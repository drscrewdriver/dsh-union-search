// 知乎开放平台 MCP 引擎（rc.5 逐字搬移；Zhihu global/site via mcp_adapter）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources, ZHIHU_MCP_URL } from "./common";
import { approximateTimeRange } from "../util/time";
import { mcpCall, mcpContentText } from "../mcp_adapter.js";

export function zhihuMcpHeaders(apiKey) {
  return {
    authorization: `Bearer ${apiKey}`,
    "user-agent": "deepseek-harness/union-search",
  };
}

// CallToolResult.content[0].text 内层 JSON → sources；{code:!=0} 与解析失败都算失败（不当搜索结果）
export function zhihuToSources(result, maxResults) {
  const text = mcpContentText(result);
  if (!text) return { sources: [], truncated: false };
  let inner;
  try {
    inner = JSON.parse(text);
  } catch {
    throw new Error(`Zhihu inner content JSON parse error: ${text.slice(0, 200)}`);
  }
  if (inner && typeof inner.code === "number" && inner.code !== 0) {
    throw new Error(`Zhihu API error ${inner.code}: ${inner.message ?? JSON.stringify(inner).slice(0, 200)}`);
  }
  const items = inner?.data?.items;
  if (!Array.isArray(items)) return { sources: [], truncated: false };
  const sources = items
    .filter((it) => it && it.url)
    .map((it) => ({
      url: String(it.url),
      ...(it.title ? { title: String(it.title) } : {}),
      ...(it.summary ? { snippet: String(it.summary) } : {}),
      ...(Number.isFinite(it.edit_time) && it.edit_time > 0
        ? { publishedAt: new Date(it.edit_time * 1000).toISOString().replace(/\.\d{3}Z$/, "Z") }
        : {}),
      ...(it.author_name ? { author: String(it.author_name) } : {}),
    }));
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

export async function searchZhihuGlobal(query, maxResults, apiKey, timeRange, signal) {
  if (!apiKey) throw new Error("Zhihu search requires ZHIHU_API_KEY");
  const count = Math.min(Math.max(maxResults ?? 10, 1), 20);
  const arguments_ = { query: String(query).slice(0, 100), count, search_db: "all" };
  if (timeRange) {
    // 已验证原生时间过滤：filter 表达式 publish_time>=<unix秒>；{days} 相对 / {after} 绝对日期都折算成秒
    const afterMs = timeRange.after
      ? Date.parse(`${timeRange.after}T00:00:00Z`)
      : Date.now() - (timeRange.days ?? 1) * 86_400_000;
    if (Number.isFinite(afterMs)) arguments_.filter = `publish_time>=${Math.floor(afterMs / 1000)}`;
  }
  const result = await mcpCall(ZHIHU_MCP_URL, zhihuMcpHeaders(apiKey), "tools/call", {
    name: "global_search",
    arguments: arguments_,
  }, { timeoutMs: 20000, signal, label: "Zhihu" });
  return zhihuToSources(result, maxResults);
}

export async function searchZhihuSite(query, maxResults, apiKey, signal) {
  if (!apiKey) throw new Error("Zhihu search requires ZHIHU_API_KEY");
  const count = Math.min(Math.max(maxResults ?? 10, 1), 20);
  const result = await mcpCall(ZHIHU_MCP_URL, zhihuMcpHeaders(apiKey), "tools/call", {
    name: "zhihu_search",
    arguments: { query: String(query).slice(0, 100), count },
  }, { timeoutMs: 20000, signal, label: "Zhihu" });
  return zhihuToSources(result, maxResults);
}


// ── 国产 REST 搜索：智谱 / 博查 / 秘塔（均需各自 API Key，纯 fetch，仿 Tavily）──────
// approximateTimeRange 输出 day/week/month/year → 这两家的相对时间档（智谱 search_recency_filter / 博查 freshness 同枚举）
