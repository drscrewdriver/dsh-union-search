// note 通道与首触去重的行为闸：用桩 ctx 真注册，断言宿主收到的对象形状
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { firstTouchGuidance, GUIDANCE_SENT } from "../lib/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const mod = await import("file://" + path.join(here, "..", "lib", "index.js").replace(/\\/g, "/"));

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

const tools = [];
const sctx = {
  effect: (fn) => { try { fn(); } catch {} return () => {}; },
  tools: { register: (t) => { tools.push(t); return () => {}; } },
  systemPrompt: { section: () => () => {}, getSectionOrder: () => 100 },
  logger: { info() {}, warn() {}, error() {}, debug() {} },
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
try { await mod.apply(ctx, {}); } catch (e) { console.log(`apply threw: ${e.message}`); }

const byName = (n) => tools.find((t) => t.name === n);

test("note 通道：三个工具的输出面声明了 note", () => {
  assert.ok(tools.length >= 6, `注册工具数 ${tools.length}，注册面可能失效`);
  for (const n of ["platform_search", "video_search", "advance_fetch"]) {
    const t = byName(n);
    assert.ok(t, `${n} 未注册`);
    const props = t.output?.schema?.properties ?? {};
    assert.ok(props.note, `${n} 的 output schema 未声明 note（strict schema 会拒绝非声明字段）`);
    assert.equal(props.note.type, "string");
  }
});

test("note 通道：execute 已接收 exec（首触去重的前置条件）", () => {
  for (const n of ["platform_search", "video_search", "multi_search", "advance_fetch"]) {
    const t = byName(n);
    assert.ok(t, `${n} 未注册`);
    // 参数个数须为 2：(args, exec)
    assert.equal(t.execute.length, 2, `${n}.execute 未接 exec，会话级去重无从谈起`);
  }
});

test("首触去重：同会话同工具只发一次，跨会话各发一次", () => {
  GUIDANCE_SENT.clear();
  const text = "guidance-under-test";
  assert.equal(firstTouchGuidance("t1", { sessionId: "sess-A" }, text), text, "首触应发出");
  assert.equal(firstTouchGuidance("t1", { sessionId: "sess-A" }, text), "", "同会话二次应静默");
  assert.equal(firstTouchGuidance("t1", { sessionId: "sess-B" }, text), text, "另一会话首触应发出");
  assert.equal(firstTouchGuidance("t2", { sessionId: "sess-A" }, text), text, "同会话另一工具应独立");
});

test("首触去重：拿不到 sessionId 时退化为进程内一次，不逐调用复制", () => {
  GUIDANCE_SENT.clear();
  const text = "fallback-guidance";
  assert.equal(firstTouchGuidance("t3", {}, text), text, "无 sessionId 时首次仍发出");
  assert.equal(firstTouchGuidance("t3", undefined, text), "", "无 exec 时不得每次调用都发");
});

test("渲染边界：插件自撰说明必须在 <untrusted-web-content> 之外", () => {
  const OPEN = "<untrusted-web-content>";
  const CLOSE = "</untrusted-web-content>";
  const cases = [
    { name: "platform_search", marker: "PLUGIN-NOTE platform", args: { platform: "v2ex" }, value: { platform: "v2ex", sources: [{ url: "https://x", title: "t" }], note: "PLUGIN-NOTE platform" } },
    { name: "video_search", marker: "PLUGIN-NOTE video", args: {}, value: { provider: "ddg", sources: [{ url: "https://x", title: "t" }], note: "PLUGIN-NOTE video" } },
    { name: "multi_search", marker: "PLUGIN-NOTE multi", args: {}, value: { provider: "multi_search", content: "PLUGIN-NOTE multi", sources: [{ url: "https://x", title: "t" }] } },
    { name: "advance_fetch", marker: "PLUGIN-NOTE fetch", args: {}, value: { url: "http://x", finalUrl: "http://x", markdown: "body", truncated: false, note: "PLUGIN-NOTE fetch" } },
  ];
  for (const c of cases) {
    const t = byName(c.name);
    assert.ok(t, `${c.name} 未注册`);
    const text = t.output.render(c.args, c.value).map((b) => b.text).join("");
    const at = text.indexOf(c.marker);
    assert.ok(at >= 0, `${c.name} 的插件自撰说明没出现在渲染文本里`);
    const open = text.indexOf(OPEN);
    const close = text.indexOf(CLOSE);
    assert.ok(open >= 0 && close > open, `${c.name} 渲染文本缺少完整的不可信边界`);
    // 合法位置：整块之前（head 行里的 note）或整块之后（tail）；落在内部即失败
    assert.ok(at < open || at > close, `${c.name} 的插件说明落在不可信块内部（模型分不清是谁说的）`);
  }
});
