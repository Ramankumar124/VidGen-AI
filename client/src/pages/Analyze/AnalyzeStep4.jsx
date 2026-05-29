import React, { useState } from 'react'
import api from '../../services/api'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import StepIndicator from '../../components/ui/StepIndicator'

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
)
const SpinnerIcon = () => (
  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
)
const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

// ─────────────────────────────────────────────────────────────────────────────
// Tag chip
// ─────────────────────────────────────────────────────────────────────────────
const Tag = ({ children, color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    outline: 'bg-white/4 border-white/10 text-on-surface-variant',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-medium ${colors[color]}`}>
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────
const SectionLabel = ({ icon, children }) => (
  <div className="flex items-center gap-2 mb-2">
    {icon && <span className="text-outline">{icon}</span>}
    <span className="text-[10px] font-mono uppercase tracking-widest text-outline">{children}</span>
    <div className="flex-1 h-px bg-white/5" />
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Visual element pill
// ─────────────────────────────────────────────────────────────────────────────
const VisualElementPill = ({ el }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/15">
    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
    <span className="text-xs text-on-surface font-medium">{el.name}</span>
    <span className="text-[10px] text-outline ml-auto">{el.size} · {el.position}</span>
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Scene panel — all fields
// ─────────────────────────────────────────────────────────────────────────────
const ScenePanel = ({ scene, idx, total, onPrev, onNext }) => {
  if (!scene) return null

  return (
    <div className="glass-card flex flex-col flex-1 overflow-hidden">
      {/* Scene header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-on-surface">Scene {scene.scene}</span>
            <span className="font-mono text-[10px] text-outline bg-surface-high px-2 py-0.5 rounded-md">{scene.timestamp}</span>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">{scene.duration_seconds}s</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cyan-500/8 border border-cyan-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 font-mono text-[10px]">AI Generated</span>
          </div>
        </div>
      </div>

      {/* Scene body — scrollable */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

        {/* Visual description */}
        <div>
          <SectionLabel icon="🎬">Visual Direction</SectionLabel>
          <p className="text-sm text-on-surface leading-relaxed bg-surface-high/40 rounded-xl p-4 border border-white/6">
            {scene.visual}
          </p>
        </div>

        {/* Camera movement */}
        {scene.camera_movement && (
          <div>
            <SectionLabel icon="📷">Camera Work</SectionLabel>
            <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-high/40 rounded-xl p-4 border border-white/6">
              {scene.camera_movement}
            </p>
          </div>
        )}

        {/* Background / Location */}
        {scene.scene_background_location && (
          <div>
            <SectionLabel icon="🌍">Scene Location & Background</SectionLabel>
            <p className="text-sm text-on-surface-variant leading-relaxed bg-surface-high/40 rounded-xl p-4 border border-white/6">
              {scene.scene_background_location}
            </p>
          </div>
        )}

        {/* Editing */}
        {scene.editing && (
          <div>
            <SectionLabel icon="✂️">Editing Technique</SectionLabel>
            <Tag color="amber">{scene.editing}</Tag>
          </div>
        )}

        {/* Sub-cuts */}
        {scene.cuts?.length > 0 && (
          <div>
            <SectionLabel icon="🔀">Sub-Cuts</SectionLabel>
            <div className="flex flex-col gap-2">
              {scene.cuts.map((cut, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-outline font-mono flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-on-surface-variant">{cut}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voiceover */}
        {scene.voiceover && (
          <div>
            <SectionLabel icon="🎙️">Voice Over</SectionLabel>
            <p className="text-sm text-cyan-200 font-mono leading-relaxed bg-cyan-500/5 rounded-xl p-4 border border-cyan-500/15 italic">
              "{scene.voiceover}"
            </p>
          </div>
        )}

        {/* Dialogue */}
        {scene.dialogue && (
          <div>
            <SectionLabel icon="💬">Dialogue</SectionLabel>
            <p className="text-sm text-purple-200 font-mono leading-relaxed bg-purple-500/5 rounded-xl p-4 border border-purple-500/15 italic">
              "{scene.dialogue}"
            </p>
          </div>
        )}

        {/* Visual elements */}
        {scene.visual_elements?.length > 0 && (
          <div>
            <SectionLabel icon="🎨">Visual Elements</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scene.visual_elements.map((el, i) => (
                <VisualElementPill key={i} el={el} />
              ))}
            </div>
          </div>
        )}

        {/* Model appearance */}
        {scene.model_appearance?.length > 0 && (
          <div>
            <SectionLabel icon="👤">Model Appearance</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {scene.model_appearance.map((a, i) => <Tag key={i} color="outline">{a}</Tag>)}
            </div>
          </div>
        )}

        {/* Model clothes */}
        {scene.model_clothes?.length > 0 && (
          <div>
            <SectionLabel icon="👗">Wardrobe</SectionLabel>
            <div className="flex flex-col gap-2">
              {scene.model_clothes.map((c, i) => (
                <p key={i} className="text-xs text-on-surface-variant leading-relaxed">{c}</p>
              ))}
            </div>
          </div>
        )}

        {/* Reference hints */}
        <div className="flex flex-wrap gap-3">
          {scene.reference_models?.length > 0 && (
            <div>
              <SectionLabel>Reference Models</SectionLabel>
              <div className="flex gap-2 flex-wrap">
                {scene.reference_models.map((m, i) => <Tag key={i} color="outline">{m}</Tag>)}
              </div>
            </div>
          )}
          {scene.reference_products?.length > 0 && (
            <div>
              <SectionLabel>Reference Products</SectionLabel>
              <div className="flex gap-2 flex-wrap">
                {scene.reference_products.map((p, i) => <Tag key={i} color="cyan">Product {p}</Tag>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scene nav */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-white/8">
        <button
          onClick={onPrev}
          disabled={idx === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/12 text-on-surface-variant text-xs font-semibold hover:bg-surface-high disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >← Prev</button>
        <span className="text-xs text-outline font-mono">{idx + 1} / {total}</span>
        <button
          onClick={onNext}
          disabled={idx === total - 1}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/12 text-on-surface-variant text-xs font-semibold hover:bg-surface-high disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >Next →</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Style Info card
// ─────────────────────────────────────────────────────────────────────────────
const StyleCard = ({ style }) => {
  if (!style) return null
  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-on-surface">Style & Mood</h3>
      <div className="grid grid-cols-2 gap-3">
        {style.tone && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-outline uppercase">Tone</span>
            <Tag color="purple">{style.tone}</Tag>
          </div>
        )}
        {style.pacing && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-outline uppercase">Pacing</span>
            <Tag color="cyan">{style.pacing}</Tag>
          </div>
        )}
        {style.music_mood && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-outline uppercase">Music</span>
            <Tag color="amber">{style.music_mood}</Tag>
          </div>
        )}
        {style.color_palette && (
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[10px] font-mono text-outline uppercase">Color Palette</span>
            <p className="text-xs text-on-surface-variant">{style.color_palette}</p>
          </div>
        )}
        {style.notes && (
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[10px] font-mono text-outline uppercase">Notes</span>
            <p className="text-xs text-on-surface-variant leading-relaxed">{style.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Script Editor (full)
// ─────────────────────────────────────────────────────────────────────────────
const AnalyzeStep4 = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawData = searchParams.get('data')
  const runId = searchParams.get('run_id')

  // Parse data from URL (from agent state)
  const serverData = rawData
    ? (() => { try { return JSON.parse(decodeURIComponent(rawData)) } catch { return {} } })()
    : {}

  // The agent state `generateted_script` holds GeneratedScript
  const script = serverData?.generateted_script || serverData?.generated_script || serverData

  const scenes = script?.scenes || []
  const style = script?.style || null
  const title = script?.title || 'Generated Script'
  const product = script?.product || ''

  const [activeIdx, setActiveIdx] = useState(0)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedProject, setSavedProject] = useState(false)

  const handleCopyAll = () => {
    const text = scenes.map((s) => [
      `=== Scene ${s.scene} | ${s.timestamp} | ${s.duration_seconds}s ===`,
      `VISUAL: ${s.visual}`,
      s.camera_movement ? `CAMERA: ${s.camera_movement}` : '',
      s.voiceover ? `VOICEOVER: "${s.voiceover}"` : '',
      s.dialogue ? `DIALOGUE: "${s.dialogue}"` : '',
      s.editing ? `EDITING: ${s.editing}` : '',
    ].filter(Boolean).join('\n')).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveProject = async () => {
    setSaving(true)
    try {
      await api.post('/agent/projects/save', {
        run_id: runId,
        url: serverData?.url || '',
        summary: serverData?.analized_summary || null,
        product: serverData?.product_details || null,
        script: script || null,
      })
      setSavedProject(true)
      setTimeout(() => setSavedProject(false), 3000)
    } catch (err) {
      console.error('Failed to save project:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = () => {
    const text = [
      `TITLE: ${title}`,
      `PRODUCT: ${product}`,
      style ? `\nSTYLE: Tone=${style.tone || ''} | Pacing=${style.pacing || ''} | Music=${style.music_mood || ''}` : '',
      '',
      ...scenes.map((s) => [
        `--- Scene ${s.scene} (${s.timestamp}, ${s.duration_seconds}s) ---`,
        `VISUAL DIRECTION:\n${s.visual}`,
        s.camera_movement ? `CAMERA WORK:\n${s.camera_movement}` : '',
        s.scene_background_location ? `BACKGROUND:\n${s.scene_background_location}` : '',
        s.editing ? `EDITING: ${s.editing}` : '',
        s.voiceover ? `VOICEOVER: "${s.voiceover}"` : '',
        s.dialogue ? `DIALOGUE: "${s.dialogue}"` : '',
        s.visual_elements?.length ? `VISUAL ELEMENTS:\n${s.visual_elements.map((e) => `  • ${e.name} (${e.size}, ${e.position})`).join('\n')}` : '',
        s.model_clothes?.length ? `WARDROBE:\n${s.model_clothes.map((c) => `  • ${c}`).join('\n')}` : '',
      ].filter(Boolean).join('\n\n'))
    ].filter(Boolean).join('\n\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `adscript-${title.toLowerCase().replace(/\s+/g, '-')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="Script Editor" />

        <main className="flex-1 p-6 lg:p-8 overflow-hidden flex flex-col gap-6">
          <div className="flex flex-col gap-4 animate-slide-up">
            <StepIndicator current={4} />

            {/* Header row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">Script Ready · {scenes.length} scenes</span>
                </div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight truncate">{title}</h1>
                {product && <p className="text-sm text-on-surface-variant">{product}</p>}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                <button onClick={() => navigate('/analyze')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/12 text-on-surface-variant text-xs font-semibold hover:bg-surface-high transition-all">
                  <RefreshIcon /> New Script
                </button>
                <button
                  onClick={handleCopyAll}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
                    ${copied ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/8' : 'border-white/12 text-on-surface-variant hover:bg-surface-high'}`}
                >
                  <CopyIcon /> {copied ? 'Copied!' : 'Copy All'}
                </button>
                <button
                  onClick={handleSaveProject}
                  disabled={saving}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
                    ${savedProject
                      ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/8'
                      : 'border-white/12 text-on-surface-variant hover:bg-surface-high'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? <SpinnerIcon /> : <SaveIcon />}
                  {saving ? 'Saving…' : savedProject ? 'Saved!' : 'Save Project'}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold hover:shadow-glow-purple transition-all">
                  <DownloadIcon /> Export Script
                </button>
              </div>
            </div>
          </div>

          {/* Main area */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0">
            {/* Scene list sidebar */}
            <div className="lg:col-span-1 glass-card flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8">
                <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Scenes ({scenes.length})</p>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col p-2 gap-1">
                {scenes.map((s, i) => (
                  <button
                    key={s.scene}
                    onClick={() => setActiveIdx(i)}
                    className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 w-full
                      ${activeIdx === i ? 'bg-purple-500/12 border border-purple-500/30 text-primary' : 'text-on-surface-variant hover:bg-surface-high hover:text-on-surface'}`}
                  >
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5
                      ${activeIdx === i ? 'bg-purple-500 text-white' : 'bg-surface-highest text-outline'}`}>
                      {s.scene}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{s.timestamp}</p>
                      <p className="text-[10px] text-outline">{s.duration_seconds}s · {s.editing || 'Cut'}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Style card below scenes */}
              {style && (
                <div className="border-t border-white/8 p-3">
                  <StyleCard style={style} />
                </div>
              )}
            </div>

            {/* Scene detail panel */}
            <div className="lg:col-span-3 flex flex-col min-h-0 overflow-hidden">
              {scenes.length > 0 ? (
                <ScenePanel
                  scene={scenes[activeIdx]}
                  idx={activeIdx}
                  total={scenes.length}
                  onPrev={() => setActiveIdx((i) => Math.max(0, i - 1))}
                  onNext={() => setActiveIdx((i) => Math.min(scenes.length - 1, i + 1))}
                />
              ) : (
                <div className="glass-card flex-1 flex items-center justify-center">
                  <p className="text-on-surface-variant text-sm">No scenes found in the generated script.</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex justify-between items-center pt-2">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-surface-high border border-white/12 text-on-surface font-semibold text-sm hover:bg-surface-highest transition-all">
              <HomeIcon /> Dashboard
            </button>
            <p className="text-xs text-outline font-mono">Run ID: {runId?.slice(0, 12)}…</p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyzeStep4
