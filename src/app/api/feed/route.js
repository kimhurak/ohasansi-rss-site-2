import { NextResponse } from "next/server";
import Parser from "rss-parser";

const RSS_URL = "https://rss.app/feeds/FI2njqQcPrauN4Ik.xml";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

function pickThumbFromItem(item) {
  // 1) RSS 표준 enclosure
  if (item?.enclosure?.url) return item.enclosure.url;

  // 2) media:content / media:thumbnail
  const mc = item?.mediaContent?.[0]?.$?.url;
  if (mc) return mc;

  const mt = item?.mediaThumbnail?.[0]?.$?.url;
  if (mt) return mt;

  // 3) content / content:encoded 안에 img 찾기
  const html = item?.contentEncoded || item?.content || "";
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  if (match?.[1]) return match[1];

  return "";
}

export async function GET() {
  try {
    // ✅ parseURL 대신 fetch + parseString (Vercel에서 더 안정적)
    const res = await fetch(RSS_URL, {
      // Vercel 캐시: 5분
      next: { revalidate: 300 },
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; ohasansi-rss-site/1.0; +https://vercel.app)",
        accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: "RSS 불러오기 실패",
          detail: `Status code ${res.status}`,
        },
        { status: 500 }
      );
    }

    const xml = await res.text();
    const feed = await parser.parseString(xml);

    const items = (feed.items || []).slice(0, 5).map((item) => ({
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate || "",
      contentSnippet: item.contentSnippet || "",
      thumbnail: pickThumbFromItem(item),
    }));

    return NextResponse.json(
      { items },
      {
        headers: {
          // 프론트에서 보기 좋게
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: "RSS 불러오기 실패",
        detail: String(e?.message || e),
      },
      { status: 500 }
    );
  }
}