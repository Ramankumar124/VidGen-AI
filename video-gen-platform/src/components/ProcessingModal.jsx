import { useEffect, useRef } from 'react'

const STEPS = [
    'Parsing video URLs',
    'Running batch analysis',
    'Extracting style patterns',
    'Compositing product scenes',
    'Rendering final video',
]

const STEP_MESSAGES = [
    'Parsing video URLs…',
    'Running batch analysis on reference videos…',
    'Extracting visual style & pacing patterns…',
    'Compositing product into scenes…',
    'Rendering & encoding final video…',
]

const STEP_DURATIONS = [8, 25, 30, 25, 12] // % each step takes

export default function ProcessingModal({ visible, progress, currentStep, onCancel }) {
    if (!visible) return null

    let cumulative = 0
    const cumSteps = STEP_DURATIONS.map(d => { cumulative += d; return cumulative })

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Video generation in progress">
            <div className="modal-card">
                <div className="modal-anim">
                    <div className="pulse-rings">
                        <div className="ring r1" /><div className="ring r2" /><div className="ring r3" />
                    </div>
                    <div className="modal-icon">
                        <svg viewBox="0 0 64 64" fill="none">
                            <polygon points="18,12 18,52 54,32" fill="url(#mgrad)" />
                            <defs>
                                <linearGradient id="mgrad" x1="0" y1="0" x2="54" y2="52" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#7C3AED" />
                                    <stop offset="1" stopColor="#06B6D4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                <h2 className="modal-title">Generating Your Video</h2>
                <p className="modal-subtitle">{STEP_MESSAGES[currentStep] ?? 'Processing…'}</p>

                <div className="progress-bar-wrap">
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-labels">
                    <span>{progress}%</span>
                    <span>{progress < 100 ? 'Estimated 3–8 min' : 'Complete!'}</span>
                </div>

                <div className="pipeline-steps">
                    {STEPS.map((step, i) => {
                        const isDone = progress >= cumSteps[i]
                        const isActive = !isDone && currentStep === i
                        return (
                            <div key={step} className={`pipeline-step${isDone ? ' done' : ''}${isActive ? ' active-step' : ''}`}>
                                <div className={`ps-dot${isDone ? ' done' : ''}${isActive ? ' active' : ''}`} />
                                <span>{step}</span>
                            </div>
                        )
                    })}
                </div>

                <button type="button" className="btn-ghost modal-cancel" onClick={onCancel}>
                    Cancel Generation
                </button>
            </div>
        </div>
    )
}
