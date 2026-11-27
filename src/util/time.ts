// 时间窗工具（0.17.0-rc.3 自 index.js 原样搬移，行为零变化）。
// time_range 支持：固定档 day/week/month/year，或自定义（相对 12h/3d/2mo/1y、绝对 YYYY-MM-DD）

export interface TimeRangeSpec {
  days?: number;
  after?: string;
}

export const TIME_RANGES = ["day", "week", "month", "year"];
export const DAYS_BY_RANGE: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };
export const KEENABLE_REL: Record<string, string> = { day: "1d", week: "7d", month: "1mo", year: "1y" };
export const SEARXNG_TIME: Record<string, string> = { day: "day", week: "week", month: "month", year: "year" };

export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().replace(/\.\d{3}Z$/, ".000Z");
}

// 把用户/agent 给的 timeRange 解析成统一对象：{ days } 相对天数，或 { after } 绝对日期。
// 输入支持：day/week/month/year、12h/3d/2mo/1y、2026-07-01，或已解析的 {days}/{after} 对象。
// 无效返回 undefined。
export function parseTimeRange(input: unknown): TimeRangeSpec | undefined {
  if (input === undefined || input === null) return undefined;
  // 已解析对象：直接透传
  if (typeof input === "object") {
    const o = input as { after?: unknown; days?: unknown };
    if (typeof o.after === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.after)) return { after: o.after };
    if (typeof o.days === "number" && Number.isFinite(o.days) && o.days > 0) return { days: o.days };
    return undefined;
  }
  const s = String(input).trim().toLowerCase();
  if (s.length === 0) return undefined;
  if (TIME_RANGES.includes(s)) return { days: DAYS_BY_RANGE[s] };
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { after: s };
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(h|hour|hours|d|day|days|w|week|weeks|mo|month|months|y|year|years)$/);
  if (m) {
    const n = parseFloat(m[1]);
    const unit = m[2][0];
    const days =
      unit === "h" ? n / 24 : unit === "d" ? n : unit === "w" ? n * 7 : unit === "m" ? n * 30 : n * 365;
    return { days };
  }
  return undefined;
}

// 把自定义天数映射到只支持固定档的引擎（Tavily / SearXNG / DDG）的最近似档位
export function approximateTimeRange(days: number): string {
  if (days <= 2) return "day";
  if (days <= 14) return "week";
  if (days <= 90) return "month";
  return "year";
}
