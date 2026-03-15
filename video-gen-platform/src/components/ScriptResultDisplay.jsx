import { useState } from "react";

export default function ScriptResultDisplay({ data }) {
  // Handle array of scripts (streaming results)
  const scripts = Array.isArray(data) ? data : [data];
  const [activeScriptIndex, setActiveScriptIndex] = useState(0);

  if (!scripts.length || !scripts[0]?.generated_script) {
    return (
      <div style={{ padding: "24px", color: "var(--text-muted)" }}>
        No script data available
      </div>
    );
  }

  const currentScript = scripts[activeScriptIndex]?.generated_script;

  // Main render for structured script with sections (hook, body, call_to_action)
  if (currentScript?.sections) {
    const { hook, body, scene_breakdown, call_to_action } =
      currentScript.sections;
    const mainBody = body || scene_breakdown; // Support both "body" and "scene_breakdown"

    return (
      <div>
        {scripts.length > 1 && (
          <div
            style={{
              marginBottom: "24px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {scripts.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveScriptIndex(idx)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border:
                    activeScriptIndex === idx
                      ? "2px solid var(--cyan-lt)"
                      : "1px solid var(--border)",
                  background:
                    activeScriptIndex === idx
                      ? "rgba(6, 182, 212, 0.1)"
                      : "transparent",
                  color:
                    activeScriptIndex === idx
                      ? "var(--cyan-lt)"
                      : "var(--text)",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: activeScriptIndex === idx ? "600" : "400",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (activeScriptIndex !== idx) {
                    e.target.style.borderColor = "var(--purple)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeScriptIndex !== idx) {
                    e.target.style.borderColor = "var(--border)";
                  }
                }}
              >
                Script {idx + 1}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            padding: "24px",
            background:
              "linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)",
            borderRadius: "var(--radius-sm)",
            maxHeight: "600px",
            overflowY: "auto",
          }}
        >
          {/* Title */}
          {currentScript.title && (
            <h2
              style={{
                fontSize: "1.3rem",
                fontWeight: "800",
                color: "var(--cyan-lt)",
                marginBottom: "16px",
                letterSpacing: "0.5px",
              }}
            >
              {currentScript.title}
            </h2>
          )}

          {/* Product */}
          {currentScript.product && (
            <p
              style={{
                marginBottom: "20px",
                lineHeight: "1.7",
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              <strong>Product:</strong> {currentScript.product}
            </p>
          )}

          {/* Style Info */}
          {currentScript.style && (
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "var(--purple-lt)",
                  marginBottom: "12px",
                }}
              >
                Style
              </h3>
              {Object.entries(currentScript.style).map(([key, value]) => (
                <p
                  key={key}
                  style={{ marginBottom: "8px", color: "var(--text)" }}
                >
                  <strong style={{ textTransform: "capitalize" }}>
                    {key}:
                  </strong>{" "}
                  {value}
                </p>
              ))}
            </div>
          )}

          {/* Hook Section */}
          {hook && hook.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "var(--purple-lt)",
                  marginBottom: "16px",
                  borderBottom: "2px solid var(--border)",
                  paddingBottom: "8px",
                }}
              >
                🎬 Hook
              </h3>
              {hook.map((scene, idx) => renderSceneCard(scene, idx))}
            </div>
          )}

          {/* Body/Scene Breakdown Section */}
          {mainBody && mainBody.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "var(--purple-lt)",
                  marginBottom: "16px",
                  borderBottom: "2px solid var(--border)",
                  paddingBottom: "8px",
                }}
              >
                📹 Scene Breakdown
              </h3>
              {mainBody.map((scene, idx) => renderSceneCard(scene, idx))}
            </div>
          )}

          {/* Call to Action Section */}
          {call_to_action && call_to_action.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "var(--purple-lt)",
                  marginBottom: "12px",
                  borderBottom: "2px solid var(--border)",
                  paddingBottom: "8px",
                }}
              >
                ✨ Call to Action
              </h3>
              {call_to_action.map((scene, idx) => renderSceneCard(scene, idx))}
            </div>
          )}

          <style>{`
            div[style*="overflowY"] {
              scrollbar-width: thin;
              scrollbar-color: var(--purple) transparent;
            }
            div[style*="overflowY"]::-webkit-scrollbar {
              width: 6px;
            }
            div[style*="overflowY"]::-webkit-scrollbar-track {
              background: transparent;
            }
            div[style*="overflowY"]::-webkit-scrollbar-thumb {
              background: var(--purple);
              border-radius: 3px;
            }
            div[style*="overflowY"]::-webkit-scrollbar-thumb:hover {
              background: var(--purple-lt);
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Fallback for unexpected formats
  return (
    <div style={{ padding: "24px", color: "var(--text-muted)" }}>
      <p>Unable to render script in expected format</p>
      <pre style={{ fontSize: "0.75rem", overflow: "auto" }}>
        {JSON.stringify(currentScript, null, 2).slice(0, 500)}
      </pre>
    </div>
  );
}

// Helper to render individual scene card
function renderSceneCard(scene, idx) {
  return (
    <div
      key={idx}
      style={{
        marginBottom: "16px",
        padding: "12px",
        background: "rgba(124, 58, 237, 0.08)",
        borderLeft: "3px solid var(--purple)",
        borderRadius: "4px",
        fontSize: "0.875rem",
      }}
    >
      {scene.scene && (
        <p style={{ marginBottom: "6px" }}>
          <strong>Scene {scene.scene}:</strong> {scene.timestamp}
        </p>
      )}
      {scene.visual && (
        <p style={{ marginBottom: "6px", color: "var(--text)" }}>
          <strong>Visual:</strong> {scene.visual}
        </p>
      )}
      {scene.voiceover && (
        <p
          style={{
            marginBottom: "6px",
            color: "var(--text)",
            fontStyle: "italic",
          }}
        >
          <strong>VO:</strong> "{scene.voiceover}"
        </p>
      )}
      {scene.dialogue && (
        <p
          style={{
            marginBottom: "6px",
            color: "var(--text)",
            fontStyle: "italic",
          }}
        >
          <strong>Dialogue:</strong> {scene.dialogue}
        </p>
      )}
      {scene.editing && (
        <p style={{ marginBottom: "0px", color: "var(--text-muted)" }}>
          <strong>Edit:</strong> {scene.editing}
        </p>
      )}
      {scene.text_overlay && (
        <p style={{ marginTop: "6px", color: "var(--text-muted)" }}>
          <strong>Text:</strong> {scene.text_overlay}
        </p>
      )}
      {scene.text_on_screen && scene.text_on_screen.length > 0 && (
        <p style={{ marginTop: "6px", color: "var(--text-muted)" }}>
          <strong>Text:</strong> {scene.text_on_screen.join(" | ")}
        </p>
      )}
    </div>
  );
}
