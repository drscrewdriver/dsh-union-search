// 接管残留自动回收回归（0.16.0-rc.1，上游 #159）：pin 五分类、总态聚合、回滚决策核心
// （相等清除 / 不等保留 / 字段不存在幂等 / API 失败回落文本 / 双失败不外泄）。
// 注：self-check 与 dispose 的 ctx 接线由 rc 段装机冒烟覆盖（见 tasks.md），此处只锁纯逻辑。
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyPin,
  computeTakeoverState,
  rollbackPinnedFields,
  OUR_LEGACY_PROVIDER_IDS,
} from "../lib/index.js";

const SHIPPED = ["deepseek-official", "deepseek-search-api"];
const NOOP_LOG = { info() {}, warn() {}, error() {}, debug() {} };

// —— classifyPin 五分类 ——
test("classifyPin: absent/ours/shipped/our-legacy/foreign 五档", () => {
  assert.equal(classifyPin(undefined, "ddg", SHIPPED, OUR_LEGACY_PROVIDER_IDS), "absent");
  assert.equal(classifyPin(null, "ddg", SHIPPED, OUR_LEGACY_PROVIDER_IDS), "absent");
  assert.equal(classifyPin("ddg", "ddg", SHIPPED, OUR_LEGACY_PROVIDER_IDS), "ours");
  assert.equal(classifyPin("deepseek-search-api", "ddg", SHIPPED, OUR_LEGACY_PROVIDER_IDS), "shipped");
  assert.equal(classifyPin("web-search-free", "ddg", SHIPPED, OUR_LEGACY_PROVIDER_IDS), "our-legacy");
  assert.equal(classifyPin("tavily-x", "ddg", SHIPPED, OUR_LEGACY_PROVIDER_IDS), "foreign");
});

test("OUR_LEGACY_PROVIDER_IDS 含 dsh-free-search 时代旧 id", () => {
  assert.ok(OUR_LEGACY_PROVIDER_IDS.includes("web-search-free"));
});

// —— computeTakeoverState 三态聚合 ——
test("computeTakeoverState: 悬空 > 外部占用 > 正常优先级", () => {
  assert.equal(computeTakeoverState({ searchProvider: { kind: "ours" }, fetchProvider: { kind: "absent" } }), "ok");
  assert.equal(computeTakeoverState({ searchProvider: { kind: "shipped" } }), "ok");
  assert.equal(computeTakeoverState({ searchProvider: { kind: "foreign" } }), "foreign");
  assert.equal(computeTakeoverState({ searchProvider: { kind: "our-legacy" } }), "dangling");
  assert.equal(computeTakeoverState({ fetchProvider: { kind: "foreign-unregistered" } }), "dangling");
  // 同时存在外部占用与悬空 → dangling 胜出
  assert.equal(computeTakeoverState({ searchProvider: { kind: "foreign" }, fetchProvider: { kind: "our-legacy" } }), "dangling");
});

// —— rollbackPinnedFields 决策核心 ——
test("rollback: 当前值===写入值 → 生成 unset 并走 mutate（API 主路径）", async () => {
  const seen = [];
  const r = await rollbackPinnedFields(
    { searchProvider: "ddg", fetchProvider: "union-search" },
    {
      getCurrent: (f) => (f === "searchProvider" ? "ddg" : "union-search"),
      mutate: async (ops) => { seen.push(...ops); },
      textCleanup: async () => { throw new Error("should not run"); },
      log: NOOP_LOG,
    },
  );
  assert.equal(r.status, "api");
  assert.equal(seen.length, 2);
  assert.deepEqual(seen.map((o) => o.path[0]).sort(), ["fetchProvider", "searchProvider"]);
  assert.ok(seen.every((o) => o.op === "unset"));
});

test("rollback: 值已被改成第三方 → 保留不动，mutate 不被调用", async () => {
  let mutateCalls = 0;
  const r = await rollbackPinnedFields(
    { searchProvider: "ddg" },
    {
      getCurrent: () => "tavily-x", // 用户手改
      mutate: async () => { mutateCalls++; },
      textCleanup: async () => 0,
      log: NOOP_LOG,
    },
  );
  assert.equal(r.status, "noop");
  assert.equal(r.reason, "no-matching-fields");
  assert.equal(mutateCalls, 0, "非本插件值绝不误删");
});

test("rollback: 字段本就不存在 → 幂等 noop（不重复写）", async () => {
  let mutateCalls = 0;
  const r = await rollbackPinnedFields(
    { searchProvider: "ddg" },
    { getCurrent: () => null, mutate: async () => { mutateCalls++; }, textCleanup: async () => 0, log: NOOP_LOG },
  );
  assert.equal(r.status, "noop");
  assert.equal(mutateCalls, 0);
});

test("rollback: 部分匹配 → 只清匹配到的那一路", async () => {
  const seen = [];
  await rollbackPinnedFields(
    { searchProvider: "ddg", fetchProvider: "union-search" },
    {
      getCurrent: (f) => (f === "searchProvider" ? "ddg" : "third-party-fetch"),
      mutate: async (ops) => { seen.push(...ops); },
      textCleanup: async () => 0,
      log: NOOP_LOG,
    },
  );
  assert.equal(seen.length, 1);
  assert.equal(seen[0].path[0], "searchProvider");
});

test("rollback: 幂等性 —— 首轮 unset 后字段消失，再调无副作用", async () => {
  const live = { searchProvider: "ddg" };
  let mutateCalls = 0;
  const deps = {
    getCurrent: (f) => live[f],
    mutate: async (ops) => { mutateCalls++; for (const o of ops) delete live[o.path[0]]; },
    textCleanup: async () => 0,
    log: NOOP_LOG,
  };
  const first = await rollbackPinnedFields({ searchProvider: "ddg" }, deps);
  assert.equal(first.status, "api");
  const second = await rollbackPinnedFields({ searchProvider: "ddg" }, deps);
  assert.equal(second.status, "noop");
  assert.equal(mutateCalls, 1, "第二次不得再产生写入调用");
});

test("rollback: API 抛错 → 回落文本路径（task_07 双路径）", async () => {
  let textCalls = 0;
  const r = await rollbackPinnedFields(
    { searchProvider: "ddg" },
    {
      getCurrent: () => "ddg",
      mutate: async () => { throw new Error("Config field not volatile"); },
      textCleanup: async () => { textCalls++; return 1; },
      log: NOOP_LOG,
    },
  );
  assert.equal(r.status, "text");
  assert.equal(r.removedCount, 1);
  assert.equal(textCalls, 1);
});

test("rollback: 文本路径也抛错 → failed，异常不外泄（task_08 dispose 不中断）", async () => {
  const r = await rollbackPinnedFields(
    { searchProvider: "ddg" },
    {
      getCurrent: () => "ddg",
      mutate: async () => { throw new Error("mutate boom"); },
      textCleanup: async () => { throw new Error("text boom"); },
      log: NOOP_LOG,
    },
  );
  assert.equal(r.status, "failed");
});

test("rollback: our-legacy 旧 id 命中且值匹配 → 安全清除", async () => {
  const seen = [];
  const r = await rollbackPinnedFields(
    { searchProvider: "web-search-free" },
    {
      getCurrent: () => "web-search-free",
      mutate: async (ops) => { seen.push(...ops); },
      textCleanup: async () => 0,
      log: NOOP_LOG,
    },
  );
  assert.equal(r.status, "api");
  assert.equal(seen.length, 1);
  assert.equal(seen[0].path[0], "searchProvider");
});
