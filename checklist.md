# Checklist

## Must Pass

### 回归基建
- [ ] `pnpm test`(node --test test/)全绿;fixtures 与 golden 一一对应,无孤儿文件
- [ ] 0.10.10 已修三项护栏用例全绿:协议相对 `](//…)` → `](https://…)`;孤立 `[`/`](url)` 合并回单行;相邻重复图片行折叠
- [ ] 健康行为护栏全绿:`1.2\_3\_beta` 转义、`* _ [ ]` 反引号转义、`**加粗**文本` CJK 相邻、javascript:/空标/协议相对链接、img+title 块合并、GFM 对齐表格、任务列表、删除线

### P0
- [ ] GBK(带 header charset)、GB2312(仅 meta charset 声明)、UTF-8(无声明)三用例均正确解码;未知 charset label 落回 utf-8 不抛错
- [ ] 嵌套表用例:外层 `| Outer |` 表头保留 + 内表 2×2 数据(I1/I2/x/y)全部出现在输出中
- [ ] 深列表用例:3 层/4 层嵌套输出缩进 8/12 空格,层级与输入一致
- [ ] smartTruncate:emoji 串 maxChars=11 切点回退,输出无 lone surrogate;切点入围栏时输出围栏计数为偶(残块整体丢弃)
- [ ] 既有截断语义不回退:行边界优先、`…` 后缀、`truncated` 标志

### P1
- [ ] 挑战页(200+captcha 文案)→ throw,报错文案含 "anti-bot challenge";大篇幅正文偶含关键词不误报
- [ ] meta-refresh 页不 throw(有 "Redirecting" 文案但无挑战关键词时维持现状),仅挑战页路径失败
- [ ] RSS/Atom → text 透传 + note `rss/atom passed through`;xhtml 仍走 html 路径
- [ ] 相对链接/图片基于 finalUrl 绝对化:`sib.html` → `http://host/dir/sib.html`;javascript:/锚点/mailto: 不动
- [ ] 跟踪参数剥离:utm_*、gclid、fbclid、mc_eid、igshid 移除,业务参数(id=2)保留
- [ ] `1 2 3 4 5` 独立行保留输出;`8 7 6 5 4 3 2 1` 轮播行仍被删;`98 97 95`、`3 7 15 22 31` 保留
- [ ] colspan=2 行输出 `| wide |  | c |`,与 3 列表头对齐;无 colspan 表格输出逐字节不变

### P2
- [ ] sr-only/visually-hidden/screen-reader-only/d-none 类元素剔除;普通 class(如 `hidden-tab`)不受影响
- [ ] 空壳页输出含 note 提示 JS 渲染壳;frameset 页输出含 note;正常页无多余 note
- [ ] 输出无 U+00A0/U+200B/U+FEFF(围栏内原样保留)
- [ ] 双 h1 → 第二个降为 h2;#→#### 跳级拉平为 #→##;单一 h1 页面不动
- [ ] text 模式 `<p>a  b</p><p>c</p>` → `a b` 与 `c` 分行,不再粘连成 `a bc`

### 收尾
- [ ] `node --test` 无 stderr 噪音;无残留临时探针文件
- [ ] README 工具描述同步:挑战页识别为失败、RSS 透传、相对链接绝对化
- [ ] 版本 0.10.10 → 0.10.11,注释头补 0.10.11 变更摘要

## Should Pass

- [ ] 存盘 bilibili 基线复验:门户页深列表垃圾不比 0.10.10 更不可读(砍半规则移除的风险闸;离线逻辑回测已过,见下方对照)
- [ ] 存盘 news.baidu 基线不回退(0.10.7 文档模式解析基线;离线回测已过)
- [ ] 微信公众号文章样张:懒加载图、div 汤输出可用
- [ ] 32KB+ 大表格(500 行)转换耗时 < 1s(离线回测:338KB/3000 段/500 行表 = 555ms ✅)

## 测试矩阵覆盖对照(离线回测,2026-10-19)

| 矩阵区域 | 状态 | 对应用例 |
|---|---|---|
| 干净博客文章 | ✅ | shape-clean-blog |
| 文档站(侧边栏/目录/tabs/复制按钮/翻页) | ✅ | shape-docs-site(class 隐藏 tab 重复=已知限制,Copy 噪音入库) |
| 新闻页(面包屑/作者/相关推荐/订阅框) | ✅ 保留面入库 | shape-news-article(噪音按设计保留) |
| 维基类(infobox/目录/参考文献/表格) | ✅ | fix-wiki-page、fix-mixed-header、F1/F3/A2 |
| 问答/论坛(多答案/投票/引用嵌套/签名档) | ✅ | shape-qa-forum(嵌套引用 `> >`)、guard-qa-page |
| 电商详情页(规格表/价格/评论) | ✅ | shape-ecommerce(colspan 补格对齐) |
| SPA 空壳 | ✅ | guard-spa-shell-text + server shell-note |
| 落地页/纯视觉页 | ✅ | shape-landing-hero + guard-frameset-text |
| 评论流/分页长文截断边界 | ✅ | server long/emoji 截断 + smartTruncate 单元 |
| Boilerplate(导航/页脚/cookie/Share this) | ✅ 保留面入库 | guard-boilerplate-visible(正文识别=架构未做,已知) |
| 转义安全(`*`/`_`/`[`/反引号) | ✅ | guard-escape-version/chars |
| CJK(加粗紧邻标点/em 词内/全角) | ✅ | guard-cjk-bold、guard-cjk-em(emDelimiter→`*`) |
| 空白规整(nbsp/零宽/空行/行尾) | ✅ | fix-nbsp-zero-width、guard-blank-trailing |
| 标题归一(双 h1/跳级) | ✅ | fix-double-h1、fix-heading-skip |
| 链接规整(跟踪参数/相对绝对化) | ✅ | baseurl-utm-strip + server rellinks(去重=决策不做) |
| 编码(GBK/GB2312/Shift-JIS/声明冲突) | ✅ | server gbk×2/sjis/mismatch(header 优先=WHATWG) |
| 重定向/相对 URL/URL 归一 | ✅ | server redir/rellinks(归一范围=剥参数,已声明) |
| 反爬挑战页/陷阱页 | ✅ | server challenge + big-captcha-mention(误报面) |
| 403/非 200 失败路径 | ✅ | server forbidden |
| 超大页面截断 | ✅ | server long/emoji + fence/surrogate 单元 |
| 畸形 HTML(未闭合/错误嵌套) | ✅ | shape-malformed(parse5 容错,零丢失) |
| frameset / 误抓 RSS/JSON | ✅ | guard-frameset + server rss/json/xhtml |
| 图片防盗链 | N/A | 转换层不取图,仅输出 URL;防盗链发生在消费端 |
| 线上真实站点抽样(矩阵五) | ⏳ task_29 | 属冒烟层:召回率/噪音精确率口径,非全文比对 |

非本轮回归的既有发现(记录不修):布局表含 UL 等块级内容时 gfm 插件整表 keep 为原始 HTML(joplin-table-wrapper dump,news.baidu 类布局表整页路径命中,selector 路径可绕开);同行相邻重复图片不折叠。
