import { useRef, useState, useCallback } from 'react'

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProductImageSection({ image, onImage }) {
    const inputRef = useRef(null)
    const [dragging, setDragging] = useState(false)

    const processFile = useCallback((file) => {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, WEBP).')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Maximum size is 10 MB.')
            return
        }
        const url = URL.createObjectURL(file)
        onImage({ file, url, name: file.name, size: formatBytes(file.size) })
    }, [onImage])

    const onDrop = (e) => {
        e.preventDefault(); setDragging(false)
        processFile(e.dataTransfer.files[0])
    }
    const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
    const onDragLeave = () => setDragging(false)
    const onClick = () => inputRef.current?.click()
    const onKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }

    return (
        <section className="card">
            <div className="card-header">
                <div className="step-badge">02</div>
                <div>
                    <h2 className="card-title">Product Image</h2>
                    <p className="card-desc">Upload your product image (PNG, JPG, WEBP). Used as the visual anchor.</p>
                </div>
            </div>

            <div
                className={`upload-zone${dragging ? ' drag-over' : ''}`}
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                onClick={!image ? onClick : undefined}
                onKeyDown={!image ? onKeyDown : undefined}
                tabIndex={!image ? 0 : undefined}
                role={!image ? 'button' : undefined}
                aria-label="Upload product image"
            >
                <input
                    ref={inputRef} type="file" accept="image/*" hidden
                    onChange={e => processFile(e.target.files[0])}
                />

                {!image ? (
                    <div className="upload-placeholder">
                        <div className="upload-icon-wrap">
                            <svg className="upload-icon" viewBox="0 0 64 64" fill="none">
                                <circle cx="32" cy="32" r="32" fill="url(#upload-grad)" />
                                <path d="M32 20v18M24 28l8-8 8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 44h20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="upload-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#7C3AED" stopOpacity="0.4" />
                                        <stop offset="1" stopColor="#06B6D4" stopOpacity="0.4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <p className="upload-text">Drag & drop or <span className="upload-link">click to upload</span></p>
                        <p className="upload-hint">Max 10 MB — PNG, JPG, WEBP</p>
                    </div>
                ) : (
                    <div className="upload-preview">
                        <img src={image.url} alt="Product preview" />
                        <div className="preview-info">
                            <span className="preview-name">{image.name}</span>
                            <span className="preview-size">{image.size}</span>
                        </div>
                        <button
                            type="button" className="preview-remove" aria-label="Remove image"
                            onClick={e => { e.stopPropagation(); onImage(null) }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}
