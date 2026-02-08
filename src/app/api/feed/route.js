import { NextResponse } from "next/server";
import Parser from "rss-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parser = new Parser();

// 간단 캐시(서버 인스턴스 메모리): 60초
let CACHE = {
  ts: 0,
  data: null,
};
const TTL_MS = 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();

    if (CACHE.data && now - CACHE.ts < TTL_MS) {
      return NextResponse.json(CACHE.data, {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    const feed = await parser.parseURL(
      "https://rss.app/feeds/FI2njqOcPrauN4Ik.xml"
    );

    const items = (feed.items || []).slice(0, 50).map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet || "",
      thumbnail:
        item.enclosure?.url ||
        item["media:content"]?.url ||
        item["media:thumbnail"]?.url ||
        "",
    }));

    const payload = { items };

    CACHE = { ts: now, data: payload };

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "RSS 불러오기 실패" },
      { status: 500 }
    );
  }
}