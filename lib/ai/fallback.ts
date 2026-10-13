import type {
  AwardRecommendation,
  EvaluationRaw,
  FormInput,
  Improvement,
  IndicatorScore,
  Track,
  VetoResult,
} from "@/types";
import { getActiveIndicators, getDimensionWeights } from "@/lib/rules/scoring";
import { scanVetoes } from "@/lib/rules/veto";
import { evaluateMedals } from "@/lib/rules/medal";

// ============================================================================
// 本地规则引擎（无 ANTHROPIC_API_KEY 时的降级评估器）
// 关键词命中 → 指标评分；证据链锚定到用户原文片段；无依据强制 0 分
// ============================================================================

export function fullText(input: FormInput): string {
  return [
    input.title,
    input.summary,
    input.dim1,
    input.dim2,
    input.dim3,
    input.dim4,
    input.dim5,
    input.dim6,
    input.chassis,
    input.safetyLevel,
    input.labLevel,
    input.ethicsApproval,
    input.dbtlRounds,
    input.teamSize,
    input.budget,
    input.rawText,
  ]
    .filter(Boolean)
    .join("\n");
}

function dimText(input: FormInput, dim: string): string {
  const map: Record<string, string | undefined> = {
    d1: input.dim1,
    d2: input.dim2,
    d3: [input.dim3, input.chassis, input.dbtlRounds].filter(Boolean).join("\n"),
    d4: input.dim4,
    d5: [input.dim5, input.teamSize, input.budget].filter(Boolean).join("\n"),
    d6: [input.dim6, input.chassis, input.safetyLevel, input.labLevel, input.ethicsApproval]
      .filter(Boolean)
      .join("\n"),
  };
  return [map[dim], input.summary, input.title, input.rawText].filter(Boolean).join("\n");
}

function extractEvidence(text: string, keywords: string[]): string {
  for (const k of keywords) {
    const idx = text.indexOf(k);
    if (idx >= 0) {
      const start = Math.max(0, idx - 14);
      const end = Math.min(text.length, idx + k.length + 20);
      const snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
      return `“${snippet}”`;
    }
  }
  return "";
}

function statusOf(pct: number, hasEvidence: boolean): IndicatorScore["status"] {
  if (!hasEvidence) return "missing";
  if (pct >= 70) return "good";
  if (pct >= 40) return "warn";
  return "bad";
}

function adviceFor(name: string, pct: number, hasEvidence: boolean): string {
  if (!hasEvidence) return `未在输入中检索到「${name}」相关表述，建议补充具体内容并给出可验证证据。`;
  if (pct < 40) return `「${name}」证据偏弱，建议量化目标、补充可验证数据与文献支撑。`;
  if (pct < 70) return `「${name}」已有关键信息，建议进一步量化、补充对照与迭代闭环证据。`;
  return `「${name}」表现良好，建议保持并固化为 Wiki 证据链。`;
}

export function evaluateWithRules(input: FormInput, track: Track): EvaluationRaw {
  const indicators = scoreIndicators(input, track);
  const vetoes = scanVetoes(input);
  const medals = evaluateMedals(input.medalProgress);
  const awards = recommendAwards(input, track);
  const improvements = buildImprovements(indicators, track);
  const hardVetoFired = vetoes.some((v) => v.level === "hard" && v.triggered);
  return { indicators, vetoes, medals, awards, improvements, hardVetoFired };
}

export function scoreIndicators(input: FormInput, track: Track): IndicatorScore[] {
  const defs = getActiveIndicators(track);
  const all = fullText(input);
  return defs.map((def) => {
    const text = dimText(input, def.dim);
    const matched = def.keywords.filter((k) => text.toLowerCase().includes(k.toLowerCase())).length;
    const n = def.keywords.length;
    const ratio = n === 0 ? 0 : Math.min(1, matched / Math.max(2, Math.ceil(n * 0.5)));
    const score = +(def.max * ratio).toFixed(1);
    const evidence = extractEvidence(text, def.keywords);
    const hasEvidence = evidence.length > 0;
    const pct = hasEvidence ? Math.round((score / def.max) * 100) : 0;
    return {
      id: def.id,
      name: def.name,
      score,
      max: def.max,
      pct,
      evidence: evidence || "（信息缺失：未找到相关原文表述）",
      advice: adviceFor(def.name, pct, hasEvidence),
      status: statusOf(pct, hasEvidence),
    };
  });
}

// ── 专项奖匹配 ────────────────────────────────────────────────
interface AwardDef {
  name: string;
  fit: (ctx: { input: FormInput; text: string; track: Track; prog: FormInput["medalProgress"] }) => number;
  reason: string;
  gap: string;
}

const AWARD_DEFS: AwardDef[] = [
  {
    name: "Best Therapeutics",
    reason: "赛道与治疗场景高度契合",
    gap: "需强化疗效相关的功能验证数据与安全性证据",
    fit: ({ track, text }) => (track === "therapeutics" ? 78 + kw(text, "治疗", "抗菌", "疾病", "感染") * 4 : 20),
  },
  {
    name: "Best Diagnostics",
    reason: "具备诊断/检测场景",
    gap: "需补充灵敏度、特异性等检测性能指标",
    fit: ({ text }) => (kw(text, "诊断", "检测", "biomarker", "生物标志物", "传感器") >= 2 ? 72 : 30),
  },
  {
    name: "Best Environment",
    reason: "赛道与环境保护场景契合",
    gap: "需补充环境释放/治理的封闭管控方案",
    fit: ({ track }) => (track === "environment" ? 80 : 20),
  },
  {
    name: "Best Software & AI",
    reason: "赛道与软件/AI 工具契合",
    gap: "需补充算法可复现性与开源许可说明",
    fit: ({ track, text }) => (track === "software" ? 84 : kw(text, "算法", "AI", "软件", "模型", "机器学习") >= 2 ? 62 : 18),
  },
  {
    name: "Best Foundational Advance",
    reason: "具备基础工具/方法学贡献",
    gap: "需明确对合成生物学社区的通用性贡献",
    fit: ({ track, text }) => (track === "foundational" ? 80 : kw(text, "通用", "平台", "工具箱", "方法学", "基础") >= 2 ? 58 : 16),
  },
  {
    name: "Best Integrated Human Practices",
    reason: "HP 反馈驱动设计迭代",
    gap: "需补充 HP 前后对比证据，证明技术设计因此改变",
    fit: ({ prog, text }) => (prog?.integratedHP || kw(text, "反馈驱动", "human practices", "HP 反馈", "利益相关") >= 2 ? 80 : 40),
  },
  {
    name: "Best Modeling",
    reason: "具备建模工作",
    gap: "需输出可复现模型与参数敏感性分析",
    fit: ({ prog, text }) => (prog?.modeling || kw(text, "建模", "模型", "模拟", "动力学") >= 2 ? 78 : 32),
  },
  {
    name: "Best Education & Public Engagement",
    reason: "具备科普/教育覆盖",
    gap: "需补充活动规模、受众与效果评估",
    fit: ({ text }) => (kw(text, "科普", "教育", "workshop", "讲座", "公众") >= 2 ? 72 : 30),
  },
  {
    name: "Best Safety & Security",
    reason: "生物安全设计突出",
    gap: "需补充 kill switch 表征与应急演练记录",
    fit: ({ text }) => (kw(text, "遏制", "致死开关", "营养缺陷", "双重遏制", "生物安全") >= 3 ? 82 : 40),
  },
  {
    name: "Best Entrepreneurship",
    reason: "具备商业闭环规划",
    gap: "需补充市场验证（试点/客户访谈）与财务测算",
    fit: ({ text }) => (kw(text, "商业", "市场", "采购", "融资", "盈利") >= 3 ? 74 : 34),
  },
  {
    name: "Best New Composite Part",
    reason: "涉及复合元件构建",
    gap: "需补充元件表征数据（功能曲线/对照）",
    fit: ({ text }) => (kw(text, "质粒", "元件", "基因电路", "启动子", "表达") >= 3 ? 70 : 32),
  },
  {
    name: "Best Measurement",
    reason: "具备量化测量方案",
    gap: "需补充测量标准与误差分析",
    fit: ({ text }) => (kw(text, "定量", "测量", "标准化", "标定", "校准", "SOP") >= 3 ? 70 : 30),
  },
];

function kw(text: string, ...keys: string[]): number {
  const t = text.toLowerCase();
  return keys.filter((k) => t.includes(k.toLowerCase())).length;
}

export function recommendAwards(input: FormInput, track: Track): AwardRecommendation[] {
  const text = fullText(input);
  const prog = input.medalProgress;
  const scored = AWARD_DEFS.map((a) => {
    const fitScore = Math.max(0, Math.min(95, a.fit({ input, text, track, prog })));
    return { name: a.name, fitScore, reason: a.reason, gap: a.gap };
  });
  return scored.sort((a, b) => b.fitScore - a.fitScore).slice(0, 5);
}

// ── 定向优化建议 ──────────────────────────────────────────────
export function buildImprovements(indicators: IndicatorScore[], track: Track): Improvement[] {
  const weights = getDimensionWeights(track);
  const dimName = (id: string) => `d${id[0]}`;
  const weak = indicators
    .filter((i) => i.pct < 70)
    .sort((a, b) => a.pct - b.pct)
    .map((i) => {
      const w = weights[dimName(i.id)] ?? 0;
      const priority: Improvement["priority"] = i.pct === 0 ? (w >= 15 ? "P0" : "P1") : i.pct < 50 ? "P1" : "P2";
      return { priority, dimension: dimName(i.id), text: `【${i.name}】${i.advice}` } as Improvement;
    });
  return weak.slice(0, 8);
}
