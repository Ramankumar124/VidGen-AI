import { useState, useRef, useCallback } from "react";
import Header from "./components/Header";
import VideoURLsSection from "./components/VideoURLsSection";
import Toast from "./components/Toast";
import GenerateOwnScriptPage from "./components/GenerateOwnScriptPage";
import { streamVideos } from "./api";
import "./index.css";

function useToast() {
  const [toast, setToast] = useState({ message: "", type: "", visible: false });
  const timerRef = useRef(null);

  const showToast = useCallback(
    (message, type = "success", duration = 4000) => {
      clearTimeout(timerRef.current);
      setToast({ message, type, visible: true });
      timerRef.current = setTimeout(() => {
        setToast((t) => ({ ...t, visible: false }));
        setTimeout(
          () => setToast({ message: "", type: "", visible: false }),
          400,
        );
      }, duration);
    },
    [],
  );

  return { toast, showToast };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("analyze"); // 'analyze' or 'generate'
  const [urls, setUrls] = useState([""]);
  const [results, setResults] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const { toast, showToast } = useToast();

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const validUrls = urls.filter((u) => u.trim());
    if (!validUrls.length) {
      showToast("⚠️ Add at least one video URL.", "error");
      return false;
    }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const validUrls = urls.filter((u) => u.trim());

    setIsStreaming(true);
    setResults([]); // Clear previous results

    try {
      await streamVideos(validUrls, (chunk) => {
        setResults((prev) => [...prev, chunk]);
      });
      showToast(
        "🎬 All video insights generated successfully!",
        "success",
        6000,
      );
    } catch (err) {
      showToast(`❌ Connection error: ${err.message}`, "error", 6000);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      {/* Animated background orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <Header />

      {/* Page Navigation */}
      <div className="page-navigation">
        <button
          className={`nav-btn${currentPage === "analyze" ? " active" : ""}`}
          onClick={() => setCurrentPage("analyze")}
        >
          🎬 Analyze Videos
        </button>
        <button
          className={`nav-btn${currentPage === "generate" ? " active" : ""}`}
          onClick={() => setCurrentPage("generate")}
        >
          ✨ Generate Own Script
        </button>
      </div>

      {/* Page: Video Analysis */}
      {currentPage === "analyze" && (
        <>
          {/* Hero */}
          <section className="hero">
            <div className="hero-label">
              ✦ Powered by Deep Video Intelligence
            </div>
            <h1 className="hero-title">
              Generate Stunning
              <br />
              <span className="gradient-text">Product Videos</span>
              <br />
              from Batch Analysis
            </h1>
            <p className="hero-subtitle">
              Feed up to 20 reference videos — our AI analyzes style, pacing,
              <br />
              and storytelling patterns to craft your perfect product video.
            </p>
          </section>

          {/* Form */}
          <main className="container">
            <form onSubmit={handleSubmit} noValidate>
              <VideoURLsSection urls={urls} onChange={setUrls} />

              {/* Commenting out sections as requested
              <ProductImageSection image={image} onImage={setImage} />
              <ProductDetailsSection data={details} onChange={updateDetails} />
              */}

              {/* Submit */}
              <div className="submit-section">
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isStreaming}
                >
                  <span className="btn-submit-inner">
                    {isStreaming ? (
                      <>
                        <svg
                          className="animate-spin"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Analyzing Videos...
                      </>
                    ) : (
                      <>
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        Generate Insights
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            {/* Results Stream Section */}
            {results.length > 0 && (
              <section
                className="results-container"
                style={{ marginTop: "40px" }}
              >
                {results.map((res, index) => (
                  <div key={index} className="card result-stream-card">
                    <div
                      className="card-header"
                      style={{ marginBottom: "16px" }}
                    >
                      <div className="step-badge">Vid {index + 1}</div>
                      <div>
                        <h2 className="card-title">Analysis Complete</h2>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="upload-link"
                          style={{ fontSize: "0.875rem" }}
                        >
                          {res.url}
                        </a>
                      </div>
                    </div>

                    {res.status === "success" ? (
                      <div
                        className="result-script-box"
                        style={{ background: "var(--bg2)" }}
                      >
                        <pre style={{ margin: 0 }}>{res.result}</pre>
                      </div>
                    ) : (
                      <div
                        className="error-box"
                        style={{
                          padding: "16px",
                          background: "rgba(248,113,113,0.1)",
                          border: "1px solid rgba(248,113,113,0.3)",
                          borderRadius: "8px",
                          color: "#F87171",
                        }}
                      >
                        <strong>Failed to analyze video:</strong>
                        <br />
                        {res.error}
                      </div>
                    )}
                  </div>
                ))}

                {isStreaming && (
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: "20px",
                      color: "var(--text-dim)",
                    }}
                  >
                    Waiting for next video analysis...
                  </div>
                )}
              </section>
            )}
          </main>
        </>
      )}

      {/* Page: Generate Own Script */}
      {currentPage === "generate" && <GenerateOwnScriptPage />}

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </>
  );
}
