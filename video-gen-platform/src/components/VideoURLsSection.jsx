import { useState } from 'react'

const MAX_URLS = 20

export default function VideoURLsSection({ urls, onChange }) {
    const [showBulk, setShowBulk] = useState(false)
    const [bulkText, setBulkText] = useState('')

    const addUrl = () => {
        if (urls.length >= MAX_URLS) return
        onChange([...urls, ''])
    }

    const removeUrl = (idx) => {
        const next = urls.filter((_, i) => i !== idx)
        onChange(next.length ? next : [''])
    }

    const updateUrl = (idx, val) => {
        const next = [...urls]
        next[idx] = val
        onChange(next)
    }

    const handleBulkImport = () => {
        const lines = bulkText
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean)
            .slice(0, MAX_URLS)
        if (!lines.length) return
        onChange(lines)
        setBulkText('')
        setShowBulk(false)
    }

    const validCount = urls.filter(u => u.trim()).length

    return (
        <>
            <section className="card">
                <div className="card-header">
                    <div className="step-badge">01</div>
                    <div>
                        <h2 className="card-title">Reference Video URLs</h2>
                        <p className="card-desc">Paste up to 20 video URLs — YouTube, Vimeo, or direct links.</p>
                    </div>
                    <div className="url-counter-wrap">
                        <span className="url-count">{validCount}</span>
                        <span className="url-count-max">/ {MAX_URLS}</span>
                    </div>
                </div>

                <div className="url-list">
                    {urls.map((url, idx) => (
                        <div key={idx} className="url-row">
                            <span className="url-num">{String(idx + 1).padStart(2, '0')}</span>
                            <input
                                type="url" className="url-input"
                                placeholder={`https://youtube.com/watch?v=...`}
                                value={url}
                                onChange={e => updateUrl(idx, e.target.value)}
                                aria-label={`Video URL ${idx + 1}`}
                            />
                            {urls.length > 1 && (
                                <button
                                    type="button" className="url-remove" aria-label="Remove URL"
                                    onClick={() => removeUrl(idx)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="url-actions">
                    <button
                        type="button" className="btn-ghost"
                        onClick={addUrl} disabled={urls.length >= MAX_URLS}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Another URL
                    </button>
                    <button
                        type="button" className="btn-ghost btn-accent"
                        onClick={() => setShowBulk(true)}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        </svg>
                        Paste Bulk URLs
                    </button>
                </div>
            </section>

            {/* Bulk Paste Modal */}
            {showBulk && (
                <div className="modal-overlay" onClick={() => setShowBulk(false)}>
                    <div className="modal-card bulk-modal-card" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">Paste Bulk URLs</h2>
                        <p className="modal-subtitle">Paste up to 20 URLs, one per line.</p>
                        <textarea
                            className="form-input form-textarea" rows={10}
                            placeholder={"https://youtube.com/watch?v=...\nhttps://vimeo.com/...\nhttps://..."}
                            value={bulkText}
                            onChange={e => setBulkText(e.target.value)}
                            autoFocus
                        />
                        <div className="bulk-actions">
                            <button type="button" className="btn-ghost" onClick={() => setShowBulk(false)}>
                                Cancel
                            </button>
                            <button type="button" className="btn-submit bulk-submit" onClick={handleBulkImport}>
                                <span className="btn-submit-inner">Import URLs</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
