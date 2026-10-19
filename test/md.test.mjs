// advance_fetch 转换管线回归套件(fixture+golden,0.10.11 起)。
// 约定:test/fixtures/<name>.html ↔ test/golden/<name>.md 严格相等 diff。
// 特殊模式:文件名前缀 textmode- / baseurl- 分别走 extractBySelector 的 text 模式 / 带 baseUrl 的 markdown 模式。
// advanceFetch 级用例用本文件内的回环 http 服务(全离线确定性)。
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { htmlToMarkdownGfm, extractBySelector, advanceFetch } from "../lib/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FIX_DIR = path.join(here, "fixtures");
const GOLD_DIR = path.join(here, "golden");

function convertFixture(name, html) {
  if (name.startsWith("textmode-")) return extractBySelector(html, { mode: "text" }).markdown;
  if (name.startsWith("baseurl-")) return extractBySelector(html, { baseUrl: "https://base.example/dir/page.html" }).markdown;
  return htmlToMarkdownGfm(html);
}

for (const f of readdirSync(FIX_DIR).filter((n) => n.endsWith(".html"))) {
  const name = f.slice(0, -".html".length);
  test(`golden: ${name}`, () => {
    const html = readFileSync(path.join(FIX_DIR, f), "utf8");
    const expected = readFileSync(path.join(GOLD_DIR, `${name}.md`), "utf8");
    let actual;
    try { actual = convertFixture(name, html); } catch (e) { actual = `!! threw: ${e?.message ?? e}`; }
    assert.equal(actual, expected, [
      `golden mismatch: ${name}`,
      `--- expected ---\n${JSON.stringify(expected)}`,
      `--- actual ---\n${JSON.stringify(actual)}`,
    ].join("\n"));
  });
}

// ---------- advanceFetch 级(回环服务) ----------
const GBK_BYTES = Buffer.from("<html><head><meta charset=\"gbk\"></head><body><h1>\xd6\xd0\xce\xc4\xb1\xea\xcc\xe2</h1><p>Hello</p></body></html>", "latin1");
const GB2312_BYTES = Buffer.from("<html><head><meta charset=\"gb2312\"></head><body><h1>\xd6\xd0\xce\xc4</h1></body></html>", "latin1");
const SJIS_BYTES = Buffer.from("<html><head><meta charset=\"shift_jis\"></head><body><h1>\x93\xfa\x96{\x8c\xea\x83e\x83X\x83g</h1></body></html>", "latin1");
const LONG_BODY = "<p>" + "filler line of prose. ".repeat(400) + "</p><pre><code>" + "codeLine();\n".repeat(300) + "</code></pre><p>tail</p>";

const routes = {
  "/gbk-header": { ct: "text/html; charset=gbk", body: GBK_BYTES },
  "/gb2312-meta": { ct: "text/html", body: GB2312_BYTES },
  "/utf8-nodecl": { ct: "text/html", body: "<h1>plain utf8 中文</h1>" },
  "/sjis": { ct: "text/html; charset=shift_jis", body: SJIS_BYTES },
  "/mismatch-header-wins": { ct: "text/html; charset=utf-8", body: GBK_BYTES },
  "/forbidden": { ct: "text/html", body: "denied", status: 403 },
  "/metarefresh": { ct: "text/html", body: '<html><head><meta http-equiv="refresh" content="0; url=/final"></head><body>Redirecting...</body></html>' },
  "/challenge": { ct: "text/html", body: '<html><body><div class="cf-challenge">Checking your browser before accessing. Please complete the captcha.</div></body></html>' },
  "/big-captcha-mention": { ct: "text/html", body: "<h1>Guide</h1><p>" + "long article body. ".repeat(400) + "</p><p>sometimes you must solve a captcha to post.</p>" },
  "/final": { ct: "text/html", body: "<h1>landed</h1>" },
  "/json": { ct: "application/json", body: '{"a":1,"b":"two"}' },
  "/rss": { ct: "application/rss+xml", body: '<?xml version="1.0"?><rss version="2.0"><channel><title>Chan</title><item><title>A</title></item></channel></rss>' },
  "/xhtml": { ct: "application/xhtml+xml", body: "<html><body><h1>x heading</h1><p>x para</p></body></html>" },
  "/long": { ct: "text/html", body: LONG_BODY },
  "/emoji": { ct: "text/html", body: "<p>" + "\u{1F600}".repeat(30) + "</p>" },
  "/dir/rellinks": { ct: "text/html", body: '<p><a href="sib.html">sibling</a><a href="/abs/x">abs</a><a href="https://a.com/p?utm_source=fb&id=2">tracked</a></p>' },
  "/shell": { ct: "text/html", body: "<!doctype html><html><head><title>App</title></head><body><div id=\"root\"></div><script src=\"/app.js\"></script>" + "<!-- ".repeat(1200) + "--></body></html>" },
  "/frameset": { ct: "text/html", body: '<!doctype html><html><frameset cols="50%,50%"><frame src="a.html"><frame src="b.html"></frameset></html>' },
};
const server = http.createServer((req, res) => {
  if (req.url === "/redir") { res.writeHead(301, { location: "/final" }); return res.end(); }
  const r = routes[req.url];
  if (!r) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(r.status ?? 200, { "content-type": r.ct });
  res.end(r.body);
});
await new Promise((res) => server.listen(0, "127.0.0.1", res));
const base = `http://127.0.0.1:${server.address().port}`;

test("server: GBK via content-type header decodes", async () => {
  const r = await advanceFetch(`${base}/gbk-header`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, /中文标题/);
});
test("server: GB2312 via meta charset decodes (no header hint)", async () => {
  const r = await advanceFetch(`${base}/gb2312-meta`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, /中文/);
});
test("server: utf-8 without declaration unchanged", async () => {
  const r = await advanceFetch(`${base}/utf8-nodecl`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, /plain utf8 中文/);
});
test("server: Shift-JIS decodes", async () => {
  const r = await advanceFetch(`${base}/sjis`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, /日本語/);
});
test("server: charset declared-vs-actual mismatch — HTTP header wins (WHATWG precedence)", async () => {
  // header 声明 utf-8、meta 声明 gbk、字节实为 GBK:按 WHATWG 优先级 header 胜出 → 乱码(与浏览器一致),
  // 该行为是规格使然,入 golden 锁定;真实世界的此类页面同样会在浏览器里乱码。
  const r = await advanceFetch(`${base}/mismatch-header-wins`, { allowPrivate: true, maxChars: 2000 });
  assert.doesNotMatch(r.markdown, /中文标题/);
});
test("server: 403 rejected as failure", async () => {
  await assert.rejects(
    () => advanceFetch(`${base}/forbidden`, { allowPrivate: true, maxChars: 2000 }),
    /HTTP 403/,
  );
});
test("server: 301 redirect followed, finalUrl updated", async () => {
  const r = await advanceFetch(`${base}/redir`, { allowPrivate: true, maxChars: 2000 });
  assert.equal(r.finalUrl, `${base}/final`);
  assert.match(r.markdown, /landed/);
});
test("server: json passthrough", async () => {
  const r = await advanceFetch(`${base}/json`, { allowPrivate: true });
  assert.equal(r.note, "json body passed through");
  assert.match(r.text, /"a":1/);
});
test("server: rss/feed xml passed through as text", async () => {
  const r = await advanceFetch(`${base}/rss`, { allowPrivate: true, maxChars: 2000 });
  assert.equal(r.note, "rss/atom xml passed through");
  assert.match(r.text, /<rss/);
});
test("server: xhtml still converted via html path", async () => {
  const r = await advanceFetch(`${base}/xhtml`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, /x heading/);
  assert.notEqual(r.note, "rss/atom xml passed through");
});
test("server: challenge page (200+captcha) throws", async () => {
  await assert.rejects(
    () => advanceFetch(`${base}/challenge`, { allowPrivate: true, maxChars: 2000 }),
    /anti-bot challenge/,
  );
});
test("server: long article merely mentioning captcha does not throw", async () => {
  const r = await advanceFetch(`${base}/big-captcha-mention`, { allowPrivate: true, maxChars: 30000 });
  assert.match(r.markdown, /Guide/);
});
test("server: meta-refresh without challenge keywords is not a failure", async () => {
  const r = await advanceFetch(`${base}/metarefresh`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, /Redirecting/);
});
test("server: truncation never ends inside an unclosed fence", async () => {
  const r = await advanceFetch(`${base}/long`, { allowPrivate: true, maxChars: 10000 });
  const fences = (r.markdown.match(/```/g) || []).length;
  assert.equal(fences % 2, 0, `unclosed fence: count=${fences}`);
  assert.ok(r.truncated);
});
test("server: truncation does not split surrogate pairs", async () => {
  const r = await advanceFetch(`${base}/emoji`, { allowPrivate: true, maxChars: 11 });
  assert.doesNotMatch(r.markdown, /[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
});
test("server: relative links absolutized against finalUrl", async () => {
  const r = await advanceFetch(`${base}/dir/rellinks`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, new RegExp(`\\]\\(${base}/dir/sib\\.html\\)`));
  assert.match(r.markdown, new RegExp(`\\]\\(${base}/abs/x\\)`));
});
test("server: tracking params stripped", async () => {
  const r = await advanceFetch(`${base}/dir/rellinks`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.markdown, /https:\/\/a\.com\/p\?id=2/);
  assert.doesNotMatch(r.markdown, /utm_source/);
});
test("server: SPA shell flagged via note", async () => {
  const r = await advanceFetch(`${base}/shell`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.note ?? "", /JS-rendered shell/);
});
test("server: frameset flagged via note", async () => {
  const r = await advanceFetch(`${base}/frameset`, { allowPrivate: true, maxChars: 2000 });
  assert.match(r.note ?? "", /frameset/);
});
// node --test 先执行完模块顶层再跑测试,close 必须挂在 after 钩子
after(() => server.close());
