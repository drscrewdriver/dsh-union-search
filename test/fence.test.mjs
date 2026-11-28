// 设置桥准入闸门（0.18.0）：五态 × {回环, 非回环} 全组合 + fail-closed + 探测只跑一次。
// 闸门与 12 条路由都在 apply 内接线，所以这里用 ctx stub 真正跑一遍 apply，
// 再从注册面取出裸 route、用假 req/res 打 handler —— 不新增任何具名导出（122 基线不动）。
import { test } from "node:test";
import assert from "node:assert/strict";
import { apply } from "../lib/index.js";

const NS = "web-search-free";
const ROUTE = "/api/dsh-union-search-settings/takeover-status";

/** 宿主 ctx stub：只实现 apply 真正用到的面（inject/effect/get/bail/logger/webServer）。 */
function harness(options = {}) {
  const routes = [];
  const bailCalls = [];
  const warns = [];
  const logger = {
    info() {},
    debug() {},
    error() {},
    warn(message) { warns.push(String(message)); },
  };
  const settings = {
    writable: true,
    describe() { return [{ ns: NS, revision: 1, values: {}, secrets: [] }]; },
    async mutate() { return { revision: 2 }; },
  };
  const webServer = {
    register(route) { routes.push(route); return () => {}; },
  };
  // apply 在顶层就调 registerSearchProvider（不经 inject），所以 web 面必须可用。
  const web = {
    config: {},
    providers: [],
    listProviders() { return []; },
    registerSearchProvider(provider) { web.providers.push(provider); return () => {}; },
    registerFetchProvider(provider) { web.providers.push(provider); return () => {}; },
  };
  const ctx = {
    logger,
    fiber: {},
    web,
    effect(run) { const dispose = run(); return typeof dispose === "function" ? dispose : () => {}; },
    on() { return () => {}; },
    once() { return () => {}; },
    get(name) {
      if (name === "settings") return settings;
      if (name === "connection") return options.connection;
      return undefined;
    },
    bail(...args) { bailCalls.push(args); return options.authorize; },
    // 只放行 webServer 注入；commands/tools/systemPrompt/settings 面与准入无关，跳过。
    inject(deps, callback) {
      if (!Array.isArray(deps) || !deps.includes("webServer")) return undefined;
      return callback(Object.assign({}, ctx, { settings, webServer }));
    },
  };
  // 直接传同一个配置对象：apply 的 current() 每次重新读它，热生效测试才能改值。
  apply(ctx, options.config ?? {});
  const route = routes.find((entry) => entry.path === ROUTE);
  assert.ok(route, "settings bridge must register " + ROUTE);
  return { routes, route, bailCalls, warns };
}

/** 热生效：包装器每请求读 current()，改开关不需要重注册路由。 */
test("bridgeRestrictLoopback 热生效：改设置立即改变判定，不重注册", async () => {
  const config = {};
  const h = harness({ connection: { requestRejection: () => undefined }, config });
  assert.equal((await call(h.route, false)).statusCode, 200);
  config.bridgeRestrictLoopback = true;
  assert.equal((await call(h.route, false)).statusCode, 403);
  config.bridgeRestrictLoopback = false;
  assert.equal((await call(h.route, false)).statusCode, 200);
  assert.equal(h.routes.filter((r) => String(r.path).startsWith("/api/dsh-union-search-settings/")).length, 12);
});

function request(loopback, method = "POST") {
  return {
    method,
    socket: { remoteAddress: loopback ? "127.0.0.1" : "10.4.0.9" },
    headers: loopback
      ? { host: "127.0.0.1:1861" }
      : { host: "search.example.com", origin: "https://search.example.com" },
  };
}

function response() {
  return {
    statusCode: 0,
    body: "",
    writeHead(status) { this.statusCode = status; },
    end(payload) { this.body = payload ?? ""; },
  };
}

async function call(route, loopback, method) {
  const res = response();
  await route.handler(request(loopback, method), res);
  return res;
}

// ── 五种模式 × {回环, 非回环} ────────────────────────────────────────────────
const MODES = [
  {
    mode: "authorize",
    options: { authorize: { kind: "deny", status: 401 } },
    expectsHostAuth: true,
    nonLoopback: 200,
  },
  {
    mode: "authorize+loopback",
    options: { authorize: { kind: "deny", status: 401 }, config: { bridgeRestrictLoopback: true } },
    expectsHostAuth: true,
    nonLoopback: 403,
  },
  {
    mode: "rejection",
    options: { connection: { requestRejection: () => undefined } },
    expectsHostAuth: false,
    nonLoopback: 200,
  },
  {
    mode: "rejection+loopback",
    options: { connection: { requestRejection: () => undefined }, config: { bridgeRestrictLoopback: true } },
    expectsHostAuth: false,
    nonLoopback: 403,
  },
  {
    mode: "loopback",
    options: {},
    expectsHostAuth: false,
    nonLoopback: 403,
  },
];

for (const spec of MODES) {
  test(spec.mode + ": loopback request is admitted", async () => {
    const h = harness(spec.options);
    const res = await call(h.route, true);
    assert.equal(res.statusCode, 200, spec.mode + " / loopback should pass");
    // 只有 authorize 代次在路由上声明 auth:'required'（0.2.3+；0.2.2 及更早会静默忽略）
    assert.equal(h.route.auth, spec.expectsHostAuth ? "required" : undefined, spec.mode + " / auth declaration");
  });

  test(spec.mode + ": non-loopback request", async () => {
    const h = harness(spec.options);
    const res = await call(h.route, false);
    assert.equal(res.statusCode, spec.nonLoopback, spec.mode + " / non-loopback status");
    if (spec.nonLoopback === 403) assert.match(res.body, /loopback requests only/);
  });
}

// ── 安全底线 ────────────────────────────────────────────────────────────────
test("宿主无鉴权能力时强制回环，且只 warn 一次", async () => {
  const h = harness({ config: { bridgeRestrictLoopback: false } });
  assert.equal(h.route.auth, undefined);
  const first = await call(h.route, false);
  const second = await call(h.route, false);
  assert.equal(first.statusCode, 403);
  assert.equal(second.statusCode, 403);
  assert.equal(h.warns.filter((message) => message.includes("no request admission")).length, 1);
});

test("hostAuth=none 且开关为 true 时仍是回环（开关不能关掉安全底线）", async () => {
  const h = harness({ config: { bridgeRestrictLoopback: true } });
  assert.equal((await call(h.route, true)).statusCode, 200);
  assert.equal((await call(h.route, false)).statusCode, 403);
});

test("rejection 代次：宿主返回的 401 原样回传，不改成 403", async () => {
  const h = harness({ connection: { requestRejection: () => 401 } });
  const res = await call(h.route, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.body, /host admission rejected/);
});

test("connection 探测后被摘除：fail closed 回落到回环", async () => {
  const connection = { requestRejection: () => undefined };
  const h = harness({ connection });
  assert.equal((await call(h.route, false)).statusCode, 200);
  // 模拟 connection 服务在运行期消失（跨 bundle 卸载）：不得因此裸奔
  delete connection.requestRejection;
  assert.equal((await call(h.route, false)).statusCode, 403);
});

test("requestRejection 抛错时 fail closed（403，不是放行）", async () => {
  const h = harness({
    connection: { requestRejection: () => { throw new Error("boom"); } },
  });
  const res = await call(h.route, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body, /host admission rejected/);
});

test("12 条路由全部经闸门（回环 + 非回环逐路对拍）", async () => {
  const h = harness({ config: { bridgeRestrictLoopback: true } });
  const bridgeRoutes = h.routes.filter((entry) => String(entry.path).startsWith("/api/dsh-union-search-settings/"));
  assert.equal(bridgeRoutes.length, 12);
  for (const route of bridgeRoutes) {
    const denied = response();
    await route.handler(request(false), denied);
    assert.equal(denied.statusCode, 403, route.path + " must be fenced");
    const method = response();
    await route.handler(request(true, "GET"), method);
    assert.equal(method.statusCode, 405, route.path + " must keep the method gate");
  }
});

test("探测只在 apply 期执行一次，不随请求重复", async () => {
  const h = harness({
    authorize: { kind: "deny", status: 401 },
    connection: { requestRejection: () => undefined },
  });
  const probesAfterApply = h.bailCalls.length;
  assert.ok(probesAfterApply <= 1, "apply must probe at most once, got " + probesAfterApply);
  for (let i = 0; i < 5; i++) await call(h.route, true);
  assert.equal(h.bailCalls.length, probesAfterApply, "requests must not re-probe");
});
