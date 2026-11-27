// advance_fetch  machinery：宿主同款 turndown 复刻 + CSS selector 结构抽取 + SSRF 门（rc.7 逐字搬移）
// AUTO-EXTRACT rc.7：正文自 src/index.js 逐字搬移，除加 export 外未改动。
import path from "node:path";
import { exec } from "node:child_process";
import dnsPromises from "node:dns";
import https from "node:https";
import http from "node:http";
import TurndownService from "turndown";
import { gfm } from "@joplin/turndown-plugin-gfm";
import * as cheerio from "cheerio";
import { httpsLikeFetch, decodeResponseBody } from "./util/http";
import { USER_AGENT, ACCEPT_LANG } from "./engines/common";
import { cutSafe } from "./util/text";

//#region advance_fetch (宿主同款 turndown 复刻 + CSS selector 结构抽取；依赖插件自带，不碰宿主内部面)
// 0.10.11（fixture+golden 回归套件落地，test/md.test.mjs，58 用例）：响应 charset 解码（GBK/GB2312
// 乱码修复）；嵌套表抢救式还原（替代 collapse 整行裁除）；smartTruncate 代理对/围栏安全；深列表缩进
// 砍半规则移除（伤合法嵌套，门户动机以线上基线复验，见 findings.md 风险 1）；混合 th/td 首行出分隔行
// （消 gfm 幽灵空表头）；colspan 空格补齐列对齐；挑战页 200 识别为失败；RSS/Atom text 透传；裸相对
// 链接绝对化 + 跟踪参数剥离；无障碍隐藏类剔除；空壳/frameset note；nbsp/零宽规整；标题归一；
// text 模式块边界。宿主 twin 有意偏离三处（均有注释）：绝对化+参数剥离、挑战页 throw、混合表头。

// 与宿主 dsh-tool-web 同款转换配置（VERIFIED@0.2.1-rc.2 packages/web/tool-web/src/fetch.ts）：
// atx 标题 + 围栏代码 + '-' 列表符号 + GFM 表格/删除线 + 不可见内容整体剔除 + 表格跨列不展开。
export const ADVANCE_FETCH_TIMEOUT_MS = 15000;
export const ADVANCE_FETCH_MAX_CHARS_DEFAULT = 20000;
export const ADVANCE_FETCH_MAX_CHARS_LIMIT = 60000;
export function buildHostTwinTurndown() {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    // 0.10.11:em 用 * 而非默认 _ —— CommonMark 的 _ 不允许词内强调,CJK 相邻场景
    // (文<em>斜体</em>文 → 文_斜体_文)斜体会静默丢失;* 无此限制。宿主 twin 有意偏离之四。
    emDelimiter: "*",
  });
  td.use(gfm);
  // 门户页伪链接（0.10.6，news.baidu.com 实战反馈）：href 为 javascript:/data:/blob:/vbscript: 的
  // 锚点不是链接，只保留可见文本，不进 markdown 链接语法。
  td.addRule("dropPseudoProtocolLinks", {
    filter(node) {
      return node.nodeName === "A" && /^\s*(?:javascript|data|blob|vbscript):/i.test(String(node.getAttribute("href") ?? ""));
    },
    replacement(content) {
      return content;
    },
  });
  td.addRule("removeNonVisibleContent", {
    filter(node) {
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME", "OBJECT", "EMBED"].includes(node.nodeName)) return true;
      if (node.hasAttribute("hidden") || node.getAttribute("aria-hidden")?.toLowerCase() === "true") return true;
      // 0.10.11：无障碍隐藏类（约定俗成的「视觉隐藏」）剔除；普通业务 class（如 hidden-tab）不猜。
      if (String(node.getAttribute("class") ?? "").split(/\s+/).some((c) => c === "sr-only" || c === "visually-hidden" || c === "screen-reader-only" || c === "d-none")) return true;
      if (node.nodeName === "INPUT" && node.getAttribute("type")?.toLowerCase() === "hidden") return true;
      const declarations = String(node.getAttribute("style") ?? "").split(";");
      return declarations.some((declaration) => {
        const separator = declaration.indexOf(":");
        if (separator === -1) return false;
        const property = declaration.slice(0, separator).trim().toLowerCase();
        const value = declaration.slice(separator + 1).trim().toLowerCase().replace(/\s*!important\s*$/u, "");
        return (property === "display" && value === "none")
          || (property === "visibility" && (value === "hidden" || value === "collapse"));
      });
    },
    replacement() {
      return "";
    },
  });
  const renderTableCell = (content, index) => {
    const prefix = index === 0 ? "| " : " ";
    const escaped = String(content).trim().replace(/\n\r/g, "<br>").replace(/\n/g, "<br>").replace(/\|+/g, "\\|").padEnd(3, " ");
    return `${prefix}${escaped} |`;
  };
  const isTableHeadingRow = (row) => {
    const cells = Array.from(row.cells ?? []);
    const section = row.parentElement;
    const table = section?.parentElement;
    if (!(section?.nodeName === "THEAD" || table?.rows?.[0] === row)) return false;
    if (cells.length === 0) return false;
    // 0.10.11:混合 th/td 首行(维基 infobox 的 label-value 形态)也出分隔行,否则 gfm block rule
    // 会补一行幽灵空表头。纯 td 首行维持 gfm 空表头行为(GFM 语法要求表头行)。
    return cells.some((cell: any) => cell.nodeName === "TH");
  };
  const tableBorder = (cell) => {
    let align = String(cell.getAttribute("align") ?? "").toLowerCase();
    if (!align) {
      try {
        align = String(cell.style?.textAlign ?? "").toLowerCase();
      } catch {
        align = "";
      }
    }
    if (align === "left") return ":---";
    if (align === "right") return "---:";
    if (align === "center") return ":---:";
    return "---";
  };
  td.addRule("tableCellWithoutSpanExpansion", {
    filter: ["th", "td"],
    replacement(content, node) {
      const row = node.parentNode;
      const index = row?.childNodes ? Array.prototype.indexOf.call(row.childNodes, node) : 0;
      let out = renderTableCell(content, index);
      // 0.10.11:colspan 空单元格补齐——GFM 无 colspan,不复制内容,只补空格恢复列对齐(上限 20 防畸形)。
      const span = Math.min(Math.max(Number.parseInt(node.getAttribute("colspan") ?? "1", 10) || 1, 1), 20);
      for (let i = 1; i < span; i++) out += renderTableCell("", index + i);
      return out;
    },
  });
  td.addRule("tableRowWithoutSpanExpansion", {
    filter: "tr",
    replacement(content, node) {
      const border = isTableHeadingRow(node)
        ? Array.from(node.cells ?? [], (cell, index) => renderTableCell(tableBorder(cell), index)).join("")
        : "";
      return `\n${content}${border.length > 0 ? `\n${border}` : ""}`;
    },
  });
  return td;
}
export const hostTwinTurndown = buildHostTwinTurndown();

// 输出清洗（0.10.6 初版，0.10.8 扩充）：在宿主同款转换之上补门户页脏输出后处理，全部行级操作、
// 代码围栏（```/~~~）内容原样不动——
// ① 表格行内字面 <br> 换 " / "；嵌套表被外层单元折行成单行的（转义 \| + 分隔垃圾）逐格清洗，
//    有效格 ≤1 时 unwrap 出表格；② 全空管道行丢弃；③ 轮播页码式孤立数字行（"8 7 6 5…"）整行丢；
// ④ 尖括号目标 ](< url>) 归一为 ](url)，尖括号/直链两形态的伪协议链接只留标文本；
// ⑤ 空文本链接 [](url) 转裸 URL（图片 ![]() 不动）；⑥ 链接标内冗余 ** 剥除，行内 ** 奇数时去
//    "**[" 前缀（<strong><a><strong>> 三层嵌套产物）；⑦（0.10.11 已移除）深列表缩进减半——伤合法
//    嵌套层级（3 层 8 空格被压成 4），门户动机以线上基线复验；
// ⑧ 行尾空白与 3+ 连续空行折叠；
// ⑨（0.10.10，bilibili 实测）协议相对 URL ](//…) 补全 https:；相邻重复图片行折叠（源 preload 双份）；
//    turndown 对「图+标题块混排链接」把 [ 与 ](url) 吐成孤立行的断链，合并回单行（图片行前置独立）。
export function repairBrokenLinks(md) {
  const lines = md.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === "[") {
      let close = -1;
      for (let k = i + 1; k < Math.min(i + 48, lines.length); k++) {
        const s = lines[k].trim();
        if (/^```|^~~~/.test(s)) break;
        if (/^\]\(\S+\)$/.test(s)) { close = k; break; }
      }
      if (close > 0) {
        const body = lines.slice(i + 1, close).map((s) => s.trim()).filter(Boolean);
        const dest = lines[close].trim().slice(1); // "(url)"
        const images = body.filter((s) => /^!\[/.test(s));
        const rest = body
          .filter((s) => !/^!\[/.test(s))
          .map((s) => s.replace(/^#{1,6}\s+/, "").replace(/^[-*+]\s+/, ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        const label = rest || "链接";
        if (label.length <= 600) {
          for (const img of images) out.push(img);
          out.push(`[${label}]${dest}`);
          i = close;
          continue;
        }
      }
    }
    out.push(lines[i]);
  }
  return out.join("\n").replace(/^\s*\]\((\S+)\)\s*$/gm, "$1"); // 开括号超窗的孤立闭括号兜底转裸 URL（断链本就无法渲染）
}

// 0.10.10（s.weibo.com 实测）：根相对链接 ](/path、](./x、](../x 按 finalUrl 绝对化——
// 模型拿到的 markdown 没有 base 上下文，相对链接不可点。图片同修；锥点 ](#…) 保留不动。
// 0.10.11：① 裸相对名（sib.html 这类无 / 或 ./ 前缀的路径相对形态）纳入绝对化（H9 实测漏网）；
// ② 同遍剥离跟踪参数 utm_* / gclid / fbclid / mc_eid / igshid（业务参数保留）。
export const TRACKING_PARAM_PATTERN = /^(?:utm_[\w-]*|gclid|fbclid|mc_eid|igshid)$/i;
export function absolutizeRelativeLinks(md, baseUrl) {
  let base;
  try {
    base = new URL(baseUrl);
  } catch {
    return md;
  }
  return String(md ?? "").replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (m, dest, title) => {
    const isAnchor = dest.startsWith("#");
    const isAbsolute = /^(?:[a-z][a-z0-9+.-]*:)/i.test(dest);
    if (isAnchor) return m;
    let abs = dest;
    if (!isAbsolute) {
      try {
        abs = new URL(dest, base).toString();
      } catch {
        return m;
      }
    }
    try {
      const u = new URL(abs);
      let dropped = false;
      for (const k of [...u.searchParams.keys()]) {
        if (TRACKING_PARAM_PATTERN.test(k)) {
          u.searchParams.delete(k);
          dropped = true;
        }
      }
      if (dropped) abs = u.toString();
    } catch { /* 非分层 scheme（mailto: 等）保持原样 */ }
    return `](${abs}${title ?? ""})`;
  });
}
export function postprocessMarkdown(md) {
  let inFence = false;
  let lastNonBlank = "";
  const cleanLine = (line) => {
    let l = line;
    if (/^\s*\|.*\|\s*$/.test(l)) {
      // 0.10.11 嵌套表抢救(替代 0.10.8 缺陷 1 对折叠行的整行裁除):外层单元格里的内层表被 <br> 折行 +
      // \| 转义,还原成独立表格行,零内容丢失。仅当还原后每行都以 | 开头(真表格形态)才采纳,
      // 防误伤「同时含 <br> 与转义管道的普通单元格」。
      if (/<br\s*\/?>/i.test(l) && /\\\|/.test(l)) {
        const m = /^\s*\| ?(.*) ?\|\s*$/.exec(l);
        if (m) {
          const candidate = m[1].replace(/<br\s*\/?>/gi, "\n").replace(/\\\|/g, "|");
          const rows = candidate.split("\n").map((s) => s.trim()).filter(Boolean);
          // 还须含分隔行——真内层表必有 border(或 gfm 补头),无分隔行的「| 开头多行」是普通
          // 单元格内容(如字面管道文本),走旧路径不抢救。
          if (rows.length >= 2 && rows.every((r) => r.startsWith("|")) && rows.some((r) => /^\|(?:\s*:?-{2,}:?\s*\|)+$/.test(r))) return rows.join("\n");
        }
      }
      l = l.replace(/<br\s*\/?>/gi, " / ");
      if (/\\\|/.test(l)) {
        // 0.10.8 缺陷 1：嵌套表 collapse——内层表的行被 <br> 连接折进同一行（内表管道转义为 \|），
        // 真实形态是「合法首格 + 内联escaped垃圾」。尾部 ≥3 个 \| 或含 escaped 分隔行（\| ---）则
        // 认定为 collapse 垃圾，裁掉 escaped 段并把整行 unwrap 出表格（合法单格内偶发 \| 不误伤）。
        const esc = l.indexOf("\\|");
        const tail = l.slice(esc);
        const escCount = (tail.match(/\\\|/g) || []).length;
        if (escCount >= 3 || /\\\|\s*-{3,}/.test(tail)) {
          const head = l.slice(0, esc).replace(/^\s*\|\s*/, "").trim();
          l = head;
        } else {
          const cells = l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/);
          const junk = (t) => {
            const flat = t.replace(/\\\|/g, "|");
            const parts = flat.split("|").map((p) => p.trim());
            return parts.every((p) => p === "" || p === "/" || /^:?-{2,}:?$/.test(p));
          };
          const kept = cells.map((c) => c.trim()).filter((c) => c && !junk(c));
          if (kept.length === 0) return "";
          if (kept.length === 1) l = kept[0];
          else l = `| ${kept.join(" | ")} |`;
        }
      }
      const allCells = l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/);
      if (allCells.every((c) => !c.trim() || /^\\\|?$/.test(c.trim()))) return "";
    }
    // 0.10.11 收窄轮播页码丢弃（0.10.8 缺陷 5 原规则误删合法纯数字行）：≥4 个 token、全为 1–2 位
    // 整数、严格逐项 −1 递减（「8 7 6 5…」形态）才丢；比分 98 97 95、摇号 3 7 15 22 31 等保留。
    const numTokens = l.trim().split(/\s+/);
    if (numTokens.length >= 4 && numTokens.every((t) => /^\d{1,2}$/.test(t)) && numTokens.every((t, i) => i === 0 || Number(t) === Number(numTokens[i - 1]) - 1)) return "";
    l = l.replace(/\]\(<\s*([^\s>]*)\s*>\)/g, "]($1)"); // 0.10.8 缺陷 3：尖括号目标归一
    l = l.replace(/\[([^\]]*)\]\((?:javascript|data|blob|vbscript):[^)]*(?:\)[^)]*)?\)/gi, "$1");
    l = l.replace(/\[([^\]]*)\]\(<\s*(?:javascript|data|blob|vbscript):[^>]*>\)/gi, "$1");
    l = l.replace(/(?<!!)\[\s*\]\(([^)\s]+)\)/g, "$1"); // 0.10.8 缺陷 4：空标链接→裸 URL
    // 0.10.8 缺陷 2：链接标内冗余 ** 剥除；行内 ** 奇数时去首个 "**[" 前缀
    l = l.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (m, label, dest) => (label.includes("**") ? `[${label.replace(/\*\*/g, "")}](${dest})` : m));
    if ((l.match(/\*\*/g) || []).length % 2 === 1) l = l.replace(/\*\*\[/, "[");
    l = l.replace(/[ \t]+$/g, "");
    // 0.10.11：深列表缩进砍半规则（0.10.6 ⑦）移除——turndown 合法嵌套缩进恒为 4 的倍数，砍半必伤
    // 真层级（3 层 8 空格被压成 4）；0.10.6 的 bilibili 门户动机离线不可复现，发布前以线上基线复验。
    // 0.10.11 空白规整：零宽字符剔除、nbsp 归一为普通空格（本函数只在围栏外调用，代码块内容保真）。
    return l.replace(/[\u200b-\u200d\ufeff]/g, "").replace(/\u00a0/g, " ");
  };
  const lines = [];
  for (const line of String(md ?? "").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; lines.push(line); continue; }
    if (inFence) { lines.push(line); continue; }
    let l = cleanLine(line);
    l = l.replace(/\]\(\/\//g, "](https://"); // 0.10.10 协议相对 URL 补全
    if (l.trim() && /^!\[/.test(l.trim()) && l.trim() === lastNonBlank) continue; // 0.10.10 相邻重复图片折叠
    if (l.trim()) lastNonBlank = l.trim();
    lines.push(l);
  }
  // 0.10.11 标题归一（围栏感知）放在行级清洗之后、收尾 trim 之前
  return normalizeHeadings(
    repairBrokenLinks(lines.join("\n"))
      .replace(/^\s*\[\s*$/gm, "") // 合并窗口未命中的残余孤立 [ 行（导航区断链尾巴）纯噪声
      .replace(/^\s*\|\s*(?:\|\s*)+$/gm, "")
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
}

// 0.10.11 标题归一（围栏感知）：第 2+ 个 h1 降为 h2；相对前一标题跳级 >1 拉平到 prev+1；
// 首个标题不做跳级处理（无上文参照）。围栏内 # 行原样不动。
export function normalizeHeadings(md) {
  const out = [];
  let inFence = false;
  let prevLevel = 0;
  let seenH1 = false;
  for (const line of String(md ?? "").split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; out.push(line); continue; }
    const m = inFence ? null : /^(#{1,6})(\s|$)/.exec(line);
    if (m) {
      let level = m[1].length;
      if (level === 1 && seenH1) level = 2;
      else if (level === 1) seenH1 = true;
      if (prevLevel > 0 && level > prevLevel + 1) level = prevLevel + 1;
      out.push("#".repeat(level) + line.slice(m[1].length));
      prevLevel = level;
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

// 行边界截断（0.10.6）：limit 内优先切在最后一个换行，次选空格，避免尾部残留未闭合残句/转义。
// 0.10.11 切点安全：① 代理对不拆（按码元切会产出非法 UTF-16，下游 JSON 序列化即乱码）；
// ② 窗口内 ```/~~~ 行数为奇 → 切点回退到最后一个围栏行之前，残缺代码块整体丢弃（未闭合围栏
// 会让下游把后续一切当代码）。
export function smartTruncate(text, limit) {
  const s = String(text ?? "");
  if (s.length <= limit) return s;
  const cutLimit = cutSafe(s, limit).length; // 代理对回退统一走 cutSafe 判则
  const window = s.slice(0, cutLimit);
  const nl = window.lastIndexOf("\n");
  const sp = window.lastIndexOf(" ");
  let cut = nl > limit * 0.8 ? nl : sp > limit * 0.8 ? sp : cutLimit;
  const fenceRe = /^[ \t]*(?:```|~~~)/gm;
  let fenceCount = 0;
  let lastFenceIdx = -1;
  let fm;
  while ((fm = fenceRe.exec(window))) { fenceCount++; lastFenceIdx = fm.index; }
  if (fenceCount % 2 === 1 && lastFenceIdx >= 0) {
    const lineStart = window.lastIndexOf("\n", lastFenceIdx);
    cut = Math.min(cut, lineStart === -1 ? 0 : lineStart);
  }
  return window.slice(0, cut).replace(/\s+$/, "") + "\n…";
}

// HTML → GFM Markdown；malformed markup 让 turndown 抛 DOM 错时退回 cheerio 纯文本。
export function htmlToMarkdownGfm(html) {
  try {
    return postprocessMarkdown(hostTwinTurndown.turndown(html));
  } catch {
    const $ = cheerio.load(html ?? "");
    $("script, style, noscript, template").remove();
    return ($("body").text() || $("*").text() || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  }
}

// fields 规格解析：分号分隔，`label=cssSelector` 或 `label=cssSelector|attr`；无 `=` 时视为裸 selector。
export function parseFieldSpecs(fields) {
  const out = [];
  for (const raw of String(fields ?? "").split(";")) {
    const spec = raw.trim();
    if (!spec) continue;
    const eq = spec.indexOf("=");
    if (eq === -1) {
      out.push({ label: spec, sel: spec, attr: null });
      continue;
    }
    const label = spec.slice(0, eq).trim();
    const rest = spec.slice(eq + 1).trim();
    const bar = rest.lastIndexOf("|");
    const sel = bar === -1 ? rest : rest.slice(0, bar).trim();
    const attr = bar === -1 ? null : rest.slice(bar + 1).trim() || null;
    if (label && sel) out.push({ label, sel, attr });
  }
  return out;
}

// 抽取内核：selector 限定范围；fields 存在时输出 [{label,value}]（每项截 500），
// 否则对命中区域出 Markdown；零命中回退整页并在 note 里说清。
// 0.10.7：改文档模式解析——旧版片段模式按 HTML 片段解析算法会忽略字面 <body> 起始标签（子节点直接
// 挂文档根，实证@_news.baidu.raw.html：片段模式 body a=0、文档模式命中），body 前缀选择器恒空；
// markdown 路径不依赖 body 能看到链接，造成「同页两路径命中不同 DOM」的错觉（实为同一份服务端 HTML）。
export function extractBySelector(html: any, { selector, fields, mode, baseUrl }: any = {}) {
  const $ = cheerio.load(html ?? "");
  $("script, style, noscript, template").remove();
  const note = [];
  let scope = "page";
  let $nodes: any = $.root();
  if (selector && String(selector).trim()) {
    const sel = $(String(selector).trim());
    if (sel.length > 0) {
      $nodes = sel;
      scope = `selector(${String(selector).trim()})`;
      if (sel.length > 1) note.push(`${sel.length} matches`);
    } else {
      note.push(`selector "${String(selector).trim()}" matched 0 nodes, fell back to whole page`);
    }
  }
  const specs = parseFieldSpecs(fields);
  if (specs.length > 0) {
    const extracted = [];
    for (const { label, sel, attr } of specs) {
      const hit = $(sel).first();
      if (!hit.length) {
        extracted.push({ label, value: "" });
        continue;
      }
      const value = attr ? hit.attr(attr) ?? "" : hit.text();
      const clean = String(value).replace(/\s+/g, " ").trim();
      extracted.push({ label, value: clean.length > 500 ? `${cutSafe(clean, 500)}…` : clean });
    }
    return { extracted, scope, note: note.join("; ") || undefined };
  }
  const inner = [];
  $nodes.each((_, el) => { inner.push($(el).html() ?? ""); });
  const joined = inner.join("\n<hr>\n");
  if (mode === "text") {
    // 0.10.11 块边界保留：块级闭标签前注入空行、<br> 注入换行，防相邻块文本在 text() 取值时
    // 粘连成新词（实测 <p>a b</p><p>c</p> → "a bc"）。
    const blocky = joined
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|tr|td|th|section|article|blockquote|pre|h[1-6]|table|ul|ol|figcaption|dd|dt)>/gi, "\n\n");
    const tmp = cheerio.load(blocky);
    return { markdown: tmp.text().replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").replace(/^\n+/, "").trim(), scope, note: note.join("; ") || undefined };
  }
  const md = htmlToMarkdownGfm(joined);
  return { markdown: baseUrl ? absolutizeRelativeLinks(md, baseUrl) : md, scope, note: note.join("; ") || undefined };
}

// SSRF 守卫（0.10.4，L3 发现 #1 整改）：协议门已存，补内网地址拒绝 + 重定向限次（≤5，手动跟踪逐跳复检）。
// 已知残余：DNS 解析与 fetch 之间存在理论 TOCTOU（rebinding）；本机 harness 威胁模型下接受。
// advanceFetchAllowPrivate=true 为显式 opt-in（局域网设备抓取场景），仅放宽地址门，协议/重定向门不放宽。
export function isPrivateIpCase(ip) {
  const s = String(ip ?? "").trim().toLowerCase();
  if (!s) return true;
  const v4 = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (v4.some((i) => Number(i) > 255)) return true;
    if (a === 0 || a === 10 || a === 127) return true;            // 本机/私有/回环
    if (a === 169 && b === 254) return true;                        // 链路本地（含云元数据 169.254.169.254）
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;              // CGNAT
    if (a === 255 || a >= 224) return true;                          // 广播/多播
    return false;
  }
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isPrivateIpCase(mapped[1]);
  if (s === "::" || s === "::1") return true;
  const head = s.replace(/[^0-9a-f]/g, "").slice(0, 4);
  const hi = parseInt(head.padEnd(4, "0"), 16);
  if (!Number.isFinite(hi)) return true;
  if ((hi & 0xfe00) === 0xfc00) return true;                         // ULA fc00::/7
  if ((hi & 0xffc0) === 0xfe80) return true;                         // link-local fe80::/10
  return false;
}
export function isPrivateHost(hostname) {
  const h = String(hostname ?? "").toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".localdomain") || h.endsWith(".onion")) return true;
  const stripped = h.replace(/^\[|\]$/g, "");
  if (/^\d+\.\d+\.\d+\.\d+$/.test(stripped) || stripped.includes(":")) return isPrivateIpCase(stripped);
  return null; // 域名：交给 DNS 解析门
}
export async function assertFetchTargetAllowed(urlObj, allowPrivate) {
  if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
    throw new Error(`unsupported protocol "${urlObj.protocol}" — advance_fetch only fetches http(s) URLs`);
  }
  if (allowPrivate) return;
  const hostVerdict = isPrivateHost(urlObj.hostname);
  if (hostVerdict === true) {
    throw new Error(`refused: ${urlObj.hostname} is a loopback/private/reserved target (set advanceFetchAllowPrivate=true to opt in)`);
  }
  if (hostVerdict === null) {
    let addrs;
    try {
      addrs = await dnsPromises.promises.lookup(urlObj.hostname, { all: true });
    } catch {
      throw new Error(`cannot resolve ${urlObj.hostname}`);
    }
    for (const a of addrs) {
      if (isPrivateIpCase(a.address)) {
        throw new Error(`refused: ${urlObj.hostname} resolves to private/reserved address ${a.address} (set advanceFetchAllowPrivate=true to opt in)`);
      }
    }
  }
}

// 0.10.11 反爬挑战页识别：200 状态 + 挑战文案 + 近空正文（<1500 字符）→ 判定为失败。
// 大篇幅正文偶含关键词不触发（阈值双条件）。矩阵要求「识别为失败而不是当成正文」。
export const CHALLENGE_PAGE_PATTERN = /\bcaptcha\b|just a moment|checking your browser|verify (?:you are|that you are)|attention required|请完成安全验证|安全验证|人机验证|访问验证|验证码/i;

// 按域 cookie 表解析（0.10.12）：逐行 `域名 cookie串`，行内以首个空白分隔（cookie 值含 `=`/分号不受影响）；
// `#` 注释行与空行跳过，域名归一小写并剥前导点；坏行（无空白分隔/缺 cookie 值）静默丢弃。
export function parseCookieMap(raw) {
  const out = [];
  for (const line of String(raw ?? "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const sep = t.search(/\s/);
    if (sep === -1) continue;
    const domain = t.slice(0, sep).replace(/^\./, "").toLowerCase();
    const cookie = t.slice(sep + 1).trim();
    if (domain && cookie) out.push({ domain, cookie });
  }
  return out;
}
// host 匹配：相等或以 "."+domain 结尾（子域）；两侧归一小写。
export function matchCookieEntry(entries, hostname) {
  const host = String(hostname ?? "").toLowerCase();
  return entries.find((e) => host === e.domain || host.endsWith(`.${e.domain}`))?.cookie;
}

// 入口：协议+地址门（逐跳复检，重定向限 5）→ 拉取 → 分派。
export async function advanceFetch(url, { selector, fields, mode, maxChars, allowPrivate, userAgent, referer, cookieMap }: any = {}, signal?) {
  let current;
  try {
    current = new URL(String(url));
  } catch {
    throw new Error(`invalid url: ${String(url).slice(0, 120)}`);
  }
  const limit = Math.min(Math.max(Number(maxChars) || ADVANCE_FETCH_MAX_CHARS_DEFAULT, 1), ADVANCE_FETCH_MAX_CHARS_LIMIT);
  const cookieEntries = parseCookieMap(cookieMap); // 0.10.12 每次调用解析一次，循环内逐跳匹配
  let response;
  for (let hops = 0; ; hops++) {
    await assertFetchTargetAllowed(current, allowPrivate === true);
    // 0.10.12 凭据化抓取：UA/Referer 覆盖每跳都带；cookie 按 current 域匹配、每跳重判——
    // 302 换域即不带原凭据（浏览器语义，防外流）。
    const cookieHeader = cookieEntries.length ? matchCookieEntry(cookieEntries, current.hostname) : undefined;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ADVANCE_FETCH_TIMEOUT_MS);
    const onAbort = () => ctrl.abort();
    signal?.addEventListener("abort", onAbort);
    try {
      // 0.11.5：ALPN https 基元，不自动跟重定向——下面的逐跳 SSRF 复检环保留原语义
      response = await httpsLikeFetch(current, {
        headers: {
          "user-agent": userAgent || USER_AGENT,
          "accept-language": ACCEPT_LANG,
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          ...(referer ? { referer } : {}),
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        signal: ctrl.signal,
        timeoutMs: ADVANCE_FETCH_TIMEOUT_MS,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error(`connection error: ${error?.message ?? String(error)}`);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      try { response.body?.cancel?.(); } catch {}
      if (!location) break;
      if (hops >= 5) throw new Error("too many redirects (max 5 hops)");
      try {
        current = new URL(location, current);
      } catch {
        throw new Error(`invalid redirect target: ${String(location).slice(0, 120)}`);
      }
      continue;
    }
    break;
  }
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${current.host}${current.pathname}`);
  const contentType = String(response.headers.get("content-type") ?? "").toLowerCase();
  const body = decodeResponseBody(await response.arrayBuffer(), response.headers.get("content-type"));
  const truncated = body.length > Math.max(limit * 3, limit + 1000); // 抽取前留冗余，截断只作用于输出
  // statusCode 透传（0.12.0 fetch provider 需要）；advance_fetch 工具输出形状不变，多出的字段无害。
  const base = { url: String(url), finalUrl: current.toString(), statusCode: response.status };
  // 0.10.11 RSS/Atom 识别：根元素 rss/feed 的 XML 按 JSON 先例 text 透传（此前走 html 路径粘连成
  // 无分隔字符串，实测 "ChanItemADescB"）；xhtml 不含 rss/feed 根，不受影响仍走 html 路径。
  const xmlHead = body.slice(0, 2048);
  if ((contentType.includes("xml") || /^\s*<\?xml/i.test(xmlHead)) && /<\s*(?:rss|feed)[\s>]/i.test(xmlHead)) {
    const text = smartTruncate(body, limit);
    return { ...base, text, truncated: text.length < body.length, note: "rss/atom xml passed through" };
  }
  if (contentType.includes("json")) {
    const text = smartTruncate(body, limit);
    return { ...base, text, truncated: text.length < body.length, note: "json body passed through" };
  }
  if (contentType.includes("html") || contentType.includes("xml") || (!contentType && /<[a-z!]/i.test(body.slice(0, 512)))) {
    const out = extractBySelector(body, { selector, fields, mode, baseUrl: current.toString() });
    if (out.extracted) return { ...base, extracted: out.extracted, truncated: false, ...(out.note ? { note: out.note } : {}) };
    const md = out.markdown ?? "";
    // 0.10.11 反爬挑战页识别：200 + 挑战文案 + 近空正文 → 明确失败而非垃圾正文。
    if (md.length < 1500 && CHALLENGE_PAGE_PATTERN.test(md)) {
      throw new Error("anti-bot challenge page detected (HTTP 200) — content likely requires a JS-rendered source");
    }
    // 0.10.11 空壳/frameset 信号：近空正文不静默返回，note 说明原因与出路。
    const extraNotes = [];
    if (/<frameset[\s>]/i.test(body)) extraNotes.push("frameset page: frame contents are not fetched");
    else if (body.length > 5000 && md.replace(/\s/g, "").length < 200) extraNotes.push("server HTML looks like a JS-rendered shell; content likely requires browser rendering");
    return { ...base, markdown: smartTruncate(md, limit), truncated: md.length > limit, note: [out.note, ...extraNotes].filter(Boolean).join("; ") || undefined, scope: out.scope };
  }
  const plain = body.replace(/\r\n/g, "\n");
  const text = smartTruncate(plain, limit);
  return { ...base, text, truncated: text.length < plain.length, note: `content-type "${contentType || "unknown"}" passed through as text` };
}
//#endregion
