// 国产 Keyed REST：智谱/Bocha/Metaso（rc.5 逐字搬移）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources, ZHIPU_SEARCH_URL, BOCHA_SEARCH_URL, METASO_SEARCH_URL } from "../common";
import { approximateTimeRange } from "../../util/time";

export const REL_TO_ONE = { day: "oneDay", week: "oneWeek", month: "oneMonth", year: "oneYear" };

// 智谱 Web Search API：普通平台 ZHIPU_API_KEY；search_pro(默认) 约 0.03 元/次；四档引擎可选；支持时间过滤
export async function searchZhipu(query, maxResults, apiKey, engine, timeRange, signal?) {
  if (!apiKey) throw new Error("Zhipu requires ZHIPU_API_KEY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    const body: any = {
      search_query: String(query).slice(0, 70),
      search_engine: (typeof engine === "string" && engine.trim()) || "search_pro",
      search_intent: false,
      count: Math.min(Math.max(maxResults ?? 10, 1), 50),
      content_size: "medium",
    };
    if (timeRange) {
      const tr = approximateTimeRange(timeRange.days ?? 7);
      if (REL_TO_ONE[tr]) body.search_recency_filter = REL_TO_ONE[tr];
    }
    response = await fetch(ZHIPU_SEARCH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: "error",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Zhipu request failed: ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error("Zhipu API key is invalid (HTTP " + response.status + ") - update it in Settings > Plugins > Union Search");
    }
    if (response.status === 429) throw new Error("Zhipu rate limit / concurrency exceeded (HTTP 429)");
    throw new Error(`Zhipu API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  if (data && data.error) throw new Error(`Zhipu API error ${data.error.code ?? "?"}: ${data.error.message ?? JSON.stringify(data.error).slice(0, 200)}`);
  const items = Array.isArray(data.search_result) ? data.search_result : [];
  const sources = items
    .filter((r) => r && r.link)
    .map((r) => ({
      url: String(r.link),
      ...(r.title ? { title: String(r.title) } : {}),
      ...(r.content ? { snippet: String(r.content).slice(0, 300) } : {}),
      ...(r.media ? { source: String(r.media) } : {}),
      ...(r.publish_date && /^\d{4}-\d{2}-\d{2}/.test(r.publish_date) ? { publishedAt: r.publish_date } : {}),
    }));
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// 博查 Web Search API：BOCHA_API_KEY；约 0.036 元/次；freshness 支持时间过滤；summary=true 取长摘要
export async function searchBocha(query, maxResults, apiKey, timeRange, signal?) {
  if (!apiKey) throw new Error("Bocha requires BOCHA_API_KEY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    const body: any = { query: String(query), count: Math.min(Math.max(maxResults ?? 10, 1), 50), summary: true, freshness: "noLimit" };
    if (timeRange) {
      const tr = approximateTimeRange(timeRange.days ?? 7);
      if (REL_TO_ONE[tr]) body.freshness = REL_TO_ONE[tr];
    }
    response = await fetch(BOCHA_SEARCH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: "error",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Bocha request failed: ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error("Bocha API key is invalid (HTTP " + response.status + ") - update it in Settings > Plugins > Union Search");
    }
    if (response.status === 429) throw new Error("Bocha rate limit exceeded (HTTP 429)");
    throw new Error(`Bocha API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  if (data && typeof data.code === "number" && data.code !== 0) throw new Error(`Bocha API error ${data.code}: ${data.message ?? ""}`);
  const items = data?.data?.webPages?.value ?? [];
  const sources = (Array.isArray(items) ? items : [])
    .filter((r) => r && r.url)
    .map((r) => ({
      url: String(r.url),
      ...(r.name ? { title: String(r.name) } : {}),
      ...(r.summary || r.snippet ? { snippet: String(r.summary || r.snippet).slice(0, 300) } : {}),
      ...(r.siteName ? { source: String(r.siteName) } : {}),
    }));
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// 秘塔 Search API：METASO_API_KEY(mk-)；约 0.03 元/query，送 5000 点；scope 选网页/学术/文库等；时间过滤暂不加
export async function searchMetaso(query, maxResults, apiKey, scope, signal?) {
  if (!apiKey) throw new Error("Metaso requires METASO_API_KEY");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    const body: any = {
      q: String(query),
      scope: (typeof scope === "string" && scope.trim()) || "webpage",
      size: String(Math.min(Math.max(maxResults ?? 10, 1), 50)),
      includeSummary: false,
      includeRowContent: false,
    };
    response = await fetch(METASO_SEARCH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: "error",
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Metaso request failed: ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error("Metaso API key is invalid (HTTP " + response.status + ") - update it in Settings > Plugins > Union Search");
    }
    if (response.status === 429) throw new Error("Metaso rate limit / quota exceeded (HTTP 429)");
    throw new Error(`Metaso API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  if (data && typeof data.code === "number" && data.code !== 0 && !data.data) throw new Error(`Metaso API error ${data.code}: ${data.msg ?? data.message ?? ""}`);
  const items = data?.data?.items ?? data?.items ?? [];
  const sources = (Array.isArray(items) ? items : [])
    .filter((r) => r && (r.link || r.url))
    .map((r) => ({
      url: String(r.link || r.url),
      ...(r.title ? { title: String(r.title) } : {}),
      ...(r.content || r.snippet ? { snippet: String(r.content || r.snippet).slice(0, 300) } : {}),
    }));
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// Grok X 搜索：xAI Responses API + x_search 工具；XAI_API_KEY；按 token+按次计费，仅显式选中时使用（见 EXPLICIT_ONLY_ENGINES）
// 仿 searchOpenai：引用来源以 url_citation annotation 挂在 message content 上，防御式扫描全部 output 项
