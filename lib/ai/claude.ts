import Anthropic from "@anthropic-ai/sdk";
import type { EvaluationRaw, FormInput, IndicatorScore, Track } from "@/types";
import { getActiveIndicators, getActiveDimensions } from "@/lib/rules/scoring";
import { scanVetoes } from "@/lib/rules/veto";
import { evaluateMedals } from "@/lib/rules/medal";

// ============================================================================
// Claude 四角色评估（单次调用内模拟多 Agent）
//   【安全合规官】 审查 V1-V3 与维度6 → Veto 判定 + 维度6 打分
//   【合成生物学技术官】 审查 V4-V5 与维度2、3
//   【社会实践与商业官】 审查维度1、4
//   【主审仲裁官】 汇总三方输出 → 最终 JSON
// ============================================================================

function buildSystemPrompt(track: Track): string {
  const dims = getActiveDimensions(track);
  const dimList = dims
    .map((d) => {
      const inds = d.subcategories.flatMap((s) => s.indicators);
      const items = inds.map((i) => `${i.id} ${i.name}(${i.max}分)`).join("；");
      return `- ${d.id} ${d.name}：${items}`;
    })
    .join("\n");

  return `你是 iGEM 项目评估委员会。请以四个角色协同完成一次评估，最终只输出一个 JSON 对象（不要输出 markdown 代码块，不要输出任何解释性文字）。

【角色分工】
1. 安全合规官：审查 V1-V3 与维度6（生物安全/伦理）。判定软性 Veto 是否需要触发（硬 Veto 已由本地引擎判定）。
2. 合成生物学技术官：审查 V4-V5 与维度2、3（创新性、DBTL、实验可行性）。
3. 社会实践与商业官：审查维度1、4（问题定义、落地商业价值）。
4. 主审仲裁官：汇总三方结论，产出最终 JSON。

【评分规则】
- 每个指标打 0 到该指标满分的分（可小数，一位小数）。
- 证据链锚定：evidence 字段必须【逐字引用】用户输入中的原文片段；若输入中没有对应依据，score 必须为 0 且 evidence 填「信息缺失」。
- advice 字段给出该指标的具体优化建议（一句话，可执行）。

【赛道自适应】
- 当前赛道：${track}
- 指标清单（按此 id 打分，不得新增或遗漏 id）：
${dimList}

【输出 JSON 结构】
{
  "vetoes": [{"id":"V1-4","triggered":true,"reason":"一句话原因"}],
  "indicators": [{"id":"1.1.1","score":2.5,"evidence":"原文片段","advice":"优化建议"}],
  "awards": [{"name":"Best Therapeutics","fitScore":82,"reason":"契合原因","gap":"差距"}],
  "improvements": [{"priority":"P0","dimension":"d6","text":"可执行建议"}]
}

vetoes 只列出【触发】的软 Veto（未触发不列）；awards 给出 3-5 个最匹配的专项奖；improvements 给出 5-8 条按 P0/P1/P2 分级的建议。`;
}

function buildUserPrompt(input: FormInput): string {
  const fields: Record<string, string | undefined> = {
    "项目名称": input.title,
    "摘要": input.summary,
    "维度1 问题定义与社会价值": input.dim1,
    "维度2 合成生物学创新与工程化设计": input.dim2,
    "维度3 实验可行性与赛季交付能力": input.dim3,
    "维度4 落地应用与商业价值": input.dim4,
    "维度5 团队配置与资源保障": input.dim5,
    "维度6 生物安全/伦理/人文实践": input.dim6,
    "底盘与安全等级": input.chassis,
    "实验室资质": input.labLevel,
    "伦理批件": input.ethicsApproval,
    "DBTL 轮次": input.dbtlRounds,
    "团队规模": input.teamSize,
    "预算": input.budget,
    "全文": input.rawText,
  };
  const body = Object.entries(fields)
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => `【${k}】\n${v}`)
    .join("\n\n");
  return `请评估以下 iGEM 项目输入：\n\n${body}`;
}

function stripFences(s: string): string {
  let t = s.trim();
  t = t.replace(/^```(?:json)?\s*/i, "");
  t = t.replace(/\s*```$/, "");
  return t.trim();
}

export async function evaluateWithClaude(
  input: FormInput,
  track: Track
): Promise<EvaluationRaw | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
    const msg = await client.messages.create({
      model,
      max_tokens: 6000,
      system: buildSystemPrompt(track),
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    return parseClaudeOutput(text, input, track);
  } catch (e) {
    console.error("[claude] evaluation failed, falling back to local rules:", e);
    return null;
  }
}

function parseClaudeOutput(
  raw: string,
  input: FormInput,
  track: Track
): EvaluationRaw | null {
  try {
    const json = JSON.parse(stripFences(raw)) as {
      vetoes?: { id: string; triggered: boolean; reason?: string }[];
      indicators?: { id: string; score: number; evidence?: string; advice?: string }[];
      awards?: { name: string; fitScore: number; reason?: string; gap?: string }[];
      improvements?: { priority: "P0" | "P1" | "P2"; dimension: string; text: string }[];
    };

    const defs = getActiveIndicators(track);
    const byId = new Map(defs.map((d) => [d.id, d]));

    const indicators = defs.map((def) => {
      const found = (json.indicators ?? []).find((i) => i.id === def.id);
      const score = found ? Math.max(0, Math.min(def.max, Number(found.score) || 0)) : 0;
      const evidence = found?.evidence?.trim() || "";
      const pct = evidence ? Math.round((score / def.max) * 100) : 0;
      const status: IndicatorScore["status"] =
        !evidence ? "missing" : pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad";
      return {
        id: def.id,
        name: def.name,
        score: +score.toFixed(1),
        max: def.max,
        pct,
        evidence: evidence || "（信息缺失：未找到相关原文表述）",
        advice:
          found?.advice?.trim() ||
          `建议补充「${def.name}」的具体表述与可验证证据。`,
        status,
      };
    });

    // 软 Veto 合并：本地引擎为主，模型补充触发的软 Veto
    const vetoes = scanVetoes(input);
    for (const mv of json.vetoes ?? []) {
      if (!mv.triggered) continue;
      const target = vetoes.find((v) => v.id === mv.id && v.level === "soft");
      if (target) {
        target.triggered = true;
        target.fixPath = [target.fixPath, mv.reason].filter(Boolean).join(" | ");
      }
    }

    const awards = (json.awards ?? []).map((a) => ({
      name: a.name,
      fitScore: Math.max(0, Math.min(100, Number(a.fitScore) || 0)),
      reason: a.reason ?? "",
      gap: a.gap ?? "",
    }));

    const improvements = (json.improvements ?? []).map((i) => ({
      priority: i.priority,
      dimension: i.dimension,
      text: i.text,
    }));

    const medals = evaluateMedals(input.medalProgress);
    const hardVetoFired = vetoes.some((v) => v.level === "hard" && v.triggered);

    return { indicators, vetoes, medals, awards, improvements, hardVetoFired };
  } catch (e) {
    console.error("[claude] failed to parse model output:", e);
    return null;
  }
}
