---
name: skill-deploy-vercel
description: Vercel 部署流程指引，用于将 iGEM 评估系统（Next.js）部署到公网并配置环境变量。
---

# Vercel 部署流程

将 Next.js 项目部署到 Vercel，获得公网可访问地址。

## 前置条件

- 项目可本地 `npm run build` 通过。
- GitHub 仓库已创建并推送（方式 B 需要）。

## 方式 A：CLI 部署（推荐，全自动）

```bash
npm install -g vercel
vercel login          # 浏览器授权登录
vercel link           # 关联项目
vercel env add ANTHROPIC_API_KEY production   # 可选：粘贴 Claude API Key
vercel --prod         # 生产部署，输出公网地址
```

## 方式 B：GitHub 自动部署

1. 打开 https://vercel.com/new
2. 选择 GitHub 仓库 `igem-evaluator`
3. Framework Preset 自动识别为 Next.js（无需改构建配置）
4. 在 Environment Variables 添加 `ANTHROPIC_API_KEY`（可选，不配置则走本地规则引擎）
5. 点击 Deploy

## 免费计划说明

Hobby 计划免费：100GB 带宽/月、100 万次函数调用、6000 分钟构建、无限部署、自动 HTTPS、全球 CDN。

## 注意事项

1. **无 API Key 可正常部署**：系统自动降级到 `lib/ai/fallback.ts` 本地规则引擎。
2. **数据持久化**：当前用内存 Map + 浏览器 localStorage 存结果；Serverless 冷启动后内存会丢失。生产建议接入 Upstash Redis 或 Vercel Postgres（替换 `lib/storage.ts` 中的 `saveReport`/`getReport` 即可）。
3. **后续更新**：`git push` 后 Vercel 自动重新部署。

## 验证清单

- [ ] 部署后首页可访问，演示案例能跑通完整评估流程
- [ ] 报告页四屏（概览/指标树/奖牌/专项奖）正常渲染
- [ ] 导出按钮（PDF 打印 / Markdown / Wiki）可用
