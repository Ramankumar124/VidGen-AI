export default function ResultModal({ visible, result, onClose }) {
    if (!visible || !result) return null

    const {
        script = '',
        productName = '',
        tone = '',
        duration = '',
        scenes = [],
        hooks = [],
        callToAction = '',
        musicSuggestion = '',
    } = result

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Video generation result">
            <div className="modal-card result-modal-card" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="result-header">
                    <div className="result-icon">
                        <svg viewBox="0 0 64 64" fill="none" width="48" height="48">
                            <circle cx="32" cy="32" r="30" fill="url(#rgrad)" opacity="0.15" />
                            <polygon points="22,16 22,48 50,32" fill="url(#rgrad)" />
                            <defs>
                                <linearGradient id="rgrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#7C3AED" />
                                    <stop offset="1" stopColor="#06B6D4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div>
                        <h2 className="modal-title">🎬 Your Video Script is Ready!</h2>
                        <p className="modal-subtitle">
                            {productName && <span><strong>{productName}</strong> · </span>}
                            {tone && <span>{tone} tone</span>}
                            {duration && <span> · {duration}</span>}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="result-close-btn"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Script */}
                {script && (
                    <div className="result-section">
                        <h3 className="result-section-title">📝 Full Script</h3>
                        <div className="result-script-box">
                            <pre>{script}</pre>
                        </div>
                    </div>
                )}

                {/* Scenes */}
                {scenes.length > 0 && (
                    <div className="result-section">
                        <h3 className="result-section-title">🎥 Scene Breakdown</h3>
                        <div className="result-scenes">
                            {scenes.map((scene, i) => (
                                <div key={i} className="result-scene-card">
                                    <div className="scene-num">Scene {i + 1}</div>
                                    <div className="scene-desc">{scene.description ?? scene}</div>
                                    {scene.duration && (
                                        <div className="scene-duration">{scene.duration}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hooks */}
                {hooks.length > 0 && (
                    <div className="result-section">
                        <h3 className="result-section-title">🪝 Opening Hooks</h3>
                        <ul className="result-list">
                            {hooks.map((hook, i) => (
                                <li key={i}>{hook}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* CTA + Music */}
                <div className="result-meta-row">
                    {callToAction && (
                        <div className="result-meta-item">
                            <span className="result-meta-label">📢 Call to Action</span>
                            <span className="result-meta-value">{callToAction}</span>
                        </div>
                    )}
                    {musicSuggestion && (
                        <div className="result-meta-item">
                            <span className="result-meta-label">🎵 Music Suggestion</span>
                            <span className="result-meta-value">{musicSuggestion}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="result-actions">
                    <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                            const text = script || JSON.stringify(result, null, 2)
                            navigator.clipboard?.writeText(text)
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Script
                    </button>
                    <button type="button" className="btn-submit" onClick={onClose}>
                        <span className="btn-submit-inner">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Done
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}
