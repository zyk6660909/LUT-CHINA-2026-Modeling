"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabDef {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

/** 轻量受控 Tabs（避免引入 radix 依赖）。 */
export function Tabs({
  tabs,
  defaultTab,
  children,
}: {
  tabs: TabDef[];
  defaultTab?: string;
  children: (active: string) => React.ReactNode;
}) {
  const [active, setActive] = React.useState(defaultTab ?? tabs[0]?.id);
  return (
    <div>
      <div className="flex gap-1 border-b border-zinc-200 mb-5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5",
              active === t.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}
