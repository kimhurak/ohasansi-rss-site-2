import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6시간
const ogCache = globalThis.__ogCache || new Map();
globalThis.__ogCache = ogCache;

function getCached(url) {
  const hit = ogCache.get(url);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    ogCache.delete(url);
    return null;
  }
  return hit.value;
}

function setCached(url, value) {
  ogCache.set(url, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function extractOgImage(html) {
  let m =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );

  if (m?.[1]) return m[1];

  m =
    html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    ) ||
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i
    );

  return m?.[1] || "";
}

async function fetchWithTimeout(url, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      },
    });
  } finally {
    clearTimeout(t);
  }
}

async function mapLimit(list, limit, mapper) {
  const results = new Array(list.length);
  let i = 0;
  async function worker() {
    while (i < list.length) {
      const idx = i++;
      results[idx] = await mapper(list[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, () => worker())
  );
  return results;
}

function pickRssImage(item) {
  if (item?.enclosure?.url) return item.enclosure.url;
  if (item?.itunes?.image) return item.itunes.image;
  if (item?.["media:content"]?.url) return item["media:content"].url;
  if (item?.["media:thumbnail"]?.url) return item["media:thumbnail"].url;

  // content 안에 img 태그가 박혀있으면 그거라도 뽑기
  const html = item?.content || item?.["content:encoded"] || "";
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m?.[1]) return m[1];

  return "";
}

async function getThumbnailFromLink(link) {
  if (!link) return "";

  const cached = getCached(link);
  if (cached !== null) return cached;

  try {
    const res = await fetchWithTimeout(link, 7000);
    if (!res.ok) {
      setCached(link, "");
      return "";
    }
    const html = await res.text();
    const og = extractOgImage(html).replaceAll("&amp;", "&");
    setCached(link, og || "");
    return og || "";
  } catch {
    setCached(link, "");
    return "";
  }
}

export async function GET() {
  try {
    const feed = await parser.parseURL(
      "https://rss.app/feeds/FI2njqOcPrauN4Ik.xml"
    );

    const baseItems = (feed.items || []).slice(0, 20).map((item) => ({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || "",
      contentSnippet: item.contentSnippet || "",
      thumbnail: pickRssImage(item) || "",
    }));

    const items = await mapLimit(baseItems, 5, async (it) => {
      if (it.thumbnail) return it;
      const thumb = await getThumbnailFromLink(it.link);
      return { ...it, thumbnail: thumb };
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: "RSS 불러오기 실패" }, { status: 500 });
  }
}