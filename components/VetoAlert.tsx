"use client";
import type { VetoResult } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Wrench } from "lucide-react";

export function VetoAlert({
  vetoes,
  hardVetoFired,
}: {
  vetoes: VetoResult[];
  hardVetoFired: boolean;
}) {
  const triggered = vetoes.filter((v) => v.triggered);
  const hardTriggered = triggered.filter((v) => v.level === "hard");
  const softTriggered = triggered.filter((v) => v.level === "soft");

  if (hardVetoFired || hardTriggered.length > 0) {
    return (
      <div className="space-y-3">
        <Alert variant="destructive">
          <ShieldAlert className="size-5" />
          <AlertTitle>硬 Veto 熔断 —— 项目已停止评分</AlertTitle>
          <AlertDescription>
            以下一票否决项被命中，请先解决后再重新提交评估。
          </AlertDescription>
        </Alert>
        {hardTriggered.map((v) => (
          <Alert key={v.id} variant="destructive">
            <AlertTitle>
              {v.id} · {v.title}
            </AlertTitle>
            <AlertDescription>
              {v.detail}
              {v.fixPath && <p className="mt-1 font-medium">修复路径：{v.fixPath}</p>}
            </AlertDescription>
          </Alert>
        ))}
        {softTriggered.length > 0 && (
          <Alert variant="warning">
            <AlertTitle>同时存在软 Veto</AlertTitle>
            <AlertDescription>{softTriggered.map((v) => v.title).join("；")}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (softTriggered.length > 0) {
    return (
      <div className="space-y-3">
        <Alert variant="warning">
          <Wrench className="size-5" />
          <AlertTitle>软 Veto 已锁定流程（可按修复路径解除）</AlertTitle>
          <AlertDescription>
            共 {softTriggered.length} 项软 Veto 命中，修复后不影响继续评估。
          </AlertDescription>
        </Alert>
        {softTriggered.map((v) => (
          <Alert key={v.id} variant="warning">
            <AlertTitle>
              {v.id} · {v.title}
            </AlertTitle>
            <AlertDescription>
              {v.detail}
              {v.fixPath && <p className="mt-1 font-medium">修复路径：{v.fixPath}</p>}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }

  return (
    <Alert variant="success">
      <ShieldCheck className="size-5" />
      <AlertTitle>15 项 Veto 规则全部未命中</AlertTitle>
      <AlertDescription>
        未发现硬/软 Veto 风险，项目通过安全、伦理、法律与技术可行性前置审查。
        <span className="mt-2 flex flex-wrap gap-1.5">
          {vetoes.slice(0, 6).map((v) => (
            <Badge key={v.id} variant="success">
              {v.id} ✓
            </Badge>
          ))}
        </span>
      </AlertDescription>
    </Alert>
  );
}
