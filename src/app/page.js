"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const copyLink = async (url) => {
    await navigator.clipboard.writeText(url);
    alert("링크 복사됨");
  };

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 20,
        background: "#f7f7f9",
        minHeight: "100vh",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "24px 20px",
          marginBottom: 20,
          border: "1px solid #eee",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>오세현 Page</h1>
        <p style={{ color: "#666" }}>페이스북 최신 게시글 모아보기</p>
      </div>

      {loading && <div>불러오는 중…</div>}

      {!loading &&
        items.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              display: "flex",
              gap: 16,
              border: "1px solid #eee",
            }}
          >
            {/* 썸네일 */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: 12,
                background: "#e5e7eb",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>

            {/* 내용 */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "#1877f2",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                FACEBOOK.COM
              </div>

              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  fontSize: 14,
                  color: "#555",
                  marginBottom: 10,
                }}
              >
                {item.contentSnippet}
              </div>

              {/* 링크 + 복사 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => copyLink(item.link)}
                  style={{
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    padding: "6px 12px",
                    borderRadius: 999,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  링크복사
                </button>

                <div
                  style={{
                    fontSize: 13,
                    color: "#666",
                    wordBreak: "break-all",
                  }}
                >
                  {item.link}
                </div>
              </div>
            </div>
          </div>
        ))}
    </main>
  );
}