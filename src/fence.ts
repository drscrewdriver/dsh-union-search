// 设置桥准入内核（0.18.0）：宿主鉴权优先，回环作为可选加固。
//
// 背景：0.17.0 的 12 条设置桥路由只有一个闸门 isLoopbackRequest，反代部署下
// 「网关地址 + 公开域名」必然判否 → 12 条路由全 403（与 skill-hub #17 同形）。
// 主闸改为宿主自身的鉴权面后，回环只在用户显式开启 bridgeRestrictLoopback 时叠加。
//
// 三代宿主的准入能力互斥，且无法用版本号判断（engines.dsh 横跨两代）：
//   dsh-v0.1.0-rc.7 / 0.1.1          两代机制皆无        → "none"（强制回环，安全底线）
//   dsh-v0.1.2-rc.1 … 0.2.2-rc.5     connection.requestRejection → "rejection"
//   dsh-v0.2.3-alpha.1 …             webserver/authorize 瀑布     → "authorize"
//
// 探测手段刻意不用 try/catch 包 register：0.2.2 的 webServer.register 不校验未知字段，
// 上传 { auth: 'required' } 会被静默忽略、catch 永不触发（见 findings F2）。

export type HostAdmission = "authorize" | "rejection" | "none";

export type FenceMode =
  | "authorize"
  | "authorize+loopback"
  | "rejection"
  | "rejection+loopback"
  | "loopback";

/** 探测用的合成请求路径（只为构造合法 WebAuthRequest，不真的发请求）。 */
const PROBE_PATH = "/api/dsh-union-search-settings/describe";

/** 一次 apply 只探一次：宿主能力在进程生命周期内不变，按请求重复探测会反复跑鉴权链。 */
const admissionCache = new WeakMap<object, HostAdmission>();

/** 字面回环判定（0.17.0 逐字搬移，行为不变）：地址 + Host + Sec-Fetch-Site + Origin。 */
export function isLoopbackRequest(request) {
  const address = request.socket.remoteAddress;
  if (address !== "127.0.0.1" && address !== "::1" && address !== "::ffff:127.0.0.1") return false;
  const host = request.headers.host;
  if (typeof host !== "string") return false;
  let hostUrl;
  try {
    hostUrl = new URL("http://" + host);
  } catch {
    return false;
  }
  if (hostUrl.hostname !== "127.0.0.1" && hostUrl.hostname !== "localhost" && hostUrl.hostname !== "[::1]") return false;
  if (request.headers["sec-fetch-site"] === "cross-site") return false;
  const origin = request.headers.origin;
  if (origin === undefined) return true;
  try {
    return new URL(origin).host === hostUrl.host;
  } catch {
    return false;
  }
}

/**
 * 五态解析：开关只决定「是否额外加回环」，不决定「是否有闸」。
 * admission === "none" 时无论开关如何都是 "loopback"——宁可反代不可用，不可裸奔。
 */
export function fenceMode(admission: HostAdmission, restrictLoopback: boolean): FenceMode {
  if (admission === "authorize") return restrictLoopback ? "authorize+loopback" : "authorize";
  if (admission === "rejection") return restrictLoopback ? "rejection+loopback" : "rejection";
  return "loopback";
}

function detectHostAdmission(ctx): HostAdmission {
  // ① 0.2.3+：connection 注册了 webserver/authorize 钩子 → bail 返回非 undefined。
  try {
    if (typeof ctx?.bail === "function") {
      const probe = {
        headers: { host: "127.0.0.1" },
        method: "POST",
        url: new URL("http://127.0.0.1" + PROBE_PATH),
        transport: "http",
        socket: { destroyed: false },
      };
      // 探测会真实跑一遍 authorize 瀑布（无 cookie → {kind:'deny',status:401}）。
      // 「返回了东西」就是钩子存在的证据，deny 也算——这正是 isBailed 的判据。
      const verdict = ctx.webServer === undefined || ctx.webServer === null
        ? ctx.bail("webserver/authorize", probe, "required")
        : ctx.bail(ctx.webServer, "webserver/authorize", probe, "required");
      if (verdict !== undefined && verdict !== null) return "authorize";
    }
  } catch {}
  // ② 0.1.2-rc.1 … 0.2.2-rc.5：connection 服务提供 requestRejection。
  try {
    const connection = typeof ctx?.get === "function" ? ctx.get("connection") : undefined;
    if (connection && typeof connection.requestRejection === "function") return "rejection";
  } catch {}
  // ③ 0.1.0-rc.7 / 0.1.1：两代机制皆无。
  return "none";
}

/** 能力探测（带进程内缓存），返回本宿主走哪一代准入。 */
export function probeHostAdmission(ctx): HostAdmission {
  const key = ctx !== null && typeof ctx === "object" ? ctx : null;
  if (key !== null) {
    const hit = admissionCache.get(key);
    if (hit !== undefined) return hit;
  }
  const verdict = detectHostAdmission(ctx);
  if (key !== null) admissionCache.set(key, verdict);
  return verdict;
}

/**
 * 取 connection.requestRejection。connection 可能晚于本插件挂载（跨 bundle 顺序），
 * 所以每请求解析一次；未注入时 ctx.get 会抛，包 try（沿用 index.ts:1415 的写法）。
 */
export function getRequestRejection(ctx) {
  try {
    const connection = typeof ctx?.get === "function" ? ctx.get("connection") : undefined;
    if (connection && typeof connection.requestRejection === "function") {
      return (request) => connection.requestRejection(request);
    }
  } catch {}
  return null;
}

export interface BridgeGateOptions {
  /** 宿主准入代次（apply 期探测一次的结果）。 */
  admission: HostAdmission;
  /** 每请求读一次设置（热生效，不重注册路由）。 */
  restrictLoopback: () => boolean;
  isLoopback: (request) => boolean;
  /** 每请求解析宿主拒绝器（connection 可能晚挂载）；返回 null 表示宿主闸不在。 */
  resolveRejection: () => ((request) => number | undefined) | null;
  writeJson: (res, status: number, body) => void;
}

/**
 * 12 条路由的唯一准入：宿主闸（若有）→ 回环（按需/强制）→ 方法门。
 * fail closed：宿主拒绝器抛错按 403 处理，绝不因为异常放行。
 */
export function createBridgeGate(options: BridgeGateOptions) {
  const { admission, restrictLoopback, isLoopback, resolveRejection, writeJson } = options;
  return (req, res) => {
    let hostGated = false;
    if (admission === "rejection") {
      const reject = resolveRejection();
      if (typeof reject === "function") {
        hostGated = true;
        let verdict;
        try {
          verdict = reject(req);
        } catch {
          verdict = 403; // fail closed
        }
        if (verdict !== undefined && verdict !== null) {
          const status = typeof verdict === "number" && verdict >= 400 && verdict < 600 ? verdict : 403;
          writeJson(res, status, { error: "host admission rejected the request" });
          return false;
        }
      }
    } else if (admission === "authorize") {
      // 宿主在路由层按 auth:'required' 判（0.2.3+ 无钩子时默认 503，fail closed）。
      hostGated = true;
    }
    const loopbackRequired = !hostGated || restrictLoopback() === true;
    if (loopbackRequired && !isLoopback(req)) {
      writeJson(res, 403, { error: "loopback requests only" });
      return false;
    }
    if (req.method !== "POST") {
      writeJson(res, 405, { error: "method not allowed: " + (req.method ?? "") });
      return false;
    }
    return true;
  };
}
