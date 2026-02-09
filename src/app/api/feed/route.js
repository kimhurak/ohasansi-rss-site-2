import { NextResponse } from "next/server";

const FEED_URL = "https://rss.app/feeds/v1.1/FI2njqOcPrauN4Ik.json";

function pickThumbnail(item) {
  // RSS.app JSON 포맷이 케이스가 좀 갈려서 최대한 다 커버
  const direct =
    item?.image ||
    item?.image_url ||
    item?.thumbnail ||
    item?.thumbnail_url ||
    item?.banner_image ||
    item?.enclosure?.url ||
    item?.enclosure?.link ||
    item?.attachments?.[0]?.url ||
    item?.attachments?.[0]?.link;

  if (direct) return direct;

  const html = item?.content_html || item?.content || item?.summary || "";
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || "";
}

function pickLink(item) {
  return (
    item?.url ||
    item?.external_url ||
    item?.link ||
    item?.guid ||
    item?.id ||
    ""
  );
}

function pickDate(item) {
  return (
    item?.date_published ||
    item?.published ||
    item?.pubDate ||
    item?.date ||
    ""
  );
}

function pickSnippet(item) {
  const text =
    item?.content_text ||
    item?.summary ||
    item?.description ||
    item?.content ||
    "";

  // 너무 길면 UI가 터져서 살짝만 잘라줌
  return String(text).replace(/\s+/g, " ").trim();
}

export async function GET() {
  try {
    const res = await fetch(FEED_URL, {
      // Vercel에서도 안정적으로 받게
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      // 서버 캐시(=Vercel) 적용: 5분
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Status code ${res.status}`);
    }

    const feed = await res.json();
    const rawItems = feed?.items || feed?.entries || [];

    const items = rawItems.slice(0, 30).map((it) => {
      const link = pickLink(it);
      return {
        title: it?.title || "(제목 없음)",
        link,
        pubDate: pickDate(it),
        contentSnippet: pickSnippet(it),
        thumbnail: pickThumbnail(it),
      };
    });

    return NextResponse.json(
      { items },
      {
        headers: {
          // CDN 캐시(서버쪽) + 백그라운드 갱신
          "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "RSS 불러오기 실패", detail: String(e?.message || e) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}