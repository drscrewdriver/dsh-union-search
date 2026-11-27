// 平台搜索族（GitHub/V2EX/Bilibili/Reddit/HN/SO/Wikipedia/npm，rc.4 逐字搬移）
// AUTO-EXTRACT rc.4：正文自 src/index.js 逐字搬移，除加 export/尾部 setter 外未改动。
import { USER_AGENT } from "../common";
import { stripTags } from "../../util/text";
import { searchYoutube, searchVimeo } from "./video";

//#region platform search (GitHub / V2EX / Bilibili / Reddit / HN / StackOverflow / Wikipedia / npm)
export const PLATFORMS = {
  github: { name: "GitHub" },
  v2ex: { name: "V2EX" },
  bilibili: { name: "Bilibili" },
  reddit: { name: "Reddit" },
  hn: { name: "Hacker News" },
  stackoverflow: { name: "Stack Overflow" },
  wikipedia: { name: "Wikipedia" },
  npm: { name: "npm" },
  youtube: { name: "YouTube" },
  vimeo: { name: "Vimeo" },
};

export async function searchGithub(query, maxResults, signal?) {
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${maxResults ?? 5}`,
    {
      headers: { "user-agent": USER_AGENT, accept: "application/vnd.github+json" },
      ...(signal !== undefined ? { signal } : {}),
    }
  );
  if (!response.ok) throw new Error(`GitHub API error (HTTP ${response.status})`);
  const data = await response.json();
  return {
    sources: (data.items ?? []).map((item) => ({
      url: item.html_url,
      title: item.full_name ?? item.name,
      snippet: `${item.description ?? ""}${item.stargazers_count ? ` ⭐${item.stargazers_count}` : ""}`.trim(),
    })),
    truncated: false,
  };
}

export async function searchV2ex(query, maxResults, signal?) {
  const response = await fetch("https://www.v2ex.com/api/topics/hot.json", {
    headers: { "user-agent": USER_AGENT },
    ...(signal !== undefined ? { signal } : {}),
  });
  if (!response.ok) throw new Error(`V2EX API error (HTTP ${response.status})`);
  const topics = await response.json();
  const q = query.toLowerCase();
  const matched = Array.isArray(topics)
    ? topics.filter((t) => (t.title ?? "").toLowerCase().includes(q) || (t.content ?? "").toLowerCase().includes(q))
    : [];
  return {
    sources: matched.slice(0, maxResults ?? 5).map((t) => ({
      url: `https://www.v2ex.com/t/${t.id}`,
      title: t.title,
      ...(t.content ? { snippet: String(t.content).slice(0, 200) } : {}),
    })),
    truncated: false,
  };
}

export async function searchBilibili(query, maxResults, signal?) {
  const response = await fetch(
    `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${encodeURIComponent(query)}`,
    {
      headers: { "user-agent": USER_AGENT, referer: "https://www.bilibili.com" },
      ...(signal !== undefined ? { signal } : {}),
    }
  );
  if (!response.ok) throw new Error(`Bilibili API error (HTTP ${response.status})`);
  const data = await response.json();
  if (data.code !== 0) throw new Error(`Bilibili API error: ${data.message ?? data.code}`);
  const sources = [];
  for (const section of data.data?.result ?? []) {
    for (const item of section.data ?? []) {
      if (!item.arcurl) continue;
      sources.push({
        url: item.arcurl,
        title: item.title ? String(item.title).replace(/<[^>]+>/g, "") : item.bvid,
        ...(item.desc ? { snippet: String(item.desc).slice(0, 200) } : {}),
      });
      if (sources.length >= (maxResults ?? 5)) break;
    }
    if (sources.length >= (maxResults ?? 5)) break;
  }
  return { sources, truncated: false };
}

export async function searchReddit(query, maxResults, signal?) {
  const response = await fetch(
    `https://old.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${maxResults ?? 5}&sort=relevance`,
    {
      headers: {
        "user-agent": `${USER_AGENT} (dsh-union-search; contact: github.com/drscrewdriver)`,
        accept: "application/json",
      },
      ...(signal !== undefined ? { signal } : {}),
    }
  );
  if (!response.ok) throw new Error(`Reddit API error (HTTP ${response.status})`);
  const data = await response.json();
  return {
    sources: (data.data?.children ?? [])
      .map((c) => c.data)
      .filter((p) => p && p.url)
      .map((p) => ({
        url: p.url,
        title: p.title ?? "",
        ...(p.selftext ? { snippet: String(p.selftext).slice(0, 200) } : {}),
      })),
    truncated: false,
  };
}

export async function searchHackerNews(query, maxResults, signal?) {
  const response = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=${maxResults ?? 5}`,
    {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      ...(signal !== undefined ? { signal } : {}),
    }
  );
  if (!response.ok) throw new Error(`Hacker News API error (HTTP ${response.status})`);
  const data = await response.json();
  return {
    sources: (data.hits ?? [])
      .filter((h) => h.title || h.story_title)
      .map((h) => ({
        // 有外链用外链，纯讨论帖用 HN 讨论页
        url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
        title: h.title ?? h.story_title,
        ...((h.points !== undefined && h.points !== null) || (h.num_comments !== undefined && h.num_comments !== null)
          ? { snippet: `HN discussion · ${h.points ?? 0} points · ${h.num_comments ?? 0} comments` }
          : {}),
      })),
    truncated: false,
  };
}

export async function searchStackOverflow(query, maxResults, signal?) {
  const response = await fetch(
    `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=${maxResults ?? 5}&filter=!nNPvSNVZJS`,
    {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      ...(signal !== undefined ? { signal } : {}),
    }
  );
  if (!response.ok) throw new Error(`Stack Exchange API error (HTTP ${response.status})`);
  const data = await response.json();
  if (data.error_message) throw new Error(`Stack Exchange API error: ${data.error_message}`);
  return {
    sources: (data.items ?? []).map((it) => ({
      url: it.link,
      title: it.title,
      ...(it.score !== undefined || it.answer_count !== undefined
        ? { snippet: `${it.is_answered ? "✓ answered" : "unanswered"} · score ${it.score ?? 0} · ${it.answer_count ?? 0} answers` }
        : {}),
    })),
    truncated: false,
  };
}

export async function searchWikipedia(query, maxResults, signal, lang) {
  const host = lang === "en" ? "en.wikipedia.org" : "zh.wikipedia.org";
  const response = await fetch(
    `https://${host}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=${maxResults ?? 5}`,
    {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      ...(signal !== undefined ? { signal } : {}),
    }
  );
  if (!response.ok) throw new Error(`Wikipedia API error (HTTP ${response.status})`);
  const data = await response.json();
  return {
    sources: (data.query?.search ?? []).map((s) => ({
      url: `https://${host}/wiki/${encodeURIComponent(String(s.title).replace(/ /g, "_"))}`,
      title: s.title,
      // snippet 含 <span class="searchmatch"> 高亮标签，剥掉
      ...(s.snippet ? { snippet: stripTags(s.snippet).slice(0, 200) } : {}),
    })),
    truncated: false,
  };
}

export async function searchNpm(query, maxResults, signal?) {
  const response = await fetch(
    `https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(query)}&size=${maxResults ?? 5}`,
    {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      ...(signal !== undefined ? { signal } : {}),
    }
  );
  if (!response.ok) throw new Error(`npm registry API error (HTTP ${response.status})`);
  const data = await response.json();
  return {
    sources: (data.objects ?? [])
      .map((o) => o.package)
      .filter((p) => p && p.name)
      .map((p) => ({
        url: p.links?.npm ?? `https://www.npmjs.com/package/${p.name}`,
        title: p.name,
        ...((p.description || p.version)
          ? { snippet: `v${p.version ?? "?"}${p.description ? ` — ${String(p.description).slice(0, 160)}` : ""}` }
          : {}),
      })),
    truncated: false,
  };
}

export async function searchPlatform(platform, query, maxResults, signal, lang) {
  switch (platform) {
    case "github":
      return searchGithub(query, maxResults, signal);
    case "v2ex":
      return searchV2ex(query, maxResults, signal);
    case "bilibili":
      return searchBilibili(query, maxResults, signal);
    case "reddit":
      return searchReddit(query, maxResults, signal);
    case "hn":
      return searchHackerNews(query, maxResults, signal);
    case "stackoverflow":
      return searchStackOverflow(query, maxResults, signal);
    case "wikipedia":
      return searchWikipedia(query, maxResults, signal, lang);
    case "npm":
      return searchNpm(query, maxResults, signal);
    case "youtube":
      return searchYoutube(query, maxResults, signal);
    case "vimeo":
      return searchVimeo(query, maxResults, signal);
    default:
      throw new Error(`unknown platform: ${platform}`);
  }
}
//#endregion
