// ============================================================================
// iGEM Evaluator — shared TypeScript types
// ============================================================================

export type Track =
  | "therapeutics"
  | "environment"
  | "software"
  | "foundational"
  | "other";

export const TRACK_LABELS: Record<Track, string> = {
  therapeutics: "Therapeutics / Diagnostics",
  environment: "Environment",
  software: "Software & AI",
  foundational: "Foundational Advance",
  other: "其他赛道",
};

export interface MedalProgress {
  wiki?: boolean;
  safetyForm?: boolean;
  judgingForm?: boolean;
  part?: boolean;
  engineering?: boolean;
  hp?: boolean;
  experiment?: boolean;
  integratedHP?: boolean;
  modeling?: boolean;
  experimentDone?: boolean;
  futureContribution?: boolean;
}

export interface FormInput {
  track: Track;
  title: string;
  summary?: string;
  dim1?: string; // 问题定义与社会价值
  dim2?: string; // 合成生物学创新与工程化设计
  dim3?: string; // 实验可行性与赛季交付能力
  dim4?: string; // 落地应用与商业价值
  dim5?: string; // 团队配置与资源保障
  dim6?: string; // 生物安全、伦理与人文实践
  chassis?: string;
  safetyLevel?: string;
  dbtlRounds?: string;
  teamSize?: string;
  budget?: string;
  ethicsApproval?: string;
  labLevel?: string;
  rawText?: string;
  medalProgress?: MedalProgress;
}

export type IndicatorStatus = "good" | "warn" | "bad" | "missing";

export interface IndicatorScore {
  id: string;
  name: string;
  score: number; // 0 .. max
  max: number;
  pct: number; // 0..100
  evidence: string; // 引用用户原文片段
  advice: string;
  status: IndicatorStatus;
}

export interface DimensionScore {
  id: string;
  name: string;
  rawScore: number; // 0..100 (weighted within dimension, before track weight)
  weight: number; // dimension weight out of 100
  weighted: number; // contribution to total (0..100)
  indicators: IndicatorScore[];
}

export interface VetoResult {
  id: string;
  level: "hard" | "soft";
  triggered: boolean;
  title: string;
  detail: string;
  exemption?: string; // 赛道豁免说明
  fixPath?: string; // 软 Veto 修复动作
}

export interface MedalItem {
  key: string;
  name: string;
  done: boolean;
  action: string; // 未达标时的补齐动作
}

export interface MedalCheck {
  medal: "bronze" | "silver" | "gold";
  label: string;
  achieved: boolean;
  items: MedalItem[];
}

export interface AwardRecommendation {
  name: string;
  fitScore: number; // 0..100
  reason: string;
  gap: string;
}

export interface Improvement {
  priority: "P0" | "P1" | "P2";
  dimension: string;
  text: string;
}

export interface Report {
  id: string;
  createdAt: string;
  title: string;
  track: Track;
  trackLabel: string;
  model: "claude" | "local-rules";
  completeness: number; // 0..100
  confidence: number; // 0..1
  confidenceNote: string;
  hardVetoFired: boolean;
  vetoes: VetoResult[];
  dimensions: DimensionScore[];
  totalScore: number; // 0..100 (after confidence)
  level: string;
  levelColor: string;
  medals: MedalCheck[];
  awards: AwardRecommendation[];
  improvements: Improvement[];
  projectedScore: number;
  projectedLevel: string;
  baseline: number[]; // 往届金奖均值基准线（6 维）
  rawInput: Record<string, string>;
}

export interface EvaluationRaw {
  indicators: IndicatorScore[];
  vetoes: VetoResult[];
  medals: MedalCheck[];
  awards: AwardRecommendation[];
  improvements: Improvement[];
  hardVetoFired: boolean;
}
