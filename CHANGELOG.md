# Changelog

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
