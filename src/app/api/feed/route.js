import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
    ],
  },
});

function pickFirstImage(html = "") {
  if (!html) return "";
  // img src
  const m1 = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m1?.[1]) return m1[1];
  // og:image 같은 게 content에 섞여있을 때 대비
  const m2 = html.match(/https?:\/\/[^"' ]+\.(jpg|jpeg|png|webp)/i);
  if (m2?.[0]) return m2[0];
  return "";
}

function pickThumb(item) {
  // 1) rss-parser 기본
  if (item.thumbnail) return item.thumbnail;

  // 2) media:* 기반
  const mc = item.mediaContent;
  if (mc && typeof mc === "object" && mc.url) return mc.url;
  const mt = item.mediaThumbnail;
  if (mt && typeof mt === "object" && mt.url) return mt.url;

  // 3) enclosure
  const enc = item.enclosure;
  if (enc && typeof enc === "object" && enc.url) return enc.url;

  // 4) content에서 이미지 파싱
  const html = item.contentEncoded || item["content:encoded"] || item.content || item.summary || "";
  const fromHtml = pickFirstImage(html);
  if (fromHtml) return fromHtml;

  return "";
}

export async function GET() {
  try {
    const feed = await parser.parseURL("https://rss.app/feeds/FI2njq0cPrauN4Ik.xml");

    const items = (feed.items || []).slice(0, 20).map((item) => {
      const thumbnail = pickThumb(item);

      return {
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || "",
        contentSnippet: item.contentSnippet || item.summary || "",
        thumbnail: thumbnail || "", // ← 여기 중요
      };
    });

    // 캐시 방지 (Vercel이 오래 들고있는거 방지)
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: "RSS 불러오기 실패" }, { status: 500 });
  }
}