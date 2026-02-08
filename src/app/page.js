"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_URL = "https://www.facebook.com/ohasansi";

function hostFromUrl(url = "") {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "").toUpperCase();
  } catch {
    return "LINK";
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  return `${day}d`;
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch("/api/feed", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;

        if (!res.ok || data?.error) {
          setErr(data?.error || "불러오기 실패");
          setItems([]);
        } else {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      } catch (e) {
        if (!alive) return;
        setErr("불러오기 실패");
        setItems([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = new Date(a.pubDate || 0).getTime() || 0;
      const db = new Date(b.pubDate || 0).getTime() || 0;
      return db - da;
    });
  }, [items]);

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "28px 18px",
        background: "#f7f7f9",
        minHeight: "100vh",
      }}
    >
      {/* 헤더: 클릭하면 페북 페이지로 이동 */}
      <a
        href={PAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #ececf0",
            borderRadius: 14,
            padding: "18px 18px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800 }}>오세현 Page</div>
          <div style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
            페이스북 최신 게시글 모아보기
          </div>
        </div>
      </a>

      {loading ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ececf0",
            borderRadius: 14,
            padding: 18,
          }}
        >
          불러오는 중…
        </div>
      ) : err ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ececf0",
            borderRadius: 14,
            padding: 18,
            color: "#b00020",
            fontWeight: 700,
          }}
        >
          {err}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sorted.map((item, idx) => {
            const host = hostFromUrl(item.link);
            const ago = timeAgo(item.pubDate);
            const thumb = item.thumbnail || "";

            return (
              <a
                key={idx}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    background: "#fff",
                    border: "1px solid #ececf0",
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: "0 1px 0 rgba(0,0,0,0.02)",
                  }}
                >
                  {/* 썸네일 */}
                  <div
                    style={{
                      width: 140,
                      height: 100,
                      background: "#e9e9ee",
                      borderRadius: 10,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        referrerPolicy="no-referrer"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        onError={(e) => {
                          // 이미지 로딩 실패하면 그냥 회색 박스 유지
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>

                  {/* 텍스트 */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#1877f2",
                        }}
                      >
                        {host}
                      </div>
                      {ago ? (
                        <div style={{ fontSize: 12, color: "#777" }}>
                          • {ago}
                        </div>
                      ) : null}
                    </div>

                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        lineHeight: 1.25,
                        marginBottom: 8,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#444",
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.contentSnippet}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </main>
  );
}