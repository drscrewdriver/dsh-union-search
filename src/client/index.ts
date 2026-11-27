// AUTO-EXTRACT rc.8：lib/client.js 的 inject/apply 装配段。apply/inject 经 banner 的 module.exports 面导出。
// 原 bundle 头部注释（boot 图条目 id 必须 = package.json name）由 tsdown.config.ts banner 保留。
import * as react from "react";
import * as react_jsx_runtime from "react/jsx-runtime";
import { NS, ENGINES, bridgeDescribe, bridgeMutate, summaryText, UnionSearchCard } from "./ui";
import "./css";
// tsdown client banner 提供的 CJS shim（见 tsdown.config.ts outputOptions.intro）
declare const exports: any;

const inject = ["slots", "locale"];

function apply(ctx) {
  // 跨代护栏:每个 slot/服务注册独立 try——某条宿主线上未知的槽名或服务
  // 可能同步抛错(cordis inject 回调抛错会静默吞掉整段 apply),绝不能让
  // 一个面的失败带走其它面。失败打 console.warn(可达 start.log)。
  const safe = (tag, fn) => {
    try {
      fn();
    } catch (e) {
      console.warn("union-search: client surface '" + tag + "' failed: " + (e && e.message ? e.message : String(e)));
    }
  };
  // 挂插件页 slot：侧栏 插件 → 已安装 → union-search → 行配置页。
  // rc.1 废弃了旧版设置页的插件配置 slot，只保留 plugins.row.config；
  // key 规则见 ui-plugin-manager 的 rowConfigKey：<bundle 名>#<patch 里声明的行 id>。
  // bundle 名 = profile 的依赖键/bundles 项；0.9.27 起与包内 name 同为 scoped 名，
  // 二者必须同名，否则卡片不派发（别名安装即此坑）。
  // 配置读写走自建 bridge（/api/dsh-union-search-settings），不依赖 dsh-web-ui。
  safe("plugins.row.config", () =>
    ctx.slots.inject("plugins.row.config", () =>
      ctx.slots.register(
        {
          name: "plugins.row.config",
          key: "dsh-union-search#web-search-free",
        },
        (slotProps) =>
          slotProps && slotProps.view === "summary"
            ? summaryText()
            : react_jsx_runtime.jsx(UnionSearchCard, { page: true })
      )
    )
  );
  // 老设置页 slot(≤0.1.5)的 settings.plugin.item 卡已于 2026-10-08 撤除
  // (family-insection 第二轮):与「网页搜索」家族 tab 重复——家族 tab 是唯一
  // 设置面(TL/guard/preset-manager 同批撤各自 item 卡)。下面的 settingsScope
  // bind 保留(无 UI 副作用,rc.1+ 静默挂起)。
  // ≤0.1.5 的「插件配置」tab 只渲染「宿主服务的 namespaces ∩ settings.plugin.item 卡」
  // 的交集,派发键=namespace:须把 ns 绑进 client 侧 settingsScope,卡片才会被派发
  // (input-traffic 双代腰同款子 inject;rc.1+ 无此服务,静默挂起不阻塞)。
  safe("settingsScope", () =>
    ctx.inject(["settingsScope"], (settingsScope) => {
      settingsScope.bind({ namespace: NS });
    })
  );
        // bundle 详情页平铺(plugins.bundle.config page 面):整卡直接铺在
  // 插件页 → 该 bundle 行详情,比行配置页少一层跳转;key=pkg.name(bundle 名,0.10.15 起为裸名)。
  safe("plugins.bundle.config", () =>
    ctx.slots.inject("plugins.bundle.config", () =>
      ctx.slots.register(
        { name: "plugins.bundle.config", key: "dsh-union-search" },
        () => react_jsx_runtime.jsx(UnionSearchCard, { page: true })
      )
    )
  );
  // 家族配置页 tab(容器=dsh-thinking-levels,渲染于模型选择器):免跳转的
  // 常驻配置入口,page 模式固定展开。必须走完整 input-traffic 契约:
  // locale 注册 + bind + slot locale: NS——此前两次翻车(污染清单页/web boot
  // 失败)均因缺 locale 注入或裸字符串 label。
  safe("dsh-family.tab", () => {
    const tFamily = ctx.locale.bind(NS);
    ctx.locale.register(NS, {
      zh: { "family.title": "网页搜索" },
      en: { "family.title": "Web Search" },
    });
    ctx.slots.inject("dsh-family.tab", () =>
      ctx.slots.register(
        {
          name: "dsh-family.tab",
          id: "union-search",
          order: 60,
          label: () => tFamily("family.title"),
          locale: NS,
          inject: () => ({}),
        },
        () => react_jsx_runtime.jsx(UnionSearchCard, { page: true })
      )
    );
  });
  // /union-search-engine 弹出式命令：输入 "/" 选中后弹出引擎列表，点选即切换。
  // 等效于设置页切换引擎+保存；命令只改 provider 配置，搜索仍走回退链。
  // description 必须传函数：ui-commands 读回的是 contribution.description()，
  // 传字符串会抛 TypeError: contribution.description is not a function；该异常
  // 会让整份 "/" 候选列表一起失败，菜单空白、其他命令也一起点不到。
  safe("commandUi", () =>
  ctx.inject(["commandUi"], (sctx) => {
    const command = sctx.get("commandUi");
    sctx.effect(() => {
      const dispose = command.register({
        name: "union-search-engine",
        description: () => "切换搜索引擎 / Switch web search engine",
        available: () => true,
        ui: {
          kind: "popupSelect",
          options: async () => {
            const result = await bridgeDescribe();
            const view = result.ok ? result.value.namespaces.find((n) => n.ns === NS) : undefined;
            const current = view?.value?.provider ?? "bing";
            const disabled = new Set(Array.isArray(view?.value?.disabledEngines) ? view.value.disabledEngines : []);
            return ENGINES
              .filter((e) => e.id === "auto" || e.id === "multi" || !disabled.has(e.id))
              .map((e) => ({
                id: e.id,
                label: `${e.label}${e.badge === "AUTO" ? " · 智能路由" : e.badge === "MULTI" ? " · 并发合并" : e.badge === "FREE" ? " · 免费" : " · API Key"}`,
                detail: e.id === current ? (view?.value?.lang === "en" ? "current" : "当前") : undefined,
                active: e.id === current,
              }));
          },
          onSelect: async (option) => {
            await bridgeMutate({ ns: NS, ops: [{ op: "set", path: ["provider"], value: option.id }] });
          },
        },
      });
      return dispose;
    }, "union-search: /union-search-engine command");
  })
  );
}

exports.apply = apply;
exports.inject = inject;
