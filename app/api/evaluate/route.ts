import { NextResponse } from "next/server";
import type { FormInput } from "@/types";
import { evaluate } from "@/lib/evaluate";
import { saveReport } from "@/lib/storage";

export const dynamic = "force-dynamic";

const VALID_TRACKS = ["therapeutics", "environment", "software", "foundational", "other"];

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FormInput;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "请求体为空" }, { status: 400 });
    }
    if (!VALID_TRACKS.includes(body.track)) {
      return NextResponse.json({ error: "缺少有效的赛道字段 track" }, { status: 400 });
    }
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "缺少项目名称 title" }, { status: 400 });
    }

    const report = await evaluate(body);
    saveReport(report);
    return NextResponse.json({ report });
  } catch (e) {
    console.error("[evaluate] error:", e);
    return NextResponse.json(
      { error: "评估失败", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
