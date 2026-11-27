// 安装模式检测与升级核实（0.11.4 上游 #163；rc.7 逐字搬移）
// AUTO-EXTRACT rc.7：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import fs from "node:fs";
import path from "node:path";

// 当前插件版本（发布时与 package.json 同步）
export const PLUGIN_VERSION = "0.10.19";
// 检查更新的 npm registry 元数据地址（dsh-union-search 是 npmjs 上的公开包，0.10.15 起统一裸名）
export const NPM_REGISTRY_URL = "https://registry.npmjs.org/dsh-union-search/latest";
export const PLUGIN_NPM_URL = "https://www.npmjs.com/package/dsh-union-search";
export const PLUGIN_REPO_URL = "https://github.com/drscrewdriver/dsh-union-search";

// 查询 npm registry 的最新版本；失败时返回 null（网络/代理问题不阻塞设置页）
export async function fetchLatestVersion(signal?: AbortSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const response = await fetch(NPM_REGISTRY_URL, {
      headers: { accept: "application/json", "user-agent": "deepseek-harness/union-search" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

// 升级后的实装版本核实（上游 #163 教训）：pnpm exit 0 ≠ 装到了 latest——pnpm 11 默认
// minimumReleaseAge 会把未过冷却期的新版静默拦回旧版。读 profile 里的 package.json 为准
// （Windows 下可能带 BOM，先剥）；读不到/损坏返回 null 交由调用方判为未知。
export function verifyInstalledVersion(profileDir) {
  try {
    const raw = fs.readFileSync(path.join(profileDir, "node_modules", "dsh-union-search", "package.json"), "utf8");
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ""));
    return typeof parsed.version === "string" && parsed.version ? parsed.version : null;
  } catch {
    return null;
  }
}

// 简单的 semver 比较（仅处理 x.y.z 主/次/补丁，忽略预发布标签）；a>b 返回 1, a<b 返回 -1, 相等返回 0
export function compareVersions(a, b) {
  const na = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const nb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((na[i] ?? 0) > (nb[i] ?? 0)) return 1;
    if ((na[i] ?? 0) < (nb[i] ?? 0)) return -1;
  }
  return 0;
}

// 检测插件的安装模式：遍历 profiles/*/node_modules 下的裸名与 scoped 两种目录，
// symlink（link: 本地开发）→ isLink=true；npm 真安装 → isLink=false；找不到 → null
export function detectInstallMode() {
  const profilesDir = path.join(process.cwd(), "profiles");
  let found = null;
  try {
    for (const name of fs.readdirSync(profilesDir)) {
      // 裸名优先（0.10.15+ 正统身份）；scoped 与更早的 dsh-free-search 保留为兼容候选（历史安装）
      const pkgPath = [path.join(profilesDir, name, "node_modules", "dsh-union-search"), path.join(profilesDir, name, "node_modules", "@drscrewdriver", "dsh-union-search"), path.join(profilesDir, name, "node_modules", "@drscrewdriver", "dsh-free-search")].find((c) => fs.existsSync(c));
      if (pkgPath === undefined) continue;
      let isLink = false;
      try {
        isLink = fs.lstatSync(pkgPath).isSymbolicLink();
      } catch {}
      found = { profileDir: path.join(profilesDir, name), isLink };
      break;
    }
  } catch {}
  return found;
}
