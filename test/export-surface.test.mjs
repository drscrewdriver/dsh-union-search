// 导出面门禁（0.17.0-rc.1 源码化前置锚）：lib/index.js 的具名导出必须与基线名单逐名相等。
// TS 化按域搬移期间，最容易出的错是漏导/重名/多导——本测试在 pnpm test 里第一时间拦下。
// 若某片确实要新增导出（不应发生，对外面零变化是 rc 阶梯的硬约束），须同步改
// test/fixtures/exports-baseline.txt 并在 CHANGELOG 说明。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

test("lib/index.js export surface matches baseline (name-for-name)", async () => {
  const baseline = readFileSync(path.join(here, "fixtures", "exports-baseline.txt"), "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .sort();
  const mod = await import(path.join("..", "lib", "index.js").split("\\").join("/"));
  const actual = Object.keys(mod).sort();
  const missing = baseline.filter((k) => !actual.includes(k));
  const extra = actual.filter((k) => !baseline.includes(k));
  assert.deepEqual(
    { count: actual.length, missing, extra },
    { count: baseline.length, missing: [], extra: [] },
    `导出面漂移：基线 ${baseline.length} 项，实际 ${actual.length} 项` +
      (missing.length ? `；缺失: ${missing.join(", ")}` : "") +
      (extra.length ? `；多出: ${extra.join(", ")}` : "")
  );
});
