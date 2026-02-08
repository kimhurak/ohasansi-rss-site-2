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

  // 토스트(복사됨)
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => setToast(""), 1600);
  };

  useEffect(() => {
    let ignore = false;

    async function run() {
      try {
        // 캐시 회피 (Vercel/브라우저 캐시 때문에 썸네일 안 바뀌는거 방지)
        const res = await fetch(`/api/feed?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (!ignore) {
          setItems(Array.isArray(data.items) ? data.items : []);
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
    // 최신순 정렬(날짜 없으면 원래 순서)
    const copy = [...items];
    copy.sort((a, b) => {
      const da = new Date(a.pubDate || 0).getTime();
      const db = new Date(b.pubDate || 0).getTime();
      return db - da;
    });
    return copy;
  }, [items]);

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크 복사됨");
    } catch {
      // 클립보드가 막힌 환경 대비
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("링크 복사됨");
    }
  };

  const styles = {
    page: {
      maxWidth: 980,
      margin: "0 auto",
      padding: "28px 18px",
      background: "#f7f7f9",
      minHeight: "100vh",
    },
    headerCard: {
      background: "#fff",
      border: "1px solid #ececf0",
      borderRadius: 14,
      padding: "18px 18px",
      marginBottom: 16,
      cursor: "pointer",
    },
    title: { fontSize: 28, fontWeight: 900, letterSpacing: -0.5 },
    subtitle: { marginTop: 6, color: "#666", fontSize: 14 },

    listWrap: {
      display: "grid",
      gap: 14,
    },

    card: {
      background: "#fff",
      border: "1px solid #ececf0",
      borderRadius: 16,
      padding: 16,
      display: "grid",
      gridTemplateColumns: "170px 1fr",
      gap: 14,
      alignItems: "start",
    },

    thumbBox: {
      width: 170,
      height: 110,
      borderRadius: 12,
      background: "#e8e8ec",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    thumbImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },

    metaRow: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 6,
    },
    host: { color: "#1877f2", fontWeight: 800, fontSize: 13 },
    ago: { color: "#888", fontSize: 12, fontWeight: 600 },

    h2: {
      fontSize: 18,
      fontWeight: 900,
      lineHeight: 1.25,
      margin: "6px 0 8px",
      letterSpacing: -0.2,
    },
    desc: { color: "#444", fontSize: 13, lineHeight: 1.45 },

    bottomRow: {
      marginTop: 12,
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },

    copyBtn: {
      border: "1px solid #ff4d4f",
      color: "#ff4d4f",
      background: "#fff",
      borderRadius: 10,
      padding: "8px 12px",
      fontWeight: 900,
      cursor: "pointer",
    },

    linkText: {
      color: "#222",
      fontSize: 12,
      wordBreak: "break-all",
      opacity: 0.9,
    },

    loadingCard: {
      background: "#fff",
      border: "1px solid #ececf0",
      borderRadius: 14,
      padding: 18,
      color: "#666",
    },

    toast: {
      position: "fixed",
      left: "50%",
      bottom: 22,
      transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.78)",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 800,
      zIndex: 9999,
    },
  };

  return (
    <main style={styles.page}>
      {/* 헤더(전체 클릭하면 페북 페이지로 이동) */}
      <div
        style={styles.headerCard}
        onClick={() => window.open(PAGE_URL, "_blank", "noopener,noreferrer")}
        role="button"
        title="오세현 페이스북 페이지로 이동"
      >
        <div style={styles.title}>오세현 Page</div>
        <div style={styles.subtitle}>페이스북 최신 게시글 모아보기</div>
      </div>

      {loading ? (
        <div style={styles.loadingCard}>불러오는 중...</div>
      ) : (
        <div style={styles.listWrap}>
          {sorted.map((item, idx) => {
            const host = hostFromUrl(item.link);
            const ago = timeAgo(item.pubDate);
            const thumb = item.thumbnail || "";

            return (
              <div key={idx} style={styles.card}>
                <div style={styles.thumbBox}>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      style={styles.thumbImg}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // 썸네일 깨지면 그냥 회색 박스로 둠
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>

                <div>
                  <div style={styles.metaRow}>
                    <div style={styles.host}>{host}</div>
                    {ago ? <div style={styles.ago}>{ago}</div> : null}
                  </div>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "inherit" }}
                    title="게시글 열기"
                  >
                    <div style={styles.h2}>{item.title}</div>
                    {item.contentSnippet ? <div style={styles.desc}>{item.contentSnippet}</div> : null}
                  </a>

                  {/* 링크 복사 + 최종 URL 표시 */}
                  <div style={styles.bottomRow}>
                    <button style={styles.copyBtn} onClick={() => copyLink(item.link)}>
                      링크복사
                    </button>
                    <div style={styles.linkText}>{item.link}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast ? <div style={styles.toast}>{toast}</div> : null}
    </main>
  );
}