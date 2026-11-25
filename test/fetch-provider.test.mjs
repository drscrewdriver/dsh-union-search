// fetch provider 直连档回归（0.12.0-rc.1）：providerTextFrom 三形态 + advanceFetch statusCode 透传。
// 注册/选择语义（available()=fetchTakeover）由代码审阅与装机冒烟（rc.4）覆盖，离线不做 ctx 全链模拟。
import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { providerTextFrom, advanceFetch } from "../lib/index.js";

test("providerTextFrom: extracted 字段表按 - label: value 渲染", () => {
  const out = providerTextFrom({
    extracted: [
      { label: "title", value: "Hello" },
      { label: "price", value: "" },
    ],
  });
  assert.equal(out, "- title: Hello\n- price: (no match)");
});

test("providerTextFrom: markdown 优先于 text；皆空回空串", () => {
  assert.equal(providerTextFrom({ markdown: "# md", text: "plain" }), "# md");
  assert.equal(providerTextFrom({ text: "plain" }), "plain");
  assert.equal(providerTextFrom({}), "");
});

test("advanceFetch: statusCode 与 finalUrl 随结果透传（重定向链后为终点状态）", async () => {
  const srv = await new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      if (req.url === "/start") {
        res.writeHead(302, { location: "/done" });
        res.end();
        return;
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end("<html><body><h1>landed</h1><p>fetch provider target body text for regression.</p></body></html>");
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    const result = await advanceFetch(`http://127.0.0.1:${srv.address().port}/start`, { mode: "markdown", allowPrivate: true });
    assert.equal(result.statusCode, 200, "重定向终点状态码");
    assert.ok(result.finalUrl.endsWith("/done"), `finalUrl 应为终点: ${result.finalUrl}`);
    assert.ok(result.markdown.includes("landed"));
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});

test("advanceFetch: 非 2xx 抛错由宿主 provider 调用方接收为工具失败", async () => {
  const srv = await new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("gone");
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
  try {
    await assert.rejects(
      () => advanceFetch(`http://127.0.0.1:${srv.address().port}/missing`, { mode: "markdown", allowPrivate: true }),
      /HTTP 404/,
    );
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});
