// 文本/HTML 工具（0.17.0-rc.3 自 index.js 原样搬移，行为零变化）。
// 出口卫生主线：码点安全截断（上游 #108）+ 实体解码防护（上游 #108/#112 系）。

export function fromCodePointSafe(n: number): string {
  // 数字实体解码：星平面（>0xFFFF）必须 fromCodePoint；fromCharCode 会直接产出孤立代理。
  // 越界（>0x10FFFF）与孤立代理区（D800-DFFF）一律丢空（与浏览器实体行为一致），不造畸形码点。
  if (!Number.isInteger(n) || n <= 0 || n > 0x10ffff) return "";
  if (n >= 0xd800 && n <= 0xdfff) return "";
  return String.fromCodePoint(n);
}

export function decodeEntities(text: string): string {
  return String(text)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => fromCodePointSafe(Number(n)));
}

// 码点安全截断（上游 #108 教训）：UTF-16 半代理截出孤立代理项后，JSON.stringify 会产出
// 非法字符串污染会话且不可恢复。凡对外输出/入请求体的文本截断一律走本函数，
// 纯检测用途（反爬页扫描等）保留原生 slice。limit 落在代理对中间时回退到高代理前。
export function cutSafe(text: unknown, limit: number): string {
  const s = String(text ?? "");
  if (s.length <= limit) return s;
  let cut = limit;
  const hi = s.charCodeAt(cut - 1);
  const lo = s.charCodeAt(cut);
  if (hi >= 0xd800 && hi <= 0xdbff && lo >= 0xdc00 && lo <= 0xdfff) cut -= 1;
  return s.slice(0, cut);
}

// 统一的 snippet 清洗：剔除登录/付费墙/订阅等噪音短语，折叠空白，限制长度。
// 只在回退链出口统一应用，各引擎内部不做，避免重复处理。
const SNIPPET_NOISE =
  /\b(sign up|sign in|log in|login|subscribe( to| for)?|member[- ]?only|become a member|create (a )?free account|read more|continue reading|story continues|get started|install (the )?app|view on|medium membership|join \w+ for free|get updates from this writer|stories in your inbox|remember me for|unlock this|free to read|become a patron)\b/gi;

export function cleanSnippet(text: string | null | undefined, max = 300): string | null | undefined {
  if (!text) return text;
  return cutSafe(
    String(text)
      .replace(SNIPPET_NOISE, " ")
      .replace(/^\s*(#{1,6}\s*|\[\s*x?\s*\]\s*|-\s*\[\s*x?\s*\]\s*|>\s*)/gm, " ")
      .replace(/\s+/g, " ")
      .trim(),
    max,
  );
}

// 提示注入防护：插件自有工具（advanced_search / platform_search / multi_search）的
// 网页来源文本统一包进显式「不可信数据」边界，配合系统提示词里的同名说明使用。
// 核心 web_search / web_fetch 由 DSH 核心自带 EXTERNAL_WEB_CONTENT_NOTICE，不在此重复；
// 也不给 source.snippet 本体加标记——同一字符串会原样显示在 DSH 前端的结果卡片里。
export const UNTRUSTED_BOUNDARY_OPEN = "<untrusted-web-content>";
export const UNTRUSTED_BOUNDARY_CLOSE = "</untrusted-web-content>";
const UNTRUSTED_BOUNDARY_TAG = /<\/?untrusted-web-content>/gi;

// 防伪造：剥掉网页文本里自带的同名边界标记，避免提前闭合边界
export function stripBoundaryTags(text: string): string {
  return typeof text === "string" ? text.replace(UNTRUSTED_BOUNDARY_TAG, "") : text;
}

export function wrapUntrustedBlock(text: string): string {
  return `${UNTRUSTED_BOUNDARY_OPEN}\n${stripBoundaryTags(text)}\n${UNTRUSTED_BOUNDARY_CLOSE}`;
}

export function stripTags(html: string): string {
  return decodeEntities(String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

export function extractDdgUrl(rel: string | null | undefined): string | null {
  if (!rel) return null;
  const m = rel.match(/uddg=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  if (rel.startsWith("//")) return `https:${rel}`;
  return rel;
}
