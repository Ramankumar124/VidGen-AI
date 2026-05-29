import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import api from '../../services/api'

// ── Icons ─────────────────────────────────────────────────────────────────────
const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)
const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const ScriptIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
)
const SpinnerIcon = () => (
  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
)
const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

// ── AnalyzeSave ───────────────────────────────────────────────────────────────
/**
 * Shown when the user skips script generation.
 * Displays a summary of what was analyzed and lets the user save the project
 * (with or without a script).
 */
const AnalyzeSave = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const runId = searchParams.get('run_id')
  const rawData = searchParams.get('data')

  // Parse the agent state passed via URL
  const agentData = rawData
    ? (() => { try { return JSON.parse(decodeURIComponent(rawData)) } catch { return {} } })()
    : {}

  const url = agentData?.url || ''
  const summary = agentData?.analized_summary || null
  const product = agentData?.product_details || null
  const script = agentData?.generateted_script || null // may exist if navigated here from step4

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // ── Product helpers ──────────────────────────────────────────────────────────
  const productName =
    product?.product_name ||
    product?.details?.product_name ||
    null

  const productBrand =
    product?.brand ||
    product?.details?.brand ||
    null

  // ── Summary highlights ────────────────────────────────────────────────────────
  const storytelling = summary?.storytelling_structure || null
  const marketing = summary?.marketing_strategy || null
  const sceneCount = summary?.scene_timeline?.length || 0

  // ── Save handler ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await api.post('/agent/projects/save', {
        run_id: runId,
        url,
        summary,
        product,
        script: script || null,
      })
      setSaved(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save project. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="Save Project" />

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-slide-up">

            {/* ── Success state ── */}
            {saved ? (
              <div className="glass-card flex flex-col items-center text-center p-12 gap-5">
                <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <CheckCircleIcon />
                </div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-bold text-on-surface">Project Saved!</h1>
                  <p className="text-on-surface-variant text-sm max-w-sm">
                    Your analysis has been saved to your projects. You can view it anytime from the Dashboard.
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 py-2.5 px-6 rounded-xl border border-white/12 text-on-surface font-semibold text-sm hover:bg-surface-high transition-all"
                  >
                    <HomeIcon /> Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/analyze')}
                    className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:shadow-glow-purple transition-all"
                  >
                    <ScriptIcon /> New Project
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ── Header ── */}
                <div className="flex flex-col gap-1">
                  <span className="label-mono text-purple-400 text-[10px]">Analysis Complete</span>
                  <h1 className="text-2xl font-bold text-on-surface tracking-tight">
                    Save Your Project
                  </h1>
                  <p className="text-on-surface-variant text-sm">
                    Review what was analyzed and save the project to your dashboard.
                  </p>
                </div>

                {/* ── Error ── */}
                {error && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-error/5 border border-error/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                {/* ── URL Card ── */}
                <div className="glass-card p-5 flex flex-col gap-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-outline">Source Video</p>
                  <div className="flex items-center gap-3 px-4 py-3 bg-surface-high/50 rounded-xl border border-white/8">
                    <span className="text-outline flex-shrink-0"><LinkIcon /></span>
                    <span className="text-sm text-on-surface-variant truncate">{url || 'N/A'}</span>
                  </div>
                </div>

                {/* ── Product Card ── */}
                {productName && (
                  <div className="glass-card p-5 flex flex-col gap-3">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-outline">Selected Product</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
                        </svg>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-on-surface">{productName}</span>
                        {productBrand && <span className="text-xs text-on-surface-variant">{productBrand}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Summary highlights ── */}
                {summary && (
                  <div className="glass-card p-5 flex flex-col gap-4">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-outline">Analysis Highlights</p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-high/50 rounded-xl p-4 border border-white/8 flex flex-col gap-1">
                        <span className="text-[10px] font-mono text-outline uppercase">Scenes</span>
                        <span className="text-2xl font-bold text-cyan-400">{sceneCount}</span>
                      </div>
                      {marketing?.target_audience && (
                        <div className="bg-surface-high/50 rounded-xl p-4 border border-white/8 flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-outline uppercase">Target Audience</span>
                          <span className="text-sm text-on-surface font-medium line-clamp-2">{marketing.target_audience}</span>
                        </div>
                      )}
                    </div>

                    {storytelling?.hook && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono text-outline uppercase">Hook</span>
                        <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-high/40 rounded-xl p-3 border border-white/6 line-clamp-3">
                          {storytelling.hook}
                        </p>
                      </div>
                    )}

                    {storytelling?.call_to_action && (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono text-outline uppercase">Call to Action</span>
                        <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-high/40 rounded-xl p-3 border border-white/6">
                          {storytelling.call_to_action}
                        </p>
                      </div>
                    )}

                    {marketing?.emotional_triggers?.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono text-outline uppercase">Emotional Triggers</span>
                        <div className="flex flex-wrap gap-2">
                          {marketing.emotional_triggers.map((t, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg border bg-purple-500/8 border-purple-500/20 text-purple-300 text-[11px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Script status note ── */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-300">
                    {script
                      ? 'This project includes a generated script.'
                      : 'No script was generated for this project. You can always come back and generate one later.'}
                  </p>
                </div>

                {/* ── Actions ── */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 py-2.5 px-5 rounded-xl border border-white/12 text-on-surface-variant font-semibold text-sm hover:bg-surface-high transition-all"
                  >
                    <HomeIcon /> Skip & Go Home
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 py-2.5 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:shadow-glow-purple transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? <><SpinnerIcon /> Saving...</> : <><SaveIcon /> Save Project</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyzeSave
