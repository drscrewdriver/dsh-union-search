// 宿主 boot 图条目 id = 包内 manifest name（dsh-client-modules: graphRow(packageName)），
// 浏览器侧随后还会校验自注册 id 与之逐字相等（client/system.ts: "loaded without registering"）。
// 所以这里的 id 必须等于 package.json 的 "name"，不能写 profile 键/别名——
// 0.10.15 起包名统一为裸名 dsh-union-search（scoped 时代 0.9.27~0.10.14 结束）。
window.__ModuleLoader__.load({ id: "dsh-union-search", factory: (require) => {

var module = { exports: {} }; var exports = module.exports;
// \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (let key of __getOwnPropNames(from)) {
			if (!__hasOwnProp.call(to, key) && key !== except) {
				desc = __getOwnPropDesc(from, key);
				__defProp(to, key, {
					get: desc && desc.get && !desc.configurable ? desc.get : () => from[key],
					enumerable: !desc || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

let react_jsx_runtime = require("react/jsx-runtime");
let react = require("react");
react_jsx_runtime = __toESM(react_jsx_runtime, 1);
react = __toESM(react, 1);

// src/client/ui.ts
const BRIDGE_PREFIX = "/api/dsh-union-search-settings";
const NS = "web-search-free";
const I18N = {
	zh: {
		description: "Union Search —— 免 API key 免费引擎（Bing / DuckDuckGo / AnySearch / SearXNG / Exa / Tavily / Keenable / Firecrawl / Parallel）+ 多种专业付费搜索 API（Perplexity / DeepSeek 官方 / Kimi / 智谱 / 博查 / 秘塔 / 豆包 / You.com / OpenAI / Gemini / Claude / Grok 等）",
		unsaved: "未保存",
		searchEngine: "搜索引擎",
		visit: "访问官网 →",
		getKey: "获取 API Key →",
		engineHint: "Multi Search 会并发搜索路由/优先级前 3 个已启用引擎并合并去重；Auto 根据查询语言及时间过滤自动优选单个引擎。Bing 是稳定的免费引擎。API KEY 引擎需在下方填写凭据。",
		apiKeys: "API 密钥（可选）",
		anysearchPh: (c) => c ? "AnySearch API 密钥（已配置）" : "AnySearch API 密钥（可选，不填免费匿名，填了提额）",
		exaPh: (c) => c ? "Exa API 密钥（已配置）" : "Exa API 密钥（可选，不填也可免费使用）",
		tavilyPh: (c) => c ? "Tavily API 密钥（已配置）" : "Tavily API 密钥（可选，不填也可免费使用）",
		keenablePh: (c) => c ? "Keenable API 密钥（已配置）" : "Keenable API 密钥（可选，不填也可免费使用）",
		firecrawlPh: (c) => c ? "Firecrawl API 密钥（已配置）" : "Firecrawl API 密钥（可选，不填也可免费使用）",
		parallelPh: (c) => c ? "Parallel API 密钥（已配置）" : "Parallel API 密钥（可选，不填走 MCP 免 key）",
		perplexityPh: (c) => c ? "Perplexity API 密钥（已配置）" : "Perplexity API 密钥（pplx-...）",
		deepseekPh: (c) => c ? "DeepSeek API 密钥（已配置）" : "DeepSeek API 密钥（sk-...）",
		serpbasePh: (c) => c ? "SerpBase API 密钥（已配置）" : "SerpBase API 密钥（serpbase.dev 获取）",
		serplyPh: (c) => c ? "Serply API 密钥（已配置）" : "Serply API 密钥（serply.io 获取）",
		youcomPh: (c) => c ? "You.com API 密钥（已配置）" : "You.com API 密钥（you.com/platform/api-keys 获取）",
		baiduPh: (c) => c ? "Baidu API 密钥（已配置）" : "百度千帆 API 密钥（BAIDU_API_KEY）",
		kimiPh: (c) => c ? "Kimi API 密钥（已配置）" : "Kimi API 密钥（MOONSHOT_API_KEY）",
		aliyunPh: (c) => c ? "Aliyun API 密钥（已配置）" : "阿里云 DashScope 密钥（DASHSCOPE_API_KEY）",
		doubaoPh: (c) => c ? "豆包搜索密钥（已配置）" : "豆包搜索 / 火山联网搜索密钥（DOUBAO_SEARCH_API_KEY，每月 500 次免费）",
		openaiPh: (c) => c ? "OpenAI 密钥（已配置）" : "OpenAI 密钥（OPENAI_API_KEY，按次计费，仅显式选用）",
		geminiPh: (c) => c ? "Gemini 密钥（已配置）" : "Gemini 密钥（GEMINI_API_KEY / GOOGLE_API_KEY，按次计费，仅显式选用）",
		claudePh: (c) => c ? "Claude 密钥（已配置）" : "Anthropic 密钥（ANTHROPIC_API_KEY，按次计费，仅显式选用）",
		zhihuPh: (c) => c ? "知乎密钥（已配置）" : "知乎开放平台密钥（ZHIHU_API_KEY）",
		zhipuPh: (c) => c ? "智谱密钥（已配置）" : "智谱平台密钥（ZHIPU_API_KEY，search_pro 约 0.03 元/次）",
		bochaPh: (c) => c ? "博查密钥（已配置）" : "博查 API 密钥（BOCHA_API_KEY，约 0.036 元/次，注册送额度）",
		metasoPh: (c) => c ? "秘塔密钥（已配置）" : "秘塔 API 密钥（METASO_API_KEY，mk- 开头，约 0.03 元/query，送 5000 点）",
		grokPh: (c) => c ? "xAI 密钥（已配置）" : "xAI 密钥（XAI_API_KEY，按次计费，仅显式选用；X/Twitter 搜索）",
		keysHint: "密钥读取优先级：.credentials.yaml 凭据中心 > 这里 > 环境变量。推荐把 key 写进凭据中心（与官方 LLM 一致，一处管理）。",
		keyStorage: "Key 存储位置",
		keyStorageCred: "凭据中心（推荐）",
		keyStorageSettings: "设置页（兼容）",
		keyStorageCredHint: (c) => `保存后写入 ~/.dsh/.credentials.yaml（最高优先级）。当前已配置：${[
			"anysearch",
			"exa",
			"tavily",
			"keenable",
			"firecrawl",
			"parallel",
			"perplexity",
			"serpbase",
			"serply",
			"deepseek",
			"youcom",
			"baidu",
			"kimi",
			"aliyun",
			"doubao",
			"openai",
			"gemini",
			"claude",
			"zhihu",
			"zhipu",
			"bocha",
			"metaso",
			"grok"
		].filter((k) => c[k]).map((k) => k.toUpperCase()).join(", ") || "无"}`,
		keyStorageSettingsHint: "保存后写入当前 profile 的插件条目 config（cordis.patch.yml，优先级低于凭据中心）。",
		engineEnable: "全局启用的搜索引擎",
		engineEnableHint: "取消勾选后，该引擎会从普通 web_search 回退链、Auto 智能路由、advanced_search、multi_search 和引擎测试中全局排除。至少保留一个引擎。",
		fallbackPriority: "全局回退优先级",
		fallbackPriorityHint: "从上到下为回退顺序。首选引擎仍先尝试；Auto 保留语言/时间路由，但自定义后同一分组内及后续回退按此顺序。禁用引擎不会执行，但会保留当前位置。",
		fallbackPriorityReset: "恢复默认顺序",
		fallbackOnLabel: "回退触发条件（fallbackOn）",
		fallbackOnHint: "勾选哪些失败类别允许触发回退到下一个引擎。全部勾选＝保持现状（搜索永不直接失败）；取消某类＝遇到该类失败就停下并把该引擎的错误报出，不再换引擎。缺 key、被禁用、不支持时间过滤不算失败，始终会换引擎。",
		classQuota: "额度/预算耗尽 (quota)",
		classAuth: "鉴权失败 (auth)",
		classBotWall: "反爬拦截 (bot-wall)",
		classTransient: "超时/网络/限流 (transient)",
		classInvalidResponse: "解析失败/0 结果 (invalid-response)",
		classUnknown: "其他未知 (unknown)",
		priorityDisabled: "已禁用",
		platformSearch: "平台搜索（platform_search 工具）",
		platformHint: "为 agent 的 platform_search 工具启用平台。禁用的平台会被跳过。",
		cacheTtl: "结果缓存时长（分钟）",
		cacheTtlHint: "0 关闭缓存，最长 5 分钟。缩短可加快时效，延长可防限流、省额度。",
		blockSystemSearch: "屏蔽系统自带搜索",
		blockSystemSearchHint: "开启后强制接管 web_search，并把出厂的 deepseek-official 引擎从所有引擎链（首选/回退/Auto/multi/引擎测试）中剔除；保存即生效，无需重启。",
		fetchTakeover: "接管 web_fetch（fetch provider）",
		fetchTakeoverHint: "开启后本插件注册并钉选宿主 web_fetch 的 fetch provider（union-search）：抓取走本插件通道（ALPN 直连 + 宿主同款 Markdown 优化器，正文在插件侧完成转换，不受宿主截断影响）。关闭后自动回落免费 http 档；你显式指定的第三方 fetch provider 不会被覆盖。需宿主 ≥0.2.1-rc.2（旧宿主无此缝）。",
		browserFetchTier: "浏览器升级档（需 dsh-browser-cdp ≥1.15.0）",
		browserFetchTierHint: "⚠️ 以你的登录身份访问网页：仅在 web_fetch 命中登录墙/反爬/JS 空壳页时，改借已登录浏览器重抓（携带 cookie）。默认关；只在确实需要读取登录后内容时开启，建议配合域名白名单使用。结果会标注「经用户浏览器抓取」。",
		browserFetchAllowHosts: "升级档域名白名单",
		browserFetchAllowHostsHint: "逗号分隔域名后缀（含子域），如 linkedin.com,weibo.com；空 = 不限制（仍受上方总开关控制）。建议只钉登录墙域名，避免任意 URL 都被带 cookie 访问。",
		deepseekToolsBaseUrl: "DeepSeek Tools 端点（可选）",
		deepseekToolsBaseUrlHint: "默认直连官方 https://api.deepseek.com/v1/tools/search；自建网关可填 base（自动补 /v1/tools/search）或完整端点 URL（走 /v1/search 的网关填完整 URL）；留空 = 官方默认，保存即热生效。",
		autoRestoreOnDispose: "停用插件时自动回收接管钉选",
		autoRestoreOnDisposeHint: "开启后：停用本插件时自动清除写进 web 条目的 searchProvider/fetchProvider 钉选，启动时还会自检上次未清干净的遗留（只删本插件写过的值，外部第三方 provider 永不误删）。关闭后退回纯手动：跑 node bin/restore.js --apply。注意：卸载场景任何取值都无法自动回收（插件代码已不存在），必须手跑 restore.js。",
		takeoverOk: "接管状态：正常（未钉选 / 本插件在用 / 宿主出厂）",
		takeoverDangling: "接管状态：发现悬空残留（本插件旧钉选或无主 id）——日志里有修复命令",
		takeoverForeign: "接管状态：外部 provider 占用（非本插件写入，不会动它）",
		takeoverPinnedBy: "当前钉选",
		sec_engines: "引擎与回退链",
		sec_behavior: "搜索行为",
		sec_keys: "API Key",
		sec_platform: "平台搜索",
		sec_fetch: "网页抓取",
		sec_block: "屏蔽系统自带搜索",
		sec_update: "版本与更新",
		advanceFetchEnabled: "advance_fetch 工具",
		advanceFetchEnabledHint: "【实验性 · 免费】零 key、零按次计费（区别于按次计费的付费搜索 API）。整页 GitHub-Flavored Markdown（宿主同款转换配置）+ CSS selector/fields 定向结构化抽取。关闭后调用被拒绝（热生效），系统提示词也不再宣传该工具。",
		advanceFetchAllowPrivate: "允许 advance_fetch 访问内网",
		advanceFetchAllowPrivateHint: "SSRF 防护地址门：默认拒绝回环/私有/链路本地/云元数据地址；开启后放行（用于自建的局域网设备，如本地 SearXNG/Dashboard 页面）。协议门（仅 http/https）与重定向限次不受影响。",
		advanceFetchUserAgent: "advance_fetch 自定义 UA",
		advanceFetchUserAgentHint: "抓取请求使用的 User-Agent，空 = 内置默认。用于目标站按 UA 拦截的场景。",
		advanceFetchReferer: "advance_fetch 自定义 Referer",
		advanceFetchRefererHint: "随抓取请求发送的 Referer，空 = 不发送。可用于防盗链图床/接口解锁。",
		advanceFetchCookieMap: "advance_fetch 按域 Cookie",
		advanceFetchCookieMapHint: "逐行一条：`域名 cookie串`（# 开头为注释行），如 weibo.com SUB=xxx; SUBP=yyy。仅在抓取目标匹配该域（含子域）时附带，重定向换域不外流；cookie 失效后回此更新。凭据只存设置页，勿在对话中粘贴。",
		searxngLanguageLabel: "SearXNG 返回语言",
		searxngLanguageAuto: "自动（按 query 检测）",
		searxngLanguageHint: "默认自动：假名→ja、谚文→ko、西里尔→ru、汉字→zh-CN，判不出则用设置页语言兜底；选具体值＝锁定档，不再随 query 变化。",
		unavailable: "设置不可用 —— union-search 桥接未暴露。",
		saveFailed: "保存失败",
		saveFailedDetail: (d) => `保存失败：${d}`,
		testing: "测试中…",
		testEngine: "测试引擎",
		useBing: "恢复 Bing 默认",
		discard: "撤销",
		saving: "保存中…",
		save: "保存",
		testOk: (r) => `✓ ${r.count} 条结果（引擎: ${r.engine}）${r.content ? ` — ${r.content}` : ""}${r.sample ? ` · 例如 "${r.sample.slice(0, 40)}"` : ""}`,
		testFail: (e) => `✗ ${e}`,
		toggleLang: "EN",
		checkUpdate: "检查更新",
		checkingUpdate: "检查中…",
		updateAvailable: (c, l) => `发现新版本 v${l}（当前 v${c}）`,
		updateLatest: (c) => `已是最新版本 v${c}`,
		updateCheckFailed: "检查更新失败（无法访问 npm registry）",
		updateView: "查看 →",
		hasUpdate: "有更新",
		upgrade: "升级",
		upgrading: "升级中…",
		upgradeLinkMode: "（本地开发模式，升级请用 git pull）",
		upgradeDone: (l) => `升级到 v${l} 完成，重启 dsh 后生效`,
		upgradeFailed: (m) => `升级失败：${m}`,
		safeSearchLabel: "安全搜索过滤 (adlt)",
		safeSearchOff: "关闭 —— 引擎默认（不加参数）",
		safeSearchModerate: "中等 —— Bing 默认",
		safeSearchStrict: "严格",
		safeSearchHint: "作用于 Bing（adlt）、DuckDuckGo HTML / Lite（adlt 等级）。如遇引擎自带过滤可在此调整。",
		bingMarketLabel: "Bing 市场（本地化结果）",
		bingMarketHint: "Bing 的 mkt + Accept-Language 跟随此设置。例如 ru-RU 会让西里尔查询返回俄语结果。",
		marketZhCN: "zh-CN —— 中国大陆（默认）",
		marketZhTW: "zh-TW —— 台湾",
		marketEnUS: "en-US —— 美国",
		marketEnGB: "en-GB —— 英国",
		marketRuRU: "ru-RU —— 俄罗斯",
		marketJaJP: "ja-JP —— 日本",
		marketDeDE: "de-DE —— 德国",
		marketFrFR: "fr-FR —— 法国",
		marketEsES: "es-ES —— 西班牙",
		marketKoKR: "ko-KR —— 韩国",
		searxngInstancesLabel: "SearXNG 实例",
		searxngModePublic: "公网池（内置免费实例）",
		searxngModeLocal: "本地 Docker 节点",
		searxngModeCustom: "自定义实例列表",
		searxngModeHint: "公网池=内置实例顺序故障转移（部分地区可能全部超时）；本地 Docker=最快最稳，推荐自建；自定义列表=自己维护实例集，≥2 个端点时自动双发请求、等两份都返回后综合（双命中的条目优先）。",
		searxngLocalUrlPh: "http://localhost:8080",
		searxngCustomPh: "一行一个实例地址，例如：\nhttp://localhost:8080\nhttps://searx.be",
		searxngLocalHint: "本地起实例：docker run -d --name searxng -p 8080:8080 searxng/searxng；并在 settings.yml 的 search.formats 中加入 json，否则 JSON API 返回 403。",
		searxngProbe: "探测实例",
		searxngProbing: "探测中…",
		searxngProbeFailEmpty: "探测失败：没有可用的实例地址",
		searxngUsePrimary: "设为首选",
		searxngUsePrimaryKeptMode: "端点已设为首选；当前引擎是 auto/multi 或付费引擎，未自动切换——如需强制走该端点，请手动把搜索引擎改为 SearXNG",
		searxngCustomEmptyWarn: "自定义列表为空：当前模式下 SearXNG 不会回落公网池，搜索将直接失败——请填写端点或切换回公网池模式",
		testAllEngines: "测试全部引擎",
		testingAll: "全部测试中…",
		disableSuggestHint: "本次测试失败的引擎（勾选后点「应用禁用」；CAPTCHA/限流属暂时性故障可跳过，稍后可在上方引擎勾选区恢复）",
		applyDisable: "应用禁用"
	},
	en: {
		description: "Union Search — free keyless engines (Bing / DuckDuckGo / AnySearch / SearXNG / Exa / Tavily / Keenable / Firecrawl / Parallel) plus many professional paid search APIs (Perplexity / DeepSeek official / Kimi / Zhipu / Bocha / Metaso / Doubao / You.com / OpenAI / Gemini / Claude / Grok)",
		unsaved: "unsaved",
		searchEngine: "Search engine",
		visit: "Visit website →",
		getKey: "Get API Key →",
		engineHint: "Multi Search queries the top 3 enabled routed/prioritized engines concurrently and merges/deduplicates results. Auto smartly routes a single engine by query language and time filter. API KEY engines need credentials below.",
		apiKeys: "API keys (optional)",
		anysearchPh: (c) => c ? "AnySearch API key (configured)" : "AnySearch API key (optional, free anonymous without; key raises quota)",
		exaPh: (c) => c ? "Exa API key (configured)" : "Exa API key (optional, free without)",
		tavilyPh: (c) => c ? "Tavily API key (configured)" : "Tavily API key (optional, free without)",
		keenablePh: (c) => c ? "Keenable API key (configured)" : "Keenable API key (optional, free without)",
		firecrawlPh: (c) => c ? "Firecrawl API key (configured)" : "Firecrawl API key (optional, free without)",
		parallelPh: (c) => c ? "Parallel API key (configured)" : "Parallel API key (optional, free without)",
		perplexityPh: (c) => c ? "Perplexity API key (configured)" : "Perplexity API key (pplx-...)",
		deepseekPh: (c) => c ? "DeepSeek API key (configured)" : "DeepSeek API key (sk-...)",
		serpbasePh: (c) => c ? "SerpBase API key (configured)" : "SerpBase API key (from serpbase.dev)",
		serplyPh: (c) => c ? "Serply API key (configured)" : "Serply API key (from serply.io)",
		youcomPh: (c) => c ? "You.com API key (configured)" : "You.com API key (from you.com/platform/api-keys)",
		baiduPh: (c) => c ? "Baidu API key (configured)" : "Baidu Qianfan API key (BAIDU_API_KEY)",
		kimiPh: (c) => c ? "Kimi API key (configured)" : "Kimi API key (MOONSHOT_API_KEY)",
		aliyunPh: (c) => c ? "Aliyun API key (configured)" : "Aliyun DashScope API key (DASHSCOPE_API_KEY)",
		doubaoPh: (c) => c ? "Doubao search key (configured)" : "Doubao / Volcano Web Search key (DOUBAO_SEARCH_API_KEY, 500 free/month)",
		openaiPh: (c) => c ? "OpenAI key (configured)" : "OpenAI key (OPENAI_API_KEY, billed per search, explicit use only)",
		geminiPh: (c) => c ? "Gemini key (configured)" : "Gemini key (GEMINI_API_KEY / GOOGLE_API_KEY, billed per search, explicit use only)",
		claudePh: (c) => c ? "Claude key (configured)" : "Anthropic key (ANTHROPIC_API_KEY, billed per search, explicit use only)",
		zhihuPh: (c) => c ? "Zhihu key (configured)" : "Zhihu open-platform key (ZHIHU_API_KEY)",
		zhipuPh: (c) => c ? "Zhipu key (configured)" : "Zhipu platform key (ZHIPU_API_KEY, search_pro ~¥0.03/search)",
		bochaPh: (c) => c ? "Bocha key (configured)" : "Bocha API key (BOCHA_API_KEY, ~¥0.036/search, signup quota)",
		metasoPh: (c) => c ? "Metaso key (configured)" : "Metaso API key (METASO_API_KEY, mk-..., ~¥0.03/query, 5,000 free)",
		grokPh: (c) => c ? "xAI key (configured)" : "xAI key (XAI_API_KEY, billed per call, explicit use only; X/Twitter search)",
		keysHint: "Key resolution: .credentials.yaml credential center > here > environment variables. Recommended: store keys in the credential center (same as official LLM providers, one place for all).",
		keyStorage: "Key storage",
		keyStorageCred: "Credential center (recommended)",
		keyStorageSettings: "Settings page (legacy)",
		keyStorageCredHint: (c) => `Saved to ~/.dsh/.credentials.yaml (highest priority). Currently configured: ${[
			"anysearch",
			"exa",
			"tavily",
			"keenable",
			"firecrawl",
			"parallel",
			"perplexity",
			"serpbase",
			"serply",
			"deepseek",
			"youcom",
			"baidu",
			"kimi",
			"aliyun",
			"doubao",
			"openai",
			"gemini",
			"claude",
			"zhihu",
			"zhipu",
			"bocha",
			"metaso",
			"grok"
		].filter((k) => c[k]).map((k) => k.toUpperCase()).join(", ") || "none"}`,
		keyStorageSettingsHint: "Saved to the active profile plugin entry config (cordis.patch.yml; lower priority than the credential center).",
		engineEnable: "Globally enabled search engines",
		engineEnableHint: "Unchecked engines are excluded globally from web_search fallback, Auto routing, advanced_search, multi_search, and engine tests. At least one engine must remain enabled.",
		fallbackPriority: "Global fallback priority",
		fallbackPriorityHint: "Top to bottom is the fallback order. The preferred engine is still tried first. Auto keeps language/time routing, while customized priority orders engines within a route group and the remaining fallback chain. Disabled engines keep their position but are skipped.",
		fallbackPriorityReset: "Reset default order",
		fallbackOnLabel: "Fallback triggers (fallbackOn)",
		fallbackOnHint: "Choose which failure classes may trigger a fallback to the next engine. All checked = current behaviour (search never fails outright); unchecking one means such a failure stops the search and surfaces that engine's error instead of trying another engine. Missing keys, disabled engines and unsupported time filters are not failures and always advance.",
		classQuota: "Quota/budget exhausted (quota)",
		classAuth: "Auth failure (auth)",
		classBotWall: "Anti-bot block (bot-wall)",
		classTransient: "Timeout/network/rate limit (transient)",
		classInvalidResponse: "Parse failure / 0 results (invalid-response)",
		classUnknown: "Other unknown (unknown)",
		priorityDisabled: "disabled",
		platformSearch: "Platform search (platform_search tool)",
		platformHint: "Enable platforms for the agent's platform_search tool. Disabled platforms are skipped.",
		cacheTtl: "Result cache TTL (minutes)",
		cacheTtlHint: "0 disables caching, max 5 minutes. Lower = fresher results, higher = less rate-limiting / fewer credits used.",
		blockSystemSearch: "Block built-in system search",
		blockSystemSearchHint: "When on, web_search is force-taken-over by this plugin and the shipped deepseek-official engine is excluded from every engine chain (preferred / fallback / auto / multi / engine tests). Takes effect on save; no restart needed.",
		fetchTakeover: "Take over web_fetch (fetch provider)",
		fetchTakeoverHint: "When on, this plugin registers and pins the host's web_fetch fetch provider (union-search): retrieval runs through this plugin's stack (ALPN direct fetch + host-twin Markdown optimizer, conversion finishes plugin-side so host output caps cannot mangle it). Turning it off falls back to the free http provider; a third-party fetch provider you picked explicitly is never overridden. Requires host >= 0.2.1-rc.2 (older hosts have no fetch seam).",
		browserFetchTier: "Browser upgrade tier (needs dsh-browser-cdp >= 1.15.0)",
		browserFetchTierHint: "⚠️ Visits pages AS YOU (session cookies). When a web_fetch hits a login wall / anti-bot page / JS shell, the page is re-fetched through the logged-in agent browser instead. Off by default; enable only when you truly need post-login content, ideally with the host allowlist below. Upgraded results are labelled “fetched via user browser”.",
		browserFetchAllowHosts: "Browser-tier host allowlist",
		browserFetchAllowHostsHint: "Comma-separated domain suffixes (subdomains included), e.g. linkedin.com,weibo.com; empty = unrestricted (still gated by the master switch above). Recommended: pin only the login-walled domains so arbitrary URLs never get fetched with your cookies.",
		deepseekToolsBaseUrl: "DeepSeek Tools endpoint (optional)",
		deepseekToolsBaseUrlHint: "Defaults to the official https://api.deepseek.com/v1/tools/search; a custom gateway accepts either a base URL (…/v1/tools/search is appended) or the full endpoint URL (fill the full URL for gateways serving /v1/search); empty = official default, takes effect on save.",
		autoRestoreOnDispose: "Auto-reclaim takeover pins on plugin disable",
		autoRestoreOnDisposeHint: "When on, disabling this plugin un-pins the searchProvider/fetchProvider it wrote into the web entry, and a startup self-check repairs leftovers from unclean exits (only values this plugin wrote are touched — third-party providers are never removed). When off, clean up manually: node bin/restore.js --apply. Note: uninstall is never covered automatically by either setting (plugin code no longer exists) — restore.js must be run by hand.",
		takeoverOk: "Takeover state: OK (unpinned / owned by this plugin / shipped default)",
		takeoverDangling: "Takeover state: dangling pin detected (legacy value from this plugin or an unregistered id) — repair command in the logs",
		takeoverForeign: "Takeover state: held by an external provider (not written by this plugin, left untouched)",
		takeoverPinnedBy: "Current pins",
		sec_engines: "Engines & fallback chain",
		sec_behavior: "Search behaviour",
		sec_keys: "API keys",
		sec_platform: "Platform search",
		sec_fetch: "Web fetching",
		sec_block: "Block built-in search",
		sec_update: "Version & updates",
		advanceFetchEnabled: "advance_fetch tool",
		advanceFetchEnabledHint: "[Experimental · free] No API key and no per-request billing (unlike the metered paid search APIs). Whole-page GitHub-Flavored Markdown (host-twin conversion profile) + CSS selector/fields structured extraction. When off, calls are rejected (hot) and the system prompt stops advertising the tool.",
		advanceFetchAllowPrivate: "Allow advance_fetch to reach private networks",
		advanceFetchAllowPrivateHint: "SSRF address gate: by default loopback/private/link-local/metadata targets are refused; enable to allow them (self-hosted LAN devices such as a local SearXNG or dashboard). The protocol gate (http/https only) and the redirect cap are unaffected.",
		advanceFetchUserAgent: "advance_fetch custom User-Agent",
		advanceFetchUserAgentHint: "User-Agent sent with advance_fetch requests; empty = built-in default. Use when a target site blocks by UA.",
		advanceFetchReferer: "advance_fetch custom Referer",
		advanceFetchRefererHint: "Referer sent with advance_fetch requests; empty = not sent. Can unlock hotlink-protected image hosts/APIs.",
		advanceFetchCookieMap: "advance_fetch per-domain cookies",
		advanceFetchCookieMapHint: "One entry per line: `domain cookie-string` (# lines are comments), e.g. weibo.com SUB=xxx; SUBP=yyy. Attached only when the fetch target matches the domain (subdomains included); never forwarded across a cross-domain redirect. Update here when cookies expire. Credentials belong in settings - never paste cookies into chat.",
		searxngLanguageLabel: "SearXNG response language",
		searxngLanguageAuto: "auto (detect from query)",
		searxngLanguageHint: "Default auto: kana→ja, hangul→ko, cyrillic→ru, CJK→zh-CN, falling back to the settings language; picking a value locks the tier regardless of the query.",
		unavailable: "Settings unavailable — the union-search bridge is not exposed.",
		saveFailed: "save failed",
		saveFailedDetail: (d) => `save failed: ${d}`,
		testing: "Testing…",
		testEngine: "Test engine",
		useBing: "Use Bing default",
		discard: "Discard",
		saving: "Saving…",
		save: "Save",
		testOk: (r) => `✓ ${r.count} results (engine: ${r.engine})${r.content ? ` — ${r.content}` : ""}${r.sample ? ` · e.g. "${r.sample.slice(0, 40)}"` : ""}`,
		testFail: (e) => `✗ ${e}`,
		toggleLang: "中文",
		checkUpdate: "Check update",
		checkingUpdate: "Checking…",
		updateAvailable: (c, l) => `New version v${l} available (current v${c})`,
		updateLatest: (c) => `You're on the latest version v${c}`,
		updateCheckFailed: "Update check failed (cannot reach npm registry)",
		updateView: "View →",
		hasUpdate: "Update available",
		upgrade: "Upgrade",
		upgrading: "Upgrading…",
		upgradeLinkMode: "(local dev install - use git pull to update)",
		upgradeDone: (l) => `Upgraded to v${l} - restart dsh to apply`,
		upgradeFailed: (m) => `Upgrade failed: ${m}`,
		safeSearchLabel: "Safe search filter (adlt)",
		safeSearchOff: "Off - engine default (no filtering)",
		safeSearchModerate: "Moderate - Bing default",
		safeSearchStrict: "Strict",
		safeSearchHint: "Applies to bing (adlt), ddg, ddg-lite (adlt degree). If you see the engine's own filtering, adjust here.",
		bingMarketLabel: "Bing market (localized results)",
		bingMarketHint: "Bing's mkt + Accept-Language follow this. e.g. ru-RU returns Russian results for Cyrillic queries.",
		marketZhCN: "zh-CN - China (default)",
		marketZhTW: "zh-TW - Taiwan",
		marketEnUS: "en-US - United States",
		marketEnGB: "en-GB - United Kingdom",
		marketRuRU: "ru-RU - Russia",
		marketJaJP: "ja-JP - Japan",
		marketDeDE: "de-DE - Germany",
		marketFrFR: "fr-FR - France",
		marketEsES: "es-ES - Spain",
		marketKoKR: "ko-KR - Korea",
		searxngInstancesLabel: "SearXNG instances",
		searxngModePublic: "Public pool (built-in free instances)",
		searxngModeLocal: "Local Docker node",
		searxngModeCustom: "Custom instance list",
		searxngModeHint: "Public pool = built-in instances with sequential failover (may all time out in some regions); Local Docker = fastest and most reliable, recommended; Custom list = your own instances — with 2+ endpoints the first two are queried concurrently and merged once both return (cross-hit items ranked first).",
		searxngLocalUrlPh: "http://localhost:8080",
		searxngCustomPh: "One instance URL per line, e.g.:\nhttp://localhost:8080\nhttps://searx.be",
		searxngLocalHint: "Start a local instance: docker run -d --name searxng -p 8080:8080 searxng/searxng; then add json to search.formats in settings.yml, otherwise the JSON API returns 403.",
		searxngProbe: "Probe instances",
		searxngProbing: "Probing…",
		searxngProbeFailEmpty: "Probe failed: no valid instance URLs",
		searxngUsePrimary: "Use as primary",
		searxngUsePrimaryKeptMode: "Endpoint set as primary; current engine is auto/multi or a paid engine, so it was NOT switched automatically — switch the engine to SearXNG manually to force this endpoint",
		searxngCustomEmptyWarn: "Custom list is empty: in this mode SearXNG will NOT fall back to the public pool and searches will fail outright — add endpoints or switch back to the public pool",
		testAllEngines: "Test all engines",
		testingAll: "Testing all…",
		disableSuggestHint: "Engines that failed this test (tick then click Apply to disable; transient CAPTCHA/rate-limit failures can be skipped, restore anytime in the engine checkboxes above)",
		applyDisable: "Apply disable"
	}
};
const tt = (lang) => I18N[lang === "en" ? "en" : "zh"];
const ENGINES = [
	{
		id: "auto",
		label: "Auto · 智能路由",
		badge: "AUTO",
		link: null
	},
	{
		id: "multi",
		label: "Multi Search · 多引擎",
		badge: "MULTI",
		link: null
	},
	{
		id: "ddg",
		label: "DuckDuckGo · HTML",
		badge: "FREE",
		link: "https://duckduckgo.com"
	},
	{
		id: "ddg-lite",
		label: "DuckDuckGo · Lite",
		badge: "FREE",
		link: "https://duckduckgo.com"
	},
	{
		id: "bing",
		label: "Bing",
		badge: "FREE",
		link: "https://www.bing.com"
	},
	{
		id: "anysearch",
		label: "AnySearch · AI",
		badge: "FREE",
		link: "https://anysearch.com",
		price: "免key·匿名",
		noteZh: "免费可用：是（匿名公共额度）；无 key：匿名免费（有限流）；配 key：提升额度；价格：免费",
		noteEn: "Free: yes (anonymous); no-key: free anonymous (rate-limited); with-key: higher quota; price: free"
	},
	{
		id: "searxng",
		label: "SearXNG · 元搜索",
		badge: "FREE",
		link: "https://github.com/searxng/searxng",
		price: "免费",
		noteZh: "免费可用：是；无 key：公网实例池免费；配 key：不需要（可自建实例）；价格：免费",
		noteEn: "Free: yes; no-key: public instance pool; with-key: N/A (self-host optional); price: free"
	},
	{
		id: "exa",
		label: "Exa",
		badge: "FREE",
		link: "https://dashboard.exa.ai/api-keys",
		price: "免key·$10/月",
		noteZh: "免费可用：是；无 key：MCP 匿名免费；配 key：约 $10/月额度（~1400 次）；价格：超额按量",
		noteEn: "Free: yes; no-key: anonymous MCP; with-key: ~$10/mo (~1,400 searches); price: pay-as-you-go beyond"
	},
	{
		id: "tavily",
		label: "Tavily",
		badge: "FREE",
		link: "https://app.tavily.com/home",
		price: "免key·1k/月",
		noteZh: "免费可用：是；无 key：keyless 匿名免费；配 key：约 1000 credits/月；价格：超额按量",
		noteEn: "Free: yes; no-key: keyless anonymous; with-key: ~1,000 credits/mo; price: pay-as-you-go beyond"
	},
	{
		id: "keenable",
		label: "Keenable",
		badge: "FREE",
		link: "https://keenable.ai/login",
		price: "免key",
		noteZh: "免费可用：是；无 key：公开 MCP 匿名；配 key：更高额度、按组织限流；价格：免费额度",
		noteEn: "Free: yes; no-key: public MCP anonymous; with-key: higher quota; price: free tier"
	},
	{
		id: "firecrawl",
		label: "Firecrawl",
		badge: "FREE",
		link: "https://www.firecrawl.dev",
		price: "免key·1k/月",
		noteZh: "免费可用：是；无 key：官方免 key 约 1000/月；配 key：提升限额；价格：超额按量",
		noteEn: "Free: yes; no-key: official keyless ~1,000/mo; with-key: higher limits; price: pay-as-you-go beyond"
	},
	{
		id: "parallel",
		label: "Parallel",
		badge: "FREE",
		link: "https://platform.parallel.ai",
		price: "免key",
		noteZh: "免费可用：是；无 key：官方 MCP 匿名额度；配 key：精确时间过滤+提额；价格：超额按量",
		noteEn: "Free: yes; no-key: official MCP anonymous; with-key: precise time filter + quota; price: pay-as-you-go beyond"
	},
	{
		id: "perplexity",
		label: "Perplexity",
		badge: "API KEY",
		link: "https://www.perplexity.ai/settings/api",
		price: "按量",
		noteZh: "免费可用：否；无 key：不可用；配 key：必需 PERPLEXITY_API_KEY；价格：按 token 计费",
		noteEn: "Free: no; no-key: unavailable; with-key: PERPLEXITY_API_KEY required; price: token-billed"
	},
	{
		id: "serpbase",
		label: "SerpBase · Google",
		badge: "API KEY",
		link: "https://serpbase.dev",
		price: "送100次",
		noteZh: "免费可用：注册送；无 key：不可用；配 key：注册送 100 次；价格：超额按量",
		noteEn: "Free: signup 100; no-key: unavailable; with-key: 100 free calls; price: pay-as-you-go beyond"
	},
	{
		id: "serply",
		label: "Serply · Google",
		badge: "API KEY",
		link: "https://serply.io",
		price: "2500/月",
		noteZh: "免费可用：新账户送；无 key：不可用；配 key：30 天内 2500 次免费；价格：超额按量",
		noteEn: "Free: new-account 2,500/30d; no-key: unavailable; with-key: 2,500 free in 30 days; price: beyond that"
	},
	{
		id: "deepseek-tools",
		label: "DeepSeek Tools · 直连",
		badge: "API KEY",
		link: "https://platform.deepseek.com/api_keys",
		price: "≈5厘/次",
		noteZh: "免费可用：否；无 key：不可用；配 key：与 DeepSeek Official 共用 DEEPSEEK_API_KEY；价格：按次计费 ≈5厘/次；直连 /v1/tools/search 无模型轮次，同 query 实测 ~0.3s（official 约 5-6s）",
		noteEn: "Free: no; no-key: unavailable; with-key: shares DEEPSEEK_API_KEY with DeepSeek Official; price: per-call ≈¥0.005; hits /v1/tools/search directly with no model turns — ~0.3s vs ~5-6s for official on the same query"
	},
	{
		id: "deepseek-official",
		label: "DeepSeek Official",
		badge: "API KEY",
		link: "https://platform.deepseek.com/api_keys",
		price: "≈5厘/次",
		noteZh: "免费可用：否；无 key：不可用；配 key：必需 DEEPSEEK_API_KEY；价格（2026-10 官方）：Search $0.75/千次成功请求 ≈ 单次 5 厘；经 DSH 宿主的服务端工具调用 2026-11-01 前免费",
		noteEn: "Free: no; no-key: unavailable; with-key: DEEPSEEK_API_KEY; price (2026-10 official): Search $0.75 per 1,000 successful requests ≈ ¥0.005 per request; server-side tool calls via the DSH harness are free until 2026-11-01"
	},
	{
		id: "you",
		label: "You.com",
		badge: "API KEY",
		link: "https://you.com/platform/api-keys",
		price: "注册送额",
		noteZh: "免费可用：注册送；无 key：不可用；配 key：注册即送免费额度；价格：超额按量",
		noteEn: "Free: signup quota; no-key: unavailable; with-key: free on signup; price: pay-as-you-go beyond"
	},
	{
		id: "baidu",
		label: "Baidu · 百度千帆",
		badge: "API KEY",
		link: "https://console.bce.baidu.com/qianfan",
		price: "50次/日",
		noteZh: "免费可用：每日赠；无 key：不可用；配 key：每日赠 50 次；价格：超额后付费",
		noteEn: "Free: 50/day; no-key: unavailable; with-key: 50 free/day; price: post-pay beyond"
	},
	{
		id: "kimi",
		label: "Kimi · Moonshot",
		badge: "API KEY",
		link: "https://platform.moonshot.cn",
		price: "~¥0.01/次",
		noteZh: "免费可用：否；无 key：不可用；配 key：必需 MOONSHOT_API_KEY；价格：basic 约 ¥0.01/次",
		noteEn: "Free: no; no-key: unavailable; with-key: MOONSHOT_API_KEY; price: ~¥0.01/query"
	},
	{
		id: "aliyun",
		label: "Aliyun · 百炼",
		badge: "API KEY",
		link: "https://bailian.console.aliyun.com",
		price: "~¥0.03/次",
		noteZh: "免费可用：新用户送；无 key：不可用；配 key：新用户 200 次免费包；价格：约 ¥0.03/次",
		noteEn: "Free: 200 for new users; no-key: unavailable; with-key: DASHSCOPE_API_KEY; price: ~¥0.03/query"
	},
	{
		id: "doubao",
		label: "Doubao · 豆包搜索",
		badge: "API KEY",
		link: "https://console.volcengine.com/search-infinity/web-search",
		price: "500次/月",
		noteZh: "免费可用：每月送；无 key：不可用；配 key：每月 500 次免费；价格：超出按量",
		noteEn: "Free: 500/mo; no-key: unavailable; with-key: 500 free/month; price: pay-as-you-go beyond"
	},
	{
		id: "zhihu_global",
		label: "Zhihu · 知乎全网",
		badge: "API KEY",
		link: "https://developer.zhihu.com",
		price: "按量",
		noteZh: "免费可用：否；无 key：不可用；配 key：必需 ZHIHU_API_KEY（开放平台）；价格：按量，支持时间过滤",
		noteEn: "Free: no; no-key: unavailable; with-key: ZHIHU_API_KEY; price: per-use, supports time filter"
	},
	{
		id: "zhihu_site",
		label: "Zhihu · 知乎站内",
		badge: "API KEY",
		link: "https://developer.zhihu.com",
		price: "按量",
		noteZh: "免费可用：否；无 key：不可用；配 key：必需 ZHIHU_API_KEY；价格：按量，不支持时间过滤",
		noteEn: "Free: no; no-key: unavailable; with-key: ZHIHU_API_KEY; price: per-use, no time filter"
	},
	{
		id: "zhipu",
		label: "Zhipu · 智谱",
		badge: "API KEY",
		link: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
		price: "¥0.03/次",
		noteZh: "免费可用：否；无 key：不可用；配 key：普通平台 ZHIPU_API_KEY（非 Coding Plan）；价格：search_pro 约 0.03 元/次（std 0.01 / sogou·quark 0.05）",
		noteEn: "Free: no; no-key: unavailable; with-key: platform ZHIPU_API_KEY (not Coding Plan); price: search_pro ~¥0.03 (std 0.01 / sogou·quark 0.05)"
	},
	{
		id: "bocha",
		label: "Bocha · 博查",
		badge: "API KEY",
		link: "https://open.bochaai.com",
		price: "¥0.036/次",
		noteZh: "免费可用：注册送；无 key：不可用；配 key：BOCHA_API_KEY，注册送额度；价格：约 0.036 元/次（DeepSeek 官方供应方，中文强）",
		noteEn: "Free: signup quota; no-key: unavailable; with-key: BOCHA_API_KEY; price: ~¥0.036/search (DeepSeek's official vendor, strong Chinese)"
	},
	{
		id: "metaso",
		label: "Metaso · 秘塔",
		badge: "API KEY",
		link: "https://metaso.cn",
		price: "¥0.03/次",
		noteZh: "免费可用：注册送；无 key：不可用；配 key：METASO_API_KEY(mk-)，注册送 5000 点；价格：约 0.03 元/query；支持网页/学术/文库多模态",
		noteEn: "Free: 5,000 on signup; no-key: unavailable; with-key: METASO_API_KEY(mk-); price: ~¥0.03/query; web/academic/docs"
	},
	{
		id: "openai",
		label: "OpenAI · 内置搜索",
		badge: "API KEY",
		link: "https://platform.openai.com/api-keys",
		price: "按次",
		noteZh: "免费可用：否；无 key：不可用；配 key：OPENAI_API_KEY；价格：模型内置 web_search 按次计费，仅显式选用",
		noteEn: "Free: no; no-key: unavailable; with-key: OPENAI_API_KEY; price: built-in web_search per-call, explicit use only"
	},
	{
		id: "gemini",
		label: "Gemini · 内置搜索",
		badge: "API KEY",
		link: "https://aistudio.google.com/apikey",
		price: "按次",
		noteZh: "免费可用：否；无 key：不可用；配 key：GEMINI_API_KEY / GOOGLE_API_KEY；价格：Google Search grounding 按次计费，仅显式选用",
		noteEn: "Free: no; no-key: unavailable; with-key: GEMINI/GOOGLE_API_KEY; price: Google Search grounding per-call, explicit use only"
	},
	{
		id: "claude",
		label: "Claude · 内置搜索",
		badge: "API KEY",
		link: "https://console.anthropic.com/settings/keys",
		price: "按次",
		noteZh: "免费可用：否；无 key：不可用；配 key：ANTHROPIC_API_KEY；价格：服务端 web_search 按次计费，仅显式选用",
		noteEn: "Free: no; no-key: unavailable; with-key: ANTHROPIC_API_KEY; price: server-side web_search per-call, explicit use only"
	},
	{
		id: "grok",
		label: "Grok · X 搜索",
		badge: "API KEY",
		link: "https://console.x.ai",
		price: "按次",
		noteZh: "免费可用：否；无 key：不可用；配 key：XAI_API_KEY；价格：xAI Responses API + x_search，按 token+工具次数计费，仅显式选用（X/Twitter）",
		noteEn: "Free: no; no-key: unavailable; with-key: XAI_API_KEY; price: xAI Responses + x_search, token+tool billed, explicit use only (X/Twitter)"
	}
];
const ENGINE_IDS = ENGINES.filter((engine) => engine.id !== "auto" && engine.id !== "multi").map((engine) => engine.id);
const DEFAULT_FALLBACK_ORDER = [
	"exa",
	"tavily",
	"keenable",
	"firecrawl",
	"parallel",
	"perplexity",
	"serpbase",
	"serply",
	"deepseek-tools",
	"deepseek-official",
	"you",
	"baidu",
	"kimi",
	"aliyun",
	"doubao",
	"zhipu",
	"bocha",
	"metaso",
	"zhihu_global",
	"zhihu_site",
	"bing",
	"anysearch",
	"ddg",
	"ddg-lite",
	"searxng"
];
const SEARXNG_PUBLIC_POOL = [
	"https://opnxng.com",
	"https://priv.au",
	"https://searx.be",
	"https://searx.tiekoetter.com",
	"https://search.inetol.net",
	"https://paulgo.io"
];
const normalizeFallbackOrder = (value) => {
	const configured = Array.isArray(value) ? value.filter((id) => ENGINE_IDS.includes(id)) : [];
	return [.../* @__PURE__ */ new Set([
		...configured,
		...DEFAULT_FALLBACK_ORDER,
		...ENGINE_IDS
	])];
};
const FAILURE_CLASSES = [
	{
		id: "quota",
		labelKey: "classQuota"
	},
	{
		id: "auth",
		labelKey: "classAuth"
	},
	{
		id: "bot-wall",
		labelKey: "classBotWall"
	},
	{
		id: "transient",
		labelKey: "classTransient"
	},
	{
		id: "invalid-response",
		labelKey: "classInvalidResponse"
	},
	{
		id: "unknown",
		labelKey: "classUnknown"
	}
];
const normalizeFallbackOn = (value) => {
	if (!Array.isArray(value)) return FAILURE_CLASSES.map((cls) => cls.id);
	return [...new Set(value.filter((id) => FAILURE_CLASSES.some((cls) => cls.id === id)))];
};
async function bridgeDescribe() {
	return (await fetch(`${BRIDGE_PREFIX}/describe`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: "{}"
	})).json();
}
async function bridgeMutate(payload) {
	return (await fetch(`${BRIDGE_PREFIX}/mutate`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload)
	})).json();
}
async function bridgeRawSearch(payload) {
	return (await fetch(`${BRIDGE_PREFIX}/raw-search`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload)
	})).json();
}
async function bridgeSearxngProbe(urls) {
	return (await fetch(`${BRIDGE_PREFIX}/searxng-probe`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ urls })
	})).json();
}
async function bridgeTestEngines(payload) {
	return (await fetch(`${BRIDGE_PREFIX}/test-engines`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(payload ?? {})
	})).json();
}
async function bridgeTakeoverStatus() {
	return (await fetch(`${BRIDGE_PREFIX}/takeover-status`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: "{}"
	})).json();
}
async function bridgeCheckUpdate() {
	return (await fetch(`${BRIDGE_PREFIX}/check-update`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: "{}"
	})).json();
}
async function bridgeCredentialsStatus() {
	return (await fetch(`${BRIDGE_PREFIX}/credentials-status`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: "{}"
	})).json();
}
async function bridgeCredentialsSet(key, value) {
	return (await fetch(`${BRIDGE_PREFIX}/credentials-set`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			key,
			value
		})
	})).json();
}
function summaryText() {
	return (typeof navigator === "undefined" ? "zh" : String(navigator.languages && navigator.languages[0] || navigator.language || "zh").toLowerCase()).startsWith("en") ? "13 engines · time filtering · platform search · web_fetch" : "13 个搜索引擎 · 时间筛选 · 平台搜索 · web_fetch";
}
const GUIDE_NS = "union-search";
const GUIDE_BASE_LOCALES = [
	"zh",
	"en",
	"ja",
	"ko",
	"fr",
	"de",
	"it",
	"ru",
	"es",
	"pt"
];
const GUIDE_COPY = {
	zh: {
		title: "快速上手",
		skip: "跳过引导",
		next: "下一步",
		prev: "上一步",
		done: "开始使用",
		restart: "重新查看引导",
		stepOf: (current, total) => `第 ${current} / ${total} 步`
	},
	en: {
		title: "Quick start",
		skip: "Skip guide",
		next: "Next",
		prev: "Back",
		done: "Get started",
		restart: "Show guide again",
		stepOf: (current, total) => `Step ${current} of ${total}`
	},
	ja: {
		title: "クイックスタート",
		skip: "ガイドをスキップ",
		next: "次へ",
		prev: "戻る",
		done: "はじめる",
		restart: "ガイドをもう一度表示",
		stepOf: (current, total) => `ステップ ${current} / ${total}`
	},
	ko: {
		title: "빠른 시작",
		skip: "가이드 건너뛰기",
		next: "다음",
		prev: "이전",
		done: "시작하기",
		restart: "가이드 다시 보기",
		stepOf: (current, total) => `${current} / ${total} 단계`
	},
	fr: {
		title: "Démarrage rapide",
		skip: "Ignorer le guide",
		next: "Suivant",
		prev: "Retour",
		done: "Commencer",
		restart: "Revoir le guide",
		stepOf: (current, total) => `Étape ${current} sur ${total}`
	},
	de: {
		title: "Schnellstart",
		skip: "Anleitung überspringen",
		next: "Weiter",
		prev: "Zurück",
		done: "Loslegen",
		restart: "Anleitung erneut anzeigen",
		stepOf: (current, total) => `Schritt ${current} von ${total}`
	},
	it: {
		title: "Avvio rapido",
		skip: "Salta la guida",
		next: "Avanti",
		prev: "Indietro",
		done: "Inizia",
		restart: "Rivedi la guida",
		stepOf: (current, total) => `Passo ${current} di ${total}`
	},
	ru: {
		title: "Быстрый старт",
		skip: "Пропустить руководство",
		next: "Далее",
		prev: "Назад",
		done: "Начать",
		restart: "Показать руководство снова",
		stepOf: (current, total) => `Шаг ${current} из ${total}`
	},
	es: {
		title: "Inicio rápido",
		skip: "Omitir la guía",
		next: "Siguiente",
		prev: "Atrás",
		done: "Empezar",
		restart: "Ver la guía de nuevo",
		stepOf: (current, total) => `Paso ${current} de ${total}`
	},
	pt: {
		title: "Início rápido",
		skip: "Ignorar o guia",
		next: "Próximo",
		prev: "Voltar",
		done: "Começar",
		restart: "Ver o guia novamente",
		stepOf: (current, total) => `Passo ${current} de ${total}`
	}
};
function normalizeGuideLocale(tag) {
	const primary = String(tag || "").toLowerCase().trim().split(/[-_]/)[0];
	return GUIDE_BASE_LOCALES.includes(primary) ? primary : "";
}
function currentGuideLocale() {
	try {
		return normalizeGuideLocale(typeof document === "undefined" ? "" : document.documentElement && document.documentElement.lang || "") || "en";
	} catch {
		return "en";
	}
}
function guideLocale(pref) {
	return normalizeGuideLocale(pref) || currentGuideLocale();
}
function guideLabels(locale) {
	return GUIDE_COPY[locale] || GUIDE_COPY.en;
}
function guideSteps(map, locale) {
	if (!map) return [];
	const order = [
		locale,
		"en",
		"zh"
	];
	for (const key of order) {
		const hit = key ? map[key] : void 0;
		if (hit && hit.length > 0) return hit;
	}
	for (const key of Object.keys(map)) if (map[key] && map[key].length > 0) return map[key];
	return [];
}
function guideStorageKey(ns) {
	return "dsh.guide." + ns + ".skipped";
}
function isGuideSkipped(ns) {
	try {
		return typeof localStorage !== "undefined" && localStorage.getItem(guideStorageKey(ns)) === "1";
	} catch {
		return false;
	}
}
function skipGuide(ns) {
	try {
		localStorage.setItem(guideStorageKey(ns), "1");
	} catch {}
}
function resetGuide(ns) {
	try {
		localStorage.removeItem(guideStorageKey(ns));
	} catch {}
}
const GUIDE_CSS = ".sgGuide{border:1px solid rgba(127,127,127,.28);background:rgba(127,127,127,.06);border-radius:12px;padding:14px 16px;margin:0}.sgGuideHead{display:flex;align-items:center;gap:8px;margin:0 0 10px}.sgGuideTitle{font-size:14px;font-weight:600}.sgGuideStep{font-size:12px;color:#6e6e73;margin-left:auto}@media (prefers-color-scheme: dark){.sgGuideStep{color:#a1a1a6}}.sgGuideBody{font-size:13px;line-height:1.6;min-height:52px}.sgGuideBody b{font-weight:600}.sgGuideDots{display:flex;gap:6px;margin:10px 0 0}.sgGuideDot{width:6px;height:6px;border-radius:50%;background:rgba(127,127,127,.3)}.sgGuideDot-on{background:#4d6bfe}.sgGuideFoot{display:flex;align-items:center;gap:8px;margin:12px 0 0}.sgGuideBtn{appearance:none;font:inherit;font-size:12px;padding:5px 12px;border-radius:8px;border:1px solid rgba(127,127,127,.3);background:transparent;color:inherit;cursor:pointer}.sgGuideBtn-primary{background:#4d6bfe;border-color:transparent;color:#fff}.sgGuideBtn-skip{margin-right:auto;color:#6e6e73;border-color:transparent;text-decoration:underline}.sgGuideRestart{appearance:none;font:inherit;font-size:12px;padding:0;border:0;background:transparent;color:#4d6bfe;cursor:pointer;text-decoration:underline;align-self:flex-start}";
function injectGuideCss() {
	try {
		if (typeof document === "undefined") return;
		if (typeof document.querySelector !== "function") return;
		if (typeof document.createElement !== "function") return;
		if (!document.head) return;
		if (document.querySelector("style[data-plugin-css=\"union-search-guide\"]") !== null) return;
		const tag = document.createElement("style");
		tag.dataset.pluginCss = "union-search-guide";
		tag.textContent = GUIDE_CSS;
		document.head.appendChild(tag);
	} catch {}
}
function GuidePanel(props) {
	const ns = props.ns;
	const steps = props.steps || [];
	const labels = guideLabels(guideLocale(props.locale));
	const [index, setIndex] = react.useState(0);
	react.useEffect(() => {
		injectGuideCss();
	}, []);
	if (steps.length === 0) return null;
	const current = steps[Math.min(index, steps.length - 1)];
	const last = index >= steps.length - 1;
	const finish = (skip) => {
		if (skip) skipGuide(ns);
		if (typeof props.onClose === "function") props.onClose();
	};
	return react_jsx_runtime.jsx("section", {
		className: "sgGuide",
		"aria-label": labels.title,
		children: [
			react_jsx_runtime.jsx("header", {
				className: "sgGuideHead",
				children: [react_jsx_runtime.jsx("span", {
					className: "sgGuideTitle",
					children: labels.title
				}), react_jsx_runtime.jsx("span", {
					className: "sgGuideStep",
					children: labels.stepOf(index + 1, steps.length)
				})]
			}),
			react_jsx_runtime.jsx("div", {
				className: "sgGuideBody",
				children: [react_jsx_runtime.jsx("b", { children: current.title }), react_jsx_runtime.jsx("div", { children: current.body })]
			}),
			react_jsx_runtime.jsx("div", {
				className: "sgGuideDots",
				"aria-hidden": "true",
				children: steps.map((step, i) => react_jsx_runtime.jsx("span", { className: "sgGuideDot" + (i === index ? " sgGuideDot-on" : "") }, "guide-dot-" + i))
			}),
			react_jsx_runtime.jsx("footer", {
				className: "sgGuideFoot",
				children: [
					react_jsx_runtime.jsx("button", {
						type: "button",
						className: "sgGuideBtn sgGuideBtn-skip",
						onClick: () => finish(true),
						children: labels.skip
					}),
					index > 0 ? react_jsx_runtime.jsx("button", {
						type: "button",
						className: "sgGuideBtn",
						onClick: () => setIndex(index - 1),
						children: labels.prev
					}) : null,
					last ? react_jsx_runtime.jsx("button", {
						type: "button",
						className: "sgGuideBtn sgGuideBtn-primary",
						onClick: () => finish(false),
						children: labels.done
					}) : react_jsx_runtime.jsx("button", {
						type: "button",
						className: "sgGuideBtn sgGuideBtn-primary",
						onClick: () => setIndex(index + 1),
						children: labels.next
					})
				]
			})
		]
	});
}
function Section(props) {
	const storageKey = "dsh.union-search.sec." + props.id;
	const [secOpen, setSecOpen] = react.useState(() => {
		try {
			const raw = localStorage.getItem(storageKey);
			return raw === null ? props.defaultOpen !== false : raw === "1";
		} catch {
			return props.defaultOpen !== false;
		}
	});
	const toggle = () => setSecOpen((o) => {
		try {
			localStorage.setItem(storageKey, o ? "0" : "1");
		} catch {}
		return !o;
	});
	return react_jsx_runtime.jsx("div", {
		className: secOpen ? "dshfs-sec dshfs-secOpen" : "dshfs-sec",
		children: [react_jsx_runtime.jsx("button", {
			type: "button",
			className: "dshfs-secHead",
			"aria-expanded": secOpen,
			onClick: toggle,
			children: [
				react_jsx_runtime.jsx("span", {
					className: "dshfs-secTitle",
					children: props.title
				}),
				props.badge ? react_jsx_runtime.jsx("span", {
					className: "dshfs-secBadge",
					children: props.badge
				}) : null,
				react_jsx_runtime.jsx("span", {
					className: secOpen ? "dshfs-chevron dshfs-chevronOpen" : "dshfs-chevron",
					children: "▾"
				})
			]
		}), secOpen ? react_jsx_runtime.jsx("div", {
			className: "dshfs-secBody",
			children: props.children
		}) : null]
	});
}
function GuideRestartButton(props) {
	const labels = guideLabels(guideLocale(props.locale));
	return react_jsx_runtime.jsx("button", {
		type: "button",
		className: "sgGuideRestart",
		style: props.style,
		onClick: () => {
			resetGuide(props.ns);
			if (typeof props.onOpen === "function") props.onOpen();
		},
		children: labels.restart
	});
}
const UNION_SEARCH_GUIDE_STEPS = {
	zh: [
		{
			title: "先用免费引擎",
			body: "Bing / DuckDuckGo / AnySearch / SearXNG 免 key 直接可用，Exa、Tavily、Keenable、Firecrawl、Parallel 不填 key 也能用。要更高额度或更专业的结果，再到下方「API 密钥」填付费引擎的 key；读取优先级：凭据中心 > 设置页 > 环境变量。"
		},
		{
			title: "auto 与 multi 怎么选",
			body: "auto 按查询语言和时间过滤自动优选单个引擎；multi 并发跑路由/优先级前 3 个已启用引擎并合并去重。要多源核对就用 multi_search 工具或把搜索引擎设为 multi；回退顺序在「全局回退优先级」里调整，被禁用的引擎会从所有链路里剔除。"
		},
		{
			title: "失败后去哪看",
			body: "搜索失败会按「回退触发条件」里勾选的失败类别换下一个引擎；取消某类勾选＝遇到该类错误就停下并报出原因（缺 key、被禁用、不支持时间过滤不算失败，始终换引擎）。排错先用底部「测试引擎 / 测试全部引擎」定位是哪个引擎挂了。"
		}
	],
	en: [
		{
			title: "Start with the free engines",
			body: "Bing / DuckDuckGo / AnySearch / SearXNG work with no key, and Exa, Tavily, Keenable, Firecrawl and Parallel also run keyless. For higher quota or professional results, add a paid engine's key under \"API keys\" below; keys resolve in this order: credential center > settings page > environment variables."
		},
		{
			title: "Pick auto or multi",
			body: "auto picks one engine from the query language and time filter; multi runs the top 3 enabled routed engines in parallel and merges duplicates. For cross-source checks use the multi_search tool or set the engine to multi; fallback order lives in \"Global fallback priority\", and disabled engines are excluded from every chain."
		},
		{
			title: "Where failures show up",
			body: "A failed search moves to the next engine only for the failure classes ticked in \"Fallback triggers\"; unticking one stops the chain and reports the error (missing key, disabled and no-time-filter are not failures and always move on). Diagnose with the \"Test engine / Test all engines\" buttons at the bottom."
		}
	]
};
function UnionSearchCard(props) {
	const selectColorScheme = react.useMemo(() => {
		try {
			const root = document.body || document.documentElement;
			const bg = getComputedStyle(root).getPropertyValue("--dsw-alias-bg-base").trim();
			const m = bg.match(/(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/);
			if (m) return .299 * Number(m[1]) + .587 * Number(m[2]) + .114 * Number(m[3]) < 128;
			if (/^#([0-9a-f]{3,8})/i.test(bg)) {
				const hex = bg.slice(1);
				const h = hex.length <= 4 ? hex.replace(/./g, (c) => c + c) : hex;
				const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
				return .299 * r + .587 * g + .114 * b < 128;
			}
		} catch {}
		return typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)").matches : false;
	}, []) ? "dark" : "light";
	const pageMode = !!(props && props.page);
	const [open, setOpen] = react.useState(pageMode);
	const [guideOpen, setGuideOpen] = react.useState(() => !isGuideSkipped(GUIDE_NS));
	const [state, setState] = react.useState({ status: "loading" });
	const [provider, setProvider] = react.useState("bing");
	const [disabledEngines, setDisabledEngines] = react.useState([]);
	const [fallbackOrder, setFallbackOrder] = react.useState(DEFAULT_FALLBACK_ORDER);
	const [fallbackOn, setFallbackOn] = react.useState(FAILURE_CLASSES.map((cls) => cls.id));
	const [safeSearch, setSafeSearch] = react.useState("off");
	const [bingMarket, setBingMarket] = react.useState("zh-CN");
	const [anysearchKey, setAnysearchKey] = react.useState("");
	const [exaKey, setExaKey] = react.useState("");
	const [tavilyKey, setTavilyKey] = react.useState("");
	const [keenableKey, setKeenableKey] = react.useState("");
	const [firecrawlKey, setFirecrawlKey] = react.useState("");
	const [parallelKey, setParallelKey] = react.useState("");
	const [perplexityKey, setPerplexityKey] = react.useState("");
	const [deepseekKey, setDeepseekKey] = react.useState("");
	const [serpbaseKey, setSerpbaseKey] = react.useState("");
	const [serplyKey, setSerplyKey] = react.useState("");
	const [youcomKey, setYoucomKey] = react.useState("");
	const [baiduKey, setBaiduKey] = react.useState("");
	const [kimiKey, setKimiKey] = react.useState("");
	const [aliyunKey, setAliyunKey] = react.useState("");
	const [doubaoKey, setDoubaoKey] = react.useState("");
	const [openaiKey, setOpenaiKey] = react.useState("");
	const [geminiKey, setGeminiKey] = react.useState("");
	const [claudeKey, setClaudeKey] = react.useState("");
	const [zhihuKey, setZhihuKey] = react.useState("");
	const [zhipuKey, setZhipuKey] = react.useState("");
	const [bochaKey, setBochaKey] = react.useState("");
	const [metasoKey, setMetasoKey] = react.useState("");
	const [grokKey, setGrokKey] = react.useState("");
	const [platforms, setPlatforms] = react.useState([
		"github",
		"v2ex",
		"bilibili",
		"reddit",
		"hn",
		"stackoverflow",
		"wikipedia",
		"npm",
		"youtube",
		"vimeo"
	]);
	const [cacheTtl, setCacheTtl] = react.useState(5);
	const [blockSystemSearch, setBlockSystemSearch] = react.useState(false);
	const [autoRestoreOnDispose, setAutoRestoreOnDispose] = react.useState(true);
	const [takeoverStatus, setTakeoverStatus] = react.useState(null);
	const [fetchTakeover, setFetchTakeover] = react.useState(false);
	const [browserFetchTier, setBrowserFetchTier] = react.useState(false);
	const [browserFetchAllowHosts, setBrowserFetchAllowHosts] = react.useState("");
	const [deepseekToolsBaseUrl, setDeepseekToolsBaseUrl] = react.useState("");
	const [advanceFetchEnabled, setAdvanceFetchEnabled] = react.useState(true);
	const [advanceFetchAllowPrivate, setAdvanceFetchAllowPrivate] = react.useState(false);
	const [searxngLang, setSearxngLang] = react.useState("auto");
	const [searxngMode, setSearxngMode] = react.useState("public");
	const [searxngLocalUrl, setSearxngLocalUrl] = react.useState("http://localhost:8080");
	const [searxngInstancesText, setSearxngInstancesText] = react.useState("");
	const [searxngProbing, setSearxngProbing] = react.useState(false);
	const [searxngProbeResults, setSearxngProbeResults] = react.useState(null);
	const [searxngPrimaryHint, setSearxngPrimaryHint] = react.useState("");
	const [testingAll, setTestingAll] = react.useState(false);
	const [testAllResults, setTestAllResults] = react.useState(null);
	const [suggestSelection, setSuggestSelection] = react.useState({});
	const [keysConfigured, setKeysConfigured] = react.useState({});
	const [keyStorage, setKeyStorage] = react.useState("credentials");
	const [credConfigured, setCredConfigured] = react.useState({});
	const [lang, setLang] = react.useState("zh");
	const [dirty, setDirty] = react.useState(false);
	const [saving, setSaving] = react.useState(false);
	const [failed, setFailed] = react.useState(false);
	const [saveError, setSaveError] = react.useState("");
	const [testing, setTesting] = react.useState(false);
	const [testResult, setTestResult] = react.useState(null);
	const [checkingUpdate, setCheckingUpdate] = react.useState(false);
	const [upgrading, setUpgrading] = react.useState(false);
	const [updateInfo, setUpdateInfo] = react.useState(null);
	const load = react.useCallback(async () => {
		try {
			const result = await bridgeDescribe();
			if (result.ok) {
				const view = result.value.namespaces.find((n) => n.ns === NS);
				if (view) {
					const v = view.value ?? {};
					setProvider(v.provider ?? "ddg");
					setDisabledEngines(Array.isArray(v.disabledEngines) ? [...new Set(v.disabledEngines.filter((id) => ENGINES.some((engine) => engine.id === id && id !== "auto" && id !== "multi")))] : []);
					setFallbackOrder(normalizeFallbackOrder(v.fallbackOrder));
					setFallbackOn(normalizeFallbackOn(v.fallbackOn));
					setSafeSearch(v.safeSearch === "strict" || v.safeSearch === "moderate" ? v.safeSearch : "off");
					setBingMarket(v.bingMarket === void 0 ? "zh-CN" : v.bingMarket);
					setSearxngMode(v.searxngMode === "local" || v.searxngMode === "custom" ? v.searxngMode : Array.isArray(v.searxngInstances) && v.searxngInstances.length > 0 ? "custom" : "public");
					setSearxngLocalUrl(v.searxngLocalUrl === void 0 || v.searxngLocalUrl === "" ? "http://localhost:8080" : v.searxngLocalUrl);
					setSearxngInstancesText(Array.isArray(v.searxngInstances) ? v.searxngInstances.join("\n") : "");
					setLang(v.lang === "en" ? "en" : "zh");
					setAnysearchKey(v.anysearchApiKey ?? "");
					setExaKey(v.exaApiKey ?? "");
					setTavilyKey(v.tavilyApiKey ?? "");
					setKeenableKey(v.keenableApiKey ?? "");
					setFirecrawlKey(v.firecrawlApiKey ?? "");
					setParallelKey(v.parallelApiKey ?? "");
					setPerplexityKey(v.perplexityApiKey ?? "");
					setDeepseekKey(v.deepseekApiKey ?? "");
					setSerpbaseKey(v.serpbaseApiKey ?? "");
					setSerplyKey(v.serplyApiKey ?? "");
					setYoucomKey(v.youcomApiKey ?? "");
					setBaiduKey(v.baiduApiKey ?? "");
					setKimiKey(v.kimiApiKey ?? "");
					setAliyunKey(v.aliyunApiKey ?? "");
					setDoubaoKey(v.doubaoApiKey ?? "");
					setOpenaiKey(v.openaiApiKey ?? "");
					setGeminiKey(v.geminiApiKey ?? "");
					setClaudeKey(v.claudeApiKey ?? "");
					setZhihuKey(v.zhihuApiKey ?? "");
					setZhipuKey(v.zhipuApiKey ?? "");
					setBochaKey(v.bochaApiKey ?? "");
					setMetasoKey(v.metasoApiKey ?? "");
					setGrokKey(v.grokApiKey ?? "");
					setPlatforms(Array.isArray(v.platforms) && v.platforms.length > 0 ? v.platforms : [
						"github",
						"v2ex",
						"bilibili",
						"reddit",
						"hn",
						"stackoverflow",
						"wikipedia",
						"npm",
						"youtube",
						"vimeo"
					]);
					setCacheTtl(v.cacheTtl === void 0 ? 5 : Math.min(Math.max(Number(v.cacheTtl) ?? 5, 0), 5));
					setBlockSystemSearch(v.blockSystemSearch === true);
					setAutoRestoreOnDispose(v.autoRestoreOnDispose !== false);
					setFetchTakeover(v.fetchTakeover === true);
					setBrowserFetchTier(v.browserFetchTier === true);
					setBrowserFetchAllowHosts(typeof v.browserFetchAllowHosts === "string" ? v.browserFetchAllowHosts : "");
					setDeepseekToolsBaseUrl(typeof v.deepseekToolsBaseUrl === "string" ? v.deepseekToolsBaseUrl : "");
					setAdvanceFetchEnabled(v.advanceFetchEnabled !== false);
					setAdvanceFetchAllowPrivate(v.advanceFetchAllowPrivate === true);
					setSearxngLang(typeof v.searxngLanguage === "string" && v.searxngLanguage ? v.searxngLanguage : "auto");
					const configured = {};
					for (const secret of view.secrets ?? []) if (secret.set) {
						const path = secret.path.join(".");
						if (path === "anysearchApiKey") configured.anysearch = true;
						if (path === "exaApiKey") configured.exa = true;
						if (path === "tavilyApiKey") configured.tavily = true;
						if (path === "keenableApiKey") configured.keenable = true;
						if (path === "firecrawlApiKey") configured.firecrawl = true;
						if (path === "parallelApiKey") configured.parallel = true;
						if (path === "perplexityApiKey") configured.perplexity = true;
						if (path === "deepseekApiKey") configured.deepseek = true;
						if (path === "serpbaseApiKey") configured.serpbase = true;
						if (path === "serplyApiKey") configured.serply = true;
						if (path === "youcomApiKey") configured.youcom = true;
						if (path === "baiduApiKey") configured.baidu = true;
						if (path === "kimiApiKey") configured.kimi = true;
						if (path === "aliyunApiKey") configured.aliyun = true;
						if (path === "doubaoApiKey") configured.doubao = true;
						if (path === "openaiApiKey") configured.openai = true;
						if (path === "geminiApiKey") configured.gemini = true;
						if (path === "claudeApiKey") configured.claude = true;
						if (path === "zhihuApiKey") configured.zhihu = true;
						if (path === "zhipuApiKey") configured.zhipu = true;
						if (path === "bochaApiKey") configured.bocha = true;
						if (path === "metasoApiKey") configured.metaso = true;
						if (path === "grokApiKey") configured.grok = true;
					}
					setKeysConfigured(configured);
					setKeyStorage(v.keyStorage === "settings" ? "settings" : "credentials");
					setState({
						status: "ready",
						writable: result.value.writable
					});
					try {
						const cred = await bridgeCredentialsStatus();
						if (cred.ok) {
							const cc = {};
							const map = {
								anysearchApiKey: "anysearch",
								exaApiKey: "exa",
								tavilyApiKey: "tavily",
								keenableApiKey: "keenable",
								firecrawlApiKey: "firecrawl",
								parallelApiKey: "parallel",
								perplexityApiKey: "perplexity",
								deepseekApiKey: "deepseek",
								serpbaseApiKey: "serpbase",
								serplyApiKey: "serply",
								youcomApiKey: "youcom",
								baiduApiKey: "baidu",
								kimiApiKey: "kimi",
								aliyunApiKey: "aliyun",
								doubaoApiKey: "doubao",
								openaiApiKey: "openai",
								geminiApiKey: "gemini",
								claudeApiKey: "claude",
								zhihuApiKey: "zhihu",
								zhipuApiKey: "zhipu",
								bochaApiKey: "bocha",
								metasoApiKey: "metaso",
								grokApiKey: "grok"
							};
							for (const [k, v] of Object.entries(cred.value.configured ?? {})) if (map[k]) cc[map[k]] = v;
							setCredConfigured(cc);
						}
					} catch {}
					try {
						const ts = await bridgeTakeoverStatus();
						if (ts && ts.ok && ts.value) setTakeoverStatus(ts.value);
					} catch {}
				} else setState({ status: "unavailable" });
			} else setState({ status: "unavailable" });
		} catch {
			setState({ status: "unavailable" });
		}
	}, []);
	react.useEffect(() => {
		load();
	}, [load]);
	const select = (value) => {
		setProvider(value);
		setDirty(true);
		setFailed(false);
		setSaveError("");
	};
	const runSearxngProbe = async () => {
		let urls;
		if (searxngMode === "local") urls = [(searxngLocalUrl || "").trim() || "http://localhost:8080"];
		else if (searxngMode === "custom") {
			urls = [...new Set(searxngInstancesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];
			if (urls.length === 0) {
				setSearxngProbeResults([{
					url: "",
					ok: false,
					error: t.searxngProbeFailEmpty
				}]);
				return;
			}
		} else urls = SEARXNG_PUBLIC_POOL;
		setSearxngProbing(true);
		setSearxngProbeResults(null);
		try {
			const result = await bridgeSearxngProbe(urls);
			if (result && result.ok) setSearxngProbeResults(result.value.results);
			else setSearxngProbeResults([{
				url: "",
				ok: false,
				error: result && result.message || "probe failed"
			}]);
		} catch (e) {
			setSearxngProbeResults([{
				url: "",
				ok: false,
				error: e && e.message ? e.message : String(e)
			}]);
		} finally {
			setSearxngProbing(false);
		}
	};
	const searxngProbeLine = (r) => (r.ok ? "✓ " : "✗ ") + (r.url ? r.url + " — " : "") + (r.ok ? `${r.latencyMs}ms · ${r.results}` : `${r.error ?? (r.status !== void 0 ? `HTTP ${r.status}` : "failed")}${r.hint ? ` ${r.hint}` : ""}`);
	const useAsPrimary = (url) => {
		if (!url) return;
		if (searxngMode === "local") setSearxngLocalUrl(url);
		else if (searxngMode === "custom") {
			const rest = searxngInstancesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean).filter((s) => s !== url);
			setSearxngInstancesText([url, ...rest].join("\n"));
		} else {
			setSearxngMode("custom");
			setSearxngInstancesText(url);
			setSearxngProbeResults(null);
		}
		setSearxngPrimaryHint("");
		if (provider !== "searxng") {
			if ([
				"bing",
				"ddg",
				"ddg-lite",
				"anysearch"
			].includes(provider)) setProvider("searxng");
			else setSearxngPrimaryHint(t.searxngUsePrimaryKeptMode);
		}
		setDirty(true);
		setFailed(false);
		setSaveError("");
	};
	const runTestAllEngines = async () => {
		setTestingAll(true);
		setTestAllResults(null);
		setSuggestSelection({});
		try {
			const result = await bridgeTestEngines({});
			if (result && result.ok) {
				const rows = result.value.results ?? [];
				setTestAllResults(rows);
				const failed = rows.filter((r) => r.status === "fail" && r.engine && r.engine !== "auto" && r.engine !== "multi" && r.engine !== "—").map((r) => r.engine);
				setSuggestSelection(Object.fromEntries(failed.map((engine) => [engine, true])));
			} else setTestAllResults([{
				engine: "—",
				status: "fail",
				error: result && result.message || "test failed"
			}]);
		} catch (e) {
			setTestAllResults([{
				engine: "—",
				status: "fail",
				error: e && e.message ? e.message : String(e)
			}]);
		} finally {
			setTestingAll(false);
		}
	};
	const save = async () => {
		setSaving(true);
		setFailed(false);
		setSaveError("");
		const errors = [];
		try {
			const keyFields = [
				["anysearchApiKey", anysearchKey],
				["exaApiKey", exaKey],
				["tavilyApiKey", tavilyKey],
				["keenableApiKey", keenableKey],
				["firecrawlApiKey", firecrawlKey],
				["parallelApiKey", parallelKey],
				["perplexityApiKey", perplexityKey],
				["deepseekApiKey", deepseekKey],
				["serpbaseApiKey", serpbaseKey],
				["serplyApiKey", serplyKey],
				["youcomApiKey", youcomKey],
				["baiduApiKey", baiduKey],
				["kimiApiKey", kimiKey],
				["aliyunApiKey", aliyunKey],
				["doubaoApiKey", doubaoKey],
				["openaiApiKey", openaiKey],
				["geminiApiKey", geminiKey],
				["claudeApiKey", claudeKey],
				["zhihuApiKey", zhihuKey],
				["zhipuApiKey", zhipuKey],
				["bochaApiKey", bochaKey],
				["metasoApiKey", metasoKey],
				["grokApiKey", grokKey]
			];
			if (keyStorage === "credentials") for (const [field, value] of keyFields) {
				if (!value.trim()) continue;
				const r = await bridgeCredentialsSet(field, value.trim());
				if (!r || !r.ok) {
					const code = r && r.code || "error";
					const msg = r && r.message || "";
					errors.push(`credentials-set ${field}: ${code}${msg ? " — " + msg : ""}`);
				}
			}
			const ops = [{
				op: "set",
				path: ["provider"],
				value: provider
			}];
			ops.push({
				op: "set",
				path: ["disabledEngines"],
				value: disabledEngines
			});
			ops.push({
				op: "set",
				path: ["fallbackOrder"],
				value: normalizeFallbackOrder(fallbackOrder)
			});
			ops.push({
				op: "set",
				path: ["fallbackOn"],
				value: normalizeFallbackOn(fallbackOn)
			});
			ops.push({
				op: "set",
				path: ["lang"],
				value: lang
			});
			ops.push({
				op: "set",
				path: ["keyStorage"],
				value: keyStorage
			});
			ops.push({
				op: "set",
				path: ["safeSearch"],
				value: safeSearch
			});
			ops.push({
				op: "set",
				path: ["bingMarket"],
				value: bingMarket
			});
			ops.push({
				op: "set",
				path: ["searxngMode"],
				value: searxngMode
			});
			if (searxngMode === "local") ops.push({
				op: "set",
				path: ["searxngLocalUrl"],
				value: (searxngLocalUrl || "").trim() || "http://localhost:8080"
			});
			if (searxngMode === "custom") {
				const searxngList = [...new Set(searxngInstancesText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))];
				ops.push({
					op: "set",
					path: ["searxngInstances"],
					value: searxngList
				});
			}
			if (keyStorage !== "credentials") {
				for (const [field, value] of keyFields) if (value.trim()) ops.push({
					op: "set",
					path: [field],
					value: value.trim()
				});
			}
			ops.push({
				op: "set",
				path: ["platforms"],
				value: platforms
			});
			ops.push({
				op: "set",
				path: ["cacheTtl"],
				value: Math.min(Math.max(Number(cacheTtl) ?? 5, 0), 5)
			});
			ops.push({
				op: "set",
				path: ["blockSystemSearch"],
				value: blockSystemSearch
			});
			ops.push({
				op: "set",
				path: ["autoRestoreOnDispose"],
				value: autoRestoreOnDispose
			});
			ops.push({
				op: "set",
				path: ["fetchTakeover"],
				value: fetchTakeover
			});
			ops.push({
				op: "set",
				path: ["browserFetchTier"],
				value: browserFetchTier
			});
			ops.push({
				op: "set",
				path: ["browserFetchAllowHosts"],
				value: String(browserFetchAllowHosts).trim()
			});
			ops.push({
				op: "set",
				path: ["deepseekToolsBaseUrl"],
				value: String(deepseekToolsBaseUrl).trim()
			});
			ops.push({
				op: "set",
				path: ["advanceFetchEnabled"],
				value: advanceFetchEnabled
			});
			ops.push({
				op: "set",
				path: ["advanceFetchAllowPrivate"],
				value: advanceFetchAllowPrivate
			});
			ops.push({
				op: "set",
				path: ["searxngLanguage"],
				value: searxngLang
			});
			const result = await bridgeMutate({
				ns: NS,
				ops
			});
			if (!result || !result.ok) {
				const code = result && result.code || "error";
				const msg = result && result.message || "";
				errors.push(`mutate: ${code}${msg ? " — " + msg : ""}`);
			}
			if (errors.length === 0) {
				setDirty(false);
				setProvider(result.value.value.provider ?? provider);
				setFailed(false);
				setSaveError("");
				load();
			} else {
				const detail = errors.join("; ");
				setFailed(true);
				setSaveError(detail);
				console.error("[dsh-union-search] save failed:", detail);
			}
		} catch (e) {
			const msg = e && e.message ? e.message : String(e);
			setFailed(true);
			setSaveError(`exception: ${msg}`);
			console.error("[dsh-union-search] save exception:", e);
		} finally {
			setSaving(false);
		}
	};
	const discard = () => {
		load();
		setDirty(false);
		setFailed(false);
		setSaveError("");
	};
	const runTest = async () => {
		setTesting(true);
		setTestResult(null);
		setFailed(false);
		setSaveError("");
		try {
			const result = await bridgeRawSearch({
				query: "DeepSeek Harness",
				maxResults: 2,
				engine: provider
			});
			if (result.ok) {
				const sources = result.value.sources ?? [];
				setTestResult({
					ok: true,
					count: sources.length,
					engine: result.value.provider === "multi_search" ? "multi" : result.value.provider ?? provider,
					content: result.value.content ?? "",
					sample: sources[0]?.title ?? ""
				});
			} else setTestResult({
				ok: false,
				error: result.message ?? "unknown error"
			});
		} catch {
			setTestResult({
				ok: false,
				error: "request failed"
			});
		} finally {
			setTesting(false);
		}
	};
	const runCheckUpdate = async () => {
		setCheckingUpdate(true);
		setUpdateInfo(null);
		setFailed(false);
		setSaveError("");
		try {
			const result = await bridgeCheckUpdate();
			if (result.ok) setUpdateInfo({
				ok: true,
				...result.value
			});
			else setUpdateInfo({ ok: false });
		} catch {
			setUpdateInfo({ ok: false });
		} finally {
			setCheckingUpdate(false);
		}
	};
	const runUpdate = async () => {
		setUpgrading(true);
		setUpdateInfo(null);
		setFailed(false);
		setSaveError("");
		try {
			const result = await (await fetch(`${BRIDGE_PREFIX}/update`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: "{}"
			})).json();
			if (result.ok) setUpdateInfo({
				ok: true,
				hasUpdate: false,
				upgraded: true,
				message: result.value.message,
				latest: result.value.latest
			});
			else setUpdateInfo({
				ok: false,
				upgradeFailed: result.message ?? "upgrade failed"
			});
		} catch {
			setUpdateInfo({
				ok: false,
				upgradeFailed: "request failed"
			});
		} finally {
			setUpgrading(false);
		}
	};
	if (state.status === "loading") return null;
	const ready = state.status === "ready";
	const t = tt(lang);
	const title = "Union Search";
	const description = t.description;
	const enabledEngineCount = ENGINES.filter((e) => e.id !== "auto" && e.id !== "multi" && !disabledEngines.includes(e.id)).length;
	const currentEngine = ENGINES.find((e) => e.id === provider) ?? ENGINES.find((e) => e.id === "bing") ?? ENGINES[0];
	const moveFallbackEngine = (engineId, delta) => {
		setFallbackOrder((prev) => {
			const next = normalizeFallbackOrder(prev);
			const from = next.indexOf(engineId);
			const to = from + delta;
			if (from < 0 || to < 0 || to >= next.length) return next;
			[next[from], next[to]] = [next[to], next[from]];
			return next;
		});
		setDirty(true);
		setFailed(false);
		setSaveError("");
	};
	const badgeClass = currentEngine.badge === "AUTO" ? "dshfs-badge dshfs-badgeAuto" : currentEngine.badge === "MULTI" ? "dshfs-badge dshfs-badgeMulti" : currentEngine.badge === "FREE" ? "dshfs-badge dshfs-badgeFree" : "dshfs-badge dshfs-badgeKey";
	const priceBadge = !currentEngine.price ? null : react_jsx_runtime.jsx("span", {
		className: "dshfs-badge dshfs-badgePrice",
		title: (lang === "zh" ? currentEngine.noteZh : currentEngine.noteEn) || currentEngine.price,
		children: currentEngine.price
	});
	const priceTag = (id) => {
		const e = ENGINES.find((x) => x.id === id);
		return !e || !e.price ? null : react_jsx_runtime.jsx("span", {
			className: "dshfs-badge dshfs-badgePrice",
			title: (lang === "zh" ? e.noteZh : e.noteEn) || e.price,
			children: e.price
		});
	};
	const toggleLang = () => {
		setLang((prev) => prev === "en" ? "zh" : "en");
		setDirty(true);
		setFailed(false);
		setSaveError("");
	};
	return react_jsx_runtime.jsx("li", {
		className: (open ? "dshfs-card dshfs-cardOpen" : "dshfs-card") + (pageMode ? " dshfs-pageMode" : ""),
		children: [react_jsx_runtime.jsx("button", {
			type: "button",
			className: "dshfs-header",
			"aria-expanded": pageMode ? void 0 : open,
			onClick: pageMode ? void 0 : () => setOpen(!open),
			children: [
				react_jsx_runtime.jsx("span", {
					className: "dshfs-headText",
					children: [react_jsx_runtime.jsx("span", {
						className: "dshfs-name",
						children: title
					}), react_jsx_runtime.jsx("span", {
						className: "dshfs-description",
						children: description
					})]
				}),
				react_jsx_runtime.jsx("span", {
					className: badgeClass,
					children: currentEngine.badge
				}),
				priceBadge,
				dirty ? react_jsx_runtime.jsx("span", {
					className: "dshfs-pending",
					children: t.unsaved
				}) : null,
				react_jsx_runtime.jsx("button", {
					type: "button",
					className: "dshfs-btn dshfs-langToggle",
					onClick: (e) => {
						e.stopPropagation();
						toggleLang();
					},
					children: t.toggleLang
				}),
				react_jsx_runtime.jsx("span", {
					className: open ? "dshfs-chevron dshfs-chevronOpen" : "dshfs-chevron",
					children: "▾"
				})
			]
		}), open ? react_jsx_runtime.jsx("div", {
			className: "dshfs-body",
			children: [
				react_jsx_runtime.jsx(GuideRestartButton, {
					key: "guide-restart",
					ns: GUIDE_NS,
					locale: lang,
					style: { marginBottom: 8 },
					onOpen: () => setGuideOpen(true)
				}),
				guideOpen ? react_jsx_runtime.jsx(GuidePanel, {
					ns: GUIDE_NS,
					locale: lang,
					steps: guideSteps(UNION_SEARCH_GUIDE_STEPS, guideLocale(lang)),
					onClose: () => setGuideOpen(false)
				}) : null,
				react_jsx_runtime.jsx(Section, {
					id: "engines",
					title: t.sec_engines,
					defaultOpen: true,
					children: [
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: [
										t.searchEngine,
										react_jsx_runtime.jsx("span", {
											className: badgeClass,
											children: currentEngine.badge
										}),
										priceBadge
									]
								}),
								react_jsx_runtime.jsx("select", {
									className: "dshfs-select",
									value: provider,
									style: { colorScheme: selectColorScheme },
									disabled: !ready || saving,
									onChange: (e) => select(e.target.value),
									children: ENGINES.map((engine) => react_jsx_runtime.jsx("option", {
										value: engine.id,
										disabled: engine.id !== "auto" && engine.id !== "multi" && disabledEngines.includes(engine.id),
										children: `${engine.label} (${engine.badge})${engine.price ? " · " + engine.price : ""}${engine.id !== "auto" && engine.id !== "multi" && disabledEngines.includes(engine.id) ? " · DISABLED" : ""}`
									}, engine.id))
								}),
								currentEngine.link ? react_jsx_runtime.jsx("a", {
									className: "dshfs-link",
									href: currentEngine.link,
									target: "_blank",
									rel: "noopener noreferrer",
									children: currentEngine.badge === "FREE" ? t.visit : t.getKey
								}) : null,
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.engineHint
								})
							]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.engineEnable
								}),
								react_jsx_runtime.jsx("div", {
									className: "dshfs-platforms",
									children: ENGINES.filter((engine) => engine.id !== "auto" && engine.id !== "multi").map((engine) => {
										const enabled = !disabledEngines.includes(engine.id);
										const lastEnabled = enabled && enabledEngineCount <= 1;
										return react_jsx_runtime.jsx("label", {
											className: "dshfs-platform",
											children: [react_jsx_runtime.jsx("input", {
												type: "checkbox",
												checked: enabled,
												disabled: !ready || saving || lastEnabled,
												onChange: (e) => {
													const nextEnabled = e.target.checked;
													setDisabledEngines((prev) => {
														return nextEnabled ? prev.filter((id) => id !== engine.id) : [.../* @__PURE__ */ new Set([...prev, engine.id])];
													});
													if (!nextEnabled && provider === engine.id) setProvider("auto");
													setDirty(true);
													setFailed(false);
													setSaveError("");
												}
											}), `${engine.label} (${engine.badge})${engine.price ? " · " + engine.price : ""}`]
										}, engine.id);
									})
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.engineEnableHint
								})
							]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.fallbackPriority
								}),
								react_jsx_runtime.jsx("div", {
									className: "dshfs-priorityList",
									children: fallbackOrder.map((engineId, index) => {
										const engine = ENGINES.find((item) => item.id === engineId);
										if (!engine) return null;
										const isDisabled = disabledEngines.includes(engineId);
										return react_jsx_runtime.jsx("div", {
											className: "dshfs-priorityRow" + (isDisabled ? " dshfs-priorityRowDisabled" : ""),
											children: [
												react_jsx_runtime.jsx("span", {
													className: "dshfs-priorityIndex",
													children: String(index + 1)
												}),
												react_jsx_runtime.jsx("span", {
													className: "dshfs-priorityName",
													children: `${engine.label} (${engine.badge})${engine.price ? " · " + engine.price : ""}${isDisabled ? " · " + t.priorityDisabled : ""}`
												}),
												react_jsx_runtime.jsx("span", {
													className: "dshfs-priorityActions",
													children: [react_jsx_runtime.jsx("button", {
														type: "button",
														className: "dshfs-btn dshfs-priorityBtn",
														disabled: !ready || saving || index === 0,
														onClick: () => moveFallbackEngine(engineId, -1),
														"aria-label": `${engine.label} ↑`,
														title: "↑",
														children: "↑"
													}, "up"), react_jsx_runtime.jsx("button", {
														type: "button",
														className: "dshfs-btn dshfs-priorityBtn",
														disabled: !ready || saving || index === fallbackOrder.length - 1,
														onClick: () => moveFallbackEngine(engineId, 1),
														"aria-label": `${engine.label} ↓`,
														title: "↓",
														children: "↓"
													}, "down")]
												})
											]
										}, engineId);
									})
								}),
								react_jsx_runtime.jsx("div", { children: react_jsx_runtime.jsx("button", {
									type: "button",
									className: "dshfs-btn",
									disabled: !ready || saving || fallbackOrder.join(",") === DEFAULT_FALLBACK_ORDER.join(","),
									onClick: () => {
										setFallbackOrder(DEFAULT_FALLBACK_ORDER.slice());
										setDirty(true);
										setFailed(false);
										setSaveError("");
									},
									children: t.fallbackPriorityReset
								}) }),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.fallbackPriorityHint
								})
							]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.fallbackOnLabel
								}),
								react_jsx_runtime.jsx("div", {
									className: "dshfs-platforms",
									children: FAILURE_CLASSES.map((cls) => {
										const checked = fallbackOn.includes(cls.id);
										return react_jsx_runtime.jsx("label", {
											className: "dshfs-platform",
											children: [react_jsx_runtime.jsx("input", {
												type: "checkbox",
												checked,
												disabled: !ready || saving,
												onChange: (e) => {
													const on = e.target.checked;
													setFallbackOn((prev) => on ? [.../* @__PURE__ */ new Set([...prev, cls.id])] : prev.filter((id) => id !== cls.id));
													setDirty(true);
													setFailed(false);
													setSaveError("");
												}
											}), t[cls.labelKey]]
										}, cls.id);
									})
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.fallbackOnHint
								})
							]
						})
					]
				}),
				react_jsx_runtime.jsx(Section, {
					id: "behavior",
					title: t.sec_behavior,
					defaultOpen: false,
					children: [
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.safeSearchLabel
								}),
								react_jsx_runtime.jsx("select", {
									className: "dshfs-select",
									value: safeSearch,
									style: { colorScheme: selectColorScheme },
									disabled: !ready || saving,
									onChange: (e) => setSafeSearch(e.target.value),
									children: [
										react_jsx_runtime.jsx("option", {
											value: "off",
											children: t.safeSearchOff
										}, "off"),
										react_jsx_runtime.jsx("option", {
											value: "moderate",
											children: t.safeSearchModerate
										}, "moderate"),
										react_jsx_runtime.jsx("option", {
											value: "strict",
											children: t.safeSearchStrict
										}, "strict")
									]
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.safeSearchHint
								})
							]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.bingMarketLabel
								}),
								react_jsx_runtime.jsx("select", {
									className: "dshfs-select",
									value: bingMarket,
									style: { colorScheme: selectColorScheme },
									disabled: !ready || saving,
									onChange: (e) => setBingMarket(e.target.value),
									children: [
										react_jsx_runtime.jsx("option", {
											value: "zh-CN",
											children: t.marketZhCN
										}, "zh-CN"),
										react_jsx_runtime.jsx("option", {
											value: "zh-TW",
											children: t.marketZhTW
										}, "zh-TW"),
										react_jsx_runtime.jsx("option", {
											value: "en-US",
											children: t.marketEnUS
										}, "en-US"),
										react_jsx_runtime.jsx("option", {
											value: "en-GB",
											children: t.marketEnGB
										}, "en-GB"),
										react_jsx_runtime.jsx("option", {
											value: "ru-RU",
											children: t.marketRuRU
										}, "ru-RU"),
										react_jsx_runtime.jsx("option", {
											value: "ja-JP",
											children: t.marketJaJP
										}, "ja-JP"),
										react_jsx_runtime.jsx("option", {
											value: "de-DE",
											children: t.marketDeDE
										}, "de-DE"),
										react_jsx_runtime.jsx("option", {
											value: "fr-FR",
											children: t.marketFrFR
										}, "fr-FR"),
										react_jsx_runtime.jsx("option", {
											value: "es-ES",
											children: t.marketEsES
										}, "es-ES"),
										react_jsx_runtime.jsx("option", {
											value: "ko-KR",
											children: t.marketKoKR
										}, "ko-KR")
									]
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.bingMarketHint
								})
							]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.searxngInstancesLabel
								}),
								react_jsx_runtime.jsx("select", {
									className: "dshfs-select",
									value: searxngMode,
									style: { colorScheme: selectColorScheme },
									disabled: !ready || saving,
									onChange: (e) => {
										setSearxngMode(e.target.value);
										setSearxngProbeResults(null);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									},
									children: [
										react_jsx_runtime.jsx("option", {
											value: "public",
											children: t.searxngModePublic
										}, "public"),
										react_jsx_runtime.jsx("option", {
											value: "local",
											children: t.searxngModeLocal
										}, "local"),
										react_jsx_runtime.jsx("option", {
											value: "custom",
											children: t.searxngModeCustom
										}, "custom")
									]
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.searxngModeHint
								}),
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.searxngLanguageLabel
								}),
								react_jsx_runtime.jsx("select", {
									className: "dshfs-select",
									value: searxngLang,
									disabled: !ready || saving,
									onChange: (e) => {
										setSearxngLang(e.target.value);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									},
									children: [
										"auto",
										"zh-CN",
										"zh-TW",
										"en",
										"ja",
										"ko",
										"ru",
										"de",
										"fr",
										"es",
										"all"
									].map((v) => react_jsx_runtime.jsx("option", {
										value: v,
										children: v === "auto" ? t.searxngLanguageAuto : v
									}, v))
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.searxngLanguageHint
								}),
								searxngMode === "local" ? react_jsx_runtime.jsx("input", {
									className: "dshfs-input",
									type: "text",
									placeholder: t.searxngLocalUrlPh,
									value: searxngLocalUrl,
									disabled: !ready || saving,
									onChange: (e) => {
										setSearxngLocalUrl(e.target.value);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}) : null,
								searxngMode === "custom" ? react_jsx_runtime.jsx("textarea", {
									className: "dshfs-input",
									rows: 4,
									placeholder: t.searxngCustomPh,
									value: searxngInstancesText,
									disabled: !ready || saving,
									style: {
										colorScheme: selectColorScheme,
										height: "auto",
										minHeight: "88px",
										paddingTop: "8px",
										paddingBottom: "8px",
										fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
										fontSize: "13px",
										resize: "vertical"
									},
									onChange: (e) => {
										setSearxngInstancesText(e.target.value);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}) : null,
								searxngMode === "custom" && !searxngInstancesText.trim() && provider === "searxng" ? react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									style: {
										color: "#b26a00",
										whiteSpace: "normal"
									},
									children: t.searxngCustomEmptyWarn
								}, "searxng-custom-empty-warn") : null,
								searxngMode === "local" ? react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.searxngLocalHint
								}) : null,
								react_jsx_runtime.jsx("div", {
									className: "dshfs-footer",
									children: [react_jsx_runtime.jsx("button", {
										className: "dshfs-btn",
										type: "button",
										disabled: !ready || saving || searxngProbing,
										onClick: () => {
											runSearxngProbe();
										},
										children: searxngProbing ? t.searxngProbing : t.searxngProbe
									}, "searxng-probe-btn"), react_jsx_runtime.jsx("button", {
										className: "dshfs-btn",
										type: "button",
										disabled: !ready || saving || !dirty,
										onClick: () => {
											save();
										},
										children: saving ? t.saving : t.save
									}, "searxng-save-btn")]
								}),
								searxngProbeResults && searxngProbeResults.length > 0 ? react_jsx_runtime.jsx("div", { children: searxngProbeResults.map((r, i) => react_jsx_runtime.jsx("div", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: 8
									},
									children: [react_jsx_runtime.jsx("p", {
										className: "dshfs-hint",
										style: {
											color: r.ok ? "#1a7f37" : "#c62828",
											whiteSpace: "normal",
											margin: 0,
											flex: "1 1 auto",
											minWidth: 0
										},
										children: searxngProbeLine(r)
									}, "searxng-probe-" + i), r.ok && r.url ? react_jsx_runtime.jsx("button", {
										className: "dshfs-btn",
										type: "button",
										style: {
											height: 26,
											padding: "0 10px",
											fontSize: 12,
											flexShrink: 0
										},
										disabled: !ready || saving,
										onClick: () => {
											useAsPrimary(r.url);
										},
										children: t.searxngUsePrimary
									}, "searxng-probe-use-" + i) : null]
								}, "searxng-probe-row-" + i)) }, "searxng-probe-results") : null,
								searxngPrimaryHint ? react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									style: {
										color: "#b26a00",
										whiteSpace: "normal"
									},
									children: searxngPrimaryHint
								}, "searxng-primary-hint") : null
							]
						}, "searxng-field"),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("div", {
									className: "dshfs-label",
									children: t.cacheTtl
								}),
								react_jsx_runtime.jsx("input", {
									className: "dshfs-input dshfs-ttl",
									type: "number",
									min: 0,
									max: 5,
									step: 1,
									value: cacheTtl,
									disabled: !ready || saving,
									onChange: (e) => {
										setCacheTtl(Number(e.target.value));
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.cacheTtlHint
								})
							]
						})
					]
				}),
				react_jsx_runtime.jsx(Section, {
					id: "keys",
					title: t.sec_keys,
					defaultOpen: true,
					children: [react_jsx_runtime.jsx("div", {
						className: "dshfs-field",
						children: [
							react_jsx_runtime.jsx("div", {
								className: "dshfs-label",
								children: t.apiKeys
							}),
							priceTag("anysearch"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.anysearchPh(keysConfigured.anysearch),
								value: anysearchKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setAnysearchKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("exa"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.exaPh(keysConfigured.exa),
								value: exaKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setExaKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("tavily"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.tavilyPh(keysConfigured.tavily),
								value: tavilyKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setTavilyKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("keenable"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.keenablePh(keysConfigured.keenable),
								value: keenableKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setKeenableKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("firecrawl"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.firecrawlPh(keysConfigured.firecrawl),
								value: firecrawlKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setFirecrawlKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("parallel"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.parallelPh(keysConfigured.parallel),
								value: parallelKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setParallelKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("perplexity"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.perplexityPh(keysConfigured.perplexity),
								value: perplexityKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setPerplexityKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("serpbase"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.serpbasePh(keysConfigured.serpbase),
								value: serpbaseKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setSerpbaseKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("serply"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.serplyPh(keysConfigured.serply),
								value: serplyKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setSerplyKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("you"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.youcomPh(keysConfigured.youcom),
								value: youcomKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setYoucomKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("deepseek-official"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.deepseekPh(keysConfigured.deepseek),
								value: deepseekKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setDeepseekKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.deepseekToolsBaseUrl
							}),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "text",
								placeholder: "https://api.deepseek.com/v1/tools/search",
								value: deepseekToolsBaseUrl,
								disabled: !ready || saving,
								onChange: (e) => {
									setDeepseekToolsBaseUrl(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.deepseekToolsBaseUrlHint
							}),
							priceTag("baidu"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.baiduPh(keysConfigured.baidu),
								value: baiduKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setBaiduKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("kimi"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.kimiPh(keysConfigured.kimi),
								value: kimiKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setKimiKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("aliyun"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.aliyunPh(keysConfigured.aliyun),
								value: aliyunKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setAliyunKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("doubao"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.doubaoPh(keysConfigured.doubao),
								value: doubaoKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setDoubaoKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("openai"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.openaiPh(keysConfigured.openai),
								value: openaiKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setOpenaiKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("gemini"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.geminiPh(keysConfigured.gemini),
								value: geminiKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setGeminiKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("claude"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.claudePh(keysConfigured.claude),
								value: claudeKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setClaudeKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("zhihu_global"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.zhihuPh(keysConfigured.zhihu),
								value: zhihuKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setZhihuKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("zhipu"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.zhipuPh(keysConfigured.zhipu),
								value: zhipuKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setZhipuKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("bocha"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.bochaPh(keysConfigured.bocha),
								value: bochaKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setBochaKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("metaso"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.metasoPh(keysConfigured.metaso),
								value: metasoKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setMetasoKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							priceTag("grok"),
							react_jsx_runtime.jsx("input", {
								className: "dshfs-input",
								type: "password",
								placeholder: t.grokPh(keysConfigured.grok),
								value: grokKey,
								disabled: !ready || saving,
								onChange: (e) => {
									setGrokKey(e.target.value);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}),
							react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.keysHint
							}),
							react_jsx_runtime.jsx("div", {
								className: "dshfs-fieldRow",
								children: [react_jsx_runtime.jsx("label", {
									className: "dshfs-label",
									children: t.keyStorage
								}), react_jsx_runtime.jsx("select", {
									className: "dshfs-select dshfs-keyStorage",
									value: keyStorage,
									style: { colorScheme: selectColorScheme },
									disabled: !ready || saving,
									onChange: (e) => {
										setKeyStorage(e.target.value);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									},
									children: [react_jsx_runtime.jsx("option", {
										value: "credentials",
										children: t.keyStorageCred
									}), react_jsx_runtime.jsx("option", {
										value: "settings",
										children: t.keyStorageSettings
									})]
								})]
							}),
							react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: keyStorage === "credentials" ? t.keyStorageCredHint(credConfigured) : t.keyStorageSettingsHint
							})
						]
					})]
				}),
				react_jsx_runtime.jsx(Section, {
					id: "platform",
					title: t.sec_platform,
					defaultOpen: false,
					children: [react_jsx_runtime.jsx("div", {
						className: "dshfs-field",
						children: [
							react_jsx_runtime.jsx("div", {
								className: "dshfs-label",
								children: t.platformSearch
							}),
							react_jsx_runtime.jsx("div", {
								className: "dshfs-platforms",
								children: [
									["github", "GitHub"],
									["v2ex", "V2EX"],
									["bilibili", "Bilibili"],
									["reddit", "Reddit"],
									["hn", "Hacker News"],
									["stackoverflow", "Stack Overflow"],
									["wikipedia", "Wikipedia"],
									["npm", "npm"],
									["youtube", "YouTube"],
									["vimeo", "Vimeo"]
								].map(([id, label]) => react_jsx_runtime.jsx("label", {
									className: "dshfs-platform",
									children: [react_jsx_runtime.jsx("input", {
										type: "checkbox",
										checked: platforms.includes(id),
										disabled: !ready || saving,
										onChange: (e) => {
											setPlatforms((prev) => e.target.checked ? [...prev, id] : prev.filter((p) => p !== id));
											setDirty(true);
											setFailed(false);
											setSaveError("");
										}
									}), label]
								}, id))
							}),
							react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.platformHint
							})
						]
					})]
				}),
				react_jsx_runtime.jsx(Section, {
					id: "block",
					title: t.sec_block,
					defaultOpen: false,
					children: [react_jsx_runtime.jsx("div", {
						className: "dshfs-field",
						children: [react_jsx_runtime.jsx("label", {
							className: "dshfs-platform",
							children: [react_jsx_runtime.jsx("input", {
								type: "checkbox",
								checked: blockSystemSearch,
								disabled: !ready || saving,
								onChange: (e) => {
									setBlockSystemSearch(e.target.checked);
									setDirty(true);
									setFailed(false);
									setSaveError("");
								}
							}), t.blockSystemSearch]
						}), react_jsx_runtime.jsx("p", {
							className: "dshfs-hint",
							children: t.blockSystemSearchHint
						})]
					}), react_jsx_runtime.jsx("div", {
						className: "dshfs-field",
						children: [
							react_jsx_runtime.jsx("label", {
								className: "dshfs-platform",
								children: [react_jsx_runtime.jsx("input", {
									type: "checkbox",
									checked: autoRestoreOnDispose,
									disabled: !ready || saving,
									onChange: (e) => {
										setAutoRestoreOnDispose(e.target.checked);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}), t.autoRestoreOnDispose]
							}),
							react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.autoRestoreOnDisposeHint
							}),
							takeoverStatus && takeoverStatus.ran ? react_jsx_runtime.jsx("p", {
								className: "dshfs-hint" + (takeoverStatus.state === "dangling" ? " dshfs-danger" : ""),
								children: (takeoverStatus.state === "dangling" ? t.takeoverDangling : takeoverStatus.state === "foreign" ? t.takeoverForeign : t.takeoverOk) + (takeoverStatus.search && takeoverStatus.search.value || takeoverStatus.fetch && takeoverStatus.fetch.value ? " — " + t.takeoverPinnedBy + ": " + [takeoverStatus.search ? "searchProvider=" + (takeoverStatus.search.value || "-") + " (" + takeoverStatus.search.kind + ")" : "", takeoverStatus.fetch ? "fetchProvider=" + (takeoverStatus.fetch.value || "-") + " (" + takeoverStatus.fetch.kind + ")" : ""].filter(Boolean).join(", ") : "")
							}) : null
						]
					})]
				}),
				react_jsx_runtime.jsx(Section, {
					id: "fetch",
					title: t.sec_fetch,
					defaultOpen: false,
					children: [
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [react_jsx_runtime.jsx("label", {
								className: "dshfs-platform",
								children: [react_jsx_runtime.jsx("input", {
									type: "checkbox",
									checked: fetchTakeover,
									disabled: !ready || saving,
									onChange: (e) => {
										setFetchTakeover(e.target.checked);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}), t.fetchTakeover]
							}), react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.fetchTakeoverHint
							})]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [
								react_jsx_runtime.jsx("label", {
									className: "dshfs-platform",
									children: [react_jsx_runtime.jsx("input", {
										type: "checkbox",
										checked: browserFetchTier,
										disabled: !ready || saving,
										onChange: (e) => {
											setBrowserFetchTier(e.target.checked);
											setDirty(true);
											setFailed(false);
											setSaveError("");
										}
									}), t.browserFetchTier]
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.browserFetchTierHint
								}),
								react_jsx_runtime.jsx("input", {
									type: "text",
									className: "dshfs-input",
									placeholder: "linkedin.com,weibo.com",
									value: browserFetchAllowHosts,
									disabled: !ready || saving || !browserFetchTier,
									onChange: (e) => {
										setBrowserFetchAllowHosts(e.target.value);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}),
								react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									children: t.browserFetchAllowHostsHint
								})
							]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [react_jsx_runtime.jsx("label", {
								className: "dshfs-platform",
								children: [react_jsx_runtime.jsx("input", {
									type: "checkbox",
									checked: advanceFetchEnabled,
									disabled: !ready || saving,
									onChange: (e) => {
										setAdvanceFetchEnabled(e.target.checked);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}), t.advanceFetchEnabled]
							}), react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.advanceFetchEnabledHint
							})]
						}),
						react_jsx_runtime.jsx("div", {
							className: "dshfs-field",
							children: [react_jsx_runtime.jsx("label", {
								className: "dshfs-platform",
								children: [react_jsx_runtime.jsx("input", {
									type: "checkbox",
									checked: advanceFetchAllowPrivate,
									disabled: !ready || saving,
									onChange: (e) => {
										setAdvanceFetchAllowPrivate(e.target.checked);
										setDirty(true);
										setFailed(false);
										setSaveError("");
									}
								}), t.advanceFetchAllowPrivate]
							}), react_jsx_runtime.jsx("p", {
								className: "dshfs-hint",
								children: t.advanceFetchAllowPrivateHint
							})]
						})
					]
				}),
				react_jsx_runtime.jsx("div", {
					className: "dshfs-resultRow",
					children: [failed ? react_jsx_runtime.jsx("span", {
						className: "dshfs-failed",
						children: saveError ? t.saveFailedDetail(saveError) : t.saveFailed
					}) : null, testResult ? react_jsx_runtime.jsx("span", {
						className: testResult.ok ? "dshfs-testOk" : "dshfs-failed",
						children: testResult.ok ? t.testOk(testResult) : t.testFail(testResult.error)
					}) : null]
				}),
				!ready ? react_jsx_runtime.jsx("p", {
					className: "dshfs-hint",
					children: t.unavailable
				}) : null,
				react_jsx_runtime.jsx(Section, {
					id: "update",
					title: t.sec_update,
					defaultOpen: false,
					children: [react_jsx_runtime.jsx("div", {
						className: "dshfs-footer",
						children: [
							react_jsx_runtime.jsx("div", {
								className: "dshfs-footerLeft",
								children: [
									react_jsx_runtime.jsx("span", {
										className: "dshfs-version",
										children: "v0.9.28"
									}),
									updateInfo && updateInfo.ok && updateInfo.hasUpdate && !updateInfo.installable ? react_jsx_runtime.jsx("a", {
										className: "dshfs-updatePill",
										href: updateInfo.updateUrl,
										target: "_blank",
										rel: "noopener noreferrer",
										title: t.updateAvailable(updateInfo.current, updateInfo.latest),
										children: [react_jsx_runtime.jsx("svg", {
											className: "dshfs-updateIcon",
											viewBox: "0 0 16 16",
											width: 14,
											height: 14,
											"aria-hidden": "true",
											children: react_jsx_runtime.jsx("path", {
												d: "M8 2.2v6.4M5.2 6.4 8 9.2l2.8-2.8M3 10.8v1.4c0 .9.7 1.6 1.6 1.6h6.8c.9 0 1.6-.7 1.6-1.6v-1.4",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: 1.6,
												strokeLinecap: "round",
												strokeLinejoin: "round"
											})
										}), t.hasUpdate]
									}) : react_jsx_runtime.jsx("button", {
										className: "dshfs-updatePill",
										type: "button",
										title: updateInfo && updateInfo.ok && updateInfo.hasUpdate ? t.updateAvailable(updateInfo.current, updateInfo.latest) : void 0,
										onClick: updateInfo && updateInfo.ok && updateInfo.hasUpdate ? runUpdate : runCheckUpdate,
										disabled: upgrading || checkingUpdate || saving || !ready,
										children: [react_jsx_runtime.jsx("svg", {
											className: "dshfs-updateIcon",
											viewBox: "0 0 16 16",
											width: 14,
											height: 14,
											"aria-hidden": "true",
											children: react_jsx_runtime.jsx("path", {
												d: "M8 2.2v6.4M5.2 6.4 8 9.2l2.8-2.8M3 10.8v1.4c0 .9.7 1.6 1.6 1.6h6.8c.9 0 1.6-.7 1.6-1.6v-1.4",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: 1.6,
												strokeLinecap: "round",
												strokeLinejoin: "round"
											})
										}), upgrading ? t.upgrading : checkingUpdate ? t.checkingUpdate : updateInfo && updateInfo.ok && updateInfo.hasUpdate ? t.hasUpdate : t.checkUpdate]
									}),
									updateInfo && updateInfo.ok ? updateInfo.upgraded ? react_jsx_runtime.jsx("span", {
										className: "dshfs-updateOk",
										children: t.upgradeDone(updateInfo.latest)
									}) : updateInfo.hasUpdate ? updateInfo.installable ? null : react_jsx_runtime.jsx("span", {
										className: "dshfs-version",
										children: t.upgradeLinkMode
									}) : react_jsx_runtime.jsx("span", {
										className: "dshfs-updateOk",
										children: t.updateLatest(updateInfo.current)
									}) : updateInfo && !updateInfo.ok ? react_jsx_runtime.jsx("span", {
										className: "dshfs-failed",
										children: updateInfo.upgradeFailed ? t.upgradeFailed(updateInfo.upgradeFailed) : t.updateCheckFailed
									}) : null
								]
							}),
							react_jsx_runtime.jsx("div", {
								className: "dshfs-footerRight",
								children: [
									react_jsx_runtime.jsx("button", {
										className: "dshfs-btn",
										type: "button",
										onClick: runTest,
										disabled: testing || testingAll || saving || !ready,
										children: testing ? t.testing : t.testEngine
									}),
									react_jsx_runtime.jsx("button", {
										className: "dshfs-btn",
										type: "button",
										onClick: () => {
											runTestAllEngines();
										},
										disabled: testingAll || testing || saving || !ready,
										children: testingAll ? t.testingAll : t.testAllEngines
									}),
									react_jsx_runtime.jsx("button", {
										className: "dshfs-btn",
										type: "button",
										onClick: () => {
											setProvider("bing");
											setDirty(true);
											setFailed(false);
											setSaveError("");
										},
										disabled: saving || !ready || provider === "bing" || disabledEngines.includes("bing"),
										children: t.useBing
									}),
									react_jsx_runtime.jsx("button", {
										className: "dshfs-btn",
										type: "button",
										onClick: discard,
										disabled: saving || !dirty,
										children: t.discard
									}),
									react_jsx_runtime.jsx("button", {
										className: "dshfs-btn dshfs-save",
										type: "button",
										onClick: save,
										disabled: saving || !dirty || !ready,
										children: saving ? t.saving : t.save
									})
								]
							}),
							testAllResults && testAllResults.length > 0 ? react_jsx_runtime.jsx("div", {
								style: {
									width: "100%",
									display: "flex",
									flexDirection: "column",
									gap: 2
								},
								children: [testAllResults.map((r, i) => react_jsx_runtime.jsx("p", {
									className: "dshfs-hint",
									style: {
										color: r.status === "ok" ? "#1a7f37" : r.status === "disabled" ? "#888" : "#c62828",
										whiteSpace: "normal",
										margin: 0
									},
									children: r.status === "ok" ? `✓ ${r.engine}: ${r.results}${r.engineUsed && r.engineUsed !== r.engine ? ` via ${r.engineUsed}` : ""}${r.sampleTitle ? ` · "${String(r.sampleTitle).slice(0, 40)}"` : ""}` : r.status === "disabled" ? `– ${r.engine}: disabled` : `✗ ${r.engine}: ${r.error ?? "fail"}`
								}, "test-all-" + i)), Object.keys(suggestSelection).length > 0 ? react_jsx_runtime.jsx("div", {
									style: {
										display: "flex",
										alignItems: "center",
										flexWrap: "wrap",
										gap: 10,
										marginTop: 6
									},
									children: [
										react_jsx_runtime.jsx("p", {
											className: "dshfs-hint",
											style: {
												margin: 0,
												whiteSpace: "normal",
												width: "100%"
											},
											children: t.disableSuggestHint
										}, "suggest-hint"),
										...Object.keys(suggestSelection).map((engine) => react_jsx_runtime.jsx("label", {
											style: {
												display: "inline-flex",
												alignItems: "center",
												gap: 4,
												fontSize: 13,
												cursor: "pointer"
											},
											children: [react_jsx_runtime.jsx("input", {
												type: "checkbox",
												checked: suggestSelection[engine] !== false,
												onChange: (e) => {
													setSuggestSelection({
														...suggestSelection,
														[engine]: e.target.checked
													});
												}
											}), engine]
										}, "suggest-" + engine)),
										react_jsx_runtime.jsx("button", {
											className: "dshfs-btn",
											type: "button",
											style: {
												height: 26,
												padding: "0 10px",
												fontSize: 12
											},
											disabled: saving || !ready,
											onClick: () => {
												const selected = Object.keys(suggestSelection).filter((engine) => suggestSelection[engine] !== false);
												if (selected.length > 0) {
													setDisabledEngines([.../* @__PURE__ */ new Set([...disabledEngines, ...selected])]);
													setDirty(true);
													setFailed(false);
													setSaveError("");
												}
												setSuggestSelection({});
											},
											children: t.applyDisable
										}, "suggest-apply")
									]
								}, "test-all-suggest") : null]
							}, "test-all-results") : null
						]
					})]
				})
			]
		}) : null]
	});
}

// src/client/css.ts
const css = [
	".dshfs-card{container-type:inline-size;font-family:-apple-system, \"SF Pro Text\", \"PingFang SC\", \"Segoe UI\", system-ui, sans-serif;border:1px solid rgba(0,0,0,.06);background:rgba(255,255,255,.72);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-radius:14px;min-width:0;list-style:none;transition:all 180ms cubic-bezier(.4,0,.2,1);overflow:hidden;margin-bottom:12px;box-shadow:0 1px 2px rgba(0,0,0,.04), 0 10px 30px rgba(0,0,0,.06);color:#1d1d1f}",
	"@media (prefers-color-scheme: dark){.dshfs-card{background:rgba(30,30,32,.7);border:1px solid rgba(255,255,255,.08);color:#f5f5f7;box-shadow:0 1px 2px rgba(0,0,0,.2), 0 10px 30px rgba(0,0,0,.3)}}",
	".dshfs-cardOpen{}",
	".dshfs-header{width:100%;color:inherit;cursor:pointer;text-align:left;font:inherit;background:0 0;border:0;align-items:center;gap:12px;padding:16px 20px;display:flex;transition:background 180ms cubic-bezier(.4,0,.2,1)}",
	".dshfs-header:hover:not(:disabled){background:rgba(0,0,0,.03)}",
	"@media (prefers-color-scheme: dark){.dshfs-header:hover:not(:disabled){background:rgba(255,255,255,.04)}}",
	".dshfs-pageMode>.dshfs-header{cursor:default}",
	".dshfs-pageMode>.dshfs-header:hover{background:0 0}",
	".dshfs-pageMode .dshfs-chevron{display:none}",
	".dshfs-headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex;overflow:hidden}",
	".dshfs-name{color:inherit;white-space:nowrap;text-overflow:ellipsis;font-weight:600;font-size:15px;overflow:hidden}",
	".dshfs-description{color:#6e6e73;white-space:nowrap;text-overflow:ellipsis;font-size:13px;overflow:hidden}",
	"@media (prefers-color-scheme: dark){.dshfs-description{color:#a1a1a6}}",
	".dshfs-pending{color:#e5a720;white-space:nowrap;flex:none;font-size:12px;font-weight:500}",
	".dshfs-chevron{color:#6e6e73;flex:none;font-size:14px;transition:transform 180ms cubic-bezier(.4,0,.2,1)}",
	".dshfs-chevronOpen{transform:rotate(180deg)}",
	"@media (prefers-color-scheme: dark){.dshfs-chevron{color:#a1a1a6}}",
	"@keyframes dshfsFadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}",
	".dshfs-body{flex-direction:column;gap:20px;padding:0 20px 20px;display:flex;animation:dshfsFadeIn 240ms cubic-bezier(.4,0,.2,1) forwards}",
	"@media (prefers-reduced-motion: reduce){.dshfs-body{animation:none}}",
	".dshfs-inlineSelect{max-width:260px;height:30px;font-size:12px;border-radius:8px;padding:0 8px}",
	"@container (max-width: 520px){.dshfs-header{padding:12px 14px;gap:10px}.dshfs-body{padding:0 14px 16px;gap:14px}.dshfs-name{white-space:normal;font-size:14px}.dshfs-description{white-space:normal}}",
	"@container (max-width: 380px){.dshfs-header{padding:10px 10px}.dshfs-body{padding:0 10px 12px;gap:12px}.dshfs-select,.dshfs-input{height:34px;font-size:13px}.dshfs-btn{height:30px;padding:0 10px;font-size:12px}}",
	"div:has(> section[data-plugin-config] .dshfs-card){display:flex;flex-direction:column}",
	"div:has(> section[data-plugin-config] .dshfs-card) > section[data-plugin-config]{order:2}",
	"div:has(> section[data-plugin-config] .dshfs-card) > section[data-plugin-rows]{order:1}",
	".dshfs-footer{justify-content:space-between;align-items:center;gap:12px;display:flex;flex-wrap:wrap;padding-top:4px}",
	".dshfs-footerLeft{display:flex;align-items:center;gap:12px;flex-wrap:wrap;min-width:0}",
	".dshfs-footerRight{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
	".dshfs-failed{color:#ff3b30;font-size:13px}",
	"@media (prefers-color-scheme: dark){.dshfs-failed{color:#ff453a}}",
	".dshfs-testOk{color:#34c759;font-size:13px;line-height:1.5}",
	"@media (prefers-color-scheme: dark){.dshfs-testOk{color:#30d158}}",
	".dshfs-resultRow{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0;margin-top:-4px}",
	".dshfs-field{flex-direction:column;gap:8px;min-width:0;display:flex}",
	".dshfs-label{color:inherit;font-size:14px;font-weight:500;display:flex;align-items:center;gap:8px}",
	".dshfs-select, .dshfs-input{border:1px solid rgba(0,0,0,.1);font:inherit;font-variant-numeric:tabular-nums;color:inherit;background:rgba(0,0,0,.03);border-radius:10px;padding:0 12px;height:38px;font-size:14px;transition:all 160ms cubic-bezier(.4,0,.2,1);width:100%;box-sizing:border-box}",
	"@media (prefers-color-scheme: dark){.dshfs-select, .dshfs-input{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05)}}",
	".dshfs-select{appearance:none;background-image:url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236e6e73' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}",
	"@media (prefers-color-scheme: dark){.dshfs-select{background-image:url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23a1a1a6' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")}}",
	".dshfs-select:hover:not(:disabled), .dshfs-input:hover:not(:disabled){border-color:rgba(0,0,0,.2);background:rgba(0,0,0,.05)}",
	"@media (prefers-color-scheme: dark){.dshfs-select:hover:not(:disabled), .dshfs-input:hover:not(:disabled){border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.08)}}",
	".dshfs-select:focus-visible, .dshfs-input:focus-visible{outline:none;border-color:#0071e3;box-shadow:0 0 0 3px rgba(0,113,227,.25);background:#ffffff}",
	"@media (prefers-color-scheme: dark){.dshfs-select:focus-visible, .dshfs-input:focus-visible{border-color:#0a84ff;box-shadow:0 0 0 3px rgba(10,132,255,.25);background:#1c1c1e}}",
	".dshfs-input:disabled, .dshfs-select:disabled{opacity:.5;cursor:default}",
	".dshfs-select{color-scheme:light dark}",
	".dshfs-select option, .dshfs-select optgroup{background-color:#ffffff;color:#1d1d1f}",
	"@media (prefers-color-scheme: dark){.dshfs-select{color-scheme:dark}.dshfs-select option, .dshfs-select optgroup{background-color:#1e1f24;color:#f5f5f7}}",
	".dshfs-ttl{width:100px}",
	".dshfs-fieldRow{display:flex;align-items:center;gap:12px;flex-wrap:wrap}",
	".dshfs-keyStorage{width:auto;min-width:200px}",
	".dshfs-hint{color:#6e6e73;margin:0;font-size:13px;line-height:1.4}",
	"@media (prefers-color-scheme: dark){.dshfs-hint{color:#a1a1a6}}",
	".dshfs-platforms{display:flex;gap:12px 16px;flex-wrap:wrap}",
	".dshfs-platform{display:flex;align-items:center;gap:6px;color:inherit;font-size:14px;cursor:pointer}",
	".dshfs-platform input{accent-color:#0071e3;width:16px;height:16px}",
	".dshfs-priorityList{display:flex;flex-direction:column;gap:6px}",
	".dshfs-priorityRow{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px solid rgba(0,0,0,.08);border-radius:10px;background:rgba(0,0,0,.02)}",
	"@media (prefers-color-scheme: dark){.dshfs-priorityRow{border-color:rgba(255,255,255,.09);background:rgba(255,255,255,.035)}}",
	".dshfs-priorityRowDisabled{opacity:.58}",
	".dshfs-priorityIndex{width:26px;flex:none;color:#6e6e73;font-size:12px;font-variant-numeric:tabular-nums;text-align:right}",
	"@media (prefers-color-scheme: dark){.dshfs-priorityIndex{color:#a1a1a6}}",
	".dshfs-priorityName{flex:1;min-width:0;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
	".dshfs-priorityActions{display:flex;gap:4px;flex:none}",
	".dshfs-priorityBtn{width:30px;height:28px;padding:0;font-size:14px}",
	"@media (prefers-color-scheme: dark){.dshfs-platform input{accent-color:#0a84ff}}",
	".dshfs-link{color:#0071e3;font-size:13px;text-decoration:none;align-self:flex-start;padding:2px 0;font-weight:500}",
	".dshfs-link:hover{text-decoration:underline}",
	"@media (prefers-color-scheme: dark){.dshfs-link{color:#0a84ff}}",
	".dshfs-btn{font:inherit;cursor:pointer;border-radius:10px;padding:0 14px;height:32px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;transition:all 180ms cubic-bezier(.4,0,.2,1);border:1px solid rgba(0,0,0,.1);background:transparent;color:inherit}",
	"@media (prefers-color-scheme: dark){.dshfs-btn{border-color:rgba(255,255,255,.15)}}",
	".dshfs-btn:hover:not(:disabled){background:rgba(0,0,0,.04)}",
	"@media (prefers-color-scheme: dark){.dshfs-btn:hover:not(:disabled){background:rgba(255,255,255,.06)}}",
	".dshfs-btn:active:not(:disabled){transform:scale(0.98)}",
	".dshfs-btn:disabled{opacity:.5;cursor:default}",
	".dshfs-save{border:none;background:#0071e3;color:#ffffff;box-shadow:0 1px 2px rgba(0,0,0,.1)}",
	".dshfs-save:hover:not(:disabled){background:#0077ed;transform:translateY(-1px);box-shadow:0 2px 4px rgba(0,0,0,.15)}",
	".dshfs-save:active:not(:disabled){transform:scale(0.98)}",
	"@media (prefers-color-scheme: dark){.dshfs-save{background:#0a84ff;color:#ffffff}.dshfs-save:hover:not(:disabled){background:#1e8eff}}",
	".dshfs-upgrade{border:1px solid rgba(52,199,89,.4);background:rgba(52,199,89,.15);color:#248a3d}",
	"@media (prefers-color-scheme: dark){.dshfs-upgrade{color:#30d158}}",
	".dshfs-upgrade:hover:not(:disabled){background:rgba(52,199,89,.25)}",
	".dshfs-badge{background:rgba(0,0,0,.05);color:#1d1d1f;white-space:nowrap;border-radius:999px;flex:none;padding:2px 8px;font-size:11px;font-weight:600;letter-spacing:0.3px}",
	"@media (prefers-color-scheme: dark){.dshfs-badge{background:rgba(255,255,255,.1);color:#f5f5f7}}",
	".dshfs-badgeAuto{background:rgba(175,82,222,.15);color:#af52de;border:1px solid rgba(175,82,222,.2)}",
	"@media (prefers-color-scheme: dark){.dshfs-badgeAuto{background:rgba(191,90,242,.15);color:#bf5af2;border-color:rgba(191,90,242,.2)}}",
	".dshfs-badgeMulti{background:rgba(0,122,255,.13);color:#007aff;border:1px solid rgba(0,122,255,.2)}",
	"@media (prefers-color-scheme: dark){.dshfs-badgeMulti{background:rgba(10,132,255,.15);color:#0a84ff;border-color:rgba(10,132,255,.25)}}",
	".dshfs-badgeFree{background:rgba(52,199,89,.15);color:#248a3d;border:1px solid rgba(52,199,89,.2)}",
	"@media (prefers-color-scheme: dark){.dshfs-badgeFree{background:rgba(48,209,88,.15);color:#30d158;border-color:rgba(48,209,88,.2)}}",
	".dshfs-badgeKey{background:rgba(255,149,0,.15);color:#cc7a00;border:1px solid rgba(255,149,0,.2)}",
	"@media (prefers-color-scheme: dark){.dshfs-badgeKey{background:rgba(255,159,10,.15);color:#ff9f0a;border-color:rgba(255,159,10,.2)}}",
	".dshfs-badgePrice{background:rgba(120,120,128,.12);color:#48484a;border:1px solid rgba(120,120,128,.18);font-size:10px;padding:2px 6px;cursor:help}",
	"@media (prefers-color-scheme: dark){.dshfs-badgePrice{background:rgba(120,120,128,.22);color:#c7c7cc;border-color:rgba(120,120,128,.28)}}",
	".dshfs-langToggle{padding:0 8px;height:24px;font-size:11px;border-radius:8px;color:#6e6e73}",
	"@media (prefers-color-scheme: dark){.dshfs-langToggle{color:#a1a1a6}}",
	".dshfs-update{color:#cc7a00;flex:none;font-size:12px;white-space:nowrap;border:1px solid rgba(255,149,0,.3);background:rgba(255,149,0,.12);border-radius:999px;padding:2px 8px}",
	"@media (prefers-color-scheme: dark){.dshfs-update{color:#ff9f0a}}",
	".dshfs-updateOk{color:#248a3d;flex:none;font-size:12px;white-space:nowrap;border:1px solid rgba(52,199,89,.3);background:rgba(52,199,89,.12);border-radius:999px;padding:2px 8px}",
	"@media (prefers-color-scheme: dark){.dshfs-updateOk{color:#30d158}}",
	".dshfs-updateLine{display:flex;align-items:center;gap:10px;flex-wrap:wrap}",
	".dshfs-updatePill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(0,113,227,.2);background:rgba(0,113,227,.1);color:#0071e3;font:inherit;font-size:13px;font-weight:500;line-height:1;cursor:pointer;padding:6px 12px;border-radius:999px;text-decoration:none;white-space:nowrap;transition:all 180ms cubic-bezier(.4,0,.2,1)}",
	"@media (prefers-color-scheme: dark){.dshfs-updatePill{color:#0a84ff;background:rgba(10,132,255,.15);border-color:rgba(10,132,255,.25)}}",
	".dshfs-updatePill:hover:not(:disabled){background:rgba(0,113,227,.15);border-color:rgba(0,113,227,.3)}",
	"@media (prefers-color-scheme: dark){.dshfs-updatePill:hover:not(:disabled){background:rgba(10,132,255,.2);border-color:rgba(10,132,255,.4)}}",
	".dshfs-updatePill:disabled{opacity:.5;cursor:default}",
	".dshfs-updateIcon{flex:none;display:block}",
	".dshfs-version{color:#6e6e73;font-size:12px;font-variant-numeric:tabular-nums;white-space:nowrap}",
	"@media (prefers-color-scheme: dark){.dshfs-version{color:#a1a1a6}}",
	".dshfs-sec{border:1px solid rgba(0,0,0,.09);border-radius:10px;margin:8px 0;overflow:hidden}.dshfs-secHead{align-items:center;background:rgba(0,0,0,.03);border:0;cursor:pointer;display:flex;font:inherit;gap:8px;padding:9px 12px;text-align:left;width:100%}.dshfs-secTitle{font-weight:600}.dshfs-secBadge{font-size:11px;opacity:.65}.dshfs-secBody{padding:4px 12px 10px}",
	"@media (prefers-color-scheme: dark){.dshfs-sec{border-color:rgba(255,255,255,.12)}.dshfs-secHead{background:rgba(255,255,255,.05)}}"
].join("");
const tagId = "dsh-union-search/card.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-union-search";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}

// src/client/index.ts
const inject = ["slots", "locale"];
function apply(ctx) {
	const safe = (tag, fn) => {
		try {
			fn();
		} catch (e) {
			console.warn("union-search: client surface '" + tag + "' failed: " + (e && e.message ? e.message : String(e)));
		}
	};
	safe("plugins.row.config", () => ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
		name: "plugins.row.config",
		key: "dsh-union-search#web-search-free"
	}, (slotProps) => slotProps && slotProps.view === "summary" ? summaryText() : react_jsx_runtime.jsx(UnionSearchCard, { page: true }))));
	safe("settingsScope", () => ctx.inject(["settingsScope"], (settingsScope) => {
		settingsScope.bind({ namespace: NS });
	}));
	safe("plugins.bundle.config", () => ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
		name: "plugins.bundle.config",
		key: "dsh-union-search"
	}, () => react_jsx_runtime.jsx(UnionSearchCard, { page: true }))));
	safe("dsh-family.tab", () => {
		const tFamily = ctx.locale.bind(NS);
		ctx.locale.register(NS, {
			zh: { "family.title": "网页搜索" },
			en: { "family.title": "Web Search" }
		});
		ctx.slots.inject("dsh-family.tab", () => ctx.slots.register({
			name: "dsh-family.tab",
			id: "union-search",
			order: 60,
			label: () => tFamily("family.title"),
			locale: NS,
			inject: () => ({})
		}, () => react_jsx_runtime.jsx(UnionSearchCard, { page: true })));
	});
	safe("commandUi", () => ctx.inject(["commandUi"], (sctx) => {
		const command = sctx.get("commandUi");
		sctx.effect(() => {
			return command.register({
				name: "union-search-engine",
				description: () => "切换搜索引擎 / Switch web search engine",
				available: () => true,
				ui: {
					kind: "popupSelect",
					options: async () => {
						const result = await bridgeDescribe();
						const view = result.ok ? result.value.namespaces.find((n) => n.ns === NS) : void 0;
						const current = view?.value?.provider ?? "bing";
						const disabled = new Set(Array.isArray(view?.value?.disabledEngines) ? view.value.disabledEngines : []);
						return ENGINES.filter((e) => e.id === "auto" || e.id === "multi" || !disabled.has(e.id)).map((e) => ({
							id: e.id,
							label: `${e.label}${e.badge === "AUTO" ? " · 智能路由" : e.badge === "MULTI" ? " · 并发合并" : e.badge === "FREE" ? " · 免费" : " · API Key"}`,
							detail: e.id === current ? view?.value?.lang === "en" ? "current" : "当前" : void 0,
							active: e.id === current
						}));
					},
					onSelect: async (option) => {
						await bridgeMutate({
							ns: NS,
							ops: [{
								op: "set",
								path: ["provider"],
								value: option.id
							}]
						});
					}
				}
			});
		}, "union-search: /union-search-engine command");
	}));
}
exports.apply = apply;
exports.inject = inject;

return module.exports; } });