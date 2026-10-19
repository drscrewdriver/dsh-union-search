# 用 Turndown 把 HTML 变成 Markdown 的十个坑

作者 [李十一](/author/li) · 2026-10-19 · 12 分钟

转换器最常见的失败不是转错元素,而是**把正文外的东西一起搬进来**。这篇文章按元素级、形态级、规整级三层拆解。

## 元素级的经典坑

版本号 `1.2_3_beta` 不转义就变斜体;表格里的竖线不转义就断列。

> 好的转换器宁可持续输出噪音,也不能静默丢内容。

## 代码示例

```js
const md = turndown(html);
```

配图:![转换管线](https://blog.example/img/pipeline.png)

#html #markdown #转换器