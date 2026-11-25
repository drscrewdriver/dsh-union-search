// 出口卫生回归（0.11.2-rc.1，上游 dsh-free-search #108 教训）：
// 内容截断与数字实体解码不得产出孤立代理项——污染会话后不可恢复。
// 约定:所有进模型文本 / 进外部请求体的截断走 cutSafe / fromCodePointSafe;
// 纯检测截断(html.slice(0,4000) 反爬扫描等)不在此列。
import { test } from "node:test";
import assert from "node:assert/strict";
import { cutSafe, cleanSnippet, decodeEntities, smartTruncate, extractBySelector } from "../lib/index.js";

// 逐码元走查:高代理必须紧跟低代理,孤立低代理直接判失败。
function assertWellFormed(s, msg) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = s.charCodeAt(i + 1);
      assert.ok(n >= 0xdc00 && n <= 0xdfff, `${msg}: lone high surrogate at ${i}`);
      i++;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      assert.fail(`${msg}: lone low surrogate at ${i}`);
    }
  }
}

const EMOJI = String.fromCodePoint(0x1f600); // 😀 U+1F600,UTF-16 双码元

test("cutSafe: limit 落在代理对中间时回退到高代理前", () => {
  const s = "a".repeat(4) + EMOJI + "b"; // len 4+2+1=7,limit=5 会切开代理对
  const cut = cutSafe(s, 5);
  assert.equal(cut, "aaaa");
  assertWellFormed(cut, "cutSafe 跨界");
});

test("cutSafe: 不跨界时等价原生截断;短串透传", () => {
  assert.equal(cutSafe("abcdef", 3), "abc");
  assert.equal(cutSafe("abc", 10), "abc");
  assert.equal(cutSafe("a" + EMOJI, 3), "a" + EMOJI, "limit 在完整对之后应整串透传");
  assert.equal(cutSafe("a" + EMOJI, 2), "a", "limit 落在对中间应回退到高代理前");
});

test("cleanSnippet: 300 上限尾部恰有 emoji 不出孤立代理", () => {
  const text = "x".repeat(299) + EMOJI + "tail text";
  const out = cleanSnippet(text);
  assert.ok(out.length <= 300, `长度 ${out.length} 应 ≤300`);
  assertWellFormed(out, "cleanSnippet 出口");
});

test("cleanSnippet: 噪声词剔除逻辑不回退(既有行为锚点)", () => {
  const out = cleanSnippet("real content " + "Sign up ".repeat(30) + "more");
  assert.ok(!/sign up/i.test(out), "噪声短语应被剔除");
});

test("smartTruncate: 词边界回退后仍 well-formed(代理对恰在 limit)", () => {
  const s = "word ".repeat(20) + EMOJI + " tail"; // 制造多行/空格回退场景
  const out = smartTruncate(s, 22);
  assertWellFormed(out, "smartTruncate 出口");
  assert.ok(out.length <= 22, "不超长");
});

test("extractBySelector: fields 500 字切割代理对安全", () => {
  const long = "a".repeat(499) + EMOJI + "b"; // text() 压缩后原样
  const html = `<h1>${long}</h1>`;
  const { extracted } = extractBySelector(html, { fields: "title=h1" });
  assert.equal(extracted.length, 1);
  const value = extracted[0].value;
  assert.ok(value.endsWith("…"), "超长应带省略号");
  assertWellFormed(value, "fields 500 切割");
});

test("decodeEntities: 星平面十进制实体出正确字符,不再造孤立代理", () => {
  assert.equal(decodeEntities("&#128512;"), EMOJI);
  assert.equal(decodeEntities("&#9824;"), String.fromCodePoint(9824)); // 平面内不受影响
});

test("decodeEntities: 越界与孤立代理区实体丢空,不污染文本", () => {
  assert.equal(decodeEntities("x&#55357;y"), "xy"); // D800 高代理实体
  assert.equal(decodeEntities("x&#56320;y"), "xy"); // DC00 低代理实体
  assert.equal(decodeEntities("x&#1114112;y"), "xy"); // >0x10FFFF
  assert.equal(decodeEntities("x&#0;y"), "xy"); // NUL 不再注入控制符
});

test("decodeEntities: 组合场景——实体解码产物再截断仍 well-formed", () => {
  const raw = "&#128512;".repeat(100); // 解码后 200 码元全是成对代理
  const decoded = decodeEntities(raw);
  assert.equal(decoded, EMOJI.repeat(100));
  const out = cutSafe(decoded, 199); // 199 会切开第 100 个 emoji
  assertWellFormed(out, "解码+截断组合");
});
