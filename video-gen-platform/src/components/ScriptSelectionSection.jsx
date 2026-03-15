import { useState } from "react";

export default function ScriptSelectionSection({
  results,
  selectedScripts,
  onSelectionChange,
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleToggleScript = (index) => {
    const newSelected = selectedScripts.includes(index)
      ? selectedScripts.filter((i) => i !== index)
      : [...selectedScripts, index];
    onSelectionChange(newSelected);
  };

  const toggleExpanded = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const successResults = results.filter((r) => r.status === "success");

  // Always render the section, but show appropriate message
  if (successResults.length === 0) {
    return (
      <section className="card">
        <div className="card-header">
          <div className="step-badge">02</div>
          <div>
            <h2 className="card-title">Select Example Scripts</h2>
            <p className="card-desc">
              Choose one or more analyzed scripts to use as style references
            </p>
          </div>
        </div>
        <div className="selection-hint" style={{ marginTop: "16px" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>
            No successful analyses available. Please ensure your videos were
            analyzed successfully above.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="card-header">
        <div className="step-badge">02</div>
        <div>
          <h2 className="card-title">Select Example Scripts</h2>
          <p className="card-desc">
            Choose one or more analyzed scripts to use as style references
            {selectedScripts.length > 0 &&
              ` — ${selectedScripts.length} selected`}
          </p>
        </div>
      </div>

      <div className="script-selection-list">
        {successResults.map((res, index) => {
          const isSelected = selectedScripts.includes(index);
          const isExpanded = expandedIndex === index;

          return (
            <div
              key={index}
              className={`script-selection-item${isSelected ? " selected" : ""}`}
            >
              <div
                className="script-selection-header"
                onClick={() => toggleExpanded(index)}
              >
                <div className="script-checkbox-wrapper">
                  <input
                    type="checkbox"
                    className="script-checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleScript(index)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select script from video ${index + 1}`}
                  />
                  <span className="script-check-visual" />
                </div>

                <div className="script-info">
                  <h3 className="script-title">Video Reference {index + 1}</h3>
                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="script-url"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {res.url}
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className={`script-expand-btn${isExpanded ? " expanded" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(index);
                  }}
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} script details`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {isExpanded && (
                <div className="script-content">
                  <pre className="script-preview">{res.result}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedScripts.length === 0 && (
        <div className="selection-hint">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <span>Select at least one script to use as reference</span>
        </div>
      )}
    </section>
  );
}
