// HELP/TOOL 主题表与首次使用引导标记（rc.7 逐字搬移）
// AUTO-EXTRACT rc.7：正文自 src/index.js 逐字搬移，除加 export 外未改动。

export const HELP_TOPICS = {
  "fetch-types":
    'advance_fetch dispatches on the response body, not on the file extension: HTML/XML -> GitHub-Flavored Markdown (host-twin turndown profile: invisible nodes dropped, GFM tables without colspan expansion, portal-page cleanup); mode="text" -> plain text without markdown syntax; JSON bodies pass through as text; RSS/Atom XML (root rss or feed) passes through as text; any other content-type passes through as text with the type named in the note. Encoding is resolved Content-Type charset -> BOM -> <meta charset> within the first 2KB -> utf-8 fallback, with gb2312/gbk mapped to gb18030, so legacy Chinese sites do not come back mojibake. Relative links are absolutized against the final URL after redirects and tracking params (utm_*, gclid, fbclid, mc_eid, igshid) are stripped. Frameset pages note that frame contents are not fetched. maxChars caps the extraction (default 20000, hard max 60000) and cuts at line boundaries; the rendered block additionally shows at most the first 30000 characters of what was returned.',
  "fields-syntax":
    'fields="label=selector;label=selector|attribute" - semicolon-separated, one entry per label. Each entry is resolved with cheerio against the raw server-served HTML, first match wins; with |attribute it reads that attribute, otherwise the collapsed inner text. Values are whitespace-collapsed and capped at 500 characters. When fields is set the result is [{label,value}] instead of markdown, and a label that matches nothing yields an empty value rather than an error, so a batch of probes keeps reporting. selector alone narrows the converted scope and joins multiple matches with a horizontal rule; a selector matching 0 nodes falls back to whole-page output and says so in the note. Neither sees a JS-rendered DOM: a target that only exists after client-side hydration cannot be matched by either form.',
  identity:
    'Fetch identity is a settings concern, not a per-call argument: advanceFetchUserAgent, advanceFetchReferer, and advanceFetchCookieMap (one line per domain, "domain cookie-string", # starts a comment line). A cookie line is attached only when the fetch target matches that domain (subdomains included) and is never forwarded across a cross-domain redirect, so a 302 to another host drops the credential. Keep cookies on the settings page instead of pasting them into chat. advanceFetchAllowPrivate additionally admits loopback/private/link-local/metadata addresses; the protocol gate (http/https only) and the 5-hop redirect cap are enforced either way.',
  troubleshooting:
    "Failure shapes you can rely on: an anti-bot challenge page served with HTTP 200 (captcha or verification wording on a body under 1500 characters) is reported as an error rather than returned as content. A login-walled or client-rendered page returns only the server shell plus a note saying the content needs rendering - advance_fetch never executes scripts, so anything built by client-side hydration is simply absent. A selector that matched 0 nodes falls back to whole-page output with a note, so probe once without a selector when unsure. An engine turned off in plugin settings throws a message naming the settings path. Non-2xx responses throw with the HTTP status and final host, and more than 5 redirect hops abort.",
  "time-filters":
    "advanced_search timeRange accepts fixed tiers (day, week, month, year), a relative span such as 12h, 3d, 2w, 2mo or 1y, or an absolute date YYYY-MM-DD meaning published after that date. Engines that only expose fixed tiers (Tavily, SearXNG, DuckDuckGo) get your window mapped to the nearest one: up to 2 days -> day, up to 14 -> week, up to 90 -> month, otherwise year; engines with exact support honour the real count. A value that does not parse is ignored rather than rejected, so the search still runs unfiltered - check the note in the result when freshness matters.",
};

// 按工具名的入口：本手册只说这两个工具
export const TOOL_TOPICS = {
  advance_fetch: ["fetch-types", "fields-syntax", "identity", "troubleshooting"],
  advanced_search: ["time-filters", "engines"],
};
// 会话首触去重：指导类文字只在同一会话里附一次。
// 理由：工具返回值进的是会话历史，每次调用都附等于把同一段说明复制 N 份进上下文；
// 而 schema 描述是单份每轮付费。首触一次 = 既有「调用即得」的时机，又不产生副本。
export const GUIDANCE_SENT = new Set();
export function firstTouchGuidance(tool, exec, text) {
  const sid = typeof exec?.sessionId === "string" && exec.sessionId !== "" ? exec.sessionId : "global";
  const key = `${tool}:${sid}`;
  if (GUIDANCE_SENT.has(key)) return "";
  GUIDANCE_SENT.add(key);
  return text;
}
