import type { FormInput, Track, VetoResult } from "@/types";

// ============================================================================
// 15 条 Veto 一票否决规则 + 赛道豁免逻辑
// 硬 Veto：直接熔断，不进入评分
// 软 Veto：锁定流程，但给出修复路径后仍可继续
// ============================================================================

export interface VetoRule {
  id: string;
  level: "hard" | "soft";
  title: string;
  detail: string;
  fixPath?: string;
  exemption?: string; // 赛道豁免说明
  /** 返回 true 表示命中（触发） */
  detect: (text: string, track: Track) => boolean;
}

function allText(input: FormInput): string {
  const parts = [
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
    input.rawText,
  ];
  return parts.filter(Boolean).join("\n");
}

const has = (text: string, ...keywords: string[]) =>
  keywords.some((k) => text.toLowerCase().includes(k.toLowerCase()));

/** 正向提及检测：关键词出现且未被「不/无/未…不涉及」等否定前缀修饰。 */
function positiveMention(text: string, keyword: string): boolean {
  const idx = text.indexOf(keyword);
  if (idx < 0) return false;
  const before = text.slice(Math.max(0, idx - 12), idx);
  return !/不|无|未|非|没有|禁止|避免/.test(before);
}

export const VETO_RULES: VetoRule[] = [
  // ── V1 生物安全 ─────────────────────────────────────────────
  {
    id: "V1-1",
    level: "hard",
    title: "高危病原与 BSL-3/4 无资质",
    detail:
      "涉及 BSL-3/4 或一、二类高致病病原体，且无对应实验室资质/合规来源。",
    fixPath: "改用白名单/低危底盘，或补齐 BSL-3/4 实验室资质与合规来源证明。",
    detect: (t) =>
      (has(t, "BSL-3", "BSL-4", "bsl3", "bsl4", "三类病原", "二类病原", "一类病原", "高致病") &&
        !has(t, "资质", "备案", "合规来源", "P3", "P4 实验室")) ||
      has(t, "埃博拉", "炭疽芽孢杆菌", "鼠疫耶尔森"),
  },
  {
    id: "V1-2",
    level: "hard",
    title: "可自主传播基因驱动缺双重遏制",
    detail:
      "设计可自主传播的基因驱动，且无「营养缺陷型 + 致死开关 + 物理封装」中至少两层。",
    fixPath:
      "补足至少两层遏制：营养缺陷型、致死开关、物理封装任选其二，并写入安全设计。",
    detect: (t) => {
      if (!has(t, "基因驱动", "gene drive", "自主传播", "自我传播")) return false;
      const layers = [
        has(t, "营养缺陷"),
        has(t, "致死开关", "自杀开关", "kill switch"),
        has(t, "物理封装", "封装"),
      ].filter(Boolean).length;
      return layers < 2;
    },
  },
  {
    id: "V1-3",
    level: "hard",
    title: "未灭活工程菌开放环境投放",
    detail:
      "计划赛季内将未灭活工程微生物投放开放环境，且无封闭管控措施。",
    fixPath: "改为封闭反应器/原位灭活后再排放，或补充物理隔离与监测方案。",
    detect: (t) =>
      ["开放环境", "环境释放", "投放", "田间释放", "野外释放"].some((k) => positiveMention(t, k)) &&
      !has(t, "灭活", "封闭", "隔离", "物理管控", "遏制"),
  },
  {
    id: "V1-4",
    level: "soft",
    title: "实验安全等级高于实验室资质",
    detail: "实验安全等级 > 实验室资质，且无补救管控方案。",
    fixPath: "降级实验方案，或将实验外包给具备相应资质的实验室并出具承诺书。",
    detect: (t) =>
      (has(t, "BSL-2 实验", "BSL-3 实验", "生物安全二级实验") &&
        has(t, "BSL-1") &&
        !has(t, "外包", "合作实验室", "资质升级")) ||
      (has(t, "实验安全等级高于") && !has(t, "补救", "外包")),
  },
  // ── V2 伦理合规 ─────────────────────────────────────────────
  {
    id: "V2-1",
    level: "hard",
    title: "干预性人体试验无伦理批件",
    detail: "干预性人体试验/临床试验无伦理批件。",
    fixPath:
      "赛季内不开展干预性人体研究；如确需，须取得伦理委员会批件并报备。",
    detect: (t) =>
      ["人体试验", "临床试验", "人体研究", "受试者", "干预性研究"].some((k) => positiveMention(t, k)) &&
      !has(t, "伦理批件", "伦理批准", "IRB", "伦理委员会批准", "伦理审查通过"),
  },
  {
    id: "V2-2",
    level: "soft",
    title: "活体脊椎动物实验缺伦理批件/场地",
    detail: "活体脊椎动物实验无伦理批件或无合规场地。",
    fixPath: "补齐动物实验伦理批件，或改用无脊椎动物/离体模型替代。",
    detect: (t) =>
      ["小鼠", "大鼠", "兔子", "斑马鱼", "脊椎动物", "动物实验", "体内实验"].some((k) => positiveMention(t, k)) &&
      !has(t, "伦理批件", "动物伦理", "IACUC", "合规场地"),
  },
  {
    id: "V2-3",
    level: "hard",
    title: "人类遗传资源违规且未报备",
    detail: "人类遗传资源采集/存储/处理违规且无报备。",
    fixPath: "向人类遗传资源管理部门报备/审批，或改用细胞系等非人遗资源。",
    detect: (t) =>
      has(t, "人类遗传资源", "人血液样本", "人组织样本", "基因组数据", "唾液样本") &&
      !has(t, "报备", "审批", "知情同意", "伦理批件"),
  },
  // ── V3 法律与知识产权 ───────────────────────────────────────
  {
    id: "V3-1",
    level: "hard",
    title: "违反生物安全/药品管理法",
    detail:
      "产品/技术违反《生物安全法》《药品管理法》等，如未取证宣称治疗功效、工程菌违规作食品原料。",
    fixPath: "去除治疗功效宣称，或明确研发阶段定位；工程菌不得作为食品原料。",
    detect: (t) =>
      (has(t, "治愈", "疗效", "药效", "治疗功效", "宣称治疗", "包治") && !has(t, "取证", "药监局", "临床前", "不宣称", "研发阶段")) ||
      (has(t, "工程菌", "益生菌") && has(t, "食品原料", "作为食品", "口服食品")),
  },
  {
    id: "V3-2",
    level: "soft",
    title: "使用管制品无合法资质",
    detail: "使用管制品（麻醉/精神/易制毒前体等）无合法资质。",
    fixPath: "取得管制化学品购买/使用许可，或更换为非管制替代物。",
    detect: (t) =>
      has(t, "管制", "易制毒", "麻醉药品", "精神药品", "前体") &&
      !has(t, "资质", "许可", "备案", "采购证"),
  },
  {
    id: "V3-3",
    level: "soft",
    title: "核心专利重合度 >80% 且无授权",
    detail: "核心技术/元件与已授权专利重合度 > 80% 且无授权。",
    fixPath: "开展 FTO 检索，规避或取得专利授权/许可，或更换技术路线。",
    detect: (t) =>
      has(t, "专利") && has(t, "重合", "侵权", "相同", "一样") && !has(t, "授权", "许可"),
  },
  // ── V4 项目真实性 ───────────────────────────────────────────
  {
    id: "V4-1",
    level: "hard",
    title: "无合成生物学改造（纯材料/软件/调研）",
    detail:
      "全程无基因工程/合成生物学改造（纯材料、纯软件、纯调研）。赛道豁免：Software & AI、Foundational Advance。",
    exemption: "Software & AI / Foundational Advance 赛道豁免湿实验要求。",
    detect: (t, track) => {
      if (track === "software" || track === "foundational") return false; // 赛道豁免
      const engineered = has(
        t,
        "工程菌",
        "工程化",
        "基因工程",
        "基因编辑",
        "合成生物学",
        "质粒",
        "CRISPR",
        "底盘",
        "菌株改造",
        "重组",
        "克隆",
        "基因电路",
        "生物元件",
        "改造",
      );
      const pure = has(t, "纯材料", "纯软件", "纯调研", "不涉及", "无湿实验", "仅调研");
      return !engineered || (pure && !engineered);
    },
  },
  {
    id: "V4-2",
    level: "soft",
    title: "使用白名单外高危材料未报备",
    detail: "使用 iGEM 白名单外高危材料且未报备。",
    fixPath: "向 iGEM 安全委员会提交 Check-in 报备，或改用白名单内底盘/元件。",
    detect: (t) =>
      has(t, "白名单外", "高危材料", "限制性材料", "外源致病") && !has(t, "报备", "check-in", "Check-in"),
  },
  {
    id: "V4-3",
    level: "hard",
    title: "1:1 复刻往届项目或抄袭/虚构数据",
    detail: "1:1 复刻往届项目，或抄袭/虚构数据。",
    fixPath: "重新定位创新点并重构技术路线，确保数据真实可复现。",
    detect: (t) =>
      has(t, "复刻", "照搬", "抄袭", "虚构", "造假", "1:1", "一模一样", "套用往年"),
  },
  // ── V5 技术可行性 ───────────────────────────────────────────
  {
    id: "V5-1",
    level: "hard",
    title: "核心原理违背基础科学",
    detail: "核心技术违背基础科学原理，无权威文献支撑。",
    fixPath: "回归已验证的生物学机制，引用权威文献重新论证技术路线。",
    detect: (t) =>
      (has(t, "违背", "违反", "不可能", "永动机", "违背热力学", "违背生物学") &&
        !has(t, "文献", "依据", "参考")) ||
      has(t, "不消耗能量", "凭空产生", "违背能量守恒"),
  },
  {
    id: "V5-2",
    level: "soft",
    title: "核心实验周期 >12 个月且无分阶段规划",
    detail: "核心实验周期 > 12 个月且无分阶段规划。",
    fixPath: "将 >12 个月的实验拆分为赛季内可交付的分阶段里程碑。",
    detect: (t) =>
      (has(t, ">12", "12个月", "一年以上", "超过一年", "18个月", "24个月", "两年") ||
        has(t, "12 个月以上")) &&
      !has(t, "分阶段", "里程碑", "阶段规划", "迭代"),
  },
];

/** 扫描全部 Veto 规则，返回命中状态（未命中也返回，供报告展示红绿灯）。 */
export function scanVetoes(input: FormInput): VetoResult[] {
  const text = allText(input);
  return VETO_RULES.map((r) => {
    const triggered = r.detect(text, input.track);
    return {
      id: r.id,
      level: r.level,
      triggered,
      title: r.title,
      detail: r.detail,
      exemption: r.exemption,
      fixPath: r.fixPath,
    };
  });
}

/** 快速扫描硬 Veto（本地规则引擎，用于熔断前置判断）。 */
export function scanHardVetoes(input: FormInput): VetoResult[] {
  return scanVetoes(input).filter((v) => v.level === "hard" && v.triggered);
}
