// ALPN 抓取基元回归（0.11.5-rc.1，上游 #162 / ec6c1bd）：
// 真 ALPN 握手行为在 t12 真机冒烟覆盖；此处离线断言 agent 配置、解压、重定向、abort 与状态透传。
// 服务用 http 回环（advanceFetch 同款先例），不依赖外网。
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import zlib from "node:zlib";
import { httpsLikeFetch, httpsFetchText, alpnHttpsAgent } from "../lib/index.js";

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}
function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("alpnHttpsAgent 显式声明 ALPN http/1.1 且 keepAlive", () => {
  assert.deepEqual(alpnHttpsAgent.options.ALPNProtocols, ["http/1.1"]);
  assert.equal(alpnHttpsAgent.options.keepAlive, true);
});

test("httpsFetchText: gzip 响应自动解压 + charset 解码", async () => {
  const gz = zlib.gzipSync(Buffer.from("hello gzip body", "utf8"));
  const srv = await listen(http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "content-encoding": "gzip" });
    res.end(gz);
  }));
  try {
    const { status, ok, text } = await httpsFetchText(`http://127.0.0.1:${srv.address().port}/`);
    assert.equal(status, 200);
    assert.ok(ok);
    assert.equal(text, "hello gzip body");
  } finally {
    await close(srv);
  }
});

test("httpsFetchText: raw deflate 回包兼容（inflate 失败落 inflateRaw）", async () => {
  const raw = zlib.deflateRawSync(Buffer.from("raw deflate body", "utf8"));
  const srv = await listen(http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/plain", "content-encoding": "deflate" });
    res.end(raw);
  }));
  try {
    const { text } = await httpsFetchText(`http://127.0.0.1:${srv.address().port}/`);
    assert.equal(text, "raw deflate body");
  } finally {
    await close(srv);
  }
});

test("httpsFetchText: 跟随 302 链到终点；超 5 跳报错", async () => {
  let hops = 0;
  const srv = await listen(http.createServer((req, res) => {
    if (hops < 2) {
      hops++;
      res.writeHead(302, { location: `/hop${hops}` });
      res.end();
    } else {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("arrived");
    }
  }));
  try {
    const r1 = await httpsFetchText(`http://127.0.0.1:${srv.address().port}/start`);
    assert.equal(r1.text, "arrived");
  } finally {
    await close(srv);
    hops = 0;
  }
  const loop = await listen(http.createServer((req, res) => {
    res.writeHead(302, { location: "/again" });
    res.end();
  }));
  try {
    await assert.rejects(
      () => httpsFetchText(`http://127.0.0.1:${loop.address().port}/`),
      /too many redirects/,
    );
  } finally {
    await close(loop);
  }
});

test("httpsLikeFetch: 非 2xx 不 throw，状态透传给调用方判定", async () => {
  const srv = await listen(http.createServer((req, res) => {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found body");
  }));
  try {
    const res = await httpsLikeFetch(`http://127.0.0.1:${srv.address().port}/x`);
    assert.equal(res.status, 404);
    assert.equal(res.ok, false);
    const buf = await res.arrayBuffer();
    assert.equal(Buffer.from(buf).toString("utf8"), "not found body");
  } finally {
    await close(srv);
  }
});

test("httpsLikeFetch: 外部 signal 已 abort 时立即失败", async () => {
  const srv = await listen(http.createServer(() => { /* 永不回包 */ }));
  const ctrl = new AbortController();
  ctrl.abort();
  try {
    await assert.rejects(
      () => httpsLikeFetch(`http://127.0.0.1:${srv.address().port}/`, { signal: ctrl.signal, timeoutMs: 3000 }),
    );
  } finally {
    srv.closeAllConnections?.();
    await close(srv);
  }
});
