// 升级核实回归（0.11.4-rc.1，上游 #163）：verifyInstalledVersion 三态——
// pnpm exit 0 不等于装到了 latest，一切以 profile 实装的 package.json 为准。
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { verifyInstalledVersion } from "../lib/index.js";

function makeProfile(pkgJson, opts = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "us-upg-"));
  const target = path.join(dir, "node_modules", "dsh-union-search");
  mkdirSync(target, { recursive: true });
  if (pkgJson !== null) {
    const bytes = opts.bom ? "\uFEFF" + pkgJson : pkgJson;
    writeFileSync(path.join(target, "package.json"), bytes, "utf8");
  }
  return dir;
}

test("verifyInstalledVersion: 正常读取版本号", () => {
  const dir = makeProfile(JSON.stringify({ name: "dsh-union-search", version: "9.9.9" }));
  try {
    assert.equal(verifyInstalledVersion(dir), "9.9.9");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyInstalledVersion: Windows BOM 前缀不干扰解析", () => {
  const dir = makeProfile(JSON.stringify({ name: "dsh-union-search", version: "8.8.8" }), { bom: true });
  try {
    assert.equal(verifyInstalledVersion(dir), "8.8.8");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyInstalledVersion: 文件缺失 / JSON 损坏 / version 空 → null", () => {
  const cases = [
    [null, "文件不存在"],
    ["{ broken json", "JSON 损坏"],
    [JSON.stringify({ name: "dsh-union-search" }), "version 字段缺失"],
    [JSON.stringify({ name: "dsh-union-search", version: "" }), "version 空串"],
  ];
  for (const [body, label] of cases) {
    const dir = makeProfile(body);
    try {
      assert.equal(verifyInstalledVersion(dir), null, label);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
