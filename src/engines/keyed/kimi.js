// Kimi/Moonshot 引擎（rc.5 逐字搬移）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources } from "../common";

export async function searchKimi(query, maxResults, apiKey, timeRange, signal) {
  if (!apiKey) throw new Error("Kimi search requires MOONSHOT_API_KEY");
  const limit = Math.min(Math.max(maxResults ?? 5, 1), 20);
  const body = {
    text_query: query,
    limit,
    timeout_seconds: 30,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  let response;
  try {
    response = await fetch("https://api.moonshot.cn/v1/tools/search", {
      method: "POST",
      redirect: "error",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "user-agent": "deepseek-harness/union-search",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(`Kimi search request failed: ${error?.message ?? String(error)}`);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Kimi API key is invalid (HTTP ${response.status}) - update it in Settings > Plugins > Union Search`);
    }
    throw new Error(`Kimi API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const sources = (data.search_results ?? [])
    .filter((r) => r.url)
    .map((r) => {
      let snippet = "";
      if (Array.isArray(r.chunks) && r.chunks.length > 0) {
        // chunks 是 [{ text }]（Basic 档位返回的正文片段），不是字符串数组
        snippet = r.chunks
          .map((c) => (typeof c === "string" ? c : c && typeof c.text === "string" ? c.text : ""))
          .filter(Boolean)
          .join(" ");
      } else if (r.snippet) {
        snippet = String(r.snippet);
      }
      return {
        url: r.url,
        ...(r.title ? { title: String(r.title) } : {}),
        ...(snippet ? { snippet: snippet.slice(0, 300) } : {}),
        ...(r.publish_date ? { publishedAt: String(r.publish_date) } : {}),
      };
    });
  return { sources: uniqueSources(sources, maxResults ?? 10), truncated: false };
}

// DeepSeek 原生搜索 API（/v1/tools/search，无模型参与，0.15.0）
// 同 key 下比 deepseek-official（走 /anthropic/v1/messages 模型轮次）快 ~20×：实测 ~0.3s vs ~5-6s。
// baseUrl 兼容两种填法（竞品踩过坑）：填完整端点 URL（路径以 /tools/search 或 /v1/search 结尾）原样用；
// 填 base（含带 /v1）自动补 /v1/tools/search；空/非法回落官方默认端点。
