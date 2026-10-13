import type { Report } from "@/types";

// ============================================================================
// 报告导出：Markdown 任务清单 / Wiki 叙事建议 / 浏览器打印 PDF
// ============================================================================

export function reportToMarkdown(r: Report): string {
  const lines: string[] = [];
  lines.push(`# iGEM 项目评估报告：${r.title}`);
  lines.push("");
  lines.push(`- 赛道：${r.trackLabel}`);
  lines.push(`- 生成时间：${r.createdAt}`);
  lines.push(`- 评估模型：${r.model === "claude" ? "Claude 四角色评估" : "本地规则引擎（降级）"}`);
  lines.push(`- 信息完整度：${r.completeness}%（置信系数 ${r.confidence}${r.confidenceNote ? `，${r.confidenceNote}` : ""}）`);
  lines.push(`- 综合得分：**${r.totalScore} / 100**（${r.level}）`);
  lines.push("");
  lines.push("## 一、六维得分");
  lines.push("");
  lines.push("| 维度 | 得分 | 权重 | 加权得分 |");
  lines.push("| --- | --- | --- | --- |");
  r.dimensions.forEach((d) => lines.push(`| ${d.name} | ${d.rawScore} | ${d.weight} | ${d.weighted} |`));
  lines.push("");
  lines.push("## 二、Veto 风险");
  lines.push("");
  if (r.hardVetoFired) {
    lines.push("> ⛔ 命中硬 Veto，项目已熔断。");
  } else {
    const trig = r.vetoes.filter((v) => v.triggered);
    lines.push(trig.length ? "以下 Veto 被命中：" : "✅ 15 项 Veto 规则全部未命中。");
    trig.forEach((v) => lines.push(`- ${v.level === "hard" ? "硬" : "软"} Veto ${v.id} ${v.title}：${v.fixPath ?? ""}`));
  }
  lines.push("");
  lines.push("## 三、奖牌 Checklist");
  lines.push("");
  r.medals.forEach((m) => {
    lines.push(`### ${m.label} ${m.achieved ? "✅ 已达标" : "❌ 未达标"}`);
    m.items.forEach((i) => lines.push(`- [${i.done ? "x" : " "}] ${i.name}${i.done ? "" : ` → ${i.action}`}`));
  });
  lines.push("");
  lines.push("## 四、专项奖推荐");
  lines.push("");
  r.awards.forEach((a) => lines.push(`- **${a.name}**（契合度 ${a.fitScore}）：${a.reason}；差距：${a.gap}`));
  lines.push("");
  lines.push("## 五、定向优化建议");
  lines.push("");
  r.improvements.forEach((i) => lines.push(`- [${i.priority}] ${i.text}`));
  lines.push("");
  lines.push(`## 六、整改后预估`);
  lines.push("");
  lines.push(`若采纳全部 P0/P1 建议，预估提分 +${(r.projectedScore - r.totalScore).toFixed(1)} 分，可达 **${r.projectedLevel}**（${r.projectedScore}/100）。`);
  lines.push("");
  return lines.join("\n");
}

export function wikiNarrative(r: Report): string {
  const inp = r.rawInput;
  const lines: string[] = [];
  lines.push(`# Wiki 叙事建议：${r.title}`);
  lines.push("");
  lines.push("> 以下为基于评估报告自动生成的 Wiki 章节骨架与写作建议。");
  lines.push("");
  lines.push("## Overview（一页总结）");
  lines.push("");
  lines.push(`用一句话说明问题：${inp["维度1"]?.slice(0, 120) ?? ""}`);
  lines.push(`用一句话说明方案：${inp["维度2"]?.slice(0, 120) ?? ""}`);
  lines.push("强调「为谁、解决什么、为什么是合成生物学」。");
  lines.push("");
  lines.push("## Background & Problem");
  lines.push("");
  lines.push("- 痛点与需求刚性（引用评估中 1.1 指标证据）；");
  lines.push("- 现有方案痛点强度对比表；");
  lines.push("- SDG 与受益群体规模数据。");
  lines.push("");
  lines.push("## Engineering（重点）");
  lines.push("");
  lines.push("- 分 Design → Build → Test → Learn 写清每一轮 DBTL；");
  lines.push("- 每个关键元件附表征数据（曲线/对照/重复）；");
  lines.push("- 性能目标与达标情况对照（对应 2.3.2）。");
  lines.push("");
  lines.push("## Safety & Security");
  lines.push("");
  lines.push(`- 底盘与遏制策略：${inp["底盘与安全等级"] ?? ""}；`);
  lines.push("- 双重遏制（营养缺陷型/致死开关/物理封装）机制图；");
  lines.push("- 废弃物处置与应急处置流程。");
  lines.push("");
  lines.push("## Human Practices & Integrated HP");
  lines.push("");
  lines.push("- 列出利益相关方沟通活动（对应 6.2.2）；");
  lines.push("- 用「前后对比」证明 HP 反馈如何改变了技术设计（对应 6.3.1，金牌关键）。");
  lines.push("");
  lines.push("## Measurement");
  lines.push("");
  lines.push("- 每个关键指标的测量方法与误差分析（对应 2.2.2/3.2.2/3.2.3）。");
  lines.push("");
  lines.push("## Future Outlook & Contribution");
  lines.push("");
  lines.push("- 阶段路线图（对应 4.3.2）；");
  lines.push("- 对合成生物学社区的通用贡献（Part/工具/方法）。");
  lines.push("");
  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, mime = "text/markdown") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
