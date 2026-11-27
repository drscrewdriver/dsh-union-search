// client bundle 冒烟（0.17.0-rc.8 起 lib/client.js 由 src/client/** 构建）：
// ① ModuleLoader 注册 id = package.json name；② factory 输出面只有 apply/inject；
// ③ inject 数组不变；④ apply 在通用 ctx stub 下可执行且卡片 CSS 注入 sequence 完整（tagId/去重逻辑活）。
// 选择器等价对拍由 tools/extract-client-css.mjs 离线执行（checklist），本测试守住结构面不回归。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const bundleSrc = readFileSync(path.join(here, "..", "lib", "client.js"), "utf8");
const pkgName = JSON.parse(readFileSync(path.join(here, "..", "package.json"), "utf8")).name;

function makeSandbox(captured) {
  const styles = [];
  const fakeTag = { dataset: {}, textContent: "" };
  const document = {
    querySelector: (sel) => (captured.queries.push(sel), null),
    createElement: () => fakeTag,
    head: {
      appendChild: (tag) => {
        styles.push({ plugin: tag.dataset.plugin, css: tag.dataset.pluginCss, len: String(tag.textContent ?? "").length });
      },
    },
  };
  // 万能 ctx：任意属性可调用/可取值，调用被记录（apply 内部全部是可选注入，不应抛到冒烟层）
  const calls = [];
  const anyObj = new Proxy(function () {}, {
    get(target, prop) {
      if (prop === Symbol.toPrimitive || prop === "toString") return () => "";
      return (...args) => {
        calls.push(String(prop));
        return anyObj;
      };
    },
    apply() {
      return anyObj;
    },
  });
  const loader = {
    load: (def) => captured.defs.push(def),
  };
  const sandbox = {
    window: { __ModuleLoader__: loader },
    document,
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout,
    clearTimeout,
    fetch: () => Promise.resolve({ ok: false, status: 0 }),
    AbortController,
    URL,
    URLSearchParams,
    Math,
    Date,
    JSON,
    Promise,
    Object,
    Array,
    Set,
    Map,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    Symbol,
    encodeURIComponent,
    decodeURIComponent,
    Intl,
    navigator: { language: "zh-CN", languages: ["zh-CN"] },
    location: { href: "http://127.0.0.1:1/" },
    __ctx: anyObj,
    __calls: calls,
  };
  sandbox.globalThis = sandbox;
  return { sandbox, styles };
}

test("client bundle registers under package name via __ModuleLoader__", () => {
  const captured = { defs: [], queries: [] };
  const { sandbox } = makeSandbox(captured);
  vm.createContext(sandbox);
  vm.runInContext(bundleSrc, sandbox, { filename: "lib/client.js" });
  assert.equal(captured.defs.length, 1, "应恰好一次 __ModuleLoader__.load 注册");
  assert.equal(captured.defs[0].id, pkgName, "boot 图条目 id 必须等于 package.json name");
});

test("client factory exports only apply/inject; inject shape stable", () => {
  const captured = { defs: [], queries: [] };
  const { sandbox } = makeSandbox(captured);
  vm.createContext(sandbox);
  vm.runInContext(bundleSrc, sandbox, { filename: "lib/client.js" });
  const api = captured.defs[0].factory((id) => {
    if (id === "react") return require_("react");
    if (id === "react/jsx-runtime") return require_("react/jsx-runtime");
    throw new Error("unexpected require: " + id);
  });
  assert.deepEqual(Object.keys(api).sort(), ["apply", "inject"]);
  assert.equal(typeof api.apply, "function");
  assert.ok(Array.isArray(api.inject) && api.inject.includes("slots"), "inject 应含 slots");
});

test("apply(ctx) executes under universal stub and injects card + guide CSS", () => {
  const captured = { defs: [], queries: [] };
  const { sandbox, styles } = makeSandbox(captured);
  vm.createContext(sandbox);
  vm.runInContext(bundleSrc, sandbox, { filename: "lib/client.js" });
  const api = captured.defs[0].factory((id) => {
    if (id === "react") return require_("react");
    if (id === "react/jsx-runtime") return require_("react/jsx-runtime");
    throw new Error("unexpected require: " + id);
  });
  assert.doesNotThrow(() => api.apply(sandbox.__ctx));
  // css 区（card.css）在模块加载即注入；guide css 由 injectGuideCss 在 apply 路径补
  assert.ok(styles.length >= 1, "至少注入卡片 CSS");
  assert.equal(styles[0].plugin, "dsh-union-search");
  assert.ok(styles[0].len > 2000, "卡片 CSS 体量应远超 2KB（原 bundle 实测 1 万+ 字符）");
});

// createRequire 辅助（sandbox 外加载真实 react，验证 jsx-runtime 可用）
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
function require_(id) {
  return req(id);
}
