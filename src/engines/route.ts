// 引擎注册/智能路由/失败感知回退与同计费去重（rc.6 逐字搬移）
// AUTO-EXTRACT rc.6：正文自 src/index.js 逐字搬移，除加 export 外未改动。

export const FREE_ENGINES = ["ddg", "ddg-lite", "bing", "searxng", "anysearch"];
export const ALL_ENGINES = ["ddg", "ddg-lite", "bing", "searxng", "anysearch", "exa", "tavily", "keenable", "firecrawl", "parallel", "perplexity", "serpbase", "serply", "deepseek-tools", "deepseek-official", "you", "baidu", "kimi", "aliyun", "doubao", "zhihu_global", "zhihu_site", "zhipu", "bocha", "metaso", "openai", "gemini", "claude", "grok"];
// 模型内置搜索（按次计费）：只在你显式选中该引擎时使用；自动回退链与 auto 路由都不会兜底到它们。
export const EXPLICIT_ONLY_ENGINES = ["openai", "gemini", "claude", "grok"];
// ---- Failure-aware fallback (issue #36) ----
// Not every failure means the same thing. quota/auth are terminal for the process (the
// engine cannot succeed again without user action), so they take a session-long cooldown;
// bot-wall backs off for a while; transient is retried once on the same engine before
// advancing; invalid-response is our own/upstream schema change and is surfaced as such.
export const COOLDOWN_SESSION_MS = Number.POSITIVE_INFINITY;
export const BOT_WALL_COOLDOWN_MS = 60_000;
export const engineCooldowns = new Map(); // engine -> expiresAt (ms, or Infinity)

// fallbackOn: the set of failure classes that are acceptable reasons to advance to the
// next engine. A class absent from this list aborts the search and surfaces that engine's
// error instead of silently falling back (default: every class, i.e. always fall back).
export const FAILURE_CLASSES = ["quota", "auth", "bot-wall", "transient", "invalid-response", "unknown"];
export const DEFAULT_FALLBACK_ON = [...FAILURE_CLASSES];
export const normalizeFallbackOn = (value) => {
  if (!Array.isArray(value)) return [...DEFAULT_FALLBACK_ON];
  return [...new Set(value.filter((cls) => FAILURE_CLASSES.includes(cls)))];
};

export const isCoolingDown = (engine, now = Date.now()) => {
  const until = engineCooldowns.get(engine);
  if (until === undefined) return false;
  if (until > now) return true;
  engineCooldowns.delete(engine);
  return false;
};
export const clearCooldown = (engine) => engineCooldowns.delete(engine);
export const setCooldown = (engine, ms) => {
  engineCooldowns.set(engine, ms === COOLDOWN_SESSION_MS ? COOLDOWN_SESSION_MS : Date.now() + ms);
};
export const applyFailureCooldown = (engine, cls, rateLimited = false) => {
  if (cls === "quota" || cls === "auth") setCooldown(engine, COOLDOWN_SESSION_MS);
  else if (cls === "bot-wall") setCooldown(engine, BOT_WALL_COOLDOWN_MS);
  // 短窗限流（429/rate limit）：60 秒退避，避免下一次搜索立刻再撞（知乎 MCP 等实测存在 RPM 级限流）
  else if (rateLimited) setCooldown(engine, BOT_WALL_COOLDOWN_MS);
};

export const classifyFailure = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  const m = message.toLowerCase();
  const rateLimited = /\b429\b|rate limit|too many requests|overloaded|slow down/.test(m);
  if (!rateLimited && /no_more_credits|quota\/billing|quota exceeded|out of quota|free quota exhausted|insufficient (credits|balance|quota)|\bbudget\b|\b402\b|payment required/.test(m)) {
    return { class: "quota", message };
  }
  if (/api key is invalid|invalid api key|key is invalid|invalid.*key.*\(http (401|403)\)|unauthorized|\b401\b|\b403\b|not configured|requires [a-z0-9_]+_api_key/.test(m)) {
    return { class: "auth", message };
  }
  if (/anti-bot|captcha|unusual traffic|robot check|rate-limited right now|bot wall|bot-wall/.test(m)) {
    return { class: "bot-wall", message };
  }
  if (rateLimited || /http 5\d\d|timeout|timed out|aborted|abort|fetch failed|econn|network|socket/.test(m)) {
    return { class: "transient", message, rateLimited };
  }
  if (/invalid json|unexpected|parse|empty response|returned 0 results|schema|missing .*field|malformed/.test(m)) {
    return { class: "invalid-response", message };
  }
  return { class: "unknown", message };
};

export const FAILURE_CLASS_LABELS = {
  quota: "is out of quota",
  auth: "is misconfigured (API key rejected)",
  "bot-wall": "is rate-limited (anti-bot)",
  transient: "failed (transient)",
  "invalid-response": "returned an invalid response",
  cooldown: "is cooling down",
  unknown: "unavailable or failed",
};
// 支持 time_range 过滤的引擎（zhihu_global：global_search 的 filter 支持 publish_time>=unix秒，已实测；zhihu_site 未验证，不加）
export const TIME_ENGINES = ["tavily", "exa", "keenable", "firecrawl", "parallel", "searxng", "ddg", "ddg-lite", "baidu", "doubao", "zhihu_global", "zhipu", "bocha"];

// 虚拟搜索模式：不是单个引擎，而是 provider.search 内部的路由/并发策略
export const SEARCH_MODES = ["auto", "multi"];

export const DEFAULT_FALLBACK_ORDER = ["exa", "tavily", "keenable", "firecrawl", "parallel", "perplexity", "serpbase", "serply", "deepseek-tools", "deepseek-official", "you", "baidu", "kimi", "aliyun", "doubao", "zhipu", "bocha", "metaso", "bing", "anysearch", "ddg", "ddg-lite", "searxng"];

export function normalizeDisabledEngines(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((engine) => ALL_ENGINES.includes(engine)))];
}

// 同计费上游族（上游 #167）：同账号同 key 的引擎在 multi 模式同时点名会双计费，
// 保留先点名的一路，其余跳过并在 note 里列 dedupedSameBilling。
export const SAME_BILLING_FAMILY = { "deepseek-tools": "deepseek", "deepseek-official": "deepseek" };
export function dedupeSameBilling(engines) {
  const firsts = new Map(); // family -> 首个点名引擎
  const kept = [];
  const dedupedSameBilling = [];
  for (const engine of engines) {
    const family = SAME_BILLING_FAMILY[engine];
    if (!family) { kept.push(engine); continue; }
    if (!firsts.has(family)) { firsts.set(family, engine); kept.push(engine); continue; }
    dedupedSameBilling.push(`${engine} (skipped: same billing upstream as ${firsts.get(family)})`);
  }
  return { kept, dedupedSameBilling };
}
// blockSystemSearch 开关（0.10.0）：屏蔽系统自带搜索 = 把出厂的 deepseek-official 引擎
// 并入“已禁用”集合，路由/回退链/引擎测试/提示词全部生效。
export function effectiveDisabledEngines(cfg) {
  const list = normalizeDisabledEngines(cfg?.disabledEngines);
  if (cfg?.blockSystemSearch === true && !list.includes("deepseek-official")) {
    return [...list, "deepseek-official"];
  }
  return list;
}

export function normalizeFallbackOrder(value) {
  const configured = Array.isArray(value)
    ? value.filter((engine) => ALL_ENGINES.includes(engine))
    : [];
  return [...new Set([...configured, ...DEFAULT_FALLBACK_ORDER, ...ALL_ENGINES])];
}

export function hasCustomFallbackOrder(value) {
  if (!Array.isArray(value) || value.length === 0) return false;
  const normalized = normalizeFallbackOrder(value);
  return normalized.length !== DEFAULT_FALLBACK_ORDER.length
    || normalized.some((engine, index) => engine !== DEFAULT_FALLBACK_ORDER[index]);
}

export function enabledEngines(disabledEngines, fallbackOrder = []) {
  const disabled = new Set(normalizeDisabledEngines(disabledEngines));
  return normalizeFallbackOrder(fallbackOrder).filter((engine) => !disabled.has(engine));
}

// 智能路由（provider=auto 时启用）：语言/时间规则决定分组；配置了 fallbackOrder 后，分组内按全局优先级排序。
export function routeEngines(query, { timeRange, disabledEngines = [], fallbackOrder = [] }: any = {}) {
  const disabled = new Set(normalizeDisabledEngines(disabledEngines));
  const hasCustomOrder = hasCustomFallbackOrder(fallbackOrder);
  const enabled = hasCustomOrder
    ? enabledEngines(disabledEngines, fallbackOrder)
    : ALL_ENGINES.filter((engine) => !disabled.has(engine));
  const enabledSet = new Set(enabled);
  const isCjk = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(String(query ?? ""));
  const routeHead = isCjk
    ? ["bing", "baidu", "aliyun", "anysearch"]
    : ["bing", "exa", "tavily"];
  const head = hasCustomOrder
    ? enabled.filter((engine) => routeHead.includes(engine))
    : routeHead.filter((engine) => enabledSet.has(engine));

  let ordered;
  if (timeRange) {
    const timeHead = head.filter((engine) => TIME_ENGINES.includes(engine));
    const timeOthers = enabled.filter((engine) => TIME_ENGINES.includes(engine) && !head.includes(engine));
    const nonTimeHead = head.filter((engine) => !TIME_ENGINES.includes(engine));
    ordered = [...timeHead, ...timeOthers, ...nonTimeHead];
  } else {
    ordered = [...head];
  }

  const remaining = enabled.filter((engine) => !ordered.includes(engine) && !EXPLICIT_ONLY_ENGINES.includes(engine));
  return [...ordered, ...remaining];
}
