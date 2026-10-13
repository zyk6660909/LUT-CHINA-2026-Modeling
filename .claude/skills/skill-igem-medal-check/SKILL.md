---
name: skill-igem-medal-check
description: 封装铜/银/金奖牌 Checklist 判定逻辑，严格对齐 competition.igem.org/judging/medals，输出保铜/争银/冲金缺口。
---

# iGEM 官方奖牌 Checklist 判定

严格对齐 `competition.igem.org/judging/medals`，根据用户勾选/输入逐项判定，输出「当前保铜/争银/冲金还缺哪几项」。

## Checklist 条目

### 铜牌（含基线）
- 完成 Wiki 规划
- 提交安全表 (Safety Form)
- 提交评审表 (Judging Form)
- 注册 ≥1 个基本 Part

### 银牌（含铜牌）
- Engineering Success 闭环：DBTL 至少 1 轮完整证据
- ≥1 次 Human Practices 活动
- 实验验证 / 功能测试

### 金牌（含银牌）
- Integrated Human Practices：HP 反馈驱动技术设计迭代，有前后对比证据
- 完成建模
- 完成实验验证
- 撰写 Future Outlook 与 Contribution

## 判定逻辑

1. 铜牌达标 = 铜牌全部条目完成。
2. 银牌达标 = 铜牌达标 且 银牌全部条目完成。
3. 金牌达标 = 银牌达标 且 金牌全部条目完成。
4. 输出逐级缺口：从最低未达标的奖牌开始，列出缺失项与补齐动作。

## 输出示例

```
当前卡在冲金：还缺「撰写 Future Outlook 与 Contribution」。
→ 补齐动作：在 Wiki 中补充项目未来规划与对社区/后续团队的可复用贡献。
```

## 代码位置

实现见 `lib/rules/medal.ts`（`evaluateMedals`、`medalGapSummary`）。
