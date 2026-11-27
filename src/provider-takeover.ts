// 接管残留自动回收纯逻辑（0.16.0，上游 #159；rc.7 逐字搬移）
// AUTO-EXTRACT rc.7：正文自 src/index.js 逐字搬移，除加 export 外未改动。

// 接管残留自动回收（0.16.0，上游 #159）：本插件历史上写进 web 条配置的全部 provider id。
// "ddg" = 现行 provider.id；"web-search-free" = dsh-free-search 时代旧 id（改名前装机残留）。
// 启动自检命中名单即可安全清除（只删自己写过的值，宁可不删不可误删）。
export const OUR_LEGACY_PROVIDER_IDS = ["web-search-free"];

// pin 值五分类（纯函数，单测覆盖）：absent=未配置 / ours=本插件在用 / shipped=宿主出厂 id /
// our-legacy=本插件旧 id（可清） / foreign=外部未知 id（只能由调用方按「能否解析到已注册
// provider」再判 dangling 或第三方占用，绝不自删）
export function classifyPin(value, oursId, shippedIds, legacyIds) {
  if (value === undefined || value === null) return "absent";
  if (value === oursId) return "ours";
  if ((shippedIds ?? []).includes(value)) return "shipped";
  if ((legacyIds ?? []).includes(value)) return "our-legacy";
  return "foreign";
}

// 字段级分类汇总成接管总态（healthCheck/设置页三态）：悬空 > 外部占用 > 正常；
// 第三方已注册的 fetch 占用（kind=foreign）计入 foreign 总态；absent/shipped 归 ok。
export function computeTakeoverState(fields) {
  const kinds = Object.values(fields ?? {}).map((f: any) => (typeof f === "string" ? f : f && f.kind));
  if (kinds.includes("our-legacy") || kinds.includes("foreign-unregistered")) return "dangling";
  if (kinds.includes("foreign")) return "foreign";
  return "ok";
}

// 回滚决策核心（模块级纯逻辑，依赖全由 opts 注入，便于单测）：逐字段仅当
// getCurrent(field) === 我们写入值才生成 unset；已变更/已不存在的字段只记日志跳过。
// 有操作 → mutate（主路径）；mutate 抛错 → textCleanup（回落）；回落也抛 → failed。
// 本函数不碰任何外部状态；幂等性与快照清理由调用方管理。
export async function rollbackPinnedFields(snapshot, { getCurrent, mutate, textCleanup, log }: any = {}) {
  const logger = log ?? console;
  const ops = [];
  for (const [field, pinnedValue] of Object.entries(snapshot ?? {})) {
    const value = getCurrent ? getCurrent(field) : undefined;
    if (value === undefined || value === null) {
      logger.info(`union-search: takeover rollback skips ${field} (field already absent, idempotent)`);
      continue;
    }
    if (value !== pinnedValue) {
      logger.info(`union-search: takeover rollback keeps ${field}="${value}" (no longer our pinned "${pinnedValue}", user/third-party choice left intact)`);
      continue;
    }
    ops.push({ op: "unset", path: [field] });
  }
  if (ops.length === 0) return { status: "noop", reason: "no-matching-fields" };
  try {
    await mutate(ops);
    logger.info(`union-search: takeover rolled back via settings unset (${ops.map((o) => o.path.join(".")).join(", ")})`);
    return { status: "api", ops };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`union-search: takeover rollback via settings failed (${message}); falling back to patch text cleanup`);
    try {
      const removedCount = await textCleanup();
      logger.info(`union-search: takeover rollback via patch text removed ${removedCount} line(s); restart dsh to apply`);
      return { status: "text", removedCount };
    } catch (error2) {
      logger.warn(
        `union-search: takeover rollback text fallback failed too (${error2 instanceof Error ? error2.message : String(error2)}); ` +
          `run node bin/restore.js --apply manually to clear the dangling web pins`
      );
      return { status: "failed" };
    }
  }
}
