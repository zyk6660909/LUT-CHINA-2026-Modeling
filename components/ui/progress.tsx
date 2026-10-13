import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number; // 0..100
  className?: string;
  barClassName?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-200", className)}>
      <div
        className={cn("h-full rounded-full bg-indigo-600 transition-all", barClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
