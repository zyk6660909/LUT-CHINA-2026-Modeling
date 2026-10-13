import * as React from "react";
import { cn } from "@/lib/utils";

/** 简单滚动容器（替代 radix ScrollArea）。 */
export function ScrollArea({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("overflow-auto", className)}>{children}</div>;
}
