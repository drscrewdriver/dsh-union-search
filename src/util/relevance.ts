// 相关性守卫（0.17.0-rc.3 自 index.js 原样搬移，行为零变化）。
// 上游 5001357 + d019d04 终版判据，#112/#132 教训。

/** 相关性判定消费的最小结果形状（引擎 source 对象的投影）。 */
export interface RelevanceSource {
  title?: string | null;
  snippet?: string | null;
  url?: string | null;
  [key: string]: unknown;
}

// Bing 在「查询无结果」时会返回一张完全无关的缓存 SERP（<li class="b_algo"> 照常存在，
// 但内容是别的查询/热门页的内容），直接返回等于把垃圾结果喂给模型（issue #38：YouTube、
// 法语微软文档、瑞士基金等都复现过）。这里用「查询 token 与结果文本是否重叠」识别这种页面。
// token 规则：CJK 取二元组（单字不入判据），拉丁/数字取长度 >=2 的词。
export function queryOverlapTokens(query: string): string[] {
  const tokens = new Set<string>();
  for (const run of String(query).match(/[\u4e00-\u9fff]+/g) ?? []) {
    // 单字（年/月/日/系/统）几乎出现在任何页面里，只保留二元组（上游 #112 教训）。
    if (run.length === 2) tokens.add(run);
    for (let i = 0; i + 1 < run.length; i++) tokens.add(run.slice(i, i + 2));
  }
  for (const word of String(query).toLowerCase().split(/[^a-z0-9]+/)) {
    if (word.length >= 2) tokens.add(word);
  }
  return [...tokens];
}

// 相关性守卫（上游 5001357 + d019d04 终版判据，#112/#132 教训）：一批结果与查询词面重叠
// 太少时判为空结果，交给统一回退链换下一个引擎。三条件同时成立才算相关：
//  ① 命中源数 ≥ 1/3（至少 1）——防单条杂鱼拖整批；② token 重叠度（≥2 个或 ≥50%）；
//  ③ 存在标题强命中（中文二元组或 ≥4 位 ASCII 词；短 ASCII 多是型号后缀不算）——
//    缓存页/导航页正文里满屏都是热词但标题不答问，就是这种。
export function looksRelevant(query: string, sources: RelevanceSource[]): boolean {
  const tokens = queryOverlapTokens(query);
  if (tokens.length === 0) return true; // 纯符号/单字查询无法判定，不拦截
  const strong = tokens.filter((t) => !/^\d+$/.test(t));
  const usable = strong.length > 0 ? strong : tokens;
  const titleStrong = strong.filter((t) => /[\u4e00-\u9fff]/.test(t) || t.length >= 4);
  const titleTokens = titleStrong.length > 0 ? titleStrong : usable;
  const matched = new Set<string>();
  const titleMatched = new Set<string>();
  let relevant = 0;
  for (const source of sources) {
    const title = String(source.title ?? "").toLowerCase();
    const hay = `${title} ${source.snippet ?? ""} ${source.url ?? ""}`.toLowerCase();
    const hits = usable.filter((t) => hay.includes(t.toLowerCase()));
    if (hits.length > 0) {
      relevant += 1;
      for (const hit of hits) matched.add(hit);
      for (const hit of titleTokens) {
        if (title.includes(hit.toLowerCase())) titleMatched.add(hit);
      }
    }
  }
  const enoughSources = relevant >= Math.max(1, Math.ceil(sources.length / 3));
  const enoughTokens = matched.size >= Math.min(2, usable.length) || matched.size / usable.length >= 0.5;
  return enoughSources && enoughTokens && titleMatched.size > 0;
}

// 引擎出口统一守卫（0.11.3）：非空但判无关的批次洗成空结果，交给回退链换下一个引擎；
// 洗空时附带清掉 content 等聚合提示（避免无关批次的聚合文案残留进工具输出）。
export function guardRelevance<T extends { sources?: RelevanceSource[] }>(query: string, result: T): T | { sources: never[]; truncated: boolean } {
  if (result?.sources && result.sources.length > 0 && !looksRelevant(query, result.sources)) {
    return { sources: [], truncated: false };
  }
  return result;
}
