# iGEM Project Evaluator

**所属队伍**：LUT-CHINA 2026（如需修改请告知）

**在线访问**：https://igem-lut.cn

为 iGEM 参赛团队提供智能项目自评的开源工具：输入项目参数，一键输出可行性总分与等级、六维雷达图、奖牌 Checklist、Veto 风险预警、定向优化建议、专项奖匹配与整改后预估提分，帮助队伍在立项期、实验期与 Jamboree 前系统化自查，直接对齐 iGEM 官方 judging criteria。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000，点击「查看演示案例」即可跑通完整流程（无需 API Key）。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 否 | Claude API Key，缺失时自动降级到本地规则引擎 |

## 部署

```bash
vercel --prod
```

## 目录结构

```
app/            页面与 API 路由
components/     UI 组件（雷达图 / Veto 预警 / 奖牌 / 指标树 / 专项奖）
data/           演示数据
lib/            规则引擎（Veto / 评分 / 奖牌 / 置信度）与 AI 评估
public/         静态资源
types/          TypeScript 类型定义
.claude/skills/ 5 个可复用 SKILL（核心资产）
```

## 开源许可

MIT（iGEM 社区惯例亦可选用 CC BY 4.0）

---

# iGEM 项目评估系统（iGEM Evaluator）

输入 iGEM 项目参数，系统输出评估报告：**总分 + 可行性等级、6 维雷达图、奖牌 Checklist、Veto 风险预警、定向优化建议、专项奖匹配建议、整改后预估提分**。

## 功能特性

- **15 条 Veto 一票否决规则**（硬/软）+ 赛道豁免逻辑，命中硬 Veto 直接熔断。
- **42 个三级指标**六维量化打分（百分制），证据链锚定到用户原文，无依据强制 0 分。
- **赛道自适应权重矩阵**：Therapeutics / Environment / Software & AI / Foundational Advance 各有差异化调整。
- **奖牌 Checklist**：严格对齐 `competition.igem.org/judging/medals`，输出保铜/争银/冲金缺口。
- **专项奖罗盘**：推荐可申报专项奖，附契合度评分与差距分析。
- **四角色 AI 评估**（安全合规官 / 合成生物学技术官 / 社会实践与商业官 / 主审仲裁官），无 API Key 自动降级本地规则引擎。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000 ，点击「查看演示案例」即可跑通完整流程（无需 API Key）。

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
ANTHROPIC_API_KEY=sk-ant-...   # 可选，不配置则走本地规则引擎
CLAUDE_MODEL=claude-sonnet-5-5 # 可选，覆盖默认模型
```

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | 否 | Claude API Key。缺失时自动降级到 `lib/ai/fallback.ts` |
| `CLAUDE_MODEL` | 否 | 默认 `claude-sonnet-5-5` |

## 架构

```
用户表单 (/evaluate)
   │
   ▼
POST /api/evaluate ──► 计算信息完整度 / 置信度
   │
   ├─ 本地规则引擎快速扫描硬 Veto ── 命中 → 熔断报告（不评分）
   │
   ├─ Claude 四角色评估（有 API Key）── 失败/缺失 → 本地规则引擎
   │
   ├─ 应用赛道权重矩阵 + 硬门槛（如 Environment 双重遏制）
   ├─ 置信度折减 → 总分 / 可行性等级
   ├─ 整改后预估提分（P0/P1 建议）
   └─ 持久化（内存 Map + localStorage）→ 返回报告 JSON
   │
   ▼
报告页 /report/[id]（四屏联动：概览 / 指标树 / 奖牌 / 专项奖）
```

### 目录结构

```
app/
  page.tsx                首页
  evaluate/page.tsx       评估表单
  report/[id]/page.tsx    结果页（四屏联动）
  api/evaluate/route.ts   评估 API
  api/report/[id]/route.ts报告读取 API
components/
  ui/                     UI 基础组件
  RadarChart.tsx          六维雷达图（recharts）
  VetoAlert.tsx           Veto 红绿灯
  MedalChecklist.tsx      奖牌三列卡片
  IndicatorTree.tsx       指标树 + 证据链
  AwardCompass.tsx        专项奖罗盘
lib/
  rules/veto.ts           15 条 Veto 规则 + 赛道豁免
  rules/scoring.ts        42 指标 + 权重矩阵
  rules/medal.ts          铜银金 Checklist
  rules/confidence.ts     置信度系数
  ai/claude.ts            四角色评估
  ai/fallback.ts          本地规则引擎
  evaluate.ts             报告组装
  storage.ts              持久化
  export.ts               导出（Markdown/Wiki/打印）
data/demo-gansu-diabetic-foot.json
types/index.ts
.claude/skills/           5 个自定义 SKILL.md
```

## Vercel 部署

### 方式 A：CLI

```bash
npm install -g vercel
vercel login
vercel link
vercel env add ANTHROPIC_API_KEY production   # 可选
vercel --prod
```

### 方式 B：GitHub 自动部署

1. 打开 https://vercel.com/new
2. 选择本仓库
3. Framework Preset 自动识别 Next.js
4. 添加 `ANTHROPIC_API_KEY`（可选）
5. Deploy

Hobby 免费计划：100GB 带宽/月、100 万次函数调用、6000 分钟构建、无限部署、自动 HTTPS、全球 CDN。

## 数据持久化改造方案

当前 `lib/storage.ts` 使用**内存 Map**（服务端会话级）+ **localStorage**（客户端，跨冷启动可用）。Vercel Serverless 冷启动后内存数据会丢失，直接分享 `/report/[id]` 链接在同一冷启动周期外可能 404。

生产环境建议二选一：

1. **Upstash Redis**：`npm i @upstash/redis`，在 `createRemoteStore()` 中实现 `get`/`set`，用 `redis.get(`report:${id}`)`。
2. **Vercel Postgres**：建表 `reports(id text primary key, payload jsonb)`，替换 `saveReport`/`getReport` 为 SQL 读写。

`lib/storage.ts` 已预留 `ReportStore` 接口，替换后调用点无需改动。

## 免责声明

仅供赛前自评参考，不构成 iGEM 官方评审结论。评估模型（尤其本地规则引擎）基于关键词启发式，结果仅供参考。
