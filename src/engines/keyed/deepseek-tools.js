// DeepSeek tools 联网引擎（rc.5 逐字搬移）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources } from "../common";

export const DEEPSEEK_TOOLS_DEFAULT_ENDPOINT = "https://api.deepseek.com/v1/tools/search";
export function resolveDeepSeekToolsEndpoint(baseUrl) {
  const raw = String(baseUrl ?? "").trim();
  if (!raw) return DEEPSEEK_TOOLS_DEFAULT_ENDPOINT;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return DEEPSEEK_TOOLS_DEFAULT_ENDPOINT;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return DEEPSEEK_TOOLS_DEFAULT_ENDPOINT;
  const p = u.pathname.replace(/\/+$/, "");
  if (/\/tools\/search$/.test(p) || /\/v\d+\/search$/.test(p)) {
    u.pathname = p;
    u.search = "";
    u.hash = "";
    return u.toString();
  }
  u.pathname = /\/v\d+$/.test(p) ? `${p}/tools/search` : `${p}/v1/tools/search`;
  u.search = "";
  u.hash = "";
  return u.toString();
}

export async function searchDeepSeekTools(query, maxResults, apiKey, signal, baseUrl) {
  if (!apiKey) throw new Error("DeepSeek tools search requires DEEPSEEK_API_KEY");
  const endpoint = resolveDeepSeekToolsEndpoint(baseUrl);
  const body = { query, max_results: Math.min(Math.max(maxResults ?? 5, 1), 20) };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "user-agent": "deepseek-harness/union-search",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`DeepSeek tools search request failed (${endpoint}): ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error(`DeepSeek API key is invalid (HTTP ${response.status}) - update it in Settings > Plugins > Union Search`);
    }
    throw new Error(`DeepSeek search API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const sources = (Array.isArray(data.results) ? data.results : [])
    .filter((r) => r && r.url)
    .map((r) => {
      const snippet = r.summary ?? r.snippet; // 官方字段名两说（竞品描述 summary，实际报文见 snippet），都取不硬编码
      const out = {
        url: String(r.url),
        ...(r.title ? { title: String(r.title) } : {}),
        ...(snippet ? { snippet: String(snippet).slice(0, 300) } : {}),
        ...(r.date ? { publishedAt: String(r.date) } : {}),
      };
      // rerank_score（0-3）/ authority（-1-4）透传：服务端已算好，缺失时不写入该键（不造假值）
      if (typeof r.rerank_score === "number") out.score = r.rerank_score;
      if (typeof r.authority === "number") out.authority = r.authority;
      return out;
    });
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// 阿里云百炼 EnhancedSearch MCP (search_pro)
// key = DASHSCOPE_API_KEY
