// SerpBase 引擎（rc.5 逐字搬移；SERPBASE_LOCALE 供 serply 复用）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources, SERPBASE_URL } from "../common";

export const SERPBASE_LOCALE = {
  zh: { hl: "zh-CN", gl: "cn" },
  en: { hl: "en", gl: "us" },
  ru: { hl: "ru", gl: "ru" },
  ja: { hl: "ja", gl: "jp" },
  de: { hl: "de", gl: "de" },
  fr: { hl: "fr", gl: "fr" },
  es: { hl: "es", gl: "es" },
  ko: { hl: "ko", gl: "kr" },
};

export async function searchSerpbase(query, maxResults, apiKey, options, signal?) {
  if (!apiKey) throw new Error("SerpBase search requires SERPBASE_API_KEY");
  // hl/gl 跟随设置页的 lang（SerpBase 支持 Google 的 hl/gl 本地化），默认 en/us
  const locale = SERPBASE_LOCALE[options?.lang] ?? SERPBASE_LOCALE.en;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    response = await fetch(SERPBASE_URL, {
      method: "POST",
      redirect: "error",
      headers: {
        "X-API-Key": apiKey,
        "content-type": "application/json",
        accept: "application/json",
        "user-agent": "deepseek-harness/union-search",
      },
      body: JSON.stringify({ q: query, hl: locale.hl, gl: locale.gl, page: 1 }),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`SerpBase request failed: ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`SerpBase API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }
  // HTTP 200 + status 字段：0 成功 / 1001 key 无效或缺 / 1000 请求非法
  const data = await response.json();
  if (data.status !== 0) {
    if (data.status === 1001) {
      throw new Error("SerpBase API key is invalid or missing (status 1001) - update it in Settings > Plugins > Union Search");
    }
    throw new Error(`SerpBase API error (status ${data.status}): ${String(data.error ?? "").slice(0, 200)}`);
  }
  const sources = (data.organic ?? [])
    .filter((r) => r.link)
    .map((r) => ({
      url: r.link,
      ...(r.title ? { title: String(r.title) } : {}),
      ...(r.snippet ? { snippet: String(r.snippet) } : {}),
      ...((r.published_at ?? r.date) ? { publishedAt: String(r.published_at ?? r.date) } : {}),
    }));
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// Serply: 必须配置 SERPLY_API_KEY（无 key 跳过，同 serpbase）
// Google SERP API：GET + X-Api-Key 头，返回 results[]（title/link/description）；num 上限 10。
// 错误走 HTTP 状态码，401 时 JSON 为 {"detail": "Invalid API key"}。
