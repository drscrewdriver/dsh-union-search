# Tasks

约定:`lib` = `lib/index.js`;锚点用函数名(行号随编辑漂移)。每个 task 交付物可独立验证;标 [TDD] 的先写红测试再改实现。

## Phase 0: 回归基建(先于一切修复)

- [ ] task_1: package.json 加 `"scripts": { "test": "node --test test/" }`。验证:`pnpm test` 能发现 0 个测试并成功退出。
- [ ] task_2: 建 `test/md.test.mjs` 骨架:`import { htmlToMarkdownGfm, extractBySelector, parseFieldSpecs, advanceFetch, smartTruncate } from "../lib/index.js"`;封装 `check(fixture, golden)` 读 `test/fixtures/<name>.html` 与 `test/golden/<name>.md` 做严格相等 diff,失配时输出两侧 JSON.stringify 便于定位。注意 smartTruncate 此时未导出,task_9 补;骨架先不 import。验证:`pnpm test` 绿。
- [ ] task_3: 护栏 fixtures 落库(当前即应绿):转义(`1.2_3_beta`、`* _ [ ]` 反引号)、CJK 相邻加粗、双链接修复(javascript:/空标/协议相对)、img+title 块、GFM 对齐表、任务列表、删除线、三修复的断行合并、重复图折叠。≥12 个 fixture/golden 对。验证:`pnpm test` 全绿。
- [ ] task_4: `test/md.test.mjs` 加回环 http 服务基建:固定路由表(gbk 字节流、gb2312-meta、301、json、rss、challenge、meta-refresh、long、emoji、rellinks),`allowPrivate:true` 调 advanceFetch。落地 H4(301+finalUrl)、H5(JSON 透传)两个当前即绿的服务级 golden。验证:全绿。

## Phase 1: P0

- [ ] task_5 [TDD]: 写 GBK 红测试三例:H1(GBK 字节流+header charset)期望 `# 中文标题`;gb2312 仅 meta 声明;utf-8 无声明。验证:红。
- [ ] task_6: `advanceFetch` 解码改造:`const buf = await response.arrayBuffer()`;新增 `decodeBody(buf, contentType, headBytes)`(模块内函数):header charset → BOM(utf-8/utf-16le/be)→ buf 前 2048 字节按 latin1 解码正则扫 `<meta[^>]+charset\s*=\s*["']?([\w-]+)` → utf-8;`new TextDecoder(normalizeLabel(label),{fatal:false})`,normalizeLabel 把 gb2312/gbk→gb18030,包 try/catch 落回 utf-8。response.text() 调用点全部替换。验证:task_5 转绿,task_3/4 不回退。
- [ ] task_7 [TDD]: 嵌套表红测试(N1):golden = `| Outer |` 表头 + 内表 `| I1 | I2 |`/`| x | y |` 数据行齐全。验证:红。
- [ ] task_8: `postprocessMarkdown.cleanLine` 的 `\\\|` 分支:触发条件收紧为 `/\<br\s*\/?\>/i.test(l) && escCount >= 2`;命中后不再裁断,改抢救——取整行,`<br>`→`\n`、`\\\|`→`\|` 字面还原,作为独立行组替换原行(外层表头保留)。保留原「合法单格偶发 `\|`」路径(N6 fixture 护栏)。验证:task_7 绿,N6/F3 护栏绿。
- [ ] task_9 [TDD]: 导出 `smartTruncate`(lib 导出块追加)+ 红测试两例:emoji 串 maxChars=11 无 lone surrogate(末字符 codePoint > 0xFFFF 或完整);`"a\n```js\ncode\nmore code`" 切入围栏时输出 fence 计数为偶。验证:导出后测试红。
- [ ] task_10: `smartTruncate` 修复:切点前若 `s.charCodeAt(cut-1)` 为高代理且 `s.charCodeAt(cut)` 为低代理则 cut−1;统计窗口内 `/^\s*(```|~~~)/` 行数为奇时,回退切到最后一个围栏行之前(残块丢弃),再补 `…`。验证:task_9 绿。
- [ ] task_11 [TDD]: 深列表红测试(R1/R6):3 层输出含 8 空格缩进行、4 层含 12 空格缩进行。验证:红。
- [ ] task_12: 删除 `cleanLine` 中 `>6 空格砍半` 分支(含注释改写:0.10.11 移除,理由见 findings 风险 1)。验证:task_11 绿;task_3 护栏绿。

## Phase 2: P1

- [ ] task_13: 移植 gfm tables block rule 为自定义 `tableBlockWithMixedHeader`(MIT,源自 @joplin/turndown-plugin-gfm tables.js):filter "table",先**原样行为**落地(首行=表头、align 分隔行、跳过含嵌套表的表格交回 node rule)。在 `buildHostTwinTurndown` 中 `td.use(gfm)` 之后 addRule(unshift 生效)。验证:A2/F1/F3 现有 golden 逐字节不变(纯移植无行为差)。
- [ ] task_14 [TDD]: 幽灵表头红测试(N2):混合 th/td 首行 golden = `| Founded | 1901 |` + 分隔行,无空表头。改 table rule:首行无条件作表头渲染。验证:红→绿。
- [ ] task_15 [TDD]: colspan 红测试(F1 golden 更新):`| wide |  | c |` 与 3 列表头对齐。改 table rule cell 渲染:读 `colspan`(钳制 1–20),content 后补 span−1 个空 cell。验证:红→绿,A2/F1 无 colspan 用例逐字节不变。
- [ ] task_16 [TDD]: 挑战页红测试(H3):advanceFetch 对 challenge 路由 throw 且 message 含 "anti-bot challenge"。实现:html 分支提取后,`md.length < 1500 && /captcha|challenge|just a moment|checking your browser|verify (you|that you)|请完成(安全)?验证|安全验证|人机验证|访问验证|验证码/i.test(md)` → `throw new Error("anti-bot challenge page detected (HTTP 200) — content requires a JS-rendered source")`。验证:红→绿;H2 meta-refresh(无关键词命中时)不 throw 用例同批落地。
- [ ] task_17 [TDD]: RSS 红测试(H6):根元素 `<rss|<feed` → `{ text, note:"rss/atom passed through", truncated }`。实现:decode 后、html 分派前判 `contentType` 含 xml 或 body 首 512 字节含 `<?xml`,再以 `/<\s*(rss|feed)[\s>]/i` 判根;xhtml(application/xhtml+xml)例外继续走 html 路径。验证:红→绿。
- [ ] task_18 [TDD]: baseUrl 红测试两例:单元级 `htmlToMarkdownGfm('<a href="sib.html">x</a>',{baseUrl:"http://h/dir/p.html"})` 含 `](http://h/dir/sib.html)`;服务级 H9 rellinks 输出含 finalUrl 绝对化链接。实现:`htmlToMarkdownGfm(html,{baseUrl})` / `extractBySelector(html,{…,baseUrl})` 加参;baseUrl 存在时 cheerio 预处理 `a[href],img[src]`:跳过 `/^(javascript|data|blob|vbscript|mailto|tel):/i` 与 `#` 开头,`new URL(attr, base).toString()` 回写;advanceFetch 传 `current.toString()`。验证:红→绿;D1(无 baseUrl)行为不变。
- [ ] task_19 [TDD]: 跟踪参数红测试:utm_source/gclid/fbclid/mc_eid/igshid 剥离、`?id=2` 保留、无参数 URL 不变。实现在 task_18 的同一 cheerio 预处理内:`u.searchParams.forEach((_,k)=>{ if(/^(utm_|gclid$|fbclid$|mc_eid$|igshid$)/.test(k)) del })`。验证:红→绿。
- [ ] task_20 [TDD]: 数字行红测试三例:`8 7 6 5 4 3 2 1` 删、`1 2 3 4 5` 留、`98 97 95` 留。改 `cleanLine`:`const toks=l.trim().split(/\s+/); toks.length>=4 && toks.every(t=>/^\d{1,2}$/.test(t)) && toks.every((t,i)=>i===0||+toks[i]===+toks[i-1]-1)` 才丢。验证:红→绿,N7 护栏绿。

## Phase 3: P2

- [ ] task_21 [TDD]: 隐藏类红测试:`<div class="sr-only">`/`visually-hidden`/`screen-reader-only`/`d-none` 剔除,`class="hidden-tab"` 保留。改 `removeNonVisibleContent.filter`:`node.getAttribute("class")?.split(/\s+/).some(c=>/^(sr-only|visually-hidden|screen-reader-only|d-none)$/.test(c))`。验证:红→绿,E1 护栏绿。
- [ ] task_22 [TDD]: 空壳/frameset note 红测试:空壳路由(5KB body+空 root)返回 note 含 "JS-rendered shell";frameset body 返回 note 含 "frameset";正常页 note 为 undefined。实现:advanceFetch markdown 分支提取后追加判定(body.length>5000 && md.replace(/\s/g,"").length<200;`/<frameset[\s>]/i.test(body)`)。验证:红→绿。
- [ ] task_23 [TDD]: 空白规整红测试:输出不含 U+00A0/U+200B/U+FEFF;`<pre>` 内 nbsp 原样。`cleanLine` 末尾追加 `l=l.replace(/[\u200B-\u200D\uFEFF]/g,"").replace(/\u00A0/g," ")`(仅围栏外,天然满足)。验证:红→绿。
- [ ] task_24 [TDD]: 标题归一红测试:双 h1 → 第二个 `##`;`#`→`####` → 拉平 `#`→`##`;单 h1 不动;围栏内 `#` 注释不动。新增模块函数 `normalizeHeadings(md)`(围栏感知行扫描:seenH1 后 `^# `→`## `;level > prev+1 时降为 prev+1),挂在 postprocessMarkdown 返回前。验证:红→绿,C1/C2 更新。
- [ ] task_25 [TDD]: text 模式红测试(X4):`<p>a  b</p><p>c</p>` → `a b` 与 `c` 分行。改 `extractBySelector` text 分支:load 前 `joined.replace(/<\/(p|div|li|tr|td|th|section|article|blockquote|pre|h[1-6]|table|ul|ol)>/gi,"\n\n").replace(/<br\s*\/?>/gi,"\n")` 再取 text,保留既有 `[ \t]`→空格、`\n{3,}`→`\n\n` 折叠。验证:红→绿。

## Phase 4: 收尾

- [ ] task_26: README 工具描述同步三句:挑战页识别为失败(含触发条件)、RSS/Atom 透传、相对链接自动基于最终 URL 绝对化并剥离跟踪参数;known limitation 补「代码 tabs 静态不可判定」。
- [ ] task_27: version 0.10.10 → 0.10.11;advance_fetch 区段头部注释补 0.10.11 变更摘要(解码层/表格 block rule/抢救式嵌套表/截断安全/挑战页/规整六项),并按 spec 决策记录声明 3 处宿主 twin 有意偏离。
- [ ] task_28: `pnpm test` 全量绿 + `pnpm pack` 确认包内无 test/(files 白名单生效)。
- [ ] task_29(发布闸,需用户参与): 存盘 bilibili 基线复验(砍半规则移除风险闸)+ news.baidu 基线不回退 + 公众号/知乎/掘金线上冒烟(正文召回/噪音精确率口径,不全文比对)。
