// SearXNG 元搜索引擎（三态实例源 + 双发综合 + 语言策略，rc.4 逐字搬移）
// AUTO-EXTRACT rc.4：正文自 src/index.js 逐字搬移，除加 export/尾部 setter 外未改动。
import { USER_AGENT, uniqueSources } from "../common";
import { SEARXNG_TIME, approximateTimeRange } from "../../util/time";
import { guardRelevance } from "../../util/relevance";

//#region searxng (meta-search, free instances, auto-failover)
export const SEARXNG_INSTANCES = [
  "https://opnxng.com",
  "https://priv.au",
  "https://searx.be",
  "https://searx.tiekoetter.com",
  "https://search.inetol.net",
  "https://paulgo.io",
];

// SearXNG 实例来源三态严格互斥:public(仅公网池)| local(仅回环/本地单实例)| custom(仅自定义列表)。
// 任一态都不向其他态回落:custom 空列表=无端点(报错),不偷走公网。
// searxngMode 缺省(旧配置)时按 searxngInstances 是否非空推断 → 老配置零迁移兼容。
export function resolveSearxngInstances(cfg) {
  const mode = cfg?.searxngMode || (cfg?.searxngInstances?.length ? "custom" : "public");
  if (mode === "local") return [cfg?.searxngLocalUrl || "http://localhost:8080"];
  if (mode === "custom") return (cfg?.searxngInstances ?? []).filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim());
  return SEARXNG_INSTANCES;
}

// 本地/公网实例失败 → 可操作的修复提示(403=JSON API 未放行;本地拒连=Docker 端口映射)
export function searxngFailureHint(base, status, message) {
  let host = "";
  try {
    host = new URL(base).hostname;
  } catch {}
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1" || host === "host.docker.internal";
  if (status === 403) {
    return " (SearXNG 需在 settings.yml 的 search.formats 中加入 json 才开放 JSON API,改后重启实例)";
  }
  if (isLocal && (message.includes("fetch failed") || message.includes("ECONNREFUSED") || message.includes("terminate"))) {
    return " (本地实例不可达:确认容器已启动且端口已映射,默认 8080 — docker run -p 8080:8080 searxng/searxng)";
  }
  return "";
}

// SearXNG 返回语言策略（searxng-reader-langfix R1 加强版）：先按 query 文字检测
// （假名→ja、谚文→ko、西里尔→ru、其余汉字→zh-CN；.48 实测同一实体的 wiki 卡只在
// 对应语言档出现，如 新海誠+ja 命中而 zh-CN 不命中），判不出再落 cfg.lang 映射
//（默认 zh→zh-CN，保证中文实体 infobox 可命中）。zh-Hans 实测 HTTP 400，禁直传任意 locale。
const SEARXNG_LANG_BY_CFG = { zh: "zh-CN", en: "en", ru: "ru", ja: "ja", de: "de", fr: "fr", es: "es", ko: "ko" };
export function detectSearxngLanguage(query) {
  const q = String(query ?? "");
  if (/[\u3040-\u30ff]/.test(q)) return "ja"; // 假名优先于汉字：日文 query 同含汉字
  if (/[\uac00-\ud7af]/.test(q)) return "ko";
  if (/[\u0400-\u04ff]/.test(q)) return "ru";
  if (/[\u4e00-\u9fff]/.test(q)) return "zh-CN";
  return null;
}
// locale 归一：zh-Hans 等变体实测 HTTP 400，收敛到安全值（风险2）；其余取主子标签；非法/空→zh-CN。
export function normalizeSearxngLang(raw) {
  const lang = String(raw ?? "").trim();
  if (!lang) return "zh-CN";
  if (SEARXNG_LANG_BY_CFG[lang]) return SEARXNG_LANG_BY_CFG[lang];
  if (lang === "all" || lang === "none") return lang;
  if (/^zh\b/i.test(lang)) return "zh-CN";
  const m = lang.match(/^([a-z]{2})(?:[-_][A-Za-z]{2,4}(?:[-_][A-Za-z]{2,4})?)?$/i);
  return m ? m[1].toLowerCase() : "zh-CN";
}
export function searxngLanguage(query, cfg) {
  // 0.10.3：显式锁定档优先于检测；auto/空 = query 检测优先、cfg.lang 兜底
  const locked = String(cfg?.searxngLanguage ?? "auto").trim();
  if (locked && locked !== "auto") return normalizeSearxngLang(locked);
  const detected = detectSearxngLanguage(query);
  if (detected) return detected;
  return normalizeSearxngLang(cfg?.lang ?? "zh");
}

// 单实例 SearXNG JSON 查询：成功返回 { sources, content? }，失败抛错（带可操作提示）。
// sources = results + 维基卡片（infoboxes）归一条目；content = answers 文本（无 url，不进条目）。
export async function searxngOnce(base, query, options, signal?) {
  const params = new URLSearchParams({ q: query, format: "json" });
  // R1：注入返回语言（query 检测优先，cfg.lang 兜底）
  const lang = searxngLanguage(query, options);
  if (lang) params.set("language", lang);
  // SearXNG 原生支持 time_range 过滤（只支持固定档，自定义取近似档）
  if (options?.timeRange) {
    const tr = SEARXNG_TIME[approximateTimeRange(options.timeRange.days ?? 7)];
    if (tr) params.set("time_range", tr);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    response = await fetch(`${base}/search?${params}`, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      signal: ctrl.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message}${searxngFailureHint(base, 0, message)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}${searxngFailureHint(base, response.status, "")}`);
  }
  const data = await response.json().catch(() => null);
  if (!data || !Array.isArray(data.results)) throw new Error("invalid JSON");
  const sources = data.results
    .filter((r) => r.url)
    .map((r) => ({
      url: r.url,
      ...(r.title ? { title: String(r.title) } : {}),
      ...(r.content ? { snippet: String(r.content) } : {}),
    }));
  // R2：聚合维基卡片。实测（.48）infobox 对象带顶层 url，urls[] 作双保险；
  // 归一成与 results 同构的 {url,title,snippet} 后直接交给下游 uniqueSources/mergeSearxngPair 去重。
  for (const ib of Array.isArray(data.infoboxes) ? data.infoboxes : []) {
    const url = ib?.url || ib?.urls?.find((u) => u?.url)?.url;
    if (!url) continue;
    sources.push({
      url: String(url),
      ...(ib.title || ib.infobox || ib.id ? { title: String(ib.title || ib.infobox || ib.id) } : {}),
      ...(ib.content ? { snippet: String(ib.content) } : {}),
    });
  }
  const content = (Array.isArray(data.answers) ? data.answers : [])
    .filter((a) => typeof a === "string" && a.trim())
    .join("\n");
  // R3/R4：results+infoboxes 合并集（含答案文本）全空才判 0 命中抛错，回退链语义不变；
  // 只有 answers 时也算命中（返空条目+content，上层链会按 0 结果继续回退，不丢可达性信息）。
  if (sources.length === 0 && !content) throw new Error("0 results");
  return content && sources.length === 0 ? { sources: [], content } : { sources, ...(content ? { content } : {}) };
}

// 双实例综合：按 URL（去尾部斜杠）去重，两实例都命中的条目优先置前，
// 其余保持首次出现顺序（V8 sort 稳定）。
export function mergeSearxngPair(aSources, bSources, maxResults) {
  const norm = (url) => String(url).trim().replace(/\/+$/, "");
  const counts = new Map();
  const byUrl = new Map();
  for (const source of [...aSources, ...bSources]) {
    const key = norm(source.url);
    if (!byUrl.has(key)) byUrl.set(key, source);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const merged = [...byUrl.values()].sort((x, y) => (counts.get(norm(y.url)) ?? 1) - (counts.get(norm(x.url)) ?? 1));
  return merged.slice(0, maxResults ?? 10);
}

export async function searchSearxng(query, maxResults, options, signal?) {
  const res = await searchSearxngRaw(query, maxResults, options, signal);
  // 相关性守卫（0.11.3，与 bing 同判据）：公网实例池回无关热页时判空，交回退链。
  return guardRelevance(query, res);
}

export async function searchSearxngRaw(query, maxResults, options, signal?) {
  const instances = resolveSearxngInstances(options);
  // 三态互斥:当前模式没有端点就是配置问题,直接报可操作错误,绝不偷用其他态的实例
  if (instances.length === 0) {
    throw new Error("SearXNG: 当前模式没有已注册端点（自定义列表为空）——请添加端点或切换到公网池模式");
  }
  // 聚合所有实例的失败原因，避免只显示最后一个实例的错误
  const errors = [];
  const noteError = (base, error) => {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${base}: ${message}`);
  };
  // custom 模式且 ≥2 实例：自动双发（前两个端点并发，等两个都结束后综合），
  // 剩余实例仅作双双失败后的顺序兜底；public/local 保持原顺序故障转移。
  const mode = options?.searxngMode || (options?.searxngInstances?.length ? "custom" : "public");
  if (mode === "custom" && instances.length >= 2) {
    const [primary, secondary, ...rest] = instances;
    const settled = await Promise.allSettled([
      searxngOnce(primary, query, options, signal),
      searxngOnce(secondary, query, options, signal),
    ]);
    const okResults = [];
    settled.forEach((r, i) => {
      if (r.status === "fulfilled") okResults.push(r.value);
      else {
        if (signal?.aborted) throw r.reason;
        noteError(i === 0 ? primary : secondary, r.reason);
      }
    });
    const pickContent = (results) => {
      const c = results.map((r) => r.content).filter(Boolean)[0] ?? "";
      return c ? { content: c } : {};
    };
    if (okResults.length >= 2) {
      return { sources: mergeSearxngPair(okResults[0].sources, okResults[1].sources, maxResults ?? 10), truncated: false, ...pickContent(okResults) };
    }
    if (okResults.length === 1) {
      return { sources: uniqueSources(okResults[0].sources, maxResults ?? 10), truncated: false, ...pickContent(okResults) };
    }
    for (const base of rest) {
      try {
        const hit = await searxngOnce(base, query, options, signal);
        return { sources: uniqueSources(hit.sources, maxResults ?? 10), truncated: false, ...(hit.content ? { content: hit.content } : {}) };
      } catch (error) {
        if (signal?.aborted) throw error;
        noteError(base, error);
      }
    }
  } else {
    for (const base of instances) {
      try {
        const hit = await searxngOnce(base, query, options, signal);
        return { sources: uniqueSources(hit.sources, maxResults ?? 10), truncated: false, ...(hit.content ? { content: hit.content } : {}) };
      } catch (error) {
        if (signal?.aborted) throw error;
        noteError(base, error);
      }
    }
  }
  // 空实例列表兜底：避免 "all SearXNG instances failed: " 尾巴悬空
  const detail = errors.length > 0 ? errors.join(", ") : "no instances configured";
  // Note 会引用这个错误消息，截断避免 6 实例全挂时刷屏
  throw new Error(`all SearXNG instances failed: ${detail.slice(0, 300)}`);
}
//#endregion
