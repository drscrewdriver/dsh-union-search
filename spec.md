# Spec: advance_fetch 0.10.11 修复(15 缺陷全量 + 回归基建)

## 需求

修复 2026-10-19 只读探针确认的 advance_fetch 转换管线缺陷,并建立确定性回归套件。
基线:0.10.10(已就绪未发布),本批直接落 **0.10.11**。

- **P0-1** 非 UTF-8(GBK/GB2312/Shift-JIS)页面乱码 → 按声明字符集解码
- **P0-2** 嵌套表被 collapse 清洗裁掉数据 → 抢救重构,零丢失
- **P0-3** 深嵌套列表缩进砍半破坏层级 → 移除该规则
- **P0-4** 截断边界拆代理对 / 留未闭合代码围栏
- **P1-5** 200 状态反爬挑战页 / meta-refresh 页被当正文 → 识别为失败
- **P1-6** RSS/Atom XML 粘连输出 → 按 JSON 先例 text 透传
- **P1-7** 路径相对 URL 不基于 finalUrl 绝对化
- **P1-8** 轮播数字行规则误删合法纯数字行 → 收窄触发条件
- **P1-9** colspan 不展开导致列错位 → 空单元格补齐列数
- **P2-10** sr-only/visually-hidden/d-none 等隐藏类不剔除
- **P2-11** SPA 空壳 / frameset 静默输出无信号 → note 提示
- **P2-12** nbsp(U+00A0)/零宽字符未规整
- **P2-13** 多 h1 不降级、标题跳级不拉平
- **P2-14** utm/gclid/fbclid 等跟踪参数剥离
- **P2-15** text 模式块间粘连(`a b` + `c` → `a bc`)
- **基建** test/ 下 fixture+golden 回归套件(node --test),本次 15 项探针全量转种子用例

## 技术方案

全部改动集中于 `lib/index.js` 的 advance_fetch 区段(819–1234 行)与新增 `test/` 目录。

### 1. 解码层(P0-1,`advanceFetch`)
`await response.text()` 改为 `arrayBuffer()` + 字符集决策:
`Content-Type header charset` → `BOM 嗅探` → `前 2048 字节扫 <meta charset|http-equiv>` → 默认 utf-8。
`new TextDecoder(label,{fatal:false})` 解码;gb2312/gbk 统一映射 gb18030(超集);未知 label 落回 utf-8。

### 2. 表格(P0-2 / P1-9 / N2 幽灵表头)——实现期修订:无需重写 block rule
阅读 gfm 插件源码后定位:幽灵空表头来自其 block rule 的「无分隔行就补空表头」逻辑,colspan 补格在其
`handleColSpan`(我们复刻 cell rule 时丢失)。故只改两条自有规则:
- `isTableHeadingRow`:混合 th/td 首行(维基 infobox 形态)也出分隔行 → gfm 检测到分隔行即跳过补头;纯 td 首行维持 gfm 空表头行为(GFM 需要表头行)。
- `renderTableCell` 调用处:colspan(钳制 1–20)补等量空单元格,恢复列对齐;嵌套表路径不变。
- 嵌套表抢救(原方案不变):postprocess 行级清洗由「裁掉」改「还原」:`<br>`→换行、`\|`→`|`,仅当还原后每行以 `|` 开头(真表格形态)才采纳,防误伤含 `<br>`+转义管道的普通单元格。

### 3. postprocess 规整(P0-3 / P1-8 / P2-12 / P2-13)
- 删除 >6 空格砍半规则(turndown 合法缩进恒为 4 的倍数,砍半必伤真层级)。
- 数字行规则改为:≥4 个 token、全为 1–2 位整数、严格逐项 −1 递减才丢弃。
- cleanLine 追加:剔除 `\u200B-\u200D\uFEFF`,`\u00A0`→空格(围栏外)。
- 新增 `normalizeHeadings` 后处理:围栏感知;第 2+ 个 h1 降为 h2;跳级(如 # → ####)拉平为 prev+1。

### 4. 截断(P0-4,`smartTruncate`,新增导出)
切点落在代理对高位上时回退 1;窗口内围栏行(``` / ~~~)计数为奇数时,回退切到最后一个围栏行之前(丢弃残块)。

### 5. 入口与链接(P1-5/6/7、P2-10/11/14,`advanceFetch` + `absolutizeRelativeLinks`)——实现期修订
- 发现 0.10.10 最终态已有 markdown 级 `absolutizeRelativeLinks`(根相对/点相对),原 cheerio 预处理方案取消,改为扩展该函数:裸相对名(`sib.html`)纳入绝对化;同遍剥离跟踪参数(utm_*、gclid、fbclid、mc_eid、igshid);`extractBySelector` 增 `baseUrl` 参数透传,advanceFetch 传最终 URL。
- html 分支提取后:md < 1500 字符 且 命中挑战页关键词(captcha/just a moment/checking your browser/验证码/安全验证 等)→ **throw**(走既有失败路径)。
- content-type 含 xml 且根元素为 `<rss`/`<feed` → text 透传 + note(与 JSON 同款);xhtml 不受影响。
- 提取后注记:body > 5000 字节但 md 可见文本 < 200 → note「JS 渲染空壳」;`<frameset` → note「frameset 页」。

### 6. text 模式(P2-15,`extractBySelector`)
`</p></div></li></tr></h1-6><br>` 等块级边界先注入 `\n\n`/`\n` 再取 text,后接既有空白折叠。

### 7. 回归基建(`test/`)
`test/fixtures/*.html` + `test/golden/*.md` 一一对应;`test/md.test.mjs`(node:test)纯函数直测 + 回环 http 服务测 advanceFetch(GBK 字节流、301、JSON/RSS、挑战页、截断,全离线确定性)。golden = **修复后**期望输出(TDD:先红后绿)。现有健康行为(转义/CJK/链接三修复/img+title 合并)同时入 golden 作护栏。

## 决策记录

| 选项 | 选择 | 理由 |
|------|------|------|
| 深列表砍半:移除 vs 调阈值 | 移除 | 合法 turndown 缩进恒为 4 的倍数,任何砍半/钳制必伤真层级;0.10.6 动机(bilibili 门户)离线无法复现,凭证据只能删,发布前用线上基线复验 |
| 挑战页:throw vs note | throw | 矩阵四明确要求「识别为失败」;throw 复用既有失败路径,LLM 侧看到的是明确报错而非垃圾正文 |
| 重复链接去重 | 不做 | 同文重复链接多为合法(目录+正文),全文去重误伤面大,YAGNI |
| 全空数据表行 | 不修 | 行内容为空,丢失无信息量;行级清洗无法区分垃圾与合法空行 |
| colspan:空格补齐 vs 内容复制 | 空格补齐 | GFM 无 colspan,复制内容制造虚假重复;补空格恢复列对齐即达目的 |
| 代码 tabs 重复 | 不修 | 无法从静态 HTML 判定激活 tab;工具描述已导流 selector 用法,记录为已知限制 |
| 跟踪参数白名单 | utm_*/gclid/fbclid/mc_eid/igshid | 保守集合;spm 等有正常语义风险,暂不纳入 |
| 宿主 twin 漂移 | 3 处有意偏离并注释声明 | baseUrl 绝对化 / 挑战页 throw / 表格首行混合表头——均为宿主未覆盖的改进,0.10.11 注释标明 |

## 约束

- Node ≥ 20(engines 已声明),官方构建 full-ICU,TextDecoder 支持 gbk/big5/shift_jis;未知 label 必须 try/catch 落回 utf-8。
- `lib/index.js` 单文件结构保持;`smartTruncate` 加入导出块(5523 行)供单测。
- npm `files` 白名单不含 `test/`,回归套件不进发布包。
- 不得回退 0.10.10 已修三项(协议相对 URL、断行合并、重复图折叠)——对应 golden 全程护栏。
- 用户存盘的 bilibili / news.baidu 真实页基线不在本仓,发布前须线上/本地基线复验(见 checklist)。
