import type { FormInput, Report } from "@/types";
import { TRACK_LABELS } from "@/types";
import { computeCompleteness, confidenceFromCompleteness } from "@/lib/rules/confidence";
import { scanVetoes, scanHardVetoes } from "@/lib/rules/veto";
import {
  applyTrackAdjustments,
  computeDimensions,
  getActiveIndicators,
  levelFromScore,
  levelColor,
  BASELINE,
} from "@/lib/rules/scoring";
import { evaluateWithRules, fullText, scoreIndicators, recommendAwards, buildImprovements } from "@/lib/ai/fallback";
import { evaluateWithClaude } from "@/lib/ai/claude";

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

/** 主评估入口：熔断 → 四角色评估(Claude) → 本地规则引擎降级 → 置信度折减 → 报告。 */
export async function evaluate(input: FormInput): Promise<Report> {
  const completeness = computeCompleteness(input);
  const { confidence, note } = confidenceFromCompleteness(completeness);
  const track = input.track;
  const id = genId();
  const createdAt = new Date().toISOString();
  const rawInput: Record<string, string> = {
    赛道: TRACK_LABELS[track],
    项目名称: input.title ?? "",
    摘要: input.summary ?? "",
    维度1: input.dim1 ?? "",
    维度2: input.dim2 ?? "",
    维度3: input.dim3 ?? "",
    维度4: input.dim4 ?? "",
    维度5: input.dim5 ?? "",
    维度6: input.dim6 ?? "",
    底盘与安全等级: input.chassis ?? "",
    实验室资质: input.labLevel ?? "",
    伦理批件: input.ethicsApproval ?? "",
    DBTL轮次: input.dbtlRounds ?? "",
    团队规模: input.teamSize ?? "",
    预算: input.budget ?? "",
  };

  const hardVetoes = scanHardVetoes(input);

  // 硬 Veto 熔断：直接返回熔断报告，不评分
  if (hardVetoes.length > 0) {
    return buildMeltdown(input, id, createdAt, completeness, confidence, note, rawInput);
  }

  // 四角色评估（有 API Key 走 Claude，否则本地规则引擎）
  let raw = await evaluateWithClaude(input, track);
  let model: Report["model"] = "claude";
  if (!raw) {
    raw = evaluateWithRules(input, track);
    model = "local-rules";
  }

  // 保证每个活动指标都有分数（Claude 遗漏时用本地引擎补齐）
  const defs = getActiveIndicators(track);
  const localById = new Map(scoreIndicators(input, track).map((i) => [i.id, i]));
  const indicators = defs.map((def) => raw.indicators.find((i) => i.id === def.id) ?? localById.get(def.id)!);

  // 赛道硬门槛与分数调整
  const text = fullText(input);
  const adjusted = applyTrackAdjustments(track, text, indicators);

  const { dimensions, weightedTotal } = computeDimensions(adjusted, track);
  const totalScore = Math.round(weightedTotal * confidence * 10) / 10;
  const level = levelFromScore(totalScore);

  // 整改后预估提分
  const p0 = raw.improvements.filter((i) => i.priority === "P0").length;
  const p1 = raw.improvements.filter((i) => i.priority === "P1").length;
  const gain = +(p0 * 3 + p1 * 1.5).toFixed(1);
  const projectedScore = Math.min(100, +(totalScore + gain).toFixed(1));
  const projectedLevel = levelFromScore(projectedScore);

  const awards = raw.awards.length > 0 ? raw.awards : recommendAwards(input, track);
  const improvements = raw.improvements.length > 0 ? raw.improvements : buildImprovements(adjusted, track);

  return {
    id,
    createdAt,
    title: input.title || "未命名项目",
    track,
    trackLabel: TRACK_LABELS[track],
    model,
    completeness,
    confidence,
    confidenceNote: note,
    hardVetoFired: false,
    vetoes: raw.vetoes,
    dimensions,
    totalScore,
    level,
    levelColor: levelColor(level),
    medals: raw.medals,
    awards,
    improvements,
    projectedScore,
    projectedLevel,
    baseline: BASELINE,
    rawInput,
  };
}

function buildMeltdown(
  input: FormInput,
  id: string,
  createdAt: string,
  completeness: number,
  confidence: number,
  note: string,
  rawInput: Record<string, string>
): Report {
  const track = input.track;
  const zeroIndicators = scoreIndicators(input, track).map((i) => ({
    ...i,
    score: 0,
    pct: 0,
    evidence: "（已熔断：命中硬 Veto，不进入评分）",
    advice: "请先解决硬 Veto 再重新提交评估。",
    status: "missing" as const,
  }));
  const { dimensions } = computeDimensions(zeroIndicators, track);
  const vetoes = scanVetoes(input);
  return {
    id,
    createdAt,
    title: input.title || "未命名项目",
    track,
    trackLabel: TRACK_LABELS[track],
    model: "local-rules",
    completeness,
    confidence,
    confidenceNote: note,
    hardVetoFired: true,
    vetoes,
    dimensions,
    totalScore: 0,
    level: "熔断",
    levelColor: "text-red-600 bg-red-50 border-red-200",
    medals: [],
    awards: [],
    improvements: [],
    projectedScore: 0,
    projectedLevel: "熔断",
    baseline: BASELINE,
    rawInput,
  };
}
