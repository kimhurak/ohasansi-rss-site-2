"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 더보기
  const [visibleCount, setVisibleCount] = useState(5);

  // 예쁜 토스트
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
        const res = await fetch("/api/feed", { cache: "no-store" });
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
    // 지금은 받아온 순서 그대로
    return [...items];
  }, [items]);

  const visibleItems = useMemo(() => {
    return sorted.slice(0, visibleCount);
  }, [sorted, visibleCount]);

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크 복사 완료");
    } catch (e) {
      // 구형 브라우저 fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("링크 복사 완료");
      } catch {
        showToast("복사 실패 (브라우저 권한 확인)");
      }
    }
  };

  const openFacebookPage = () => {
    window.open("https://www.facebook.com/ohasansi", "_blank", "noopener,noreferrer");
  };

  const SkeletonCard = ({ keyIndex }) => {
    return (
      <div className="card" key={`sk-${keyIndex}`}>
        <div className="thumb sk" />
        <div className="body">
          <div className="meta sk" style={{ width: 120, height: 14 }} />
          <div className="title sk" style={{ width: "90%", height: 20, marginTop: 10 }} />
          <div className="desc sk" style={{ width: "85%", height: 14, marginTop: 10 }} />
          <div className="desc sk" style={{ width: "70%", height: 14, marginTop: 8 }} />
          <div className="row" style={{ marginTop: 14 }}>
            <div className="btn sk" style={{ width: 92, height: 34, borderRadius: 10 }} />
            <div className="url sk" style={{ width: "70%", height: 14, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="wrap">
      {/* 상단 타이틀(클릭하면 페이지 이동) */}
      <div className="hero" onClick={openFacebookPage} role="button" tabIndex={0}>
        <div className="heroTitle">오세현 Page</div>
        <div className="heroSub">페이스북 최신 게시글 모아보기</div>
      </div>

      {/* 로딩 스켈레톤 */}
      {loading ? (
        <div className="list">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard keyIndex={i} key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="list">
            {visibleItems.map((item, idx) => {
              const url = item.link || "";
              const title = item.title || "(제목 없음)";
              const content = item.contentSnippet || "";
              const thumb = item.thumbnail || "";

              return (
                <div className="card" key={`${url}-${idx}`}>
                  <div
                    className="thumb"
                    style={{
                      background: thumb ? `url(${thumb}) center / cover no-repeat` : undefined,
                    }}
                  />

                  <div className="body">
                    <div className="meta">FACEBOOK.COM</div>

                    <a className="titleLink" href={url} target="_blank" rel="noopener noreferrer">
                      {title}
                    </a>

                    <div className="descText">{content}</div>

                    {/* 링크복사 + 주소 */}
                    <div className="row">
                      <button className="copyBtn" onClick={() => copyLink(url)}>
                        링크복사
                      </button>

                      <a className="urlLink" href={url} target="_blank" rel="noopener noreferrer" title={url}>
                        {url}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 더보기 */}
          {sorted.length > visibleCount && (
            <div className="moreWrap">
              <button className="moreBtn" onClick={() => setVisibleCount((v) => v + 5)}>
                더보기
              </button>
              <div className="moreHint">
                {visibleCount} / {sorted.length}
              </div>
            </div>
          )}
        </>
      )}

      {/* 토스트 */}
      {toast && <div className="toast">{toast}</div>}

      {/* 스타일 */}
      <style jsx global>{`
        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 24px 16px 60px;
          background: #f7f7f9;
          min-height: 100vh;
        }

        .hero {
          background: #fff;
          border: 1px solid #ececf0;
          border-radius: 16px;
          padding: 18px 20px;
          margin-bottom: 16px;
          cursor: pointer;
        }

        .heroTitle {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.2px;
        }

        .heroSub {
          margin-top: 6px;
          color: #666;
          font-size: 14px;
        }

        .list {
          display: grid;
          gap: 14px;
        }

        .card {
          background: #fff;
          border: 1px solid #ececf0;
          border-radius: 18px;
          padding: 14px;
          display: flex;
          gap: 14px;
        }

        .thumb {
          width: 150px;
          height: 110px;
          border-radius: 14px;
          background: #e5e7eb;
          flex-shrink: 0;
        }

        .body {
          flex: 1;
          min-width: 0;
        }

        .meta {
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .titleLink {
          display: block;
          font-size: 18px;
          font-weight: 900;
          color: #111;
          text-decoration: none;
          line-height: 1.25;
        }

        .titleLink:hover {
          text-decoration: underline;
        }

        .descText {
          margin-top: 8px;
          color: #444;
          font-size: 14px;
          line-height: 1.55;
          word-break: break-word;
        }

        .row {
          margin-top: 12px;
          display: flex;
          gap: 10px;
          align-items: center;
          min-width: 0;
        }

        .copyBtn {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid #ef4444;
          background: #fff;
          color: #ef4444;
          font-weight: 900;
          cursor: pointer;
          font-size: 13px;
          flex-shrink: 0;
        }

        .copyBtn:hover {
          filter: brightness(0.98);
        }

        .urlLink {
          font-size: 13px;
          color: #374151;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: block;
          min-width: 0;
        }

        .urlLink:hover {
          text-decoration: underline;
        }

        .moreWrap {
          display: grid;
          place-items: center;
          margin-top: 18px;
          gap: 8px;
        }

        .moreBtn {
          padding: 10px 16px;
          border-radius: 12px;
          border: 1px solid #d1d5db;
          background: #fff;
          font-weight: 900;
          cursor: pointer;
        }

        .moreHint {
          font-size: 12px;
          color: #6b7280;
        }

        .toast {
          position: fixed;
          left: 50%;
          bottom: 18px;
          transform: translateX(-50%);
          background: rgba(17, 24, 39, 0.92);
          color: #fff;
          padding: 10px 14px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13px;
          z-index: 9999;
        }

        /* skeleton */
        .sk {
          position: relative;
          overflow: hidden;
          background: #e5e7eb;
        }
        .sk::after {
          content: "";
          position: absolute;
          top: 0;
          left: -50%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(229, 231, 235, 0),
            rgba(243, 244, 246, 0.95),
            rgba(229, 231, 235, 0)
          );
          animation: shimmer 1.2s infinite;
        }
        @keyframes shimmer {
          0% {
            left: -50%;
          }
          100% {
            left: 120%;
          }
        }

        /* 모바일(2번: 카드 더 크게/예쁘게) */
        @media (max-width: 640px) {
          .wrap {
            padding: 18px 12px 70px;
          }
          .heroTitle {
            font-size: 22px;
          }
          .card {
            flex-direction: column;
          }
          .thumb {
            width: 100%;
            height: 180px;
          }
          .titleLink {
            font-size: 17px;
          }
          .descText {
            font-size: 14px;
          }
          .row {
            flex-direction: column;
            align-items: stretch;
          }
          .copyBtn {
            width: 100%;
          }
          .urlLink {
            white-space: normal;
            word-break: break-all;
          }
        }
      `}</style>
    </main>
  );
}