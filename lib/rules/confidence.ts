import type { FormInput } from "@/types";

// ============================================================================
// 置信度修正：信息完整度 → 置信系数
// ≥90% → 1.0；60-89% → 0.8（核心信息不够完善）；<60% → 0.5（核心信息缺失）
// ============================================================================

const KEY_FIELDS: (keyof FormInput)[] = [
  "title",
  "summary",
  "dim1",
  "dim2",
  "dim3",
  "dim4",
  "dim5",
  "dim6",
  "chassis",
  "safetyLevel",
  "dbtlRounds",
  "teamSize",
  "budget",
  "ethicsApproval",
  "labLevel",
];

export function computeCompleteness(input: FormInput): number {
  const filled = KEY_FIELDS.filter((k) => {
    const v = input[k];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
  return Math.round((filled / KEY_FIELDS.length) * 100);
}

export function confidenceFromCompleteness(
  completeness: number
): { confidence: number; note: string } {
  if (completeness >= 90) return { confidence: 1.0, note: "" };
  if (completeness >= 60)
    return { confidence: 0.8, note: "核心信息不够完善，评分已按 0.8 折减" };
  return { confidence: 0.5, note: "核心信息缺失，评分已按 0.5 折减" };
}
