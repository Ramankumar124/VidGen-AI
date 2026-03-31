import { useState } from "react";

// ─── Style badge colours per field ───────────────────────────────────────────
const STYLE_META = {
  tone: { label: "Tone", icon: "🎭", color: "#a78bfa" },
  pacing: { label: "Pacing", icon: "⚡", color: "#34d399" },
  color_palette: { label: "Color Palette", icon: "🎨", color: "#f472b6" },
  music_mood: { label: "Music Mood", icon: "🎵", color: "#fbbf24" },
  notes: { label: "Notes", icon: "📝", color: "#60a5fa" },
};

// ─── Tag chip ─────────────────────────────────────────────────────────────────
function Tag({ children, color = "var(--purple)" }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "999px",
        fontSize: "0.78rem",
        fontWeight: 600,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        marginRight: 6,
        marginBottom: 6,
        lineHeight: 1.8,
      }}
    >
      {children}
    </span>
  );
}

// ─── Style Info panel ─────────────────────────────────────────────────────────
function StylePanel({ style }) {
  if (!style) return null;
  const entries = Object.entries(style).filter(([, v]) => v);
  if (!entries.length) return null;

  return (
    <div
      style={{
        marginBottom: 28,
        padding: "16px 20px",
        borderRadius: 10,
        background: "rgba(124, 58, 237, 0.07)",
        border: "1px solid rgba(124, 58, 237, 0.2)",
      }}
    >
      <h3
        style={{
          fontSize: "0.85rem",
          fontWeight: 700,
          color: "var(--purple-lt)",
          marginBottom: 14,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        🎨 Style Guide
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {entries.map(([key, value]) => {
          const meta = STYLE_META[key] || { label: key, icon: "•", color: "#94a3b8" };
          return (
            <div
              key={key}
              style={{
                flex: "1 1 160px",
                padding: "10px 14px",
                borderRadius: 8,
                background: `${meta.color}11`,
                border: `1px solid ${meta.color}33`,
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: meta.color,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 4,
                }}
              >
                {meta.icon} {meta.label}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.5 }}>
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene card (collapsible) ─────────────────────────────────────────────────
function SceneCard({ scene }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        marginBottom: 12,
        borderRadius: 8,
        border: "1px solid rgba(124, 58, 237, 0.25)",
        overflow: "hidden",
        background: "rgba(124, 58, 237, 0.05)",
      }}
    >
      {/* header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(124, 58, 237, 0.1)",
          border: "none",
          cursor: "pointer",
          color: "var(--text)",
          fontSize: "0.875rem",
          fontWeight: 700,
          textAlign: "left",
        }}
      >
        <span>
          Scene {scene.scene}
          {scene.timestamp && (
            <span
              style={{
                marginLeft: 10,
                fontWeight: 400,
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              ⏱ {scene.timestamp}
            </span>
          )}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "12px 16px", fontSize: "0.875rem" }}>
          {/* Visual */}
          {scene.visual && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "var(--cyan-lt)" }}>
                🎥 Visual:{" "}
              </span>
              <span style={{ color: "var(--text)", lineHeight: 1.7 }}>
                {scene.visual}
              </span>
            </div>
          )}

          {/* Camera / shot (keyframe + motion for video) */}
          {scene.camera_movement && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "#e879f9" }}>
                📷 Camera:{" "}
              </span>
              <span style={{ color: "var(--text)", lineHeight: 1.7 }}>
                {scene.camera_movement}
              </span>
            </div>
          )}

          {/* Voiceover */}
          {scene.voiceover && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "#a78bfa" }}>🎙 VO: </span>
              <span style={{ color: "var(--text)", fontStyle: "italic" }}>
                "{scene.voiceover}"
              </span>
            </div>
          )}

          {/* Dialogue */}
          {scene.dialogue && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "#f472b6" }}>
                💬 Dialogue:{" "}
              </span>
              <span style={{ color: "var(--text)", fontStyle: "italic" }}>
                "{scene.dialogue}"
              </span>
            </div>
          )}

          {/* Text Overlay */}
          {scene.visual_elements && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "#fbbf24" }}>
                📝 Visual Elements:
              </span>

              <ul style={{ color: "var(--text)", paddingLeft: 20 }}>
                {scene.visual_elements.map((v, index) => (
                  <li key={index}>
                    {v.name} — {v.size} — {v.position}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {scene.scene_background_location && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "#fbbf24" }}>
                📝scene background location:{" "}
              </span>
              <span style={{ color: "var(--text)" }}>
                {scene.scene_background_location}
              </span>
            </div>
          )}

          {/* Editing */}
          {scene.editing && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: "#34d399" }}>
                ✂️ Editing:{" "}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {scene.editing}
              </span>
            </div>
          )}

          {/* Model Clothes */}
          {scene.model_clothes && scene.model_clothes.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#f472b6",
                  marginBottom: 6,
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                👗 Model Clothes
              </div>
              {scene.model_clothes.map((item, i) => (
                <Tag key={i} color="#f472b6">
                  {item}
                </Tag>
              ))}
            </div>
          )}

          {/* Model Appearance */}
          {scene.model_appearance && scene.model_appearance.length > 0 && (
            <div style={{ marginBottom: 4 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: "#60a5fa",
                  marginBottom: 6,
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                🧑 Model Appearance
              </div>
              {scene.model_appearance.map((item, i) => (
                <Tag key={i} color="#60a5fa">
                  {item}
                </Tag>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ScriptResultDisplay({ data }) {
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
  const scenes = currentScript?.scenes ?? [];

  return (
    <div>
      {/* Script tab switcher */}
      {scripts.length > 1 && (
        <div style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {scripts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveScriptIndex(idx)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border:
                  activeScriptIndex === idx
                    ? "2px solid var(--cyan-lt)"
                    : "1px solid var(--border)",
                background:
                  activeScriptIndex === idx ? "rgba(6, 182, 212, 0.1)" : "transparent",
                color: activeScriptIndex === idx ? "var(--cyan-lt)" : "var(--text)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: activeScriptIndex === idx ? 600 : 400,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (activeScriptIndex !== idx) e.target.style.borderColor = "var(--purple)";
              }}
              onMouseLeave={(e) => {
                if (activeScriptIndex !== idx) e.target.style.borderColor = "var(--border)";
              }}
            >
              Script {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Script body */}
      <div
        style={{
          padding: "24px",
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(6,182,212,0.05) 100%)",
          borderRadius: "var(--radius-sm)",
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        {/* Title */}
        {currentScript.title && (
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "var(--cyan-lt)",
              marginBottom: 8,
              letterSpacing: 0.5,
            }}
          >
            {currentScript.title}
          </h2>
        )}

        {/* Product */}
        {currentScript.product && (
          <p
            style={{
              marginBottom: 20,
              lineHeight: 1.7,
              color: "var(--text-muted)",
              fontStyle: "italic",
              fontSize: "0.9rem",
            }}
          >
            <strong>Product:</strong> {currentScript.product}
          </p>
        )}

        {/* Style Guide */}
        <StylePanel style={currentScript.style} />

        {/* Flat scene list */}
        {scenes.length > 0 ? (
          <div>
            <h3
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--purple-lt)",
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: "2px solid rgba(124, 58, 237, 0.25)",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              📹 Scenes ({scenes.length})
            </h3>
            {scenes.map((scene, idx) => (
              <SceneCard key={idx} scene={scene} />
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>No scenes found.</p>
        )}

        <style>{`
          div[style*="overflowY"] {
            scrollbar-width: thin;
            scrollbar-color: var(--purple) transparent;
          }
          div[style*="overflowY"]::-webkit-scrollbar { width: 6px; }
          div[style*="overflowY"]::-webkit-scrollbar-track { background: transparent; }
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
