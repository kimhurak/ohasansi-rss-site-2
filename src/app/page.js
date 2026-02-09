"use client";

import { useEffect, useMemo, useState } from "react";

const PAGE_TITLE = "오세현 Page";
const PAGE_SUB = "페이스북 최신 게시글 모아보기";
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

function shortUrl(url = "", max = 70) {
  if (!url) return "";
  if (url.length <= max) return url;
  return url.slice(0, max) + "…";
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 토스트
  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(""), 1400);
  };

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        // 브라우저는 무조건 최신으로 /api/feed를 치게 하고,
        // 캐시는 서버(route.js)에서만 관리
        const res = await fetch("/api/feed", { cache: "no-store" });
        const data = await res.json();

        if (!ignore) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setLoading(false);
        }
      } catch (e) {
        if (!ignore) {
          setItems([]);
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      ignore = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];
    arr.sort((a, b) => {
      const ta = new Date(a?.pubDate || 0).getTime() || 0;
      const tb = new Date(b?.pubDate || 0).getTime() || 0;
      return tb - ta;
    });
    return arr;
  }, [items]);

  async function copyLink(link) {
    try {
      await navigator.clipboard.writeText(link);
      showToast("링크 복사 완료");
    } catch {
      // clipboard 막히는 환경 대비: prompt fallback
      window.prompt("복사할 링크", link);
    }
  }

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
      {/* 헤더 */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #ececf0",
          borderRadius: 14,
          padding: "18px 18px",
          marginBottom: 16,
        }}
      >
        <a
          href={PAGE_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 26,
            fontWeight: 900,
            textDecoration: "none",
            color: "#111",
            display: "inline-block",
          }}
          title="페이스북 페이지로 이동"
        >
          {PAGE_TITLE}
        </a>
        <div style={{ marginTop: 6, color: "#666", fontSize: 14 }}>
          {PAGE_SUB}
        </div>
      </div>

      {/* 토스트 */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            background: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      ) : null}

      {/* 본문 */}
      {loading ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ececf0",
            borderRadius: 14,
            padding: 18,
            color: "#666",
          }}
        >
          불러오는 중…
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sorted.map((item, idx) => {
            const host = hostFromUrl(item?.link);
            const ago = timeAgo(item?.pubDate);
            const thumb = item?.thumbnail || "";
            const link = item?.link || "";

            return (
              <div
                key={idx}
                style={{
                  background: "#fff",
                  border: "1px solid #ececf0",
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gridTemplateColumns: "132px 1fr",
                  gap: 14,
                }}
              >
                {/* 썸네일 */}
                <div
                  style={{
                    width: 132,
                    height: 92,
                    borderRadius: 12,
                    background: "#e9eaee",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        // 썸네일 깨지면 회색 박스로 복귀
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>

                {/* 내용 */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                      fontSize: 12,
                      color: "#2b5cff",
                      fontWeight: 800,
                    }}
                  >
                    <span>{host}</span>
                    {ago ? <span style={{ color: "#999" }}>• {ago}</span> : null}
                  </div>

                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "block",
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#111",
                      textDecoration: "none",
                      lineHeight: 1.25,
                      marginBottom: 8,
                      wordBreak: "break-word",
                    }}
                    title="원문 열기"
                  >
                    {item?.title}
                  </a>

                  {item?.contentSnippet ? (
                    <div
                      style={{
                        fontSize: 13,
                        color: "#444",
                        lineHeight: 1.5,
                        marginBottom: 10,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.contentSnippet}
                    </div>
                  ) : null}

                  {/* 링크 복사 줄 */}
                  {link ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => copyLink(link)}
                        style={{
                          border: "1px solid #ff4b4b",
                          color: "#ff1f1f",
                          background: "#fff",
                          fontWeight: 900,
                          borderRadius: 10,
                          padding: "10px 12px",
                          cursor: "pointer",
                        }}
                      >
                        링크복사
                      </button>

                      <span
                        style={{
                          fontSize: 12,
                          color: "#333",
                          wordBreak: "break-all",
                        }}
                        title={link}
                      >
                        {shortUrl(link)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {sorted.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #ececf0",
                borderRadius: 14,
                padding: 18,
                color: "#666",
              }}
            >
              게시글이 안 불러와졌어. /api/feed에서 에러가 나는지 먼저 확인해봐.
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}