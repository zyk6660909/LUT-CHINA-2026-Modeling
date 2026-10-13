import type { Report } from "@/types";

// ============================================================================
// 数据持久化
// 当前：内存 Map（服务端会话级）+ localStorage（客户端，跨冷启动可用）
// 生产建议：接入 Upstash Redis 或 Vercel Postgres，替换 saveReport/getReport 即可
// ============================================================================

const store = new Map<string, Report>();

/** 服务端内存缓存（Vercel Serverless 冷启动后会丢失）。 */
export function saveReport(report: Report): void {
  store.set(report.id, report);
}

export function getReport(id: string): Report | undefined {
  return store.get(id);
}

export function listReports(): Report[] {
  return Array.from(store.values());
}

// ── 客户端 localStorage（让 /report/[id] 在无数据库时也能打开） ──
const LS_PREFIX = "igem-report:";

export function saveReportLocal(report: Report): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_PREFIX + report.id, JSON.stringify(report));
  } catch {
    /* 忽略配额/隐私模式错误 */
  }
}

export function getReportLocal(id: string): Report | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_PREFIX + id);
    return raw ? (JSON.parse(raw) as Report) : null;
  } catch {
    return null;
  }
}

// ── 预留：外部持久化适配接口 ──────────────────────────────────
export interface ReportStore {
  get(id: string): Promise<Report | undefined>;
  set(report: Report): Promise<void>;
}

/** 接入 Upstash Redis / Vercel Postgres 时实现此接口并替换调用点。 */
export function createRemoteStore(): ReportStore {
  // 示例：
  // const redis = Redis.fromEnv();
  // return {
  //   get: async (id) => (await redis.get(`report:${id}`)) as Report | undefined,
  //   set: async (r) => { await redis.set(`report:${r.id}`, JSON.stringify(r)); },
  // };
  throw new Error("未配置远程存储：请在 lib/storage.ts 中实现 createRemoteStore");
}
