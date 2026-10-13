"use client";
import type { AwardRecommendation } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";

export function AwardCompass({ awards }: { awards: AwardRecommendation[] }) {
  if (!awards.length) {
    return <p className="text-sm text-zinc-500">暂无专项奖匹配建议。</p>;
  }
  return (
    <div className="space-y-3">
      {awards.map((a) => (
        <div key={a.name} className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 font-semibold">
              <Award className="size-4 text-indigo-600" />
              {a.name}
            </div>
            <Badge variant={a.fitScore >= 70 ? "success" : a.fitScore >= 50 ? "warning" : "secondary"}>
              契合度 {a.fitScore}
            </Badge>
          </div>
          <Progress value={a.fitScore} className="mb-2" />
          <div className="text-sm space-y-1">
            <p className="text-zinc-700">
              <span className="font-medium">契合原因：</span>
              {a.reason}
            </p>
            <p className="text-zinc-500">
              <span className="font-medium text-amber-600">差距分析：</span>
              {a.gap}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
