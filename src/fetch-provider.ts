// fetch provider 出口形状与浏览器升级档（0.12.0/0.13.0；rc.7 逐字搬移）
// AUTO-EXTRACT rc.7：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { ADVANCE_FETCH_MAX_CHARS_DEFAULT, extractBySelector, smartTruncate } from "./advance";

// fetch provider 出口文本提取（0.12.0）：三种 advanceFetch 输出形态统一成宿主 kind:text 正文；
// extracted 字段表按 advance_fetch 工具的 `- label: value` 渲染先例对齐。
export function providerTextFrom(result) {
  if (Array.isArray(result.extracted)) {
    return result.extracted.map((f) => `- ${f.label}: ${f.value || "(no match)"}`).join("\n");
  }
  return String(result.markdown ?? result.text ?? "");
}

// 升级特征：直连报错（HTTP 4xx / 反爬挑战页）或成功但 note 里报了 JS 空壳/frameset。
// 其余失败（网络错/5xx/超时）不升级——浏览器对这些问题帮助有限且成本高一量级。
export function browserUpgradeNeeded(result, error) {
  if (error) return /HTTP 4\d\d|anti-bot challenge|captcha/i.test(String((error && error.message) || error));
  if (result && result.note && /JS-rendered shell|frameset/i.test(String(result.note))) return true;
  return false;
}

// 0.13.0 浏览器升级档执行：调 cdp 的 fetchRenderedHtml 拿渲染后 HTML，喂同一套抽取/优化器链，
// 出口形状与直连 provider 一致；正文尾部带「经用户浏览器抓取（含登录态）」声明。服务侧任何
// 失败/空结果回 null，由调用方降级回直连形态。
export async function browserTierFetch(svc, url, signal?) {
  const r = await svc.fetchRenderedHtml({ url, waitUntil: "load", maxBytes: 2_000_000, timeoutMs: 30000 }, signal);
  if (!r || r.ok !== true || !r.html) return null;
  const out = extractBySelector(r.html, { baseUrl: r.finalUrl || url });
  const md = out.markdown ?? "";
  if (!md.trim()) return null;
  const text = smartTruncate(md, ADVANCE_FETCH_MAX_CHARS_DEFAULT);
  const notes = ["fetched via user browser (session cookies included)", out.note, r.truncated ? "browser html exceeded byte budget" : null].filter(Boolean);
  return {
    url: r.finalUrl || url,
    statusCode: typeof r.statusCode === "number" ? r.statusCode : 200,
    body: { kind: "text", content: `${text}\n\n[note: ${notes.join("; ")}]` },
    truncated: Boolean(r.truncated) || text.length < md.length,
  };
}

// 0.13.0 provider 出口形状（直连与升级共用）：kind:text 成品 markdown，宿主不再二次转换。
export function shapeFetchResult(request, result) {
  return {
    url: result.finalUrl ?? String(request.url),
    statusCode: result.statusCode ?? 200,
    body: { kind: "text", content: providerTextFrom(result) },
    truncated: Boolean(result.truncated),
  };
}

export function safeHost(url) {
  try {
    return new URL(String(url)).hostname;
  } catch {
    return "";
  }
}
