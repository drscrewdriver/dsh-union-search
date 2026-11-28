// 插件 Config（schemastery volatile 面）+ 旧 free-search: settings.yaml 迁移（rc.7 逐字搬移）
// AUTO-EXTRACT rc.7：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import z from "@deepseek-ai/schemastery";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DEFAULT_FALLBACK_ON } from "./engines/route";

// rc.1 declares editable fields `.volatile()`: the Loader hands `apply` live
// references and commits profile edits in place without remounting. `resolveConfig`
// unwraps those references so every read sees the latest accepted value.
// `.volatile()` requires the scoped `@deepseek-ai/schemastery` (>= 3.18.2).
export const Config = z.object({
  provider: z.string().default("bing").volatile(),
  disabledEngines: z.array(z.string()).default([]).volatile(),
  fallbackOrder: z.array(z.string()).default([]).volatile(),
  fallbackOn: z.array(z.string()).default(DEFAULT_FALLBACK_ON).volatile(),
  cache: z.boolean().default(true).volatile(), // 单 query 结果缓存开关（防限流/省额度）
  cacheTtl: z.number().default(5).volatile(), // 缓存时长（分钟），0-5 可配置（使用处再 clamp）
  // 屏蔽系统自带搜索（0.10.0）：强制接管 web_search + 把出厂 deepseek-official 引擎移出引擎链
  blockSystemSearch: z.boolean().default(false).volatile(),
  // 接管残留自动回收（0.16.0，热生效）：true=停用插件时自动 unset 本插件写过的 web 钉选 +
  // 启动自检遗留；false=退回纯手动（bin/restore.js）。卸载场景任何取值都需手跑 restore.js。
  autoRestoreOnDispose: z.boolean().default(true).volatile(),
  // fetch provider 接管（0.12.0，热生效）：开启后注册并钉选 web.fetchProvider = union-search，
  // web_fetch 出口改走本插件抓取栈（ALPN 直连 + 宿主同款 markdown 优化器，kind:text 抢在宿主
  // 「先 2e5 截断再 HTML→MD」之前完成转换）。关闭时 available()=false，完全不参与宿主选择。
  fetchTakeover: z.boolean().default(false).volatile(),
  // 浏览器升级档（0.13.0，需 dsh-browser-cdp >= 1.15.0 同在会话）：fetch provider 直连结果命中
  // 登录墙/反爬/JS 空壳特征时，改借用户已登录浏览器重抓。默认关——带 cookie 访问由搜索结果
  // （不可信文本）驱动的 URL 是身份泄漏面，只在确需登录后内容时手动开启。
  browserFetchTier: z.boolean().default(false).volatile(),
  // 逗号分隔域名后缀 allowlist（命中含子域）；空 = 不限制（仍受 browserFetchTier 总开关）。建议只钉登录墙域名。
  browserFetchAllowHosts: z.string().default("").volatile(),
  // 插件自有 advance_fetch 工具开关（0.10.3，热生效）：关闭后 execute 拒绝调用，提示词不再宣传
  advanceFetchEnabled: z.boolean().default(true).volatile(),
  // SSRF 地址门的显式豁免（0.10.4）：true = 允许回环/内网目标（局域网设备抓取）；协议/重定向门不变
  advanceFetchAllowPrivate: z.boolean().default(false).volatile(),
  // 设置桥准入加固（0.19.0，热生效）：false（默认）= 主闸交给宿主鉴权（反代部署可用）；
  // true = 额外要求字面回环。宿主无鉴权能力时该开关无效（强制回环，安全底线）。
  bridgeRestrictLoopback: z.boolean().default(false).volatile(),
  // 凭据化抓取（0.10.12）：UA/Referer 全局覆盖 + 按域 cookie，免浏览器的静态凭据车道（bcdp 浏览器链路互补）。
  advanceFetchUserAgent: z.string().default("").volatile(), // 空 = 内置默认 UA
  advanceFetchReferer: z.string().default("").volatile(), // 空 = 不发 Referer；可配防盗链图床/接口解锁
  // 逐行 `域名 cookie串`，# 注释行与空行跳过，如 `weibo.com SUB=xxx; SUBP=yyy`。
  // 仅在抓取目标匹配该域（含子域）时附带，重定向换域不外流；失效回此更新。凭据只存设置页，勿在对话中粘贴。
  advanceFetchCookieMap: z.string().default("").volatile(),
  keyStorage: z.string().default("credentials").volatile(), // key 存储位置：credentials（凭据中心）| settings（设置页）
  lang: z.string().default("zh").volatile(),
  region: z.string().volatile(),
  bingMarket: z.string().default("zh-CN").volatile(),
  safeSearch: z.string().default("off").volatile(),
  searxngInstances: z.array(z.string()).volatile(),
  // SearXNG 实例来源三态:public(公网池)| local(本地 Docker 单实例)| custom(searxngInstances 列表)。
  // 缺省时按 searxngInstances 是否非空推断(旧配置零迁移),解析见 resolveSearxngInstances。
  searxngMode: z.string().default("public").volatile(),
  searxngLocalUrl: z.string().default("http://localhost:8080").volatile(), // local 模式的本地实例地址
  // SearXNG 返回语言（0.10.3）："auto"（缺省）= query 文字检测优先、设置页语言兜底；
  // 显式值（如 zh-CN/en/ja/all）= 锁定档，不再随 query 变化
  searxngLanguage: z.string().default("auto").volatile(),
  platforms: z.array(z.string()).default(["github", "v2ex", "bilibili", "reddit", "hn", "stackoverflow", "wikipedia", "npm", "youtube", "vimeo"]).volatile(),
  anysearchApiKey: z.string().role("secret").volatile(),
  exaApiKey: z.string().role("secret").volatile(),
  tavilyApiKey: z.string().role("secret").volatile(),
  keenableApiKey: z.string().role("secret").volatile(),
  firecrawlApiKey: z.string().role("secret").volatile(),
  parallelApiKey: z.string().role("secret").volatile(),
  perplexityApiKey: z.string().role("secret").volatile(),
  serpbaseApiKey: z.string().role("secret").volatile(),
  serplyApiKey: z.string().role("secret").volatile(),
  deepseekApiKey: z.string().role("secret").volatile(),
  // deepseek-tools 端点可配（0.15.0，热生效）：自建网关场景；完整 URL 或 base 都吃，空=官方默认，解析见 resolveDeepSeekToolsEndpoint
  deepseekToolsBaseUrl: z.string().default("").volatile(),
  youcomApiKey: z.string().role("secret").volatile(),
  baiduApiKey: z.string().role("secret").volatile(),
  kimiApiKey: z.string().role("secret").volatile(),
  aliyunApiKey: z.string().role("secret").volatile(),
  doubaoApiKey: z.string().role("secret").volatile(),
  zhihuApiKey: z.string().role("secret").volatile(),
  // 国产 REST 搜索：智谱（zhipuEngine 选档，留空默认 search_pro）/ 博查 / 秘塔（metasoScope 选范围，留空默认 webpage）
  zhipuApiKey: z.string().role("secret").volatile(),
  zhipuEngine: z.string().volatile(),
  bochaApiKey: z.string().role("secret").volatile(),
  metasoApiKey: z.string().role("secret").volatile(),
  metasoScope: z.string().volatile(),
  // 模型内置搜索：key + 模型名 + Base URL（后两者留空用默认，便于走兼容网关）
  openaiApiKey: z.string().role("secret").volatile(),
  geminiApiKey: z.string().role("secret").volatile(),
  claudeApiKey: z.string().role("secret").volatile(),
  openaiModel: z.string().volatile(),
  openaiBaseUrl: z.string().volatile(),
  geminiModel: z.string().volatile(),
  geminiBaseUrl: z.string().volatile(),
  claudeModel: z.string().volatile(),
  claudeBaseUrl: z.string().volatile(),
  grokApiKey: z.string().role("secret").volatile(),
  grokModel: z.string().volatile(),
  grokBaseUrl: z.string().volatile(),
  // 旧版 settings.yaml `free-search:` 段的一次性迁移标记（见 readLegacyFreeSearchSection）
  legacyYamlMigrated: z.boolean().default(false).volatile(),
});

// ── 旧版 settings.yaml `free-search:` 段的迁移 ─────────────────────────────────
// DSH 核心的 importLegacyDocument 只为 ui-developer-tools / ui-onboarding / shell
// 三个段提供了映射；`union-search:` 段无法自动导入，值只会留在启动时被改名的
// settings.yaml.imported 里。这里解析该段，并在首次启动时补种进本条目 config，
// 用 Config.legacyYamlMigrated 去重（只写一次）。
export const LEGACY_MIGRATABLE_KEYS = [
  "provider",
  "disabledEngines",
  "fallbackOrder",
  "fallbackOn",
  "cache",
  "cacheTtl",
  "keyStorage",
  "lang",
  "region",
  "bingMarket",
  "safeSearch",
  "searxngInstances",
  "platforms",
  "anysearchApiKey",
  "exaApiKey",
  "tavilyApiKey",
  "keenableApiKey",
  "firecrawlApiKey",
  "parallelApiKey",
  "perplexityApiKey",
  "serpbaseApiKey",
  "serplyApiKey",
  "deepseekApiKey",
  "youcomApiKey",
  "baiduApiKey",
  "kimiApiKey",
  "aliyunApiKey",
  "doubaoApiKey",
  "openaiApiKey",
  "geminiApiKey",
  "claudeApiKey",
  "openaiModel",
  "openaiBaseUrl",
  "geminiModel",
  "geminiBaseUrl",
  "claudeModel",
  "claudeBaseUrl",
];

export function dshHomeDir() {
  return process.env.DSH_HOME ?? path.join(os.homedir(), ".dsh");
}

/** 解析 YAML 标量：引号字符串、布尔、null、数字、内联数组；其余按原样字符串。 */
export function parseLegacyScalar(raw) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null" || raw === "~") return null;
  const quoted = raw.match(/^(['"])([\s\S]*)\1$/);
  if (quoted) return quoted[2];
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (/^-?\d+\.\d+$/.test(raw)) return Number(raw);
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return raw
      .slice(1, -1)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => parseLegacyScalar(part))
      .filter((value) => value !== null);
  }
  return raw;
}

/** 从 settings.yaml 文本里抽出顶层 `union-search:` 段的扁平键值（忽略嵌套块/块状列表）。 */
export function parseLegacyFreeSearchSection(text) {
  const lines = String(text).split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^free-search:\s*(#.*)?$/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;
  const section = {};
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;
    if (/^\S/.test(line)) break; // 下一个顶层键
    const kv = line.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const value = kv[2].replace(/\s+#.*$/, "").trim();
    if (value === "") continue; // 嵌套块（map / 块状列表）：跳过，保留人工处理
    section[kv[1]] = parseLegacyScalar(value);
  }
  return section;
}

/** 依次尝试 settings.yaml.imported（导入后的遗留段）与 settings.yaml。 */
export function readLegacyFreeSearchSection() {
  const home = dshHomeDir();
  for (const name of ["settings.yaml.imported", "settings.yaml"]) {
    try {
      const text = fs.readFileSync(path.join(home, name), "utf8");
      const section = parseLegacyFreeSearchSection(text);
      if (section !== null && Object.keys(section).length > 0) return { file: name, section };
    } catch {}
  }
  return null;
}

// Unwrap the live `Volatile<T>` references the Loader passes for `.volatile()`
// fields into a plain object, once per read.
export function resolveConfig(config): any {
  if (config === null || typeof config !== "object") return {};
  const out: any = {};
  for (const [key, value] of Object.entries(config)) {
    out[key] = value !== null && typeof value === "object" && typeof (value as any).get === "function" ? (value as any).get() : value;
  }
  return out;
}

// 模型面手册语料：只覆盖本插件的 advanced_search 与 advance_fetch 两个工具。
// platform_search / video_search / multi_search 不在本手册范围内（其差异见 README）。
// engines 题在调用时读当前设置生成，不另立第二份真相。
