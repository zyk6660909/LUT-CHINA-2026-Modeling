"use client";
import type { MedalCheck } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MEDAL_STYLES: Record<string, { border: string; label: string; badge: string }> = {
  bronze: {
    border: "border-amber-300",
    label: "text-amber-700",
    badge: "success",
  },
  silver: {
    border: "border-zinc-300",
    label: "text-zinc-700",
    badge: "secondary",
  },
  gold: {
    border: "border-yellow-400",
    label: "text-yellow-700",
    badge: "warning",
  },
};

export function MedalChecklist({ medals }: { medals: MedalCheck[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {medals.map((m) => {
        const style = MEDAL_STYLES[m.medal];
        return (
          <div
            key={m.medal}
            className={cn("rounded-xl border bg-white p-4", style.border)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn("text-lg font-bold", style.label)}>
                {m.medal === "bronze" ? "🥉" : m.medal === "silver" ? "🥈" : "🥇"} {m.label}
              </h3>
              <Badge variant={m.achieved ? "success" : "outline"}>
                {m.achieved ? "已达标" : "未达标"}
              </Badge>
            </div>
            <ul className="space-y-2.5">
              {m.items.map((it) => (
                <li key={it.key} className="flex items-start gap-2 text-sm">
                  {it.done ? (
                    <Check className="size-4 mt-0.5 text-emerald-600 shrink-0" />
                  ) : (
                    <X className="size-4 mt-0.5 text-red-500 shrink-0" />
                  )}
                  <div>
                    <div
                      className={cn(
                        "font-medium",
                        it.done ? "text-zinc-700" : "text-zinc-900"
                      )}
                    >
                      {it.name}
                    </div>
                    {!it.done && (
                      <div className="text-xs text-zinc-500 mt-0.5">→ {it.action}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
