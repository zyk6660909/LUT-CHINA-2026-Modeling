"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Report } from "@/types";
import { getReportLocal } from "@/lib/storage";
import { reportToMarkdown, wikiNarrative, downloadFile } from "@/lib/export";
import { medalGapSummary } from "@/lib/rules/medal";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadarChart } from "@/components/RadarChart";
import { VetoAlert } from "@/components/VetoAlert";
import { MedalChecklist } from "@/components/MedalChecklist";
import { IndicatorTree } from "@/components/IndicatorTree";
import { AwardCompass } from "@/components/AwardCompass";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  FileDown,
  Printer,
  ScrollText,
  ShieldAlert,
  LayoutDashboard,
  ListTree,
  Medal,
  Compass,
  Loader2,
} from "lucide-react";

const SHORT_LABELS: Record<string, string> = {
  d1: "问题定义",
  d2: "创新设计",
  d3: "实验可行",
  d4: "落地商业",
  d5: "团队资源",
  d6: "安全伦理",
};

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const local = getReportLocal(id);
    if (local) {
      setReport(local);
      return;
    }
    fetch(`/api/report/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.report) setReport(d.report);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <main className="flex-1 mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold mb-2">报告不存在或已过期</h1>
        <p className="text-sm text-zinc-500 mb-4">
          服务端内存缓存会在 Serverless 冷启动后清空。请重新提交评估（结果会缓存在本机浏览器）。
        </p>
        <Button onClick={() => router.push("/evaluate")}>返回评估</Button>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex-1 grid place-items-center py-40">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </main>
    );
  }

  const radarData = report.dimensions.map((d) => ({
    label: SHORT_LABELS[d.id] ?? d.name.slice(0, 4),
    score: d.rawScore,
  }));

  const gain = report.projectedScore - report.totalScore;

  return (
    <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
      {/* 顶栏 */}
      <div className="no-print flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
          <ArrowLeft className="size-4" /> 首页
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadFile(`igem-report-${report.id}.md`, reportToMarkdown(report))}>
            <FileDown className="size-4" /> Markdown 任务清单
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadFile(`igem-wiki-${report.id}.md`, wikiNarrative(report))}>
            <ScrollText className="size-4" /> Wiki 叙事建议
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" /> 导出 PDF
          </Button>
        </div>
      </div>

      {/* 态势概览头卡 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge>{report.trackLabel}</Badge>
                <Badge variant="secondary">评估引擎：{report.model === "claude" ? "Claude 四角色" : "本地规则"}</Badge>
                {report.hardVetoFired && <Badge variant="destructive">硬 Veto 熔断</Badge>}
              </div>
              <h1 className="text-2xl font-bold">{report.title}</h1>
              <p className="text-sm text-zinc-500 mt-1">{report.createdAt} 生成</p>
            </div>
            <div className="text-center">
              <div className={cn("inline-flex flex-col items-center rounded-2xl border px-8 py-4", report.levelColor)}>
                <span className="text-5xl font-bold tabular-nums">{report.totalScore}</span>
                <span className="text-sm font-semibold mt-1">可行性：{report.level}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-zinc-500">信息完整度</span>
                <span className="font-medium">{report.completeness}%</span>
              </div>
              <Progress value={report.completeness} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-zinc-500">置信系数</span>
                <span className="font-medium">{report.confidence}</span>
              </div>
              <Progress value={report.confidence * 100} barClassName="bg-violet-500" />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-zinc-500">整改后预估</span>
                <span className="font-medium">+{gain.toFixed(1)} → {report.projectedLevel}（{report.projectedScore}）</span>
              </div>
              <Progress value={report.projectedScore} barClassName="bg-emerald-500" />
            </div>
          </div>
          {report.confidenceNote && (
            <p className="text-xs text-amber-600 mt-2">⚠️ {report.confidenceNote}</p>
          )}
        </CardContent>
      </Card>

      {/* 四屏联动 */}
      <Tabs
        tabs={[
          { id: "overview", label: "态势概览", icon: <LayoutDashboard className="size-4" /> },
          { id: "tree", label: "指标树与证据链", icon: <ListTree className="size-4" /> },
          { id: "medal", label: "奖牌 Checklist", icon: <Medal className="size-4" /> },
          { id: "award", label: "专项奖罗盘", icon: <Compass className="size-4" /> },
        ]}
      >
        {(active) => (
          <div>
            {active === "overview" && (
              <div className="space-y-6">
                <VetoAlert vetoes={report.vetoes} hardVetoFired={report.hardVetoFired} />

                {!report.hardVetoFired && (
                  <Card>
                    <CardHeader>
                      <CardTitle>六维雷达图（含往届金奖均值基准线）</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadarChart data={radarData} baseline={report.baseline} />
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                        {report.dimensions.map((d) => (
                          <div key={d.id} className="rounded-lg border border-zinc-200 p-3">
                            <div className="text-xs text-zinc-500">{SHORT_LABELS[d.id] ?? d.name}</div>
                            <div className="text-xl font-bold tabular-nums">{d.rawScore}</div>
                            <div className="text-xs text-zinc-400">权重 {d.weight} · 加权 {d.weighted}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {report.hardVetoFired && (
                  <Card>
                    <CardContent className="pt-6 text-center text-zinc-500">
                      <ShieldAlert className="size-8 mx-auto text-red-500 mb-2" />
                      因命中硬 Veto，本项目未进入评分。请先按修复路径解决后再重新提交。
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>定向优化建议（P0 / P1 / P2）</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {report.improvements.length === 0 ? (
                      <p className="text-sm text-zinc-500">暂无优化建议。</p>
                    ) : (
                      report.improvements.map((i, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <Badge variant={i.priority === "P0" ? "destructive" : i.priority === "P1" ? "warning" : "secondary"}>
                            {i.priority}
                          </Badge>
                          <span className="text-zinc-700">{i.text}</span>
                        </div>
                      ))
                    )}
                    <Separator className="my-2" />
                    <p className="text-sm text-emerald-700 font-medium">
                      若采纳全部 P0/P1 建议，预估提分 +{gain.toFixed(1)} 分，可达 {report.projectedLevel}（{report.projectedScore}/100）。
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {active === "tree" && (
              <Card>
                <CardContent className="pt-6">
                  <IndicatorTree dimensions={report.dimensions} track={report.track} />
                </CardContent>
              </Card>
            )}

            {active === "medal" && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-indigo-700">{medalGapSummary(report.medals)}</p>
                  </CardContent>
                </Card>
                <MedalChecklist medals={report.medals} />
              </div>
            )}

            {active === "award" && (
              <AwardCompass awards={report.awards} />
            )}
          </div>
        )}
      </Tabs>
    </main>
  );
}
