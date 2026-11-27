# Changelog

## 0.15.0 (2026-11-27)

- **新引擎 `deepseek-tools`**：直连 `POST /v1/tools/search`，无模型参与；同 query 实测 ~0.3s，
  对比 `deepseek-official`（走 /anthropic/v1/messages 模型轮次）约 5-6s，快 ~20×。
  复用现有 `deepseekApiKey` / `DEEPSEEK_API_KEY`，不新增凭据；默认加入回退链且排在
  `deepseek-official` 之前。协议层照 `searchKimi` 骨架（AbortController + 35s 内置超时 +
  组合外部 signal + `redirect:"error"`）；错误分类三档（401/403 key 无效 / 非 2xx 带 status+detail /
  网络异常包装）；`max_results` 钳制 1-20。
- **透传 `rerank_score`→`score`、`authority`→`authority`**：服务端已算好，缺失时不写入该键（不造假值）；
  `summary` 与 `snippet` 两字段名都兼容；multi 合并结果同样保留分数字段。
- **端点可配 `deepseekToolsBaseUrl`**（volatile 热生效）：自建网关场景；完整端点 URL 与 base 两种填法
  都吃（后缀嗅探），空/非法回落官方默认端点；设置页 API Key 抽屉新增输入框（zh/en 双语）。
- **multi 模式同计费上游去重（处理上游 #167）**：`deepseek-tools` 与 `deepseek-official` 归为同一
  计费族，同时点名只发先点名的一路，被跳过项列在结果 note 的 `dedupedSameBilling`；README zh/en 同步。
- 新增 `test/deepseek-tools.test.mjs` 12 用例（已加进 `test` 脚本）；全量 147/147 pass（基线 135）。
- `deepseek-official` / `kimi` 行为零变化；`blockSystemSearch` 仍只剔除出厂两 id，不误伤 `deepseek-tools`。

## 0.14.0 (2026-11-27)

- **设置页按种类抽屉化**（主题线 `0.14.0-rc.1`/`rc.2`）：设置页重组为 7 个可折叠 Section 抽屉，
  开合态以 localStorage 持久，刷新后保持上次的展开/折叠状态。
- **rc.2 修正分组映射漏项**：缓存时长块归入「搜索行为」抽屉。
- 纯设置面（client）改动，引擎与协议层行为零变化；全量测试保持绿。

## 0.13.0 (2026-11-26)

- **fetch provider 浏览器升级档**（主题线 `0.13.0-rc.1`/`rc.2`，跨仓配套 dsh-browser-cdp 1.15.0）：
  - provider 直连结果命中登录墙（HTTP 401/403）/反爬挑战/JS 空壳页特征时，经 cordis 服务总线
    `ctx.get("browser-fetch")` 调 browser-cdp 新服务在已登录 agent 浏览器开后台 tab 重抓渲染 DOM，
    再过同一套抽取/优化器链出 kind:text 成品，尾部附「fetched via user browser (session cookies
    included)」声明；browser-cdp 不在位/服务错误/allowlist 未命中一律静默降级直连形态，不重试。
  - 新配置（均 volatile 热生效）：`browserFetchTier` 默认 **false**（带 cookie 访问注入驱动 URL 是
    身份泄漏面，永不默认开）；`browserFetchAllowHosts` 逗号分隔域名后缀白名单（含子域，空=不限）。
  - 新判据纯函数 `hostInAllowlist` / `browserUpgradeNeeded`（导出+单测）；关闭态与 0.12.0 行为完全一致。
  - 设置面双语开关行 + 白名单输入框（输入框随总开关禁用）；README zh/en 浏览器升级档分节。
  - 新增 `test/browser-tier.test.mjs` 6 用例；全量 135/135 pass。装机双开联调（cdp 1.15.0 + 本 0.13.0）
    留待 profile 验证轮。

## 0.12.0 (2026-11-26)

- **fetch provider 注册（直连档）**（主题线 `0.12.0-rc.1`/`rc.2`，格式优化器依定案留在本仓出口）：
  - rc.1：`ctx.web.registerFetchProvider` 注册 provider id `union-search`，内部复用 advanceFetch
    全栈（SSRF 门→ALPN 直连→charset→宿主同款优化器），返回 `kind:'text'` 成品 markdown—
    —抢在宿主「先 2e5 截断再 HTML→MD」之前完成转换，结构性免疫上游 #161 的坑；advanceFetch
    结果新增 `statusCode` 透传（重定向终点态）；旧宿主无此缝时能力探测跳过不崩。
  - rc.2：新增 `fetchTakeover` 配置（默认关，热生效）：开 → 钉 `web.fetchProvider: union-search`；
    仅 blockSystemSearch → 钳 http（原语义）；关且残留 union-search 钉选 → 回落 http。用户显式
    选的第三方 fetch provider 永不越权覆盖；`available()` 受开关控制，关闭态完全不参与宿主选择
    （不引入 AMBIGUOUS，零行为变化）。设置面双语开关行；bin/restore.js 无条件清
    `fetchProvider: union-search` 悬空残留（第三方值仍只在 --include-fetch 动）。
  - README（zh/en）web_fetch 分节新增 fetch 接管说明与配置示例行；
    `providerTextFrom` 提为导函数，新增 `test/fetch-provider.test.mjs` 4 用例 + restore 新用例，
    全量 129/129 pass。装机冒烟（开开关后宿主日志 pinned … fetchProvider=union-search）留待 profile 验证。

## 0.11.6 (2026-11-26)

- **接管悬空引用随包自愈**（平行移植上游 #159 / 767b5a4 概念，主题线 `0.11.6-rc.1`）：
  新增 `bin/restore.js`（零依赖单文件，卸载/停用后仍可从任意位置 node 直跑）：扫描
  `profiles/*/cordis.patch.yml`，逐行状态机定位 `- id: web` 条目 config 块，只删本插件钉选的
  `searchProvider: ddg` 行（含引号/尾注释形态）；`fetchProvider` 指向宿主内建档默认保留，
  仅 `--include-fetch` 时一并清；`--dry` 默认、`--apply` 落盘，CRLF/LF 行尾风格保持。
  非 web 条目、同条目其他字段、宿主出厂值/第三方 provider 零误伤（用例覆盖）。
- `package.json`：`files` 追加 `bin/restore.js`，新增 `bin` 映射 `dsh-union-search-restore`；
  takeover 代码注释与 README（zh/en）的「手动删字段」指引改指 restore 命令。
- 发布通道：本仓 release.yml 已加 rc 感知（-rc 版本 CI 自动 `--tag rc` + `--prerelease` Release，
  不动 latest/线标签），`v0.11.6-rc.1` 经此通道发布。
- 新增 `test/restore.test.mjs` 5 用例组，全量 124/124 pass。
- 至此平行 bug 修补批（0.11.2~0.11.6）全部闭合：出口卫生 / 相关性守卫 / 升级核实 / ALPN 通道 / 悬空自愈。

## 0.11.5 (2026-11-26)

- **ALPN http/1.1 抓取通道**（平行移植上游 #162 / ec6c1bd，主题线 `0.11.5-rc.1`）：
  部分站点/中间盒会 RST 不带 ALPN 扩展的 TLS 握手（浏览器能开、插件报 socket hang up），
  而 undici fetch 无法声明 ALPNProtocols。新增自建 fetch-like 基元（node:https +
  ALPN ["http/1.1"] + keepAlive）：零新依赖，解压 gzip/deflate(含 raw)/br，字符解码复用
  decodeResponseBody（GBK 老站矩阵不回退）；不自动跟重定向。
  - `fetchHtml`（bing/ddg  scraping 主路）与 `fetchVideoHtml` 切基元，重定向由 httpsFetchText
    内部跟 ≤5 跳；超时/abort 透传/反爬 202 判定三条既有行为不变。
  - `advanceFetch` 环内换 httpsLikeFetch（不跟 redirect），逐跳 SSRF 复检与 cookie 域匹配语义原样保留。
  - `mcp_adapter.httpsPost` 补 ALPN agent（知乎/Exa MCP 端点同治）。
  - 付费引擎 REST 端点（api.exa.ai 等 42 处）不动：正常 API 域名无此握手问题，最小变更。
  - 新增 `test/alpn.test.mjs` 6 用例（agent 配置/gzip/raw-deflate/重定向链+限跳/非 2xx 透传/abort），
    全量 119/119 pass；真机 ALPN 握手差异靠 t12 冒烟覆盖。

## 0.11.4 (2026-11-26)

- **一键升级不再盲信 pnpm 的 exit code**（平行移植上游 #163 / 0b2084e，主题线 `0.11.4-rc.1`）：
  `updatePlugin()` 成功后新增 `verifyInstalledVersion(profileDir)` 核实——读 profile 实装的
  `node_modules/dsh-union-search/package.json`（含 Windows BOM 剥除）与 npm latest 比对：
  - 一致 → 成功文案改为报具体版本号（`upgraded to v<installed>`，不再悬空 "latest"）；
  - 不一致 → `upgrade-stale`，报「请求 vX、实装 vY」并提示 minimumReleaseAge 冷却/读侧滞后成因；
  - 读不到 → `upgrade-unknown`，不再虚报成功。pnpm 11 默认冷却期静默装回旧版、界面仍提示
    「升级完成」的形态就此关闭；两个新 code 经既有错误行样式透传 message，客户端零改动。
  - 新增 `test/upgrade.test.mjs` 3 用例组（正常/BOM/四种坏态），全量 113/113 pass。

## 0.11.3 (2026-11-26)

- **相关性守卫升级**（平行移植上游 5001357 + d019d04 终版判据，主题线 `0.11.3-rc.1`/`rc.2`）：
  - `queryOverlapTokens`：中文单字不再入判据（年/月/日/系/统几乎出现在任何页面，#112 教训），只留二元组。
  - `looksRelevant` 从「任一 token 重叠即放行」升级为三条件：命中源数 ≥1/3、token 重叠度（≥2 个或 ≥50%）、
    存在标题强命中（中文二元组或 ≥4 位 ASCII 词；正文满屏热词但标题不答问的缓存页/导航页就是靠这条拉灭，
    #132 补强）；纯符号/单字查询仍放行不误杀。
  - 覆盖面从仅 bing 扩到 ddg-html / ddg-lite / searxng 出口（新 `guardRelevance` 统一包装：无关批次洗成
    空结果交回退链，并清掉 content 聚合文案残留；searxng 双发/单发四 return 点经 Raw 包裹一次收口）。
    视频类抽取引擎不接（目标就是拉列表，不适用词面判据）。
  - 新增 `test/relevance.test.mjs` 9 用例（bigram 规则/强命中/标题零命中缓存页/符号放行/短 ASCII 后缀/
    源数占比/纯数字/洗空带 content/透传），全量 110/110 pass。

## 0.11.2 (2026-11-26)

- **出口卫生：截断与实体解码的畸形码点防护**（平行移植上游 dsh-free-search #108 系列教训，主题线 `0.11.2-rc.1` 一并落地）：
  - 新增 `cutSafe(text, limit)` 码点安全截断基元（代理对跨界回退到高代理前），接入 `cleanSnippet`（300 上限）与
    `extractBySelector` fields 值（500 上限）；`smartTruncate` 的自建判则收敛到同一基元，行为不变。
  - `decodeEntities` 数字实体分支：`String.fromCharCode` → 范围校验 + `String.fromCodePoint`。此前 `&#128512;` 这类
    星平面实体直接产出孤立代理对（两个半代理拼错字符），越界（>0x10FFFF）、孤立代理区（D800-DFFF）与 `&#0;`
    统一丢空，不再污染会话文本（孤立代理一旦入会话历史，后续请求序列化即不可恢复失败）。纯检测截断（反爬页
    扫描等）保留原生 slice，不影响判定。
  - 新增 `test/egress.test.mjs` 9 用例（跨界/透传/噪声剔除锚点/实体解码四态/解码×截断组合），全量 101/101 pass。
  - 本仓无构建步骤，`lib/index.js` 即源；`cutSafe`/`cleanSnippet`/`decodeEntities` 进 exports 供测试消费。

## 0.11.1 (2026-11-25)

- feat(guide): 「重新查看引导」入口从 footer（卡片末尾）移到设置面最上方、贴士之前，并改为恒定渲染（原为收起后才出现）——与其余八个接了统一引导的插件同形态。跳过标记、十语外壳与三步正文逐字未动（`dsh.guide.union-search.skipped`）。本仓无构建步骤，`lib/client.js` 即源。

## 0.11.0 (2026-11-24)

- feat(guide): 首次使用引导（3 步）——web 设置 UI 顶部三步教学：免费引擎与付费 key 的关系、auto 智能路由与「全局回退优先级」（失败-aware 回退链）、`multi_search` 多源交叉核对。卡片底部恒定「重新查看引导」入口。
- feat(guide): 引导外壳自带十语（zh·en·ja·ko·fr·de·it·ru·es·pt），认不出的语言落 en；步骤正文 zh/en，其余语种回退 en 不留空白。Skip 恒在每一步；Skip 与「开始使用」都写 `dsh.guide.union-search.skipped`。卡片自带 zh/EN 开关时引导跟随该开关，`<html lang>` 只作 fallback。
- 为什么内联而不是共享副本：本仓**没有 src/、没有构建步骤**，`lib/client.js` 就是手维护的源（`window.__ModuleLoader__.load` 工厂）。引导按该文件既有 var/function + 中文注释风格内联在 `//#region guide` 区块；与真源的差异仅在无 TS 类型、无 GUIDE_LOCALES 导出、CSS 用固定色值 + dark media query。
- 该文件行尾归位 LF（HEAD 本是 LF），本次 diff 为纯增量、无既有行被改。
- 全量：92 tests / 92 pass。

## 0.10.25

- **适配 DSH 0.2.2-rc.5 的搜索缝语义变更**：宿主删除了 `- id: web` 里写死的
  `searchProvider: deepseek-search-api`，改为"未配置就按模型请求的路由自选"
  （`deepseek-official` / `deepseek-account` 路由 → `deepseek-official`，其余 → `deepseek-search-api`）。
  接管判据本身不受影响（未设置仍走接管分支，两个出厂 id 仍在白名单），但**失败形态变了**：
  钉选没落地时不再抛 `WEB_PROVIDER_AMBIGUOUS`，而是静默走官方通道。
  据此改写 `settings service not ready` / `could not pin` 两条告警的话术，给出 rc.5
  时代的自证信号（日志里出现 `pinned web entry config searchProvider=ddg` 才算成功），
  并更新 `SHIPPED_SEARCH_PROVIDER_IDS` 上方关于"出厂默认"的注释与 README（zh/en）说明。
- **修 `blockSystemSearch` 承诺的 fetch 钳制**：文档与代码注释一直说开启后会把
  `web.fetchProvider` 钉回免费的 `http`，但实现里从未下发该 op（只出现在 YAML 建议串中）。
  现在开启且 `fetchProvider` 未设置或仍是出厂按次档 `deepseek-fetch-api` 时，随
  `searchProvider` 一起 `settings.mutate`；显式指定的第三方 fetch provider 不动。
- **peer 精确枚举补到 0.2.2-rc.5**：`peerDependencies` 的逐 rc 白名单从 `0.2.2-rc.1`
  延长到 `rc.2 || rc.3 || rc.4 || rc.5`（npm 实查四格俱在版），同步 `pnpm-lock.yaml`
  的 specifier；`dsh.compatibility.dshReleases` 同步登记四格。

## 0.10.24

- 终端面（dsh-tui / Desktop 命令面板同源）：/ws 终端面（engines/priority/on/off，默认 dry）。
