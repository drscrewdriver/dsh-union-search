// Firecrawl 引擎（rc.5 逐字搬移）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources, FIRECRAWL_URL } from "../common";
import { approximateTimeRange } from "../../util/time";

export const FIRECRAWL_TBS = { day: "qdr:d", week: "qdr:w", month: "qdr:m", year: "qdr:y" };

// Firecrawl 自定义绝对日期 → Google tbs 语法（cd_min 用 M/D/YYYY）
export function formatFirecrawlDate(date) {
  const [y, m, d] = String(date).split("-").map((n) => parseInt(n, 10));
  return `${m}/${d}/${y}`;
}

export async function searchFirecrawl(query, maxResults, apiKey, timeRange, signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    const body = { query, limit: Math.min(Math.max(maxResults ?? 5, 1), 10) };
    // Firecrawl 时间过滤：tbs 支持固定档（qdr:d/w/m/y）与自定义绝对区间（cdr:1,cd_min:...）
    if (timeRange) {
      if (timeRange.after) {
        body.tbs = `cdr:1,cd_min:${formatFirecrawlDate(timeRange.after)}`;
      } else if (timeRange.days !== undefined) {
        const tr = approximateTimeRange(timeRange.days);
        if (FIRECRAWL_TBS[tr]) body.tbs = FIRECRAWL_TBS[tr];
      }
    }
    response = await fetch(FIRECRAWL_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: "error",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Firecrawl request failed: ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401) {
      throw new Error("Firecrawl API key is invalid (HTTP 401) - update it in Settings > Plugins > Union Search");
    }
    if (response.status === 429) {
      throw new Error("Firecrawl rate limit exceeded (HTTP 429) - configure FIRECRAWL_API_KEY for higher limits");
    }
    throw new Error(`Firecrawl API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const sources = (data.data?.web ?? [])
    .filter((r) => r.url)
    .map((r) => ({
      url: r.url,
      ...(r.title ? { title: String(r.title) } : {}),
      ...(r.description ? { snippet: String(r.description).slice(0, 300) } : {}),
    }));
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// Parallel: 有 key 走 REST（x-api-key）；无 key 走官方 MCP 免 key。自然语言 objective + search_queries，返回带 excerpts 的结果
