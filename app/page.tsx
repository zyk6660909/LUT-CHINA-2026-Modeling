"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Radar,
  Medal,
  Compass,
  Sparkles,
  FileText,
  PlayCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { saveReportLocal } from "@/lib/storage";
import demo from "@/data/demo-gansu-diabetic-foot.json";
import type { FormInput } from "@/types";

const FEATURES = [
  {
    icon: <ShieldAlert className="size-5 text-red-500" />,
    title: "Veto 一票否决预警",
    desc: "15 条硬/软 Veto 规则 + 赛道豁免逻辑，命中硬 Veto 直接熔断。",
  },
  {
    icon: <Radar className="size-5 text-indigo-500" />,
    title: "六维雷达图",
    desc: "48 项三级指标量化打分，对比往届金奖均值基准线。",
  },
  {
    icon: <Medal className="size-5 text-amber-500" />,
    title: "奖牌 Checklist",
    desc: "严格对齐 iGEM 官方评审标准，输出保铜/争银/冲金还缺哪几项。",
  },
  {
    icon: <Compass className="size-5 text-emerald-500" />,
    title: "专项奖罗盘",
    desc: "推荐可申报的专项奖，附契合度评分与差距分析。",
  },
  {
    icon: <Sparkles className="size-5 text-violet-500" />,
    title: "定向优化建议",
    desc: "P0/P1/P2 分级建议 + 整改后预估提分与可达等级。",
  },
  {
    icon: <FileText className="size-5 text-zinc-500" />,
    title: "证据链锚定",
    desc: "每个分数都引用你的原文片段，无依据强制 0 分并标注信息缺失。",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function runDemo() {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo as FormInput),
      });
      const data = await res.json();
      if (!res.ok || !data.report) {
        alert(data.error || "评估失败");
        return;
      }
      saveReportLocal(data.report);
      router.push(`/report/${data.report.id}`);
    } catch (e) {
      alert("请求失败：" + String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1">
      {/* 顶栏 */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-600 text-white text-sm">
              i
            </span>
            iGEM 项目评估系统
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/evaluate")}>
            进入评估
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center">
        <Badge className="mb-4">iGEM · 赛前可行性诊断</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          用一份评估报告，
          <br className="hidden md:block" />
          看清你的 iGEM 项目能否拿奖
        </h1>
        <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
          输入项目参数，系统输出：可行性总分与等级、6 维雷达图、奖牌 Checklist、
          Veto 风险预警、定向优化建议、专项奖匹配建议，以及整改后的预估提分。
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={() => router.push("/evaluate")}>
            开始评估 <ArrowRight className="size-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={runDemo} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
            查看演示案例
          </Button>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          演示案例：甘肃县域糖尿病足患者居家换药工程菌敷料（Therapeutics）
        </p>
      </section>

      {/* 功能特性 */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  {f.icon}
                  <span className="font-semibold">{f.title}</span>
                </div>
                <p className="text-sm text-zinc-600">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 流程 */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold text-center mb-8">评估流程</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              ["01", "填写项目参数", "选择赛道 + 六维输入 + 全文粘贴"],
              ["02", "本地 Veto 熔断扫描", "命中硬 Veto 立即停止评分"],
              ["03", "四角色 AI 评估", "安全官 / 技术官 / 商业官 / 仲裁官"],
              ["04", "输出评估报告", "总分 + 雷达图 + 奖牌 + 建议"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-xl border border-zinc-200 p-4">
                <div className="text-2xl font-bold text-indigo-600">{n}</div>
                <div className="font-semibold mt-1">{t}</div>
                <div className="text-sm text-zinc-500 mt-1">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-zinc-400">
          仅供赛前自评参考，不构成 iGEM 官方评审结论。评估模型可在无 API Key 时自动降级到本地规则引擎。
        </div>
      </footer>
    </main>
  );
}
