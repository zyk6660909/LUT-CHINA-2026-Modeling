import type { DimensionScore, IndicatorScore, Track } from "@/types";

// ============================================================================
// 三级量化评估指标体系（百分制）+ 赛道自适应权重矩阵
// 6 大维度 / 42 个三级指标
// ============================================================================

export interface IndicatorDef {
  id: string; // 形如 "1.1.1"
  name: string;
  max: number; // 该指标满分（对应二级指标内部权重）
  keywords: string[]; // 本地规则引擎关键词
  dim: string; // "d1".."d6"
}

export interface DimensionDef {
  id: string;
  name: string;
  weight: number;
  subcategories: { name: string; indicators: IndicatorDef[] }[];
}

const D = (id: string, name: string, max: number, keywords: string[]): IndicatorDef => ({
  id,
  name,
  max,
  keywords,
  dim: `d${id[0]}`,
});

// ── 湿实验 D3（默认） ──────────────────────────────────────────
const D3_WET: IndicatorDef[] = [
  D("3.1.1", "核心成熟度", 4, ["成熟", "已验证", "文献", "现有", "标准", "商用", "常用", "经典"]),
  D("3.1.2", "难度团队匹配", 4, ["团队", "经验", "能力", "匹配", "可行", "熟悉", "掌握"]),
  D("3.2.1", "周期合理性", 3, ["周期", "时间", "周", "月", "计划", "进度", "赛季", "安排"]),
  D("3.2.2", "方法标准化", 2, ["方法", "protocol", "标准", "流程", "规范", "SOP", "方案"]),
  D("3.2.3", "对照重复", 2, ["对照", "重复", "平行", "生物学重复", "误差", "三组", "统计学"]),
  D("3.3.1", "核心功能验证", 3, ["验证", "功能", "表征", "证明", "效果", "验证实验", "检测"]),
  D("3.3.2", "交付物完整度", 2, ["交付", "Part", "Wiki", "文档", "数据", "成果", "提交"]),
];

// ── Software & AI 的 D3（湿实验指标替换） ─────────────────────
const D3_SOFTWARE: IndicatorDef[] = [
  D("3.1.1", "算法可复现性", 4, ["复现", "可复现", "代码", "开源", "seed", "版本", "环境", "依赖"]),
  D("3.1.2", "开源许可合规", 4, ["开源", "许可", "license", "MIT", "GPL", "Apache", "合规"]),
  D("3.2.1", "工具普惠性", 3, ["普惠", "易用", "界面", "文档", "教程", "低门槛", "免费", "人人可用"]),
  D("3.2.2", "文档与可维护性", 2, ["文档", "注释", "维护", "README", "架构", "可读"]),
  D("3.2.3", "测试与验证", 2, ["测试", "单元测试", "基准", "benchmark", "验证", "准确率", "召回"]),
  D("3.3.1", "核心功能演示", 3, ["演示", "demo", "功能", "上线", "可用", "界面", "工具"]),
  D("3.3.2", "交付物完整度", 2, ["交付", "仓库", "发布", "文档", "成果", "开源", "提交"]),
];

const BASE_DIMENSIONS: DimensionDef[] = [
  {
    id: "d1",
    name: "问题定义与社会价值",
    weight: 20,
    subcategories: [
      {
        name: "痛点真实性与需求刚性",
        indicators: [
          D("1.1.1", "场景精准度", 3, ["场景", "县域", "社区", "医院", "居家", "目标人群", "特定人群", "地区", "乡村"]),
          D("1.1.2", "需求验证深度", 4, ["调研", "访谈", "问卷", "需求", "痛点", "验证", "用户", "走访"]),
          D("1.1.3", "现有方案痛点强度", 4, ["现有方案", "传统", "痛点", "不足", "局限", "贵", "不便", "感染", "局限"]),
        ],
      },
      {
        name: "社会价值与可持续性",
        indicators: [
          D("1.2.1", "SDG 匹配", 3, ["SDG", "可持续", "联合国", "健康", "良好健康", "目标", "清洁"]),
          D("1.2.2", "受益群体普惠性", 3, ["普惠", "基层", "弱势", "县域", "偏远", "可及", "公平", "公益"]),
          D("1.2.3", "长期社会正向价值", 3, ["长期", "社会", "正向", "公众", "教育", "科普", "可持续"]),
        ],
      },
    ],
  },
  {
    id: "d2",
    name: "合成生物学创新与工程化设计",
    weight: 20,
    subcategories: [
      {
        name: "技术路线原创性",
        indicators: [
          D("2.1.1", "核心设计原创性", 3, ["原创", "首创", "首次", "创新", "新机制", "新方案", "独特", "首创"]),
          D("2.1.2", "生物元件设计质量", 3, ["元件", "启动子", "质粒", "基因", "酶", "抗菌肽", "分泌", "表达", "蛋白"]),
          D("2.1.3", "跨学科融合深度", 2, ["跨学科", "融合", "材料", "电子", "AI", "建模", "交叉", "结合"]),
        ],
      },
      {
        name: "DBTL 循环完整性",
        indicators: [
          D("2.2.1", "迭代轮次", 3, ["迭代", "轮", "DBTL", "多轮", "三轮", "循环", "多轮次"]),
          D("2.2.2", "测试方案量化", 3, ["定量", "指标", "测量", "OD", "抑菌圈", "降解率", "存活率", "数据", "浓度"]),
          D("2.2.3", "迭代闭环", 2, ["闭环", "反馈", "优化", "改进", "下一轮", "闭环"]),
        ],
      },
      {
        name: "系统设计严谨性",
        indicators: [
          D("2.3.1", "技术链路自洽", 2, ["链路", "自洽", "通路", "信号", "逻辑", "一致", "机制"]),
          D("2.3.2", "性能目标明确", 2, ["性能", "目标", "阈值", "KPI", "指标", "达标", "明确"]),
        ],
      },
    ],
  },
  {
    id: "d3",
    name: "实验可行性与赛季交付能力",
    weight: 20,
    subcategories: [
      { name: "技术成熟度与难度匹配", indicators: [D3_WET[0], D3_WET[1]] },
      { name: "实验方案可执行性", indicators: [D3_WET[2], D3_WET[3], D3_WET[4]] },
      { name: "赛季成果可达性", indicators: [D3_WET[5], D3_WET[6]] },
    ],
  },
  {
    id: "d4",
    name: "落地应用与商业价值",
    weight: 20,
    subcategories: [
      {
        name: "产品与场景匹配",
        indicators: [
          D("4.1.1", "产品形态", 2, ["产品", "形态", "敷料", "试剂盒", "设备", "剂型", "装置", "产品化"]),
          D("4.1.2", "用户需求匹配", 3, ["用户", "需求", "匹配", "使用", "场景", "便捷", "患者"]),
          D("4.1.3", "竞品差异", 2, ["竞品", "差异", "优势", "对比", "区别", "独特", "差异化"]),
        ],
      },
      {
        name: "商业闭环",
        indicators: [
          D("4.2.1", "商业模式", 3, ["商业", "模式", "盈利", "收入", "付费", "采购", "定价", "销售"]),
          D("4.2.2", "市场空间", 2, ["市场", "规模", "人群", "万", "亿", "空间", "增长", "市场"]),
          D("4.2.3", "技术拓展性", 2, ["拓展", "延展", "平台", "复用", "多场景", "迭代", "衍生"]),
        ],
      },
      {
        name: "监管与落地路径",
        indicators: [
          D("4.3.1", "监管清晰", 3, ["监管", "法规", "注册", "审批", "医疗器械", "备案", "合规", "法规"]),
          D("4.3.2", "阶段规划", 3, ["阶段", "路径", "路线图", "里程碑", "规划", "落地", "步骤"]),
        ],
      },
    ],
  },
  {
    id: "d5",
    name: "团队配置与资源保障",
    weight: 10,
    subcategories: [
      {
        name: "团队配置",
        indicators: [
          D("5.1.1", "学科覆盖", 2, ["学科", "专业", "背景", "生物", "化学", "工程", "计算机", "医学", "覆盖"]),
          D("5.1.2", "能力匹配", 2, ["能力", "技能", "经验", "匹配", "胜任", "掌握"]),
          D("5.1.3", "分工时间", 1, ["分工", "时间", "投入", "全职", "职责", "安排", "分工"]),
        ],
      },
      {
        name: "资源保障",
        indicators: [
          D("5.2.1", "实验室设备", 2, ["实验室", "设备", "仪器", "平台", "场地", "仪器"]),
          D("5.2.2", "资金", 2, ["资金", "预算", "经费", "万元", "元", "赞助", "资金"]),
          D("5.2.3", "外部合作", 1, ["合作", "企业", "导师", "医院", "PI", "伙伴", "机构", "顾问"]),
        ],
      },
    ],
  },
  {
    id: "d6",
    name: "生物安全、伦理与人文实践整合度",
    weight: 10,
    subcategories: [
      {
        name: "生物安全防控",
        indicators: [
          D("6.1.1", "遏制策略", 2, ["遏制", "营养缺陷", "致死开关", "封装", "双遏制", "安全", "自杀开关", "kill switch"]),
          D("6.1.2", "操作废弃物", 1, ["废弃物", "灭活", "消毒", "处理", "处置", "废液"]),
          D("6.1.3", "应急处置", 1, ["应急", "泄漏", "预案", "事故", "处理", "应急"]),
        ],
      },
      {
        name: "伦理与社会责任",
        indicators: [
          D("6.2.1", "伦理评估", 2, ["伦理", "评估", "审查", "道德", "风险", "伦理"]),
          D("6.2.2", "利益相关方沟通", 1, ["利益相关", "沟通", "公众", "社区", "患者", "访谈", "沟通"]),
        ],
      },
      {
        name: "HP 与项目整合度",
        indicators: [
          D("6.3.1", "反馈驱动迭代", 2, ["反馈", "驱动", "迭代", "整合", "改进", "HP", "反馈"]),
          D("6.3.2", "HP 活动覆盖", 1, ["活动", "覆盖", "科普", "教育", "workshop", "讲座", "活动"]),
        ],
      },
    ],
  },
];

// ── 赛道自适应 ─────────────────────────────────────────────────
export function getActiveDimensions(track: Track): DimensionDef[] {
  if (track === "software") {
    return BASE_DIMENSIONS.map((dim) => {
      if (dim.id === "d3") {
        return {
          ...dim,
          name: "算法复现性与工具普惠性",
          subcategories: [
            { name: "算法成熟度与合规", indicators: [D3_SOFTWARE[0], D3_SOFTWARE[1]] },
            { name: "工具可执行性", indicators: [D3_SOFTWARE[2], D3_SOFTWARE[3], D3_SOFTWARE[4]] },
            { name: "成果可达性", indicators: [D3_SOFTWARE[5], D3_SOFTWARE[6]] },
          ],
        };
      }
      return dim;
    });
  }
  return BASE_DIMENSIONS;
}

export function getActiveIndicators(track: Track): IndicatorDef[] {
  return getActiveDimensions(track).flatMap((dim) =>
    dim.subcategories.flatMap((sc) => sc.indicators)
  );
}

/** 返回各维度归一化后的权重（总和 = 100）。 */
export function getDimensionWeights(track: Track): Record<string, number> {
  const base: Record<string, number> = { d1: 20, d2: 20, d3: 20, d4: 20, d5: 10, d6: 10 };
  if (track === "therapeutics") base.d6 *= 1.3; // 维度6 权重 ×1.3
  if (track === "foundational") {
    base.d4 = 10; // 维度4 20→10
    base.d2 = 30; // 释放 10 分到维度2
  }
  if (track === "software") base.d4 *= 0.825; // 商业闭环(4.2)权重减半：D4 20→16.5
  const sum = Object.values(base).reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  for (const k of Object.keys(base)) out[k] = Math.round((base[k] / sum) * 1000) / 10;
  return out;
}

// ── 赛道专项：硬门槛与分数调整 ────────────────────────────────
export function hasDoubleContainment(text: string): { passed: boolean; layers: string[] } {
  if (/双重遏制|双遏制|双层遏制/.test(text)) return { passed: true, layers: ["双重遏制(显式声明)"] };
  const layers: string[] = [];
  if (/营养缺陷/.test(text)) layers.push("营养缺陷型");
  if (/致死开关|自杀开关|kill switch/i.test(text)) layers.push("致死开关");
  if (/物理封装|封装/.test(text)) layers.push("物理封装");
  return { passed: layers.length >= 2, layers };
}

/** 赛道硬门槛 + 分数调整（在 AI/规则引擎产出指标分后统一施加，保证确定性）。 */
export function applyTrackAdjustments(
  track: Track,
  text: string,
  indicators: IndicatorScore[]
): IndicatorScore[] {
  const out = indicators.map((i) => ({ ...i }));
  // Environment：6.1.1 生物遏制策略升级为硬性门槛
  if (track === "environment") {
    const gate = hasDoubleContainment(text);
    const idx = out.findIndex((i) => i.id === "6.1.1");
    if (idx >= 0 && !gate.passed) {
      out[idx] = {
        ...out[idx],
        score: 0,
        pct: 0,
        status: "bad",
        advice: "Environment 赛道要求双重遏制作为硬性门槛：需在「营养缺陷型 / 致死开关 / 物理封装」中至少具备两层。",
        evidence: `未检测到双重遏制（当前识别层：${gate.layers.length ? gate.layers.join("、") : "无"}）`,
      };
    }
  }
  // Therapeutics：维度4「监管路径」×1.5
  if (track === "therapeutics") {
    out.forEach((i, idx) => {
      if (i.id === "4.3.1" || i.id === "4.3.2") {
        out[idx] = {
          ...i,
          score: Math.min(i.max, +(i.score * 1.5).toFixed(1)),
          pct: Math.min(100, +(i.pct * 1.5).toFixed(1)),
        };
      }
    });
  }
  return out;
}

// ── 维度聚合 ───────────────────────────────────────────────────
export function computeDimensions(
  indicators: IndicatorScore[],
  track: Track
): { dimensions: DimensionScore[]; weightedTotal: number } {
  const dims = getActiveDimensions(track);
  const weights = getDimensionWeights(track);
  const grouped: Record<string, IndicatorScore[]> = {};
  for (const d of dims) grouped[d.id] = [];
  for (const ind of indicators) {
    const key = `d${ind.id[0]}`;
    if (grouped[key]) grouped[key].push(ind);
    else grouped[key] = [ind];
  }
  let weightedTotal = 0;
  const dimensions: DimensionScore[] = dims.map((d) => {
    const list = grouped[d.id] ?? [];
    const maxSum = list.reduce((a, b) => a + b.max, 0) || 1;
    const scoreSum = list.reduce((a, b) => a + b.score, 0);
    const rawScore = +((scoreSum / maxSum) * 100).toFixed(1);
    const weight = weights[d.id] ?? d.weight;
    const weighted = +((rawScore * weight) / 100).toFixed(1);
    weightedTotal += weighted;
    return { id: d.id, name: d.name, rawScore, weight, weighted, indicators: list };
  });
  weightedTotal = +weightedTotal.toFixed(1);
  return { dimensions, weightedTotal };
}

// ── 往届金奖均值基准线（6 维，用于雷达图对比） ────────────────
export const BASELINE: number[] = [72, 74, 70, 66, 71, 75];

// ── 可行性等级 ────────────────────────────────────────────────
export function levelFromScore(s: number): string {
  if (s >= 85) return "极高";
  if (s >= 70) return "较高";
  if (s >= 55) return "中等";
  if (s >= 40) return "低";
  return "极低";
}

export function levelColor(level: string): string {
  switch (level) {
    case "极高":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "较高":
      return "text-green-600 bg-green-50 border-green-200";
    case "中等":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "低":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-red-600 bg-red-50 border-red-200";
  }
}
