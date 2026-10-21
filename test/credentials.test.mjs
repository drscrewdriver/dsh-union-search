// 凭据化抓取回归(0.10.12):UA/Referer 全局覆盖 + 按域 cookie 逐跳匹配。
// /echo 路由回显收到的 headers(JSON 透传路径天然可断言,测真实 fetch 链路);
// 跨域重定向用 localhost vs 127.0.0.1 构造「同机不同 host」,零外部依赖。
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { advanceFetch, parseCookieMap, matchCookieEntry } from "../lib/index.js";

// ---------- 纯函数:parseCookieMap / matchCookieEntry ----------

test("parseCookieMap: 空串与纯注释返回空表", () => {
  assert.deepEqual(parseCookieMap(""), []);
  assert.deepEqual(parseCookieMap("# comment\n\n   \n# another"), []);
});

test("parseCookieMap: 行式解析,值含 = 与分号无歧义", () => {
  assert.deepEqual(
    parseCookieMap("# 注释行\nweibo.com SUB=xxx; SUBP=yyy\n.zhihu.com\tz_c0=AAA"),
    [
      { domain: "weibo.com", cookie: "SUB=xxx; SUBP=yyy" },
      { domain: "zhihu.com", cookie: "z_c0=AAA" },
    ],
  );
});

test("parseCookieMap: 坏行(无空白分隔/缺 cookie 值)静默丢弃", () => {
  assert.deepEqual(parseCookieMap("badline-no-space\nweibo.com\n  \nok.com a=1"), [
    { domain: "ok.com", cookie: "a=1" },
  ]);
});

test("matchCookieEntry: 精确域 + 子域命中,前缀相似不误命中", () => {
  const entries = parseCookieMap("weibo.com A=1\nexample.org B=2");
  assert.equal(matchCookieEntry(entries, "weibo.com"), "A=1");
  assert.equal(matchCookieEntry(entries, "s.weibo.com"), "A=1");
  assert.equal(matchCookieEntry(entries, "xweibo.com"), undefined);
  assert.equal(matchCookieEntry(entries, "example.org"), "B=2");
  assert.equal(matchCookieEntry(entries, "other.com"), undefined);
  assert.equal(matchCookieEntry([], "weibo.com"), undefined);
});

// ---------- advanceFetch 级(回环 /echo 回显) ----------

const seen404 = [];
const server = http.createServer((req, res) => {
  seen404.push(req.url);
  if (req.url === "/cross") {
    res.writeHead(302, { location: `http://127.0.0.1:${server.address().port}/echo` });
    return res.end();
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ got: req.headers }));
});
server.unref(); // 进程退出随 runner,不显式 close(md.test.mjs 同款做法)
const port = await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
const echoAt = (host) => `http://${host}:${port}/echo`;

test("advanceFetch: 三配置全生效(UA/Referer/按域 cookie)", async () => {
  const r = await advanceFetch(echoAt("localhost"), {
    allowPrivate: true,
    userAgent: "TestUA/1.0 (credentials-probe)",
    referer: "https://ref.example/page",
    cookieMap: "localhost K=V; K2=V2",
  });
  const got = JSON.parse(r.text).got;
  assert.equal(got["user-agent"], "TestUA/1.0 (credentials-probe)");
  assert.equal(got.referer, "https://ref.example/page");
  assert.equal(got.cookie, "K=V; K2=V2");
});

test("advanceFetch: 零配置 = 内置行为(无 Referer/无 Cookie)", async () => {
  const r = await advanceFetch(echoAt("localhost"), { allowPrivate: true });
  const got = JSON.parse(r.text).got;
  assert.ok(got["user-agent"], "内置 UA 仍在");
  assert.notEqual(got["user-agent"], "TestUA/1.0 (credentials-probe)");
  assert.equal(got.referer, undefined);
  assert.equal(got.cookie, undefined);
});

test("advanceFetch: 非匹配域不带 Cookie 头", async () => {
  const r = await advanceFetch(echoAt("localhost"), {
    allowPrivate: true,
    cookieMap: "weibo.com SUB=secret",
  });
  const got = JSON.parse(r.text).got;
  assert.equal(got.cookie, undefined);
});

test("advanceFetch: 跨域重定向 cookie 不外流(localhost → 127.0.0.1)", async () => {
  const r = await advanceFetch(`http://localhost:${port}/cross`, {
    allowPrivate: true,
    cookieMap: "localhost L=first-hop-only",
  });
  const got = JSON.parse(r.text).got;
  assert.equal(got.cookie, undefined, "第二跳(127.0.0.1)不得携带绑定 localhost 的 cookie");
});

test("advanceFetch: 跨域重定向后新域 cookie 正常附带", async () => {
  const r = await advanceFetch(`http://localhost:${port}/cross`, {
    allowPrivate: true,
    cookieMap: "127.0.0.1 M=second-hop",
  });
  const got = JSON.parse(r.text).got;
  assert.equal(got.cookie, "M=second-hop");
});
