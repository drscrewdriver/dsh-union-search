import https from "node:https";
import http from "node:http";

// src/mcp_adapter.ts
const ALPN_HTTPS_AGENT = new https.Agent({
	ALPNProtocols: ["http/1.1"],
	keepAlive: true
});
const PLAIN_HTTP_AGENT = new http.Agent({ keepAlive: true });
function agentFor(endpoint) {
	try {
		return new URL(endpoint).protocol === "http:" ? PLAIN_HTTP_AGENT : ALPN_HTTPS_AGENT;
	} catch {
		return ALPN_HTTPS_AGENT;
	}
}
/**
* 解析 MCP 响应体：先按纯 JSON 解析，失败再按 SSE 帧提取。
* SSE 帧：多个 `data:` 行（同一事件内按规范以 \n 拼接）；这里同时兼容
* “每行独立一个完整 JSON-RPC envelope”的服务端实现——两种都取能解析出的 envelope，
* 优先带 result/error 字段的那条，否则取最后一条可解析的。
*/
function parseMcpResponseText(rawText) {
	if (typeof rawText !== "string" || rawText.length === 0) return null;
	const direct = tryJson(rawText);
	if (direct) return direct;
	const events = rawText.split(/\r?\n\r?\n/);
	const payloads = [];
	for (const event of events) {
		const dataLines = [];
		for (const line of event.split(/\r?\n/)) if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
		if (dataLines.length > 0) payloads.push(dataLines.join("\n"));
	}
	if (payloads.length === 0) {
		for (const line of rawText.split(/\r?\n/)) if (line.startsWith("data:")) payloads.push(line.slice(5).replace(/^ /, ""));
	}
	let fallback = null;
	for (const payload of payloads) {
		const parsed = tryJson(payload);
		if (!parsed || typeof parsed !== "object") continue;
		if (parsed.result !== void 0 || parsed.error !== void 0) return parsed;
		fallback = fallback ?? parsed;
	}
	return fallback;
}
function tryJson(text) {
	try {
		const parsed = JSON.parse(text);
		return parsed && typeof parsed === "object" ? parsed : null;
	} catch {
		return null;
	}
}
/**
* 发送一次 JSON-RPC 2.0 请求并返回 envelope.result（工具调用的 CallToolResult）。
* 任何失败路径都以 Error 抛出（消息见文件头分类约定），不返回部分结果。
*
* @param endpoint MCP HTTP 端点（如 https://developer.zhihu.com/api/mcp/v1）
* @param headers 额外请求头（Authorization / 自定义 UA 等；Content-Type/Accept 内置可覆盖）
* @param method JSON-RPC 方法（"tools/call" / "initialize" / …）
*/
async function mcpCall(endpoint, headers = {}, method, params, options = {}) {
	const { timeoutMs = 3e4, signal, id = 1 } = options;
	const label = options.label ?? safeHost(endpoint);
	const rawText = await httpsPost(endpoint, JSON.stringify({
		jsonrpc: "2.0",
		id,
		method,
		...params !== void 0 ? { params } : {}
	}), {
		"content-type": "application/json",
		accept: "application/json, text/event-stream",
		...headers
	}, {
		timeoutMs,
		signal,
		label
	});
	const envelope = parseMcpResponseText(rawText);
	if (!envelope) throw new Error(`${label} MCP response is not valid JSON or SSE (parse failed): ${rawText.slice(0, 200)}`);
	if (envelope.error) {
		const { code, message } = envelope.error;
		throw new Error(`${label} MCP error ${code ?? "?"}: ${message ?? JSON.stringify(envelope.error)}`);
	}
	const result = envelope.result;
	if (result === null || result === void 0 || typeof result !== "object" || Array.isArray(result)) throw new Error(`${label} MCP result missing or malformed: ${JSON.stringify(envelope).slice(0, 200)}`);
	const callResult = result;
	if (method === "tools/call" && callResult.isError) {
		const errText = mcpContentText(callResult);
		throw new Error(`${label} MCP tool error (isError): ${errText.slice(0, 200) || JSON.stringify(callResult).slice(0, 200)}`);
	}
	return callResult;
}
/** 从 CallToolResult.content 里取第一条 text 类型的文本（无则返回空串）。 */
function mcpContentText(result) {
	if (!result || !Array.isArray(result.content)) return "";
	const item = result.content.find((c) => c && c.type === "text" && typeof c.text === "string");
	return item ? item.text : "";
}
function safeHost(endpoint) {
	try {
		return new URL(endpoint).hostname;
	} catch {
		return "MCP";
	}
}
function transportFor(endpoint) {
	try {
		return new URL(endpoint).protocol === "http:" ? http : https;
	} catch {
		return https;
	}
}
function httpsPost(endpoint, body, headers, { timeoutMs, signal, label }) {
	return new Promise((resolve, reject) => {
		let settled = false;
		let timer = null;
		const onAbort = () => {
			req.destroy(/* @__PURE__ */ new Error(`${label} MCP request aborted`));
		};
		const req = transportFor(endpoint).request(endpoint, {
			method: "POST",
			agent: agentFor(endpoint),
			headers: {
				...headers,
				"content-length": Buffer.byteLength(body)
			}
		}, (res) => {
			const chunks = [];
			res.on("data", (chunk) => chunks.push(chunk));
			res.on("end", () => {
				const status = res.statusCode ?? 0;
				const text = Buffer.concat(chunks).toString("utf8");
				if (settled) return;
				settled = true;
				cleanup();
				if (status === 401 || status === 403) {
					reject(/* @__PURE__ */ new Error(`${label} MCP authentication failed (HTTP ${status}) - check the API key`));
					return;
				}
				if (status < 200 || status >= 300) {
					reject(/* @__PURE__ */ new Error(`${label} MCP HTTP ${status}: ${text.slice(0, 200)}`));
					return;
				}
				resolve(text);
			});
		});
		const cleanup = () => {
			if (timer !== null) clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
		};
		req.on("error", (error) => {
			if (settled) return;
			settled = true;
			cleanup();
			reject(error instanceof Error && /MCP/.test(error.message ?? "") ? error : /* @__PURE__ */ new Error(`${label} MCP request failed: ${error?.message ?? String(error)}`));
		});
		if (timeoutMs > 0) timer = setTimeout(() => {
			req.destroy(/* @__PURE__ */ new Error(`${label} MCP request timed out after ${timeoutMs}ms (timeout)`));
		}, timeoutMs);
		if (signal?.aborted) {
			req.destroy(/* @__PURE__ */ new Error(`${label} MCP request aborted`));
			return;
		}
		signal?.addEventListener("abort", onAbort, { once: true });
		req.end(body);
	});
}

export { mcpCall, mcpContentText, parseMcpResponseText };