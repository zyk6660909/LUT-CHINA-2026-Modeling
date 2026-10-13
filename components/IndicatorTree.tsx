"use client";
import { useState } from "react";
import type { DimensionScore, IndicatorScore, Track } from "@/types";
import { getActiveDimensions } from "@/lib/rules/scoring";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DOT: Record<IndicatorScore["status"], string> = {
  good: "bg-emerald-500",
  warn: "bg-amber-500",
  bad: "bg-orange-500",
  missing: "bg-red-400",
};

const STATUS_TEXT: Record<IndicatorScore["status"], string> = {
  good: "达标",
  warn: "一般",
  bad: "薄弱",
  missing: "缺失",
};

export function IndicatorTree({
  dimensions,
  track,
}: {
  dimensions: DimensionScore[];
  track: Track;
}) {
  const defs = getActiveDimensions(track);
  const scoreById = new Map<string, IndicatorScore>();
  dimensions.forEach((d) => d.indicators.forEach((i) => scoreById.set(i.id, i)));

  const [openDim, setOpenDim] = useState<Set<string>>(new Set(defs.map((d) => d.id)));
  const [openSub, setOpenSub] = useState<Set<string>>(new Set());
  const [openInd, setOpenInd] = useState<Set<string>>(new Set());

  const toggle = (set: Set<string>, key: string, fn: (s: Set<string>) => void) => {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    fn(next);
  };

  const counts = { good: 0, warn: 0, bad: 0, missing: 0 };
  scoreById.forEach((i) => counts[i.status]++);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-zinc-600">
        <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-emerald-500" /> 达标 {counts.good}</span>
        <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-amber-500" /> 一般 {counts.warn}</span>
        <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-orange-500" /> 薄弱 {counts.bad}</span>
        <span className="flex items-center gap-1"><i className="size-2.5 rounded-full bg-red-400" /> 缺失 {counts.missing}</span>
      </div>

      <div className="space-y-4">
        {defs.map((dim) => {
          const dimScore = dimensions.find((d) => d.id === dim.id);
          const dimOpen = openDim.has(dim.id);
          return (
            <div key={dim.id} className="rounded-xl border border-zinc-200 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 text-left"
                onClick={() => toggle(openDim, dim.id, setOpenDim)}
              >
                <span className="font-semibold text-sm flex items-center gap-2">
                  {dimOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  {dim.name}
                </span>
                {dimScore && (
                  <span className="text-sm font-mono">
                    {dimScore.rawScore} / 100{" "}
                    <span className="text-zinc-400">· 权重 {dimScore.weight}</span>
                  </span>
                )}
              </button>

              {dimOpen && (
                <div className="divide-y divide-zinc-100">
                  {dim.subcategories.map((sc) => {
                    const subKey = dim.id + sc.name;
                    const subOpen = openSub.has(subKey);
                    return (
                      <div key={subKey}>
                        <button
                          className="w-full flex items-center px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 text-left"
                          onClick={() => toggle(openSub, subKey, setOpenSub)}
                        >
                          {subOpen ? <ChevronDown className="size-3.5 mr-1" /> : <ChevronRight className="size-3.5 mr-1" />}
                          {sc.name}
                        </button>
                        {subOpen && (
                          <div className="pl-6 pr-2 pb-1">
                            {sc.indicators.map((ind) => {
                              const s = scoreById.get(ind.id);
                              if (!s) return null;
                              const indOpen = openInd.has(ind.id);
                              return (
                                <div key={ind.id} className="py-1">
                                  <button
                                    className="w-full flex items-center gap-2 text-sm text-left hover:bg-zinc-50 rounded px-2 py-1.5"
                                    onClick={() => toggle(openInd, ind.id, setOpenInd)}
                                  >
                                    <i className={cn("size-2 rounded-full shrink-0", DOT[s.status])} />
                                    <span className="font-medium text-zinc-800">{ind.id} {s.name}</span>
                                    <span className="ml-auto font-mono text-xs text-zinc-500">
                                      {s.score}/{s.max}
                                      <span className="ml-2 text-zinc-400">{STATUS_TEXT[s.status]}</span>
                                    </span>
                                  </button>
                                  {indOpen && (
                                    <div className="ml-5 mr-2 mt-1 mb-2 space-y-2 text-sm">
                                      <div className="rounded-md bg-amber-50 border border-amber-100 p-2.5 text-amber-900">
                                        <div className="text-xs font-semibold text-amber-700 mb-1">📎 打分依据（引用原文）</div>
                                        {s.evidence}
                                      </div>
                                      <div className="rounded-md bg-indigo-50 border border-indigo-100 p-2.5 text-indigo-900">
                                        <div className="text-xs font-semibold text-indigo-700 mb-1">💡 优化建议</div>
                                        {s.advice}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
