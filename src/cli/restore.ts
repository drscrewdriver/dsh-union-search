// 接管悬空引用清理器（0.11.6，上游 #159 / 767b5a4 概念移植）。
// 背景：本插件运行时把 web.searchProvider 钉成 "ddg"（settings.mutate 落 profile 条配置），
// 停用/卸载后该字段悬空，宿主报 CONFIGURED_MISSING 且 web_search 起不来。
// 用法（插件目录已不存在也能跑——从任意位置用 node 直接执行本文件）：
//   node restore.js                     # 默认 --dry，只报告将删什么
//   node restore.js --apply             # 落盘
//   node restore.js --profiles-dir <d>  # 指定 dsh 根（其下有 profiles/*/cordis.patch.yml）
//   node restore.js --include-fetch --apply  # 连 fetchProvider 行一并清（默认保留：指向宿主内建档）
import fs from "node:fs";
import path from "node:path";

const PINNED_SEARCH_ID = "ddg"; // 与 lib/index.js 的 provider.id 一致（index.js:4412 实证）

// 逐行状态机：定位 `- id: web` 条目 → 其 config 块内的 searchProvider/fetchProvider 行。
// 块边界按缩进判定：条目起于 `- ` 行，后续行缩进 > 条目缩进即属该条目；缩进回落即出块。
export function processPatchText(text, { includeFetch = false } = {}) {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const out = [];
  const removed = [];
  let entryIndent = -1; // -1 = 不在 web 条目内
  let inConfig = false;
  let configIndent = -1;
  for (const line of lines) {
    const indent = line.match(/^\s*/)[0].length;
    const isBlank = !line.trim();
    if (entryIndent !== -1 && !isBlank && indent <= entryIndent) {
      entryIndent = -1; // 出了 web 条目块（遇到同级或更浅的非空行）
      inConfig = false;
    }
    if (entryIndent === -1 && /^\s*-\s+id:\s*web\s*$/.test(line)) {
      entryIndent = indent;
      out.push(line);
      continue;
    }
    if (entryIndent !== -1) {
      if (!inConfig && /^\s*config:\s*$/.test(line)) {
        inConfig = true;
        configIndent = indent;
        out.push(line);
        continue;
      }
      if (inConfig && indent > configIndent) {
        if (new RegExp(`^\\s*searchProvider:\\s*['"]?${PINNED_SEARCH_ID}['"]?\\s*(#.*)?$`).test(line)) {
          removed.push(`searchProvider: ${PINNED_SEARCH_ID}`);
          continue;
        }
        // 0.12.0 fetch provider 钉选残留：值是本插件 id 时必悬空（卸载后无注册），无条件下删；
        // 其他 fetch 值（http / 第三方）只在 --include-fetch 时清。
        if (/^\s*fetchProvider:\s*['"]union-search['"]?\s*(#.*)?$/.test(line) ||
            /^\s*fetchProvider:\s*union-search\s*(#.*)?$/.test(line)) {
          removed.push("fetchProvider: union-search");
          continue;
        }
        if (includeFetch && /^\s*fetchProvider:/.test(line)) {
          removed.push(line.trim());
          continue;
        }
      } else if (inConfig && indent <= configIndent && !isBlank) {
        inConfig = false;
      }
    }
    out.push(line);
  }
  return { text: out.join(eol), removed, inWebEntry: entryIndent !== -1 };
}

// 找 profiles/*/cordis.patch.yml（含 patch.yaml 变体）
export function findPatchFiles(profilesDir) {
  const hits = [];
  let names = [];
  try {
    names = fs.readdirSync(profilesDir);
  } catch {
    return hits;
  }
  for (const name of names) {
    for (const fname of ["cordis.patch.yml", "cordis.patch.yaml"]) {
      const p = path.join(profilesDir, name, fname);
      if (fs.existsSync(p)) hits.push(p);
    }
  }
  return hits;
}

function main(argv) {
  const apply = argv.includes("--apply");
  const includeFetch = argv.includes("--include-fetch");
  const di = argv.indexOf("--profiles-dir");
  const profilesDir = di !== -1 && argv[di + 1] ? argv[di + 1] : path.join(process.cwd(), "profiles");
  const files = findPatchFiles(profilesDir);
  if (files.length === 0) {
    console.log(`未发现任何 cordis.patch.yml（目录：${profilesDir}）——无需清理。`);
    return;
  }
  let total = 0;
  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    const { text, removed } = processPatchText(before, { includeFetch });
    if (removed.length === 0) {
      console.log(`- ${file}: 干净`);
      continue;
    }
    total += removed.length;
    console.log(`- ${file}:`);
    for (const r of removed) console.log(`    将删除  ${r}`);
    if (apply) fs.writeFileSync(file, text);
  }
  console.log(total === 0 ? "没有发现本插件钉选造成的悬空字段。" :
    (apply ? `已清理 ${total} 行（重启 dsh 生效）。` : `dry-run：共 ${total} 行待删；加 --apply 落盘。`));
}

// 仅直接运行时执行 main（被 import 时不跑）
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  main(process.argv.slice(2));
}
