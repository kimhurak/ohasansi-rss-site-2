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
        setLoading(true);
        const res = await fetch("/api/feed", { cache: "no-store" });
        const data = await res.json();
        if (!ignore) {
          setItems(Array.isArray(data?.items) ? data.items : []);
          setLoading(false);
        }
      } catch {
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
    // 지금은 받은 순서 그대로
    return items;
  }, [items]);

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크 복사됨");
    } catch {
      // clipboard 막히면 fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("링크 복사됨");
      } catch {
        showToast("복사 실패");
      }
    }
  };

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
      {/* 헤더 카드: 누르면 페북 페이지로 */}
      <a
        href={PAGE_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", color: "inherit" }}
        title="오세현 Page로 이동"
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #ececf0",
            borderRadius: 16,
            padding: "22px 20px",
            marginBottom: 18,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>
            오세현 Page
          </div>
          <div style={{ color: "#666", fontSize: 14 }}>
            페이스북 최신 게시글 모아보기
          </div>
        </div>
      </a>

      {/* 토스트 */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            background: "rgba(20,20,20,0.92)",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 999,
            fontSize: 13,
            zIndex: 9999,
          }}
        >
          {toast}
        </div>
      ) : null}

      {loading ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ececf0",
            borderRadius: 16,
            padding: 18,
          }}
        >
          불러오는 중…
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {sorted.map((item, idx) => {
            const host = hostFromUrl(item.link);
            const ago = timeAgo(item.pubDate);

            const thumb = item.thumbnail || "";

            return (
              <div
                key={idx}
                style={{
                  background: "#fff",
                  border: "1px solid #ececf0",
                  borderRadius: 16,
                  padding: 18,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  {/* 썸네일 */}
                  <div
                    style={{
                      width: 150,
                      height: 100,
                      borderRadius: 14,
                      background: "#e9e9ee",
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1px solid #f0f0f4",
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
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#1877f2",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 0.2,
                        marginBottom: 6,
                      }}
                    >
                      {host} {ago ? `· ${ago}` : ""}
                    </div>

                    {/* 제목/스니펫은 카드 클릭 시 원문 */}
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          lineHeight: 1.25,
                          marginBottom: 8,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          color: "#444",
                          fontSize: 13,
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.contentSnippet}
                      </div>
                    </a>

                    {/* 링크 복사 줄 */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginTop: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => copyLink(item.link)}
                        style={{
                          border: "1px solid #ff4d4f",
                          color: "#ff4d4f",
                          background: "#fff",
                          padding: "8px 12px",
                          borderRadius: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        링크복사
                      </button>

                      <div
                        style={{
                          color: "#333",
                          fontSize: 12,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "520px",
                        }}
                        title={item.link}
                      >
                        {item.link}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #ececf0",
                borderRadius: 16,
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