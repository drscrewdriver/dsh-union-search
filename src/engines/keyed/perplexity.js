// Perplexity 引擎（rc.5 逐字搬移）
// AUTO-EXTRACT rc.5：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import { uniqueSources } from "../common";

export async function searchPerplexity(query, maxResults, apiKey, signal) {
  if (!apiKey) throw new Error("Perplexity search requires PERPLEXITY_API_KEY");
  // 内置 20s 超时（与外部 signal 组合）：调用方不传 signal 时也不会永久卡住
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    redirect: "error",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      max_tokens: 1024,
      messages: [{ role: "user", content: query }],
    }),
    signal: AbortSignal.any([...(signal !== undefined ? [signal] : []), AbortSignal.timeout(20000)]),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 401) {
      throw new Error("Perplexity API key is invalid (HTTP 401) - update it in Settings > Plugins > Union Search");
    }
    throw new Error(`Perplexity API error (HTTP ${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content ?? "";
  const citations = data.citations ?? [];
  const sources = citations.map((url) => ({ url, ...(answer ? { snippet: answer.slice(0, 200) } : {}) }));
  return {
    content: answer,
    sources: uniqueSources(sources, maxResults ?? 10),
    truncated: false,
  };
}

