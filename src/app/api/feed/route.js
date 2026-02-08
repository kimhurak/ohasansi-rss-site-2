import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET() {
  try {
    const feed = await parser.parseURL(
      "https://rss.app/feeds/FI2njq0cPrauN4Ik.xml"
    );

    const items = (feed.items || []).slice(0, 5).map((item) => {
      // content 안에서 첫 번째 이미지 추출
      let thumbnail = "";
      const html = item["content:encoded"] || item.content || "";
      const match = html.match(/<img[^>]+src="([^">]+)"/);
      if (match && match[1]) {
        thumbnail = match[1];
      }

      return {
        title: item.title || "",
        link: item.link || "",
        pubDate: item.pubDate || "",
        contentSnippet: item.contentSnippet || "",
        thumbnail,
      };
    });

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { items: [] },
      { status: 500 }
    );
  }
}