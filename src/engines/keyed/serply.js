// Serply 引擎（rc.5 逐字搬移）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources, SERPLY_URL } from "../common";
import { SERPBASE_LOCALE } from "./serpbase";

export async function searchSerply(query, maxResults, apiKey, options, signal) {
  if (!apiKey) throw new Error("Serply search requires SERPLY_API_KEY");
  // hl/gl 跟随设置页的 lang，与 SerpBase 同一套 Google 本地化参数，默认 en/us
  const locale = SERPBASE_LOCALE[options?.lang] ?? SERPBASE_LOCALE.en;
  const params = new URLSearchParams({
    q: query,
    num: String(Math.min(Math.max(maxResults ?? 10, 1), 10)),
    hl: locale.hl,
    gl: locale.gl,
  });
  const response = await fetch(`${SERPLY_URL}?${params}`, {
    method: "GET",
    redirect: "error",
    headers: {
      "X-Api-Key": apiKey,
      accept: "application/json",
      "user-agent": "deepseek-harness/union-search",
    },
    signal: AbortSignal.any([...(signal !== undefined ? [signal] : []), AbortSignal.timeout(15000)]),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Serply API key is invalid (HTTP ${response.status}) - update it in Settings > Plugins > Union Search`);
    }
    throw new Error(`Serply API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const sources = (data.results ?? [])
    .filter((r) => r.link)
    .map((r) => ({
      url: r.link,
      ...(r.title ? { title: String(r.title) } : {}),
      ...(r.description ? { snippet: String(r.description) } : {}),
    }));
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// You.com: requires YOUCOM_API_KEY (get a free key at https://you.com/platform/api-keys)
