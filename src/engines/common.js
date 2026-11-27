// 引擎共用面（0.17.0-rc.4 自 index.js 逐字搬移）：端点常量 + 语言档案 + ALPN HTML 抓取链
// AUTO-EXTRACT rc.4：正文自 src/index.js 逐字搬移，除加 export/尾部 setter 外未改动。
import { httpsFetchText } from "../util/http";

export const DDG_HTML_URL = "https://html.duckduckgo.com/html/";
export const DDG_LITE_URL = "https://lite.duckduckgo.com/lite/";
export const BING_URL = "https://www.bing.com/search";
export const TAVILY_URL = "https://api.tavily.com/search";
export const FIRECRAWL_URL = "https://api.firecrawl.dev/v2/search";
export const PARALLEL_URL = "https://api.parallel.ai/v1/search";
export const PARALLEL_MCP_URL = "https://search.parallel.ai/mcp";
export const KEENABLE_URL = "https://api.keenable.ai/v1/search";
export const KEENABLE_MCP_URL = "https://api.keenable.ai/mcp";
export const SERPBASE_URL = "https://api.serpbase.dev/google/search";
export const SERPLY_URL = "https://api.serply.io/v1/search";
export const YOUCOM_URL = "https://ydc-index.io/v1/search";
export const DOUBAO_SEARCH_URL = "https://open.feedcoopapi.com/search_api/web_search";
export const ZHIHU_MCP_URL = "https://developer.zhihu.com/api/mcp/v1";
// 国产 LLM 专用 REST 搜索（均需各自 API Key，纯 fetch，仿 Tavily）
export const ZHIPU_SEARCH_URL = "https://open.bigmodel.cn/api/paas/v4/web_search";
export const BOCHA_SEARCH_URL = "https://api.bochaai.com/v1/web-search";
export const METASO_SEARCH_URL = "https://metaso.cn/api/v1/search";
// Grok X 搜索：xAI Responses API（与 searchOpenai 同构），仅显式选中时使用
export const XAI_RESPONSES_URL = "https://api.x.ai/v1/responses";
export const GROK_DEFAULT_MODEL = "grok-4.2";
export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
export const ACCEPT_LANG = "zh-CN,zh;q=0.9,en;q=0.8";

// 语言 → Bing 本地化档案：{ market, acceptLang }。
// lang 字段（设置页可切换）驱动 Bing 的 mkt + Accept-Language，让非中文用户
// 也能拿到本地化结果（俄语搜俄文等）。bingMarket 显式设置时优先于映射。
export const LANG_PROFILES = {
  zh: { market: "zh-CN", acceptLang: "zh-CN,zh;q=0.9,en;q=0.8" },
  en: { market: "en-US", acceptLang: "en-US,en;q=0.9" },
  ru: { market: "ru-RU", acceptLang: "ru-RU,ru;q=0.9,en;q=0.8" },
  ja: { market: "ja-JP", acceptLang: "ja-JP,ja;q=0.9,en;q=0.8" },
  de: { market: "de-DE", acceptLang: "de-DE,de;q=0.9,en;q=0.8" },
  fr: { market: "fr-FR", acceptLang: "fr-FR,fr;q=0.9,en;q=0.8" },
  es: { market: "es-ES", acceptLang: "es-ES,es;q=0.9,en;q=0.8" },
  ko: { market: "ko-KR", acceptLang: "ko-KR,ko;q=0.9,en;q=0.8" },
};
// market → 语言（bingMarket 显式设置时反推 accept-language，避免中文优先 header 污染）
export const MARKET_TO_LANG = {
  "zh-CN": "zh-CN,zh;q=0.9,en;q=0.8",
  "zh-TW": "zh-TW,zh;q=0.9,en;q=0.8",
  "en-US": "en-US,en;q=0.9",
  "en-GB": "en-GB,en;q=0.9",
  "ru-RU": "ru-RU,ru;q=0.9,en;q=0.8",
  "ja-JP": "ja-JP,ja;q=0.9,en;q=0.8",
  "de-DE": "de-DE,de;q=0.9,en;q=0.8",
  "fr-FR": "fr-FR,fr;q=0.9,en;q=0.8",
  "es-ES": "es-ES,es;q=0.9,en;q=0.8",
  "ko-KR": "ko-KR,ko;q=0.9,en;q=0.8",
};
export function uniqueSources(sources, limit) {
  const seen = new Set();
  const out = [];
  for (const s of sources) {
    if (s.url && !seen.has(s.url)) {
      seen.add(s.url);
      out.push(s);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export async function fetchHtml(url, signal, acceptLang) {
  // 单次请求超时 12s，避免挂起被当成 Connection error（0.11.5 起走 ALPN https 基元）
  let result;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const onAbort = () => ctrl.abort();
    signal?.addEventListener("abort", onAbort);
    try {
      result = await httpsFetchText(url, {
        headers: { "user-agent": USER_AGENT, "accept-language": acceptLang ?? ACCEPT_LANG },
        signal: ctrl.signal,
        timeoutMs: 14000,
      });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`connection error: ${error?.message ?? String(error)}`);
  }
  const { status, ok, text: html } = result;
  if (!ok) {
    throw new Error(`HTTP ${status} from ${url.split("?")[0]}`);
  }
  // DuckDuckGo 反爬验证页检测（HTTP 202 或验证关键字）
  if (status === 202 || /anomaly|captcha|unusual traffic|robot check/i.test(html.slice(0, 4000))) {
    throw new Error("DuckDuckGo is rate-limited right now (anti-bot challenge, usually temporary) - Bing works");
  }
  return html;
}

// 带重试的抓取：网络错误/空结果时重试，间隔 1.5s，最多 3 次
export async function fetchHtmlWithRetry(url, signal, acceptLang) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const html = await fetchHtml(url, signal, acceptLang);
      if (html.length > 500) return html;
      lastError = new Error(`empty response (${html.length} bytes)`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw lastError ?? new Error("fetch failed");
}
