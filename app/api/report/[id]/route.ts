import { NextResponse } from "next/server";
import { getReport } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = getReport(id);
  if (!report) {
    return NextResponse.json(
      { error: "报告不存在或已过期（Serverless 冷启动后内存数据会丢失）" },
      { status: 404 }
    );
  }
  return NextResponse.json({ report });
}
