// 相关性守卫判据（0.11.3-rc.1 起，移植上游 5001357 + d019d04 终版三条件）。
// 消费面：searchBing 既有接线 + searchDdgHtml/searchDdgLite/searchSearxng 出口（rc.2 接线）。
// 引擎函数本体需网络，此处测判据与 guardRelevance 出口语义。
import { test } from "node:test";
import assert from "node:assert/strict";
import { looksRelevant, queryOverlapTokens, guardRelevance } from "../lib/index.js";

test("tokens: 中文单字不再入判据，二元组保留", () => {
  const t = queryOverlapTokens("系统");
  assert.deepEqual(t, ["系统"]);
  const t2 = queryOverlapTokens("水"); // 单字 run → 无 token（判据放行，不拦截）
  assert.deepEqual(t2, []);
});

test("强命中：标题含中文 bigram + 另一 token 命中 → 相关", () => {
  const sources = [
    { title: "DeepSeek V3 推理成本分析", snippet: "讨论推理成本与部署", url: "https://a.example/x" },
    { title: "无关新闻一", snippet: "另一条新闻", url: "https://b.example" },
    { title: "无关新闻二", snippet: "又一条新闻", url: "https://c.example" },
  ];
  assert.equal(looksRelevant("DeepSeek 推理成本", sources), true);
});

test("标题零命中：token 只泡在正文/URL 里 → 判无关（缓存页形态）", () => {
  const sources = [
    { title: "每日热点快讯", snippet: "页面导航含 DeepSeek 话题标签", url: "https://news.example/tag/DeepSeek" },
    { title: "财经早报", snippet: "提及推理成本一词", url: "https://news.example/a" },
    { title: "科技早报", snippet: "无关内容", url: "https://news.example/b" },
  ];
  assert.equal(looksRelevant("DeepSeek 推理成本", sources), false);
});

test("纯符号/单字查询无法判定 → 放行不误杀", () => {
  assert.equal(looksRelevant("????", [{ title: "任何", snippet: "页面", url: "u" }]), true);
  assert.equal(looksRelevant("水", [{ title: "任何", snippet: "页面", url: "u" }]), true);
});

test("短 ASCII 词不算标题强命中（gt/max 型号后缀教训）", () => {
  // 标题只含 "gt"（2 字母），不含 ≥4 位词或中文 bigram → titleTokens 回退 usable 前，
  // titleStrong 为空时 titleTokens=usable，gt 可作标题 token——真正把关在 token 重叠与源数。
  const sources = [{ title: "gt vs max 对比", snippet: "讨论 gt 与 max 的差异", url: "https://x.example" }];
  assert.equal(looksRelevant("gt max", sources), true);
  // 标题不含任何查询 token、仅在 URL 出现 → titleMatched=0 → 判无关
  const junk = [{ title: "首页", snippet: "欢迎光临", url: "https://site.example/gtmax" }];
  assert.equal(looksRelevant("gtmax", junk), false);
});

test("命中源占比：6 条里仅 1 条命中 → 不足 1/3 判无关", () => {
  const hit = { title: "Kiro 使用指南", snippet: "Kiro 是什么", url: "https://a.example/kiro" };
  const noise = (i) => ({ title: `新闻标题${i}`, snippet: `内容${i}`, url: `https://n.example/${i}` });
  assert.equal(looksRelevant("Kiro 使用指南", [hit, noise(1), noise(2), noise(3), noise(4), noise(5)]), false);
  // 3 条里 1 条命中：ceil(3/3)=1 → 达标
  assert.equal(looksRelevant("Kiro 使用指南", [hit, noise(1), noise(2)]), true);
});

test("纯数字查询：标题含数字才放行", () => {
  assert.equal(looksRelevant("2026", [{ title: "2026 年展望", snippet: "正文", url: "u" }]), true);
  assert.equal(looksRelevant("2026", [{ title: "年展望", snippet: "正文", url: "u" }]), false);
});

test("guardRelevance: 无关批次洗空且清掉 content 残留", () => {
  const dirty = {
    sources: [
      { title: "每日热点快讯", snippet: "导航里提到 DeepSeek 标签", url: "https://n.example/1" },
      { title: "财经早报", snippet: "推理成本四个字", url: "https://n.example/2" },
      { title: "体育早报", snippet: "无关", url: "https://n.example/3" },
    ],
    truncated: false,
    content: "聚合提示文本",
  };
  const out = guardRelevance("DeepSeek 推理成本", dirty);
  assert.deepEqual(out.sources, []);
  assert.equal(out.truncated, false);
  assert.equal(out.content, undefined, "洗空后不得残留聚合文案");
});

test("guardRelevance: 相关批次与空结果原样透传", () => {
  const good = { sources: [{ title: "DeepSeek 推理成本分析", snippet: "分析推理成本", url: "https://a.example" }], truncated: false };
  assert.equal(guardRelevance("DeepSeek 推理成本", good), good);
  const empty = { sources: [], truncated: false };
  assert.equal(guardRelevance("anything", empty), empty);
});
