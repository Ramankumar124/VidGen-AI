import { useRef, useState, useCallback } from "react";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProductImagesSection({ images, onImagesChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file (PNG, JPG, WEBP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Maximum size is 10 MB.");
        return;
      }
      const url = URL.createObjectURL(file);
      const newImage = {
        file,
        url,
        name: file.name,
        size: formatBytes(file.size),
        id: Date.now() + Math.random(),
      };
      onImagesChange([...images, newImage]);
    },
    [images, onImagesChange],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    // Support multiple files
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onClick = () => inputRef.current?.click();

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") onClick();
  };

  const removeImage = (id) => {
    onImagesChange(images.filter((img) => img.id !== id));
  };

  return (
    <section className="card">
      <div className="card-header">
        <div className="step-badge">04</div>
        <div>
          <h2 className="card-title">Product Images</h2>
          <p className="card-desc">
            Upload product images to help generate better scripts
            {images.length > 0 &&
              ` — ${images.length} image${images.length !== 1 ? "s" : ""} uploaded`}
          </p>
        </div>
      </div>

      <div
        className={`upload-zone${dragging ? " drag-over" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={images.length === 0 ? onClick : undefined}
        onKeyDown={images.length === 0 ? onKeyDown : undefined}
        tabIndex={images.length === 0 ? 0 : undefined}
        role={images.length === 0 ? "button" : undefined}
        aria-label="Upload product images"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          hidden
          onChange={(e) => {
            Array.from(e.target.files || []).forEach(processFile);
            e.target.value = "";
          }}
        />

        {images.length === 0 ? (
          <div className="upload-placeholder">
            <div className="upload-icon-wrap">
              <svg className="upload-icon" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="32" fill="url(#upload-grad)" />
                <path
                  d="M32 20v18M24 28l8-8 8 8"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 44h20"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="upload-grad"
                    x1="0"
                    y1="0"
                    x2="64"
                    y2="64"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#7C3AED" stopOpacity="0.4" />
                    <stop offset="1" stopColor="#06B6D4" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="upload-text">
              Drag & drop or{" "}
              <span className="upload-link">click to upload</span>
            </p>
            <p className="upload-hint">
              Max 10 MB each — PNG, JPG, WEBP. You can upload multiple images.
            </p>
          </div>
        ) : (
          <div className="upload-preview-grid">
            {images.map((image) => (
              <div key={image.id} className="upload-preview-card">
                <img
                  src={image.url}
                  alt={image.name}
                  className="preview-thumbnail"
                />
                <div className="preview-overlay">
                  <button
                    type="button"
                    className="preview-remove-btn"
                    aria-label="Remove image"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div className="preview-info-card">
                  <span className="preview-name">{image.name}</span>
                  <span className="preview-size">{image.size}</span>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="upload-add-more"
              onClick={onClick}
              aria-label="Add more images"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add More</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
