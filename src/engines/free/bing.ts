// Bing 免费引擎（mkt 本地化 + 缓存页相关性守卫，rc.4 逐字搬移）
// AUTO-EXTRACT rc.4：正文自 src/index.js 逐字搬移，除加 export/尾部 setter 外未改动。
import { ACCEPT_LANG, LANG_PROFILES, MARKET_TO_LANG, BING_URL, uniqueSources, fetchHtmlWithRetry } from "../common";
import { stripTags } from "../../util/text";
import { looksRelevant } from "../../util/relevance";

export async function searchBing(query, maxResults, options, signal?) {
  // mkt：显式 bingMarket 优先；否则按 lang 映射（zh→zh-CN, ru→ru-RU ...）
  const profile = LANG_PROFILES[options?.lang] ?? LANG_PROFILES.zh;
  const market = options?.bingMarket ?? profile.market;
  const params = new URLSearchParams({ q: query, mkt: market });
  // Accept-Language：显式 bingMarket 时按 market 反推（避免中文 header 污染），否则用 lang 档案
  const acceptLang = options?.bingMarket
    ? (MARKET_TO_LANG[market] ?? ACCEPT_LANG)
    : (profile.acceptLang ?? ACCEPT_LANG);
  const adlt = options?.safeSearch ?? "off";
  if (adlt === "off") params.set("adlt", "off");
  else if (adlt === "moderate") params.set("adlt", "moderate");
  else if (adlt === "strict") params.set("adlt", "strict");
  const html = await fetchHtmlWithRetry(`${BING_URL}?${params}`, signal, acceptLang);
  const blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/g) ?? [];
  const sources = [];
  for (const block of blocks) {
    const hrefMatch = block.match(/<a[^>]*href="(https?:\/\/[^"]+)"/);
    const titleMatch = block.match(/<h2[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>[\s\S]*?<\/h2>/);
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    if (!hrefMatch) continue;
    sources.push({
      url: hrefMatch[1],
      ...(titleMatch ? { title: stripTags(titleMatch[1]) } : {}),
      ...(snippetMatch ? { snippet: stripTags(snippetMatch[1]) } : {}),
    });
  }
  // Bing 无结果时会返回无关的缓存页：判为 0 结果，交给统一回退链换下一个引擎
  if (sources.length > 0 && !looksRelevant(query, sources)) {
    return { sources: [], truncated: false };
  }
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}
