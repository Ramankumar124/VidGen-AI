import { useState, useRef, useCallback } from "react";
import VideoURLsSection from "./VideoURLsSection";
import ScriptSelectionSection from "./ScriptSelectionSection";
import ProductDetailsForScriptSection from "./ProductDetailsForScriptSection";
import ProductImagesSection from "./ProductImagesSection";
import ScriptResultDisplay from "./ScriptResultDisplay";
import ProcessingModal from "./ProcessingModal";
import Toast from "./Toast";
import { streamVideos, generateOwnScript, generateVideo } from "../api";
import "./GenerateOwnScriptPage.css";

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

export default function GenerateOwnScriptPage() {
  // Step 1: Video Analysis
  const [videoUrls, setVideoUrls] = useState([""]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Step 2-4: Form Data
  const [selectedScripts, setSelectedScripts] = useState([]);
  const [productDetails, setProductDetails] = useState({
    brand_name: "",
    product_name: "",
    price_range: "",
    category: "",
    product_type: "",
    styling_type: "",
    target_age_range: "",
    target_gender: "",
    target_behavior: "",
    ideal_selling_location: "",
    short_reasoning: "",
  });
  const [productImages, setProductImages] = useState([]);

  // Result
  const [generatedScript, setGeneratedScript] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [scriptForVideoIndex, setScriptForVideoIndex] = useState(0);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStep, setVideoStep] = useState(0);
  const videoAbortRef = useRef(null);

  const { toast, showToast } = useToast();

  // ── Step 1: Analyze Videos ────────────────────────────────────────────────
  const validateVideos = () => {
    const validUrls = videoUrls.filter((u) => u.trim());
    if (!validUrls.length) {
      showToast("⚠️ Add at least one video URL.", "error");
      return false;
    }
    return true;
  };

  const handleAnalyzeVideos = async (e) => {
    e.preventDefault();
    if (!validateVideos()) return;

    const validUrls = videoUrls.filter((u) => u.trim());
    setIsAnalyzing(true);
    setAnalysisResults([]);
    setAnalysisComplete(false);

    try {
      await streamVideos(validUrls, (chunk) => {
        setAnalysisResults((prev) => [...prev, chunk]);
      });
      setAnalysisComplete(true);
      showToast(
        "✅ Videos analyzed! Now select your reference scripts.",
        "success",
        5000,
      );
    } catch (err) {
      showToast(`❌ Analysis failed: ${err.message}`, "error", 6000);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Step 2-4: Validate Form ────────────────────────────────────────────────
  const validateForm = () => {
    if (selectedScripts.length === 0) {
      showToast("⚠️ Select at least one example script.", "error");
      return false;
    }

    const required = [
      "brand_name",
      "product_name",
      "price_range",
      "category",
      "product_type",
      "styling_type",
      "target_age_range",
      "target_gender",
      "target_behavior",
      "ideal_selling_location",
      "short_reasoning",
    ];
    const missing = required.filter((field) => !productDetails[field]?.trim());

    if (missing.length > 0) {
      showToast(`⚠️ Please fill in all required fields.`, "error");
      return false;
    }

    return true;
  };

  // ── Step 5: Generate Custom Script ────────────────────────────────────────
  const handleGenerateScript = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Get selected script content
    const successResults = analysisResults.filter(
      (r) => r.status === "success",
    );
    const exampleScripts = selectedScripts.map(
      (idx) => successResults[idx]?.result || "",
    );

    setIsGenerating(true);
    setGeneratedScript([]);

    try {
      const payload = {
        example_script: exampleScripts,
        brand_name: productDetails.brand_name,
        product_name: productDetails.product_name,
        price_range: productDetails.price_range,
        category: productDetails.category,
        product_type: productDetails.product_type,
        styling_type: productDetails.styling_type,
        target_age_range: productDetails.target_age_range,
        target_gender: productDetails.target_gender,
        target_behavior: productDetails.target_behavior,
        ideal_selling_location: productDetails.ideal_selling_location,
        short_reasoning: productDetails.short_reasoning,
        images: productImages,
      };

      await generateOwnScript(payload, (chunk) => {
        setGeneratedScript((prev) => [...prev, chunk]);
      });

      setScriptForVideoIndex(0);
      setShowResult(true);
      showToast(
        "🎬 Custom advertisement scripts generated successfully!",
        "success",
        5000,
      );
    } catch (err) {
      showToast(`❌ Generation failed: ${err.message}`, "error", 6000);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSelectedGeneratedScript = () => {
    if (!Array.isArray(generatedScript) || generatedScript.length === 0) return null;
    return generatedScript[scriptForVideoIndex]?.generated_script ?? null;
  };

  const handleVideoStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized.includes("uploading")) {
      setVideoStep(0);
      setVideoProgress((prev) => Math.max(prev, 10));
      return;
    }
    if (normalized.includes("running pipeline")) {
      setVideoStep(2);
      setVideoProgress((prev) => Math.max(prev, 45));
      return;
    }
    if (normalized.includes("downloading")) {
      setVideoStep(4);
      setVideoProgress((prev) => Math.max(prev, 90));
      return;
    }
    if (normalized.includes("done")) {
      setVideoStep(4);
      setVideoProgress(100);
    }
  };

  const handleGenerateVideo = async () => {
    const scriptData = getSelectedGeneratedScript();
    if (!scriptData) {
      showToast("⚠️ Generate a script first before creating video.", "error");
      return;
    }

    const productFiles = productImages
      .map((image) => image?.file)
      .filter(Boolean);

    const abortController = new AbortController();
    videoAbortRef.current = abortController;
    setIsVideoGenerating(true);
    setVideoProgress(5);
    setVideoStep(0);

    try {
      await generateVideo(
        scriptData,
        productFiles,
        [],
        handleVideoStatus,
        { signal: abortController.signal },
      );
      setVideoProgress(100);
      showToast(
        "✅ Video generated successfully! Download started.",
        "success",
        5000,
      );
    } catch (err) {
      if (err?.name === "AbortError") {
        showToast("⏹️ Video generation cancelled.", "error");
      } else {
        showToast(`❌ Video generation failed: ${err.message}`, "error", 7000);
      }
    } finally {
      videoAbortRef.current = null;
      setIsVideoGenerating(false);
    }
  };

  const handleCancelVideoGeneration = () => {
    if (videoAbortRef.current) {
      videoAbortRef.current.abort();
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setVideoUrls([""]);
    setAnalysisResults([]);
    setSelectedScripts([]);
    setProductDetails({
      brand_name: "",
      product_name: "",
      price_range: "",
      category: "",
      product_type: "",
      styling_type: "",
      target_age_range: "",
      target_gender: "",
      target_behavior: "",
      ideal_selling_location: "",
      short_reasoning: "",
    });
    setProductImages([]);
    setGeneratedScript([]);
    setShowResult(false);
    setAnalysisComplete(false);
    setScriptForVideoIndex(0);
    setIsVideoGenerating(false);
    setVideoProgress(0);
    setVideoStep(0);
    if (videoAbortRef.current) {
      videoAbortRef.current.abort();
      videoAbortRef.current = null;
    }
  };

  return (
    <>
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-label">✦ Generate Your Own Script</div>
        <h1 className="hero-title">
          Create Custom
          <br />
          <span className="gradient-text">Advertisement Scripts</span>
          <br />
          Inspired by Top Competitors
        </h1>
        <p className="hero-subtitle">
          Analyze competitor videos, extract their best practices,
          <br />
          and generate a custom ad script tailored to your product.
        </p>
      </section>

      {/* Form */}
      <main className="container">
        <form onSubmit={handleGenerateScript} noValidate>
          {/* Step 1: Video URLs */}
          <VideoURLsSection urls={videoUrls} onChange={setVideoUrls} />

          {/* Analyze Videos Button */}
          <div className="submit-section">
            <button
              type="button"
              className="btn-submit btn-secondary"
              onClick={handleAnalyzeVideos}
              disabled={isAnalyzing || analysisComplete}
            >
              <span className="btn-submit-inner">
                {isAnalyzing ? (
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
                ) : analysisComplete ? (
                  <>
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Analysis Complete
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
                    Analyze Videos
                  </>
                )}
              </span>
            </button>
            {analysisComplete && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setAnalysisResults([]);
                  setAnalysisComplete(false);
                  setSelectedScripts([]);
                }}
              >
                Reanalyze
              </button>
            )}
          </div>

          {/* Analysis Results Display */}
          {analysisResults.length > 0 && (
            <>
              <section
                className="results-container"
                style={{ marginTop: "40px" }}
              >
                <h3
                  style={{
                    marginBottom: "20px",
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "var(--text)",
                  }}
                >
                  ✓ Analysis Complete —{" "}
                  {analysisResults.filter((r) => r.status === "success").length}{" "}
                  video
                  {analysisResults.filter((r) => r.status === "success")
                    .length !== 1
                    ? "s"
                    : ""}{" "}
                  analyzed
                </h3>
                {analysisResults.map((res, index) => (
                  <div key={index} className="card result-stream-card">
                    <div
                      className="card-header"
                      style={{ marginBottom: "16px" }}
                    >
                      <div className="step-badge">Vid {index + 1}</div>
                      <div>
                        <h2 className="card-title">Video Summary</h2>
                        {res.url && (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="upload-link"
                            style={{ fontSize: "0.875rem" }}
                          >
                            {res.url}
                          </a>
                        )}
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
              </section>

              {/* Form Sections - Only show after analysis */}
              <div style={{ marginTop: "30px" }}>
                <div
                  style={{
                    marginBottom: "24px",
                    padding: "12px 16px",
                    background: "rgba(124, 58, 237, 0.08)",
                    borderLeft: "3px solid var(--purple)",
                    borderRadius: "6px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "var(--text)",
                      fontWeight: "500",
                    }}
                  >
                    📋 <strong>Complete these steps</strong> to generate your
                    custom script:
                  </p>
                </div>

                {/* Step 2: Script Selection */}
                <ScriptSelectionSection
                  results={analysisResults}
                  selectedScripts={selectedScripts}
                  onSelectionChange={setSelectedScripts}
                />

                {/* Step 3: Product Details */}
                <ProductDetailsForScriptSection
                  data={productDetails}
                  onChange={setProductDetails}
                />

                {/* Step 4: Product Images */}
                <ProductImagesSection
                  images={productImages}
                  onImagesChange={setProductImages}
                />

                {/* Step Completion Status */}
                {selectedScripts.length === 0 && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "12px 16px",
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.3)",
                      borderRadius: "8px",
                      color: "#F87171",
                      fontSize: "0.875rem",
                    }}
                  >
                    ⚠️ <strong>Required:</strong> Select at least one example
                    script to continue
                  </div>
                )}

                {/* Generate Script Button */}
                <div className="submit-section" style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isGenerating || selectedScripts.length === 0}
                  >
                    <span className="btn-submit-inner">
                      {isGenerating ? (
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
                          Generating Script...
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
                          Generate Custom Script
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </form>

        {/* Generated Script Result */}
        {showResult && generatedScript && (
          <section className="results-container result-section">
            <div className="card result-stream-card">
              <div className="card-header">
                <div className="step-badge">✓</div>
                <div>
                  <h2 className="card-title">
                    Your Generated Advertisement Script
                  </h2>
                  <p className="card-desc">
                    Based on {selectedScripts.length} reference script
                    {selectedScripts.length !== 1 ? "s" : ""} and your product
                    details
                  </p>
                </div>
              </div>

              <ScriptResultDisplay data={generatedScript} />

              {Array.isArray(generatedScript) && generatedScript.length > 1 && (
                <div style={{ marginTop: "16px" }}>
                  <label
                    className="form-label"
                    htmlFor="video-script-select"
                    style={{ display: "block", marginBottom: "8px" }}
                  >
                    Script to use for video generation
                  </label>
                  <select
                    id="video-script-select"
                    className="form-input form-select"
                    value={scriptForVideoIndex}
                    onChange={(e) =>
                      setScriptForVideoIndex(Number(e.target.value))
                    }
                  >
                    {generatedScript.map((_, idx) => (
                      <option key={idx} value={idx}>
                        Script {idx + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="result-actions">
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleGenerateVideo}
                  disabled={isVideoGenerating}
                  style={{ width: "auto" }}
                >
                  <span className="btn-submit-inner">
                    {isVideoGenerating ? (
                      <>
                        <svg
                          className="animate-spin"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                        Generate Video
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    let text = "";
                    if (
                      Array.isArray(generatedScript) &&
                      generatedScript.length > 0
                    ) {
                      const script = generatedScript[0]?.generated_script;
                      if (script?.sections) {
                        // Structured format - serialize as JSON
                        text = JSON.stringify(script, null, 2);
                      } else if (typeof script === "string") {
                        // Text format
                        text = script;
                      } else {
                        // Fallback
                        text = JSON.stringify(script, null, 2);
                      }
                    } else {
                      text = JSON.stringify(generatedScript, null, 2);
                    }
                    navigator.clipboard.writeText(text);
                    showToast("✓ Copied to clipboard!", "success");
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy to Clipboard
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleReset}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1 .12-8.83" />
                  </svg>
                  Generate Another
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
      <ProcessingModal
        visible={isVideoGenerating}
        progress={videoProgress}
        currentStep={videoStep}
        onCancel={handleCancelVideoGeneration}
      />
    </>
  );
}
