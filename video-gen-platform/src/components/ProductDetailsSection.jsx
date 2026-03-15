import { useState, useRef, useCallback } from 'react'

const TONES = [
  { id: 'Energetic', label: '⚡ Energetic' },
  { id: 'Cinematic', label: '🎬 Cinematic' },
  { id: 'Minimalist', label: '🌿 Minimalist' },
  { id: 'Playful', label: '🎉 Playful' },
  { id: 'Luxury', label: '💎 Luxury' },
  { id: 'Emotional', label: '🌊 Emotional' },
  { id: 'Inspirational', label: '🚀 Inspirational' },
  { id: 'Educational', label: '📚 Educational' },
]

const CATEGORIES = [
  'Electronics & Gadgets', 'Fashion & Apparel', 'Beauty & Skincare',
  'Food & Beverage', 'Home & Living', 'Sports & Fitness',
  'Automotive', 'SaaS / Digital Product', 'Other',
]

const DURATIONS = [
  'Let AI decide', '15 seconds (Short)', '30 seconds',
  '60 seconds (Standard)', '90 seconds', '2+ minutes (Long-form)',
]

export default function ProductDetailsSection({ data, onChange }) {
  const handleTone = (tone) => {
    onChange({ selectedTone: data.selectedTone === tone ? '' : tone })
  }

  return (
    <section className="card">
      <div className="card-header">
        <div className="step-badge">03</div>
        <div>
          <h2 className="card-title">Product Details</h2>
          <p className="card-desc">Tell the AI about your product so it can craft the narrative.</p>
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="productName" className="form-label">
            Product Name <span className="required">*</span>
          </label>
          <input
            type="text" id="productName" className="form-input"
            placeholder="e.g. CloudX Pro Headphones"
            value={data.productName}
            onChange={e => onChange({ productName: e.target.value })}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="productCategory" className="form-label">
            Category <span className="required">*</span>
          </label>
          <select
            id="productCategory" className="form-input form-select"
            value={data.productCategory}
            onChange={e => onChange({ productCategory: e.target.value })}
            required
          >
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="productTagline" className="form-label">Tagline / Key Message</label>
          <input
            type="text" id="productTagline" className="form-input"
            placeholder="e.g. Sound that moves you, wherever you go"
            value={data.productTagline}
            onChange={e => onChange({ productTagline: e.target.value })}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="productDescription" className="form-label">
            Product Description <span className="required">*</span>
          </label>
          <textarea
            id="productDescription" className="form-input form-textarea" rows={4}
            placeholder="Describe your product's key features, benefits, and what makes it unique..."
            maxLength={500}
            value={data.productDescription}
            onChange={e => onChange({ productDescription: e.target.value })}
            required
          />
          <span className="char-count">
            <span>{data.productDescription.length}</span> / 500
          </span>
        </div>

        <div className="form-field">
          <label htmlFor="targetAudience" className="form-label">Target Audience</label>
          <input
            type="text" id="targetAudience" className="form-input"
            placeholder="e.g. Musicians, 18–35"
            value={data.targetAudience}
            onChange={e => onChange({ targetAudience: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label htmlFor="videoDuration" className="form-label">Desired Video Length</label>
          <select
            id="videoDuration" className="form-input form-select"
            value={data.videoDuration}
            onChange={e => onChange({ videoDuration: e.target.value })}
          >
            {DURATIONS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="form-field form-field-full">
          <label className="form-label">Video Tone</label>
          <div className="tone-chips">
            {TONES.map(t => (
              <button
                key={t.id} type="button"
                className={`chip${data.selectedTone === t.id ? ' selected' : ''}`}
                onClick={() => handleTone(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="additionalNotes" className="form-label">Additional Notes</label>
          <textarea
            id="additionalNotes" className="form-input form-textarea" rows={2}
            placeholder="Any extra instructions for the AI — colors, music style, specific scenes..."
            value={data.additionalNotes}
            onChange={e => onChange({ additionalNotes: e.target.value })}
          />
        </div>
      </div>
    </section>
  )
}
