// 常驻面预算闸：模型面工具说明（description + 各参数 description）每轮随 schema 付费。
// 超预算即失败；并核对 union_help 主题与工具短描述同源、help 语料未被写成空壳。
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HELP_TOPICS, TOOL_TOPICS } from "../lib/index.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "lib", "index.js"), "utf8");

// —— 极简解析：逐个 defineTool 块取 name/description/参数 description ——
function objEnd(s, openIdx) {
  let depth = 0;
  let q = null;
  for (let i = openIdx; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === "\\") i++;
      else if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") q = c;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return s.length;
}
function strValue(body, key) {
  const m = new RegExp(`${key}:\\s*`).exec(body);
  if (!m) return null;
  let i = m.index + m[0].length;
  while (i < body.length && /\s/.test(body[i])) i++;
  const q = body[i];
  if (q !== '"' && q !== "'" && q !== "`") return null;
  let out = "";
  i++;
  for (; i < body.length; i++) {
    const c = body[i];
    if (c === "\\") {
      out += body[i + 1] ?? "";
      i++;
      continue;
    }
    if (c === q) return out;
    out += c;
  }
  return out;
}
function collectTools(text) {
  const tools = [];
  const re = /defineTool\(\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const open = m.index + m[0].length - 1;
    const body = text.slice(open, objEnd(text, open) + 1);
    const name = strValue(body, "name");
    if (!name) continue;
    const description = strValue(body, "description") ?? "";
    const paramDescs = [];
    const pIdx = body.indexOf("parameters:");
    if (pIdx >= 0) {
      const pOpen = body.indexOf("{", pIdx + "parameters:".length);
      const inner = body.slice(pOpen + 1, objEnd(body, pOpen));
      const pre = /([A-Za-z_0-9]+)\s*:\s*\{/g;
      let pm;
      while ((pm = pre.exec(inner))) {
        const seg = inner.slice(pm.index + pm[0].length - 1, objEnd(inner, pm.index + pm[0].length - 1) + 1);
        const d = strValue(seg, "description");
        if (d) paramDescs.push(d);
      }
    }
    tools.push({ name, description, paramDescs, total: [...description].length + paramDescs.reduce((a, d) => a + [...d].length, 0) });
  }
  return tools;
}
const tools = collectTools(src);
const face = tools.reduce((a, t) => a + t.total, 0);
const len = (s) => [...s].length;

test("常驻面：六工具说明总量在预算内", () => {
  assert.ok(tools.length >= 6, `解析到 ${tools.length} 个工具，解析可能失效`);
  // 0.10.17 基线 4387 → 0.10.18（手册化）2839 → 0.10.19（三分类）2181
  assert.ok(face <= 2300, `常驻面 ${face} 字符超预算（本轮落点 2181）`);
});

test("常驻面：无单条描述超 700 字符", () => {
  for (const t of tools) {
    assert.ok(len(t.description) <= 700, `${t.name} description ${len(t.description)} 字符超单条上限`);
  }
});

test("常驻面：说明不平铺 help 语料的长规则", () => {
  // 这些串只应出现在 HELP_TOPICS / 注释 / README，回到 description 即视为又平铺了
  const banned = ["utm_*", "gb18030", "igshid", "SUBP=", "请完成安全验证"];
  for (const t of tools) {
    for (const probe of banned) {
      assert.ok(!t.description.includes(probe), `${t.name} description 又出现按需面内容 "${probe}"`);
    }
  }
});

test("手册：已注册且描述点名所覆盖的工具，且只写自家工具", () => {
  const manual = tools.find((t) => t.name === "search_fetch_tool_manual");
  assert.ok(manual, "search_fetch_tool_manual 未注册");
  // 范围锚定：本手册只说 advanced_search 与 advance_fetch，不得自己扩大到其余工具
  assert.deepEqual(Object.keys(TOOL_TOPICS).sort(), ["advance_fetch", "advanced_search"]);
  for (const out of ["platform_search", "video_search", "multi_search"]) {
    assert.ok(!manual.description.includes(out), `手册描述越范围点名了 ${out}`);
  }
  for (const tool of Object.keys(TOOL_TOPICS)) {
    assert.ok(manual.description.includes(tool), `手册描述未点名 ${tool}`);
    assert.ok(
      tools.some((t) => t.name === tool),
      `TOOL_TOPICS 记录了本插件未注册的工具 ${tool}（手册不得写别家）`,
    );
  }
});

test("手册：主题均可由工具名入口达到，无孤儿主题", () => {
  const covered = new Set(Object.values(TOOL_TOPICS).flat());
  for (const k of Object.keys(HELP_TOPICS)) {
    assert.ok(covered.has(k), `主题 ${k} 未被任何工具名入口覆盖`);
  }
});

test("手册与描述：不得夹带其他插件或外部工具的名字", () => {
  const foreign = ["browser-cdp", "bcdp_", "stagehand", "playwright", "puppeteer"];
  const corpus = [...Object.values(HELP_TOPICS), ...tools.map((t) => t.description)].join("\n");
  for (const f of foreign) {
    assert.ok(!corpus.includes(f), `模型面出现其他工具的名字 ${f}`);
  }
});

test("手册：语料非空壳且主题集与范围一致", () => {
  const keys = Object.keys(HELP_TOPICS).sort();
  assert.deepEqual(keys, ["fetch-types", "fields-syntax", "identity", "time-filters", "troubleshooting"]);
  for (const k of keys) {
    assert.ok(len(HELP_TOPICS[k]) >= 200, `${k} 语料仅 ${len(HELP_TOPICS[k])} 字符`);
  }
});
