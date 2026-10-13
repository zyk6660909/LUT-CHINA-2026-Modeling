import type { MedalCheck, MedalItem, MedalProgress } from "@/types";

// ============================================================================
// iGEM 官方奖牌 Checklist（对齐 competition.igem.org/judging/medals）
// ============================================================================

interface MedalSpec {
  medal: "bronze" | "silver" | "gold";
  label: string;
  items: { key: keyof MedalProgress; name: string; action: string }[];
}

const MEDAL_SPECS: MedalSpec[] = [
  {
    medal: "bronze",
    label: "铜牌",
    items: [
      { key: "wiki", name: "完成 Wiki 规划", action: "补充 Wiki 页面结构与文档规划" },
      { key: "safetyForm", name: "提交安全表 (Safety Form)", action: "提交 Safety Form" },
      { key: "judgingForm", name: "提交评审表 (Judging Form)", action: "提交 Judging Form" },
      { key: "part", name: "注册 ≥1 个基本 Part", action: "向 Registry 提交 ≥1 个基本 Part" },
    ],
  },
  {
    medal: "silver",
    label: "银牌",
    items: [
      { key: "engineering", name: "Engineering Success 闭环（≥1 轮完整 DBTL 证据）", action: "补齐至少 1 轮完整 DBTL 闭环证据" },
      { key: "hp", name: "≥1 次 Human Practices 活动", action: "开展至少 1 次 HP 活动并记录" },
      { key: "experiment", name: "实验验证 / 功能测试", action: "补充实验验证 / 功能测试数据" },
    ],
  },
  {
    medal: "gold",
    label: "金牌",
    items: [
      { key: "integratedHP", name: "Integrated HP（HP 反馈驱动技术迭代 + 前后对比）", action: "补充 HP 反馈驱动迭代的前后对比证据" },
      { key: "modeling", name: "完成建模", action: "完成建模并输出可复现模型" },
      { key: "experimentDone", name: "完成实验验证", action: "完成核心实验验证" },
      { key: "futureContribution", name: "撰写 Future Outlook 与 Contribution", action: "撰写 Future Outlook 与 Contribution" },
    ],
  },
];

export function evaluateMedals(progress: MedalProgress = {}): MedalCheck[] {
  const result: MedalCheck[] = [];
  let prevAchieved: boolean = true; // 铜牌无前置
  for (const spec of MEDAL_SPECS) {
    const items: MedalItem[] = spec.items.map((it) => ({
      key: it.key,
      name: it.name,
      done: !!progress[it.key],
      action: it.action,
    }));
    const allDone = items.every((i) => i.done);
    const achieved: boolean = prevAchieved && allDone;
    result.push({ medal: spec.medal, label: spec.label, achieved, items });
    prevAchieved = achieved;
  }
  return result;
}

/** 输出「当前保铜/争银/冲金还缺哪几项」的人话摘要。 */
export function medalGapSummary(medals: MedalCheck[]): string {
  const order: MedalCheck["medal"][] = ["bronze", "silver", "gold"];
  for (const m of order) {
    const check = medals.find((x) => x.medal === m);
    if (check && !check.achieved) {
      const missing = check.items.filter((i) => !i.done).map((i) => i.name);
      const labels: Record<string, string> = { bronze: "保铜", silver: "争银", gold: "冲金" };
      return `当前卡在${labels[m]}：还缺 ${missing.join("、")}。`;
    }
  }
  return "铜银金奖牌 Checklist 全部达标，具备冲金条件。";
}
