"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlayCircle, Send } from "lucide-react";
import { computeCompleteness } from "@/lib/rules/confidence";
import { saveReportLocal } from "@/lib/storage";
import type { FormInput, MedalProgress, Track } from "@/types";
import demo from "@/data/demo-gansu-diabetic-foot.json";

const TRACKS: { value: Track; label: string }[] = [
  { value: "therapeutics", label: "Therapeutics / Diagnostics" },
  { value: "environment", label: "Environment" },
  { value: "software", label: "Software & AI" },
  { value: "foundational", label: "Foundational Advance" },
  { value: "other", label: "其他赛道" },
];

const DIMS: { key: keyof FormInput; label: string; placeholder: string }[] = [
  { key: "dim1", label: "维度 1 · 问题定义与社会价值", placeholder: "痛点、目标人群、需求验证、现有方案不足、SDG 匹配、社会价值……" },
  { key: "dim2", label: "维度 2 · 合成生物学创新与工程化设计", placeholder: "技术路线、生物元件、原创性、DBTL 迭代轮次、测试量化、闭环……" },
  { key: "dim3", label: "维度 3 · 实验可行性与赛季交付能力", placeholder: "技术成熟度、周期、方法、对照重复、核心验证、交付物……" },
  { key: "dim4", label: "维度 4 · 落地应用与商业价值", placeholder: "产品形态、用户匹配、竞品差异、商业模式、市场、监管路径……" },
  { key: "dim5", label: "维度 5 · 团队配置与资源保障", placeholder: "学科覆盖、能力匹配、分工、实验室设备、资金、外部合作……" },
  { key: "dim6", label: "维度 6 · 生物安全、伦理与人文实践", placeholder: "遏制策略、废弃物、应急、伦理评估、利益相关方、HP 整合……" },
];

const MEDAL_GROUPS: { group: string; items: { key: keyof MedalProgress; label: string }[] }[] = [
  {
    group: "铜牌",
    items: [
      { key: "wiki", label: "完成 Wiki 规划" },
      { key: "safetyForm", label: "提交安全表" },
      { key: "judgingForm", label: "提交评审表" },
      { key: "part", label: "注册 ≥1 个基本 Part" },
    ],
  },
  {
    group: "银牌",
    items: [
      { key: "engineering", label: "Engineering Success 闭环" },
      { key: "hp", label: "≥1 次 Human Practices 活动" },
      { key: "experiment", label: "实验验证 / 功能测试" },
    ],
  },
  {
    group: "金牌",
    items: [
      { key: "integratedHP", label: "Integrated HP（前后对比）" },
      { key: "modeling", label: "完成建模" },
      { key: "experimentDone", label: "完成实验验证" },
      { key: "futureContribution", label: "Future Outlook 与 Contribution" },
    ],
  },
];

const EMPTY: FormInput = {
  track: "therapeutics",
  title: "",
  summary: "",
  dim1: "",
  dim2: "",
  dim3: "",
  dim4: "",
  dim5: "",
  dim6: "",
  chassis: "",
  safetyLevel: "",
  dbtlRounds: "",
  teamSize: "",
  budget: "",
  ethicsApproval: "",
  labLevel: "",
  rawText: "",
  medalProgress: {},
};

export default function EvaluatePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const completeness = useMemo(() => computeCompleteness(form), [form]);

  function set<K extends keyof FormInput>(key: K, value: FormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleMedal(key: keyof MedalProgress) {
    setForm((f) => ({
      ...f,
      medalProgress: { ...f.medalProgress, [key]: !f.medalProgress?.[key] },
    }));
  }

  function fillDemo() {
    setForm({ ...(demo as FormInput), track: (demo as FormInput).track });
  }

  async function submit() {
    setError("");
    if (!form.title.trim()) {
      setError("请至少填写项目名称。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.report) {
        setError(data.error || "评估失败");
        return;
      }
      saveReportLocal(data.report);
      router.push(`/report/${data.report.id}`);
    } catch (e) {
      setError("请求失败：" + String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">项目评估表单</h1>
        <p className="text-sm text-zinc-500 mt-1">
          填写越完整，评估越准确。无 ANTHROPIC_API_KEY 时自动降级到本地规则引擎。
        </p>
      </div>

      {/* 信息完整度 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <Label>信息完整度</Label>
            <Badge variant={completeness >= 90 ? "success" : completeness >= 60 ? "warning" : "destructive"}>
              {completeness}%
            </Badge>
          </div>
          <Progress value={completeness} />
          <p className="text-xs text-zinc-500 mt-2">
            {completeness >= 90
              ? "信息完整，评分按 1.0 系数计。"
              : completeness >= 60
                ? "核心信息不够完善，评分将按 0.8 系数折减。"
                : "核心信息缺失，评分将按 0.5 系数折减。"}
          </p>
        </CardContent>
      </Card>

      {/* 基础信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
          <CardDescription>选择赛道并填写项目概况。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>赛道 *</Label>
              <Select value={form.track} onChange={(e) => set("track", e.target.value as Track)}>
                {TRACKS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>项目名称 *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="例如：甘肃县域糖尿病足居家换药工程菌敷料" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>项目摘要（一句话）</Label>
            <Textarea rows={2} value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="一句话概括：用什么合成生物学手段，解决谁的什么问题。" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>底盘生物</Label>
              <Input value={form.chassis} onChange={(e) => set("chassis", e.target.value)} placeholder="E. coli Nissle 1917" />
            </div>
            <div className="space-y-2">
              <Label>生物安全等级</Label>
              <Select value={form.safetyLevel} onChange={(e) => set("safetyLevel", e.target.value)}>
                <option value="">未填写</option>
                <option>BSL-1</option>
                <option>BSL-2</option>
                <option>BSL-3</option>
                <option>BSL-4</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>实验室资质</Label>
              <Select value={form.labLevel} onChange={(e) => set("labLevel", e.target.value)}>
                <option value="">未填写</option>
                <option>BSL-1</option>
                <option>BSL-2</option>
                <option>BSL-3</option>
                <option>BSL-4</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>DBTL 迭代轮次</Label>
              <Select value={form.dbtlRounds} onChange={(e) => set("dbtlRounds", e.target.value)}>
                <option value="">未填写</option>
                <option>0 轮</option>
                <option>1 轮</option>
                <option>2 轮</option>
                <option>3 轮</option>
                <option>4 轮及以上</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>团队规模</Label>
              <Input value={form.teamSize} onChange={(e) => set("teamSize", e.target.value)} placeholder="12 人" />
            </div>
            <div className="space-y-2">
              <Label>预算</Label>
              <Input value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="18 万元" />
            </div>
            <div className="space-y-2">
              <Label>伦理批件</Label>
              <Select value={form.ethicsApproval} onChange={(e) => set("ethicsApproval", e.target.value)}>
                <option value="">未填写</option>
                <option>已取得伦理批件</option>
                <option>不涉及人体/动物实验</option>
                <option>计划申请</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 六维输入 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>六维项目描述</CardTitle>
          <CardDescription>每个维度粘贴相关描述，系统将用于证据链锚定打分。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DIMS.map((d) => (
            <div key={d.key} className="space-y-2">
              <Label>{d.label}</Label>
              <Textarea
                rows={3}
                value={(form[d.key] as string) ?? ""}
                onChange={(e) => set(d.key, e.target.value)}
                placeholder={d.placeholder}
              />
            </div>
          ))}
          <Separator />
          <div className="space-y-2">
            <Label>全文粘贴（可选）</Label>
            <Textarea
              rows={4}
              value={form.rawText}
              onChange={(e) => set("rawText", e.target.value)}
              placeholder="可直接粘贴项目 Wiki / 申请书全文，系统会全文检索证据。"
            />
          </div>
        </CardContent>
      </Card>

      {/* 奖牌进度 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>奖牌 Checklist 进度</CardTitle>
          <CardDescription>勾选当前已完成的项，用于判断「保铜 / 争银 / 冲金」缺口。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {MEDAL_GROUPS.map((g) => (
            <div key={g.group}>
              <div className="text-sm font-semibold text-zinc-700 mb-2">{g.group}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {g.items.map((it) => (
                  <label key={it.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="size-4 accent-indigo-600"
                      checked={!!form.medalProgress?.[it.key]}
                      onChange={() => toggleMedal(it.key)}
                    />
                    {it.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          提交并生成评估报告
        </Button>
        <Button size="lg" variant="outline" onClick={fillDemo} disabled={loading}>
          <PlayCircle className="size-4" />
          填入演示数据
        </Button>
      </div>
    </main>
  );
}
