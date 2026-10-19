# Findings

来源:2026-10-19 三轮只读探针(临时脚本,已清理;关键证据编号 R*/N*/H*/A-G/X 系列引用自该轮)。

## 架构决策

- **管线分层与责任定位**(探针 RAW/MID/FIN 三态对照得出):
  - turndown 规则层(`buildHostTwinTurndown`):不可见剔除、伪协议链接、cell/tr 规则。
  - **gfm 插件的 table block rule 主导无嵌套表格的整表渲染**——自定义 cell/tr node rule 只在嵌套表等 block rule 放弃的场合生效。幽灵空表头(N2)、colspan 错位(N5)都发生在这一层,所以修表格必须下沉到自定义 block rule,而非继续打补丁。
  - `postprocessMarkdown` 行级清洗层:0.10.6–0.10.10 的修复全在此层。本轮确认的三个「误伤」(嵌套表裁剪、深列表砍半、数字行整删)也全在此层——该层的垃圾启发式与合法内容没有可靠的行级区分特征,修复方向一律是**收紧触发条件或改为抢救式重构**,不再新增整行删除规则。
- **绝对化选 cheerio 预处理而非 turndown rule / markdown 正则**:rule 层要复刻默认链接 rule 的转义/标题处理,markdown 层要反解 `\(` 转义;转换前在 DOM 上改 href/src 是唯一零转义风险的注入点。
- **golden = 修复后期望输出(TDD)**:先写红测试钉住行为规格,再改实现;0.10.6→0.10.10 的「修 A 破 B」(砍半规则伤深列表、数字行规则伤纯数字行、collapse 清洗伤嵌套表)正是缺回归的后果。

## 技术选型

- **TextDecoder(内置)** 而非 iconv-lite:Node ≥20 官方构建 full-ICU,gbk/gb18030/big5/shift_jis 全支持,零依赖。gb2312/gbk 统一映射 gb18030(超集,向后兼容)。探测顺序 header → BOM → meta 是 WHATWG 编码嗅探的简化版,2048 字节窗口覆盖绝大多数静态页。
- **node --test**(Node 20 内置)而非 mocha/vitest:插件仓库零 devDependency 负担,`pnpm test` 直接可用。
- 回环 http 服务测 advanceFetch:GBK 案例需要字节级控制(手工构造 GBK 字节流),meta-refresh/挑战页/301/截断都需要可控路由,全部离线确定性。

## 关键实证(修复依据)

| 编号 | 实证 | 结论 |
|------|------|------|
| H1 | GBK 字节流 → `# ���ı���` | response.text() 固定 UTF-8 |
| N1 | MID 层内表合法折进单元格(内容完整),FIN 层被裁 | 丢失在 postprocess,不在 turndown |
| R1/R6 | turndown 原生 8/12/16 空格正确,砍半后 3 层变 2 层 | 砍半规则无差别破坏合法层级 |
| H7b | 切点入围栏,fenceCount=1(奇) | 输出以未闭合 ``` 结尾 |
| H8b | maxChars=11 → 末字符 lone surrogate \ud83d | slice 按码元切分 |
| H3/H2 | 挑战页/meta-refresh 200 → 文案当正文 | 无失败识别 |
| H6 | RSS → `ChanItemADescB` | xml 走 html 路径粘连 |
| H9/D1 | `sib.html`、`/docs/page` 原样输出 | finalUrl 未参与链接解析 |
| N2 | 混合 th/td 首行 → `|     |     |` 幽灵表头 | gfm block rule 层缺陷 |
| R5/N7 | `1 2 3 4 5` 整行删空;`第 1 2 3 名` 安全 | 数字行规则触发面=独立数字行 |
| 码点 | U+00A0/U+200B 原样保留 | 无空白规整 |
| X4 | `<p>a b</p><p>c</p>` → `a bc` | text 模式无块边界 |

## 约束与依赖

- `@joplin/turndown-plugin-gfm` 的 tables.js 为 MIT,可移植改造;须保留其 taskListItems/strikethrough(td.use(gfm) 整体保留,table block rule 由后注册的同名 filter 覆盖——turndown addRule unshift 优先)。
- advanceFetch 是插件导出面的一部分(`export { advanceFetch }`),throw 语义变化属行为增强,README 工具描述需同步一句。
- npm `files` 白名单已把发布面限死在 lib/ + cordis.patch.yml,test/ 天然不进包。

## 风险识别

1. **深列表砍半移除的回归风险(最高)**:0.10.6 当初为 bilibili 门户页实测而加。离线无该样本,无法证明移除后门户输出仍可读。缓解:发布前用存盘 bilibili 基线 + 线上抽查复验;若门户确实再产出深垃圾,回补方案是「仅当缩进 >12 且行内容长度 > 80 时钳制到 8」(伤面限于超深长行)。
2. **~~表格 block rule 重写~~(实现期消解)**:阅读 gfm 插件源码后确认幽灵表头/colspan 都可在两条自有规则内修复(tr rule 补分隔行、cell rule 补空格),无需接管整表渲染,改动面从最大降为最小;A2/对齐表等既有 golden 逐字节未动。
3. **挑战页 throw 的误报**:小体量正文恰好含「验证」字样的页面(如登录说明页)。缓解:双重条件(关键词 且 md<1500 字符)已把误报压到极小;README 注明该行为。
4. **TextDecoder 依赖 full-ICU**:非官方 Node 构建(small-icu)会退化。缓解:fatal:false + try/catch 落回 utf-8,行为退化为现状而非崩溃。
5. **绝对化改变链接输出形态**:relative → absolute 后 md 变长,对 20000 字符限额的页面略增截断压力。量级可忽略,不处理。
