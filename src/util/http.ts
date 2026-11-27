// ALPN 抓取通道（0.11.5，上游 #162 / ec6c1bd 教训；0.17.0-rc.3 自 index.js 原样搬移）。
// 部分站点/中间盒会 RST 不带 ALPN 扩展的 TLS 握手，undici fetch 无法声明 ALPNProtocols，
// 只能表现为 "socket hang up"；浏览器能开这些站。
// 这里用 node:https + ALPN ["http/1.1"] 自建 fetch-like 基元：不跟重定向（advanceFetch 自带
// 逐跳 SSRF 复检环）；解压 gzip/deflate/br；字符解码复用 decodeResponseBody（GBK 老站矩阵）。

import https from "node:https";
import http from "node:http";
import zlib from "node:zlib";

/** fetch-like 的最小响应面（httpsLikeFetch 产出，非完整 Response）。 */
export interface AlpnFetchResponse {
  status: number;
  ok: boolean;
  headers: { get: (k: string) => string | null };
  arrayBuffer: () => Promise<Buffer>;
  url: string;
}

export const alpnHttpsAgent = new https.Agent({ ALPNProtocols: ["http/1.1"], keepAlive: true });
const alpnHttpAgent = new http.Agent({ keepAlive: true });

export function httpsLikeFetch(
  target: string | URL,
  { headers = {}, signal, timeoutMs = 12000 }: { headers?: Record<string, string>; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<AlpnFetchResponse> {
  return new Promise((resolve, reject) => {
    const urlObj = target instanceof URL ? target : new URL(String(target));
    const transport = urlObj.protocol === "http:" ? http : https;
    const agent = urlObj.protocol === "http:" ? alpnHttpAgent : alpnHttpsAgent;
    const onAbort = () => req.destroy(new Error("aborted"));
    const req = transport.request(urlObj, {
      method: "GET",
      agent,
      headers: { "accept-encoding": "gzip, deflate, br", ...headers },
      timeout: timeoutMs,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        signal?.removeEventListener("abort", onAbort);
        let body = Buffer.concat(chunks);
        const enc = String(res.headers["content-encoding"] ?? "").toLowerCase();
        try {
          if (enc.includes("gzip")) body = zlib.gunzipSync(body);
          else if (enc.includes("br")) body = zlib.brotliDecompressSync(body);
          else if (enc.includes("deflate")) {
            try { body = zlib.inflateSync(body); } catch { body = zlib.inflateRawSync(body); }
          }
        } catch { /* 解压失败保留原字节，交给解码层兜底（与旧行为一致） */ }
        const headersMap = new Map<string, string>();
        for (const [k, v] of Object.entries(res.headers)) headersMap.set(k, Array.isArray(v) ? v.join(", ") : String(v));
        const status = res.statusCode ?? 0;
        resolve({
          status,
          ok: status >= 200 && status < 300,
          headers: { get: (k: string) => headersMap.get(String(k).toLowerCase()) ?? null },
          arrayBuffer: async () => body,
          url: (res as { responseUrl?: string }).responseUrl ?? urlObj.toString(),
        });
      });
      res.on("aborted", () => reject(new Error("socket hang up (response aborted)")));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`timed out after ${timeoutMs}ms`)));
    signal?.addEventListener("abort", onAbort, { once: true });
    req.on("error", (error: Error) => {
      signal?.removeEventListener("abort", onAbort);
      reject(error);
    });
    req.end();
  });
}

// 跟随机重定向（≤5 跳，浏览器语义 GET 延续）+ 文本解码；fetchHtml / fetchVideoHtml 共用。
export async function httpsFetchText(
  url: string | URL,
  { headers = {}, signal, timeoutMs = 12000 }: { headers?: Record<string, string>; signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<{ status: number; ok: boolean; text: string }> {
  let current = url instanceof URL ? url : new URL(String(url));
  let res: AlpnFetchResponse;
  for (let hops = 0; ; hops++) {
    res = await httpsLikeFetch(current, { headers, signal, timeoutMs });
    if (![301, 302, 303, 307, 308].includes(res.status)) break;
    const location = res.headers.get("location");
    if (!location) break;
    if (hops >= 5) throw new Error("too many redirects (max 5 hops)");
    current = new URL(location, current);
  }
  const text = decodeResponseBody(await res.arrayBuffer(), res.headers.get("content-type"));
  return { status: res.status, ok: res.ok, text };
}

// 0.10.11 响应解码：Content-Type charset → BOM → 前 2KB <meta charset> 扫描 → utf-8 兜底。
// 修 GBK/GB2312 老站乱码（response.text() 固定 UTF-8，实测 mojibake）。gb2312/gbk 映射 gb18030
// （超集，向后兼容）；TextDecoder 不认识的 label（如 small-icu 构建）catch 落回 utf-8，退化为旧行为。
export function decodeResponseBody(buffer: ArrayBufferView | ArrayBuffer, contentTypeHeader?: string | null): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  let charset = /charset\s*=\s*"?([\w-]+)/i.exec(String(contentTypeHeader ?? ""))?.[1];
  if (!charset && bytes.length >= 3) {
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) charset = "utf-8";
    else if (bytes[0] === 0xff && bytes[1] === 0xfe) charset = "utf-16le";
    else if (bytes[0] === 0xfe && bytes[1] === 0xff) charset = "utf-16be";
  }
  if (!charset) {
    const head = Buffer.from(bytes.buffer, bytes.byteOffset, Math.min(bytes.byteLength, 2048)).toString("latin1");
    charset = /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i.exec(head)?.[1];
  }
  const raw = String(charset ?? "").trim().toLowerCase();
  const label = ["gb2312", "gbk", "gb18030", "csgb2312", "gb13000"].includes(raw) ? "gb18030" : raw || "utf-8";
  try {
    return new TextDecoder(label, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  }
}

// 浏览器升级档判据（0.13.0，导出供测试）：
// hostInAllowlist：逗号分隔后缀表；空表=全放行（总开关在调用方）；匹配 host 全名或 .后缀。
export function hostInAllowlist(hostname: string, allowCsv: string): boolean {
  const list = String(allowCsv ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return true;
  const h = String(hostname ?? "").toLowerCase();
  return list.some((d) => h === d || h.endsWith(`.${d}`));
}
