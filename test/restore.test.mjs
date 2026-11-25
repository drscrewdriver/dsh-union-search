// bin/restore.js 回归（0.11.6-rc.1，上游 #159）：只删本插件钉选造成的悬空行，零误伤。
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { processPatchText, findPatchFiles } from "../bin/restore.js";

test("仅删 web 条目 config 内的 searchProvider: ddg；其他条目/其他值不动", () => {
  const src = [
    "- id: web",
    "  config:",
    "    searchProvider: ddg",
    "    searchMaxResults: 8",
    "- id: other-plugin",
    "  config:",
    "    searchProvider: ddg",
    "",
  ].join("\n");
  const { text, removed } = processPatchText(src);
  assert.deepEqual(removed, ["searchProvider: ddg"]);
  assert.ok(text.includes("- id: other-plugin\n  config:\n    searchProvider: ddg"), "非 web 条目零误伤");
  assert.ok(text.includes("searchMaxResults: 8"), "同条目其他字段保留");
  assert.ok(!/^    searchProvider: ddg\n    searchMaxResults/m.test(text), "web 条目内已删");
});

test("fetchProvider 默认保留；--include-fetch 才清", () => {
  const src = [
    "- id: web",
    "  config:",
    "    searchProvider: 'ddg'",
    "    fetchProvider: http",
    "",
  ].join("\n");
  const keep = processPatchText(src);
  assert.deepEqual(keep.removed, ["searchProvider: ddg"]);
  assert.ok(keep.text.includes("fetchProvider: http"));
  const full = processPatchText(src, { includeFetch: true });
  assert.deepEqual(full.removed, ["searchProvider: ddg", "fetchProvider: http"]);
  assert.ok(!full.text.includes("fetchProvider"));
});

test("宿主出厂值/第三方 provider 不是本插件钉选，绝不删", () => {
  const src = [
    "- id: web",
    "  config:",
    "    searchProvider: deepseek-search-api",
    "    fetchProvider: deepseek-fetch-api",
    "",
  ].join("\n");
  const { removed } = processPatchText(src);
  assert.deepEqual(removed, []);
});

test("web 条目后接注释与 CRLF 文件保持行尾风格", () => {
  const src = [
    "- id: web",
    "  config:",
    "    searchProvider: ddg # pinned by union-search",
    "  enabled: true",
    "",
  ].join("\r\n");
  const { text, removed } = processPatchText(src);
  assert.deepEqual(removed, ["searchProvider: ddg"]);
  assert.ok(!text.includes("searchProvider"));
  assert.ok(text.includes("enabled: true"));
  assert.ok(text.includes("\r\n"), "CRLF 保留");
});

test("findPatchFiles: profiles/*/cordis.patch.yml(.yaml) 枚举", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "us-restore-"));
  try {
    mkdirSync(path.join(dir, "p1"), { recursive: true });
    mkdirSync(path.join(dir, "p2"), { recursive: true });
    mkdirSync(path.join(dir, "p3"), { recursive: true });
    writeFileSync(path.join(dir, "p1", "cordis.patch.yml"), "", "utf8");
    writeFileSync(path.join(dir, "p2", "cordis.patch.yaml"), "", "utf8");
    const found = findPatchFiles(dir);
    assert.equal(found.length, 2);
    assert.ok(readFileSync(found[0], "utf8") === "");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
