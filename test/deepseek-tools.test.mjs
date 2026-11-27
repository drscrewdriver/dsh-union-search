// deepseek-tools 引擎回归（0.15.0-rc.1）：端点解析三态、字段映射（summary/snippet 二选一、
// rerank_score/authority 缺失不造假）、错误分类三档、max_results 钳制 1-20、
// 注册点齐全，及 multi 模式同计费上游去重（上游 #167）行为闸。
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mod = await import("file://" + path.join(here, "..", "lib", "index.js").replace(/\\/g, "/"));
const { ALL_ENGINES, DEFAULT_FALLBACK_ORDER, resolveDeepSeekToolsEndpoint, searchDeepSeekTools, dedupeSameBilling } = mod;

function permissive() {
  const fn = function () { return permissive(); };
  return new Proxy(fn, {
    get(t, p) {
      if (typeof p === "symbol") return Reflect.get(t, p);
      if (p === "then" || p === "catch" || p === "finally") return undefined;
      if (p === "toString" || p === "valueOf") return () => "";
      return permissive();
    },
    set: () => true,
    has: () => true,
    apply: () => permissive(),
  });
}

// —— 纯函数：端点解析三态 ——
test("resolveDeepSeekToolsEndpoint: 空/非法回落官方默认端点", () => {
  const D = "https://api.deepseek.com/v1/tools/search";
  assert.equal(resolveDeepSeekToolsEndpoint(""), D);
  assert.equal(resolveDeepSeekToolsEndpoint(undefined), D);
  assert.equal(resolveDeepSeekToolsEndpoint("   "), D);
  assert.equal(resolveDeepSeekToolsEndpoint("not a url"), D);
  assert.equal(resolveDeepSeekToolsEndpoint("ftp://x.example/tools/search"), D);
});

test("resolveDeepSeekToolsEndpoint: 完整端点 URL 原样用（/tools/search 与 /v1/search 后缀）", () => {
  assert.equal(
    resolveDeepSeekToolsEndpoint("https://gw.example.com/v1/tools/search"),
    "https://gw.example.com/v1/tools/search",
  );
  assert.equal(
    resolveDeepSeekToolsEndpoint("https://gw.example.com/api/v1/search"),
    "https://gw.example.com/api/v1/search",
  );
  // 完整端点上的 query/hash 属于填错残留，剥掉
  assert.equal(
    resolveDeepSeekToolsEndpoint("https://gw.example.com/v1/tools/search?x=1#h"),
    "https://gw.example.com/v1/tools/search",
  );
});

test("resolveDeepSeekToolsEndpoint: base 自动补全（根/带路径/带 /v1/尾斜杠）", () => {
  assert.equal(
    resolveDeepSeekToolsEndpoint("https://gw.example.com"),
    "https://gw.example.com/v1/tools/search",
  );
  assert.equal(
    resolveDeepSeekToolsEndpoint("https://gw.example.com/"),
    "https://gw.example.com/v1/tools/search",
  );
  assert.equal(
    resolveDeepSeekToolsEndpoint("https://gw.example.com/dsh"),
    "https://gw.example.com/dsh/v1/tools/search",
  );
  assert.equal(
    resolveDeepSeekToolsEndpoint("https://gw.example.com/v1"),
    "https://gw.example.com/v1/tools/search",
  );
});

// —— 常量注册点 ——
test("注册点: ALL_ENGINES 含 deepseek-tools，回退链排在 deepseek-official 之前", () => {
  assert.ok(ALL_ENGINES.includes("deepseek-tools"));
  const i = DEFAULT_FALLBACK_ORDER.indexOf("deepseek-tools");
  const j = DEFAULT_FALLBACK_ORDER.indexOf("deepseek-official");
  assert.ok(i >= 0 && j >= 0 && i < j);
});

// —— 同计费上游去重（上游 #167）——
test("dedupeSameBilling: 同族只留先点名的一路，其余进 dedupedSameBilling", () => {
  const a = dedupeSameBilling(["deepseek-tools", "deepseek-official", "bing", "tavily"]);
  assert.deepEqual(a.kept, ["deepseek-tools", "bing", "tavily"]);
  assert.equal(a.dedupedSameBilling.length, 1);
  assert.match(a.dedupedSameBilling[0], /deepseek-official/);
  assert.match(a.dedupedSameBilling[0], /deepseek-tools/);
  const b = dedupeSameBilling(["deepseek-official", "deepseek-tools"]);
  assert.deepEqual(b.kept, ["deepseek-official"]);
  const c = dedupeSameBilling(["bing", "ddg"]);
  assert.deepEqual(c.kept, ["bing", "ddg"]);
  assert.equal(c.dedupedSameBilling.length, 0);
});

// —— fetch 桩：searchDeepSeekTools 行为 ——
const realFetch = globalThis.fetch;
function stubFetch(handler) {
  const calls = [];
  globalThis.fetch = async (url, opts) => {
    calls.push({ url: String(url), opts });
    return handler(url, opts);
  };
  return calls;
}
function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

test("searchDeepSeekTools: 无 key 抛 requires DEEPSEEK_API_KEY", async () => {
  await assert.rejects(
    () => searchDeepSeekTools("q", 5, ""),
    /requires DEEPSEEK_API_KEY/,
  );
});

test("searchDeepSeekTools: max_results 钳制 1-20，端点随 baseUrl 解析", async () => {
  const calls = stubFetch(() => jsonResponse(200, { results: [] }));
  try {
    await searchDeepSeekTools("q", 100, "k", undefined, "https://gw.example.com");
    await searchDeepSeekTools("q", 0, "k");
    const body1 = JSON.parse(calls[0].opts.body);
    const body2 = JSON.parse(calls[1].opts.body);
    assert.equal(body1.max_results, 20);
    assert.equal(body2.max_results, 1);
    assert.equal(calls[0].url, "https://gw.example.com/v1/tools/search");
    assert.equal(calls[1].url, "https://api.deepseek.com/v1/tools/search");
    assert.equal(calls[0].opts.redirect, "error");
    assert.match(calls[0].opts.headers.authorization, /Bearer k/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("searchDeepSeekTools: summary 优先于 snippet；score/authority 透传", async () => {
  const calls = stubFetch(() => jsonResponse(200, {
    results: [
      { url: "https://a.example", title: "A", summary: "from summary", snippet: "from snippet", rerank_score: 2.5, authority: 4 },
      { url: "https://b.example", title: "B", snippet: "only snippet" },
    ],
  }));
  try {
    const r = await searchDeepSeekTools("q", 5, "k");
    assert.equal(calls.length, 1);
    assert.equal(r.sources[0].snippet, "from summary");
    assert.equal(r.sources[0].score, 2.5);
    assert.equal(r.sources[0].authority, 4);
    assert.equal(r.sources[1].snippet, "only snippet");
    assert.ok(!("score" in r.sources[1]), "缺失 rerank_score 不得造假值");
    assert.ok(!("authority" in r.sources[1]), "缺失 authority 不得造假值");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("searchDeepSeekTools: date 映射为 publishedAt，缺 url 的行被丢弃", async () => {
  const calls = stubFetch(() => jsonResponse(200, {
    results: [{ title: "no url" }, { url: "https://c.example", date: "2026-11-01" }],
  }));
  try {
    const r = await searchDeepSeekTools("q", 5, "k");
    assert.equal(r.sources.length, 1);
    assert.equal(r.sources[0].publishedAt, "2026-11-01");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("searchDeepSeekTools: 401/403 报 key 无效；其余非 2xx 带 status 与 detail 前 200 字", async () => {
  const calls = stubFetch(() => jsonResponse(401, { error: "unauthorized" }));
  try {
    await assert.rejects(() => searchDeepSeekTools("q", 5, "k"), /DeepSeek API key is invalid \(HTTP 401\)/);
    globalThis.fetch = async () => jsonResponse(403, {});
    await assert.rejects(() => searchDeepSeekTools("q", 5, "k"), /DeepSeek API key is invalid \(HTTP 403\)/);
    globalThis.fetch = async () => jsonResponse(500, { msg: "boom".repeat(100) });
    await assert.rejects(
      () => searchDeepSeekTools("q", 5, "k"),
      (e) => /DeepSeek search API error \(HTTP 500\)/.test(e.message) && e.message.length < 300,
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("searchDeepSeekTools: 网络异常包装原始 message 且带解析后端点", async () => {
  const calls = stubFetch(() => { throw Object.assign(new Error("socket hang up"), { name: "TypeError" }); });
  try {
    await assert.rejects(
      () => searchDeepSeekTools("q", 5, "k", undefined, "https://gw.example.com"),
      (e) => e.message.includes("socket hang up") && e.message.includes("https://gw.example.com/v1/tools/search"),
    );
  } finally {
    globalThis.fetch = realFetch;
  }
});

// —— multi_search 同计费去重（端到端，桩 ctx 真注册）——
test("multi_search: 同时点名 deepseek-tools 与 deepseek-official 只发一路，note 列 dedupedSameBilling", async () => {
  const tools = [];
  const sctx = {
    effect: (fn) => { try { fn(); } catch {} return () => {}; },
    tools: { register: (t) => { tools.push(t); return () => {}; } },
    systemPrompt: { section: () => () => {}, getSectionOrder: () => 100 },
    logger: { info() {}, warn() {}, error() {}, debug() {} },
    config: { deepseekApiKey: "stub-key", keyStorage: "settings" },
  };
  const ctx = new Proxy(sctx, {
    get(obj, prop) {
      if (prop === "inject") {
        return (deps, fn) => {
          const need = Array.isArray(deps) ? deps : [deps];
          if (need.every((d) => ["tools", "systemPrompt"].includes(d))) { try { fn(sctx); } catch {} }
          return () => {};
        };
      }
      if (prop in obj) return obj[prop];
      return permissive();
    },
  });
  try { await mod.apply(ctx, {}); } catch {}

  const t = tools.find((x) => x.name === "multi_search");
  assert.ok(t, "multi_search 未注册（桩 ctx 注册面失效）");

  const calls = stubFetch((url) => {
    if (String(url).includes("/tools/search")) {
      return jsonResponse(200, { results: [{ url: "https://ds.example", title: "DS", summary: "hit" }] });
    }
    return jsonResponse(200, {});
  });
  const prevEnv = process.env.DEEPSEEK_API_KEY;
  process.env.DEEPSEEK_API_KEY = "stub-key";
  try {
    mod.GUIDANCE_SENT.clear();
    const r = await t.execute({ query: "dedup-case-0150", engines: ["deepseek-tools", "deepseek-official"] }, {});
    const dsCalls = calls.filter((c) => c.url.includes("deepseek") || c.url.includes("/tools/search"));
    assert.equal(dsCalls.length, 1, `DeepSeek 上游应只发一路，实际 ${dsCalls.length} 路: ${calls.map((c) => c.url).join(", ")}`);
    assert.match(calls[0].url, /\/tools\/search$/);
    assert.match(r.content, /dedupedSameBilling/);
    assert.match(r.content, /deepseek-official/);
  } finally {
    globalThis.fetch = realFetch;
    if (prevEnv === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = prevEnv;
  }
});
