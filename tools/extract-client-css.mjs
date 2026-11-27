// client bundle CSS/选择器等价对拍（checklist「新 lib/client.js 的 .dshfs-* 选择器集合与原 bundle 完全一致」）。
// 配对: $env:CLIENT_CSS_PAIR="old.js,new.js"; node tools/extract-client-css.mjs
// 单文件: node tools/extract-client-css.mjs [--file lib/client.js] [--json]
// 集合 = 字符串字面量内部的 CSS 选择器 token（.class 仅收 dsh*/sg* 系、#hex 色值、[attr] 前缀），
// 外加 className 字面量、style 注入 tagId、ModuleLoader id 与 exports 面。
import { readFileSync, existsSync } from "node:fs";

const argv = process.argv.slice(2);
const fileIdx = argv.indexOf("--file");
const FILES = process.env.CLIENT_CSS_PAIR; // "old,new" 形式，逗号分
const SEL_RE = /\.(?:dsh|sg)[\w-]+|#[0-9a-fA-F]{3,8}(?=[{,:\s).]|$)|\[(?:data|class|href|id)[^\]]*\]/g;
function extract(file) {
  const s = readFileSync(file, "utf8");
  const set = new Set();
  // 1) 字符串字面量中的选择器 token（引号成对、不跨行）
  for (const m of s.matchAll(/"([^"\n]{1,100000})"|'([^'\n]{1,100000})'/g)) {
    const lit = m[1] ?? m[2];
    if (!lit || !/[.#]/.test(lit)) continue;
    for (const c of lit.match(SEL_RE) ?? []) set.add(c);
  }
  // 2) className 表达式里的字符串
  for (const m of s.matchAll(/className:\s*"([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) set.add("." + c);
  // 3) data-plugin / tagId
  for (const m of s.matchAll(/data-plugin(?:Css)?["'\]]?\s*[:=]?\s*"([^"]+)"/g)) set.add("data:" + m[1]);
  for (const m of s.matchAll(/dataset\.plugin(?:Css)?\s*=\s*"?([^;"\n]+)"?/g)) set.add("ds:" + m[1].trim());
  // 4) ModuleLoader id / exports 面
  const id = (s.match(/__ModuleLoader__\.load\(\{\s*\r?\n?\s*id:\s*"([^"]+)"/) || [])[1] ?? (s.match(/id:\s*"(dsh-[^"]+)"/) || [])[1];
  const exportKeys = [...s.matchAll(/exports\.(\w+)\s*=/g)].map((m) => m[1]).sort();
  return { selectors: [...set].sort(), id, exportKeys, count: set.size };
}

if (FILES) {
  const [a, b] = FILES.split(",");
  const A = extract(a), B = extract(b);
  const onlyA = A.selectors.filter((x) => !B.selectors.includes(x));
  const onlyB = B.selectors.filter((x) => !A.selectors.includes(x));
  console.log(JSON.stringify({
    oldCount: A.count, newCount: B.count,
    idEqual: A.id === B.id, AId: A.id, BId: B.id,
    exportsEqual: JSON.stringify(A.exportKeys) === JSON.stringify(B.exportKeys),
    exportsB: B.exportKeys,
    onlyOld: onlyA, onlyNew: onlyB,
    PASS: onlyA.length === 0 && onlyB.length === 0 && A.id === B.id && JSON.stringify(A.exportKeys) === JSON.stringify(B.exportKeys),
  }, null, 1));
  process.exitCode = onlyA.length === 0 && onlyB.length === 0 && A.id === B.id ? 0 : 1;
} else {
  const f = fileIdx >= 0 ? argv[fileIdx + 1] : "lib/client.js";
  if (!existsSync(f)) { console.error("missing", f); process.exit(1); }
  const r = extract(f);
  if (argv.includes("--json")) console.log(JSON.stringify(r));
  else console.log(r.selectors.join("\n"));
  console.log("count=", r.count, "id=", r.id, "exports=", r.exportKeys.join(","));
}
