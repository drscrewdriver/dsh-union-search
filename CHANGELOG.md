# Changelog

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
