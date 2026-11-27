// Grok X 搜索（xAI Responses API，仅显式选择时运行；rc.6 逐字搬移）
// AUTO-EXTRACT rc.6：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources, XAI_RESPONSES_URL, GROK_DEFAULT_MODEL } from "../common";

export async function searchGrok(query, maxResults, apiKey, options, signal) {
  if (!apiKey) throw new Error("Grok requires XAI_API_KEY");
  const model = (typeof options?.grokModel === "string" && options.grokModel.trim()) || GROK_DEFAULT_MODEL;
  const base = (typeof options?.grokBaseUrl === "string" && options.grokBaseUrl.trim()) || XAI_RESPONSES_URL;
  const url = /\/responses$/.test(base) ? base : base.replace(/\/+$/, "") + "/responses";
  const response = await fetch(url, {
    method: "POST",
    redirect: "error",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + apiKey,
      "user-agent": "deepseek-harness/union-search",
    },
    body: JSON.stringify({ model, input: String(query), tools: [{ type: "x_search" }] }),
    signal: AbortSignal.any([...(signal !== undefined ? [signal] : []), AbortSignal.timeout(45000)]),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error("Grok API key is invalid (HTTP " + response.status + ") - update it in Settings > Plugins > Union Search");
    }
    if (response.status === 429) {
      throw new Error("Grok rate limit or quota exceeded (HTTP 429) - check your xAI usage/limits");
    }
    throw new Error("Grok search API error (HTTP " + response.status + "): " + detail.slice(0, 200));
  }
  const data = await response.json();
  if (data?.error) throw new Error("Grok response failed: " + (data.error.message ?? JSON.stringify(data.error).slice(0, 200)));
  const sources = [];
  for (const item of data.output ?? []) {
    if (!item) continue;
    for (const part of Array.isArray(item.content) ? item.content : []) {
      for (const annotation of part?.annotations ?? []) {
        const u = typeof annotation?.url === "string" ? annotation.url : typeof annotation?.href === "string" ? annotation.href : "";
        if (!u) continue;
        sources.push({
          url: u,
          ...(annotation.title ? { title: String(annotation.title) } : {}),
        });
      }
    }
  }
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}
