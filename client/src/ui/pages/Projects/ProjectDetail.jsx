import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import api from '../../services/api'

// ── Icons ──────────────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const LinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

// ── Shared UI atoms ────────────────────────────────────────────────────────────
const Tag = ({ children, color = 'purple' }) => {
  const cls = {
    purple: 'bg-purple-500/10 border-purple-500/25 text-purple-300',
    cyan: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',
    amber: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
    outline: 'bg-white/4 border-white/10 text-on-surface-variant',
  }
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-medium ${cls[color]}`}>{children}</span>
}

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-[10px] font-mono uppercase tracking-widest text-outline">{children}</span>
    <div className="flex-1 h-px bg-white/5"/>
  </div>
)

const InfoBlock = ({ label, value }) => value ? (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-mono text-outline uppercase">{label}</span>
    <p className="text-sm text-on-surface-variant leading-relaxed">{value}</p>
  </div>
) : null

const ProseBlock = ({ label, value, mono = false }) => value ? (
  <div className="flex flex-col gap-2">
    <SectionLabel>{label}</SectionLabel>
    <p className={`text-sm leading-relaxed bg-surface-high/40 rounded-xl p-4 border border-white/6 ${mono ? 'font-mono text-cyan-200 italic' : 'text-on-surface-variant'}`}>
      {value}
    </p>
  </div>
) : null

// ── Scene Card ─────────────────────────────────────────────────────────────────
const SceneCard = ({ scene }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-high/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {scene.scene}
          </span>
          <div className="text-left">
            <p className="text-sm font-semibold text-on-surface">{scene.timestamp}</p>
            <p className="text-[10px] text-outline">{scene.duration_seconds}s · {scene.editing || 'Cut'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {scene.camera_movement && <Tag color="outline">📷 Camera</Tag>}
          {scene.voiceover && <Tag color="cyan">🎙️ VO</Tag>}
          {scene.dialogue && <Tag color="purple">💬 Dialog</Tag>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform duration-200 text-outline ${open ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/8 p-5 flex flex-col gap-5">
          <ProseBlock label="🎬 Visual Direction" value={scene.visual} />
          <ProseBlock label="📷 Camera Work" value={scene.camera_movement} />
          <ProseBlock label="🌍 Background & Location" value={scene.scene_background_location} />
          <ProseBlock label="🎙️ Voice Over" value={scene.voiceover} mono />
          <ProseBlock label="💬 Dialogue" value={scene.dialogue} mono />

          {scene.editing && (
            <div><SectionLabel>✂️ Editing</SectionLabel><Tag color="amber">{scene.editing}</Tag></div>
          )}

          {scene.cuts?.length > 0 && (
            <div>
              <SectionLabel>🔀 Sub-Cuts</SectionLabel>
              <div className="flex flex-col gap-2">
                {scene.cuts.map((c, i) => (
                  <div key={i} className="flex gap-3 text-sm text-on-surface-variant">
                    <span className="text-outline font-mono">{i + 1}.</span> {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {scene.visual_elements?.length > 0 && (
            <div>
              <SectionLabel>🎨 Visual Elements</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scene.visual_elements.map((el, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/5 border border-purple-500/12">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"/>
                    <span className="text-xs text-on-surface font-medium">{el.name}</span>
                    <span className="text-[10px] text-outline ml-auto">{el.size} · {el.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scene.model_appearance?.length > 0 && (
            <div>
              <SectionLabel>👤 Model Appearance</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {scene.model_appearance.map((a, i) => <Tag key={i} color="outline">{a}</Tag>)}
              </div>
            </div>
          )}

          {scene.model_clothes?.length > 0 && (
            <div>
              <SectionLabel>👗 Wardrobe</SectionLabel>
              <div className="flex flex-col gap-1.5">
                {scene.model_clothes.map((c, i) => (
                  <p key={i} className="text-xs text-on-surface-variant leading-relaxed">• {c}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ProjectDetail Page ────────────────────────────────────────────────────
const ProjectDetail = () => {
  const navigate = useNavigate()
  const { runId } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('script')

  useEffect(() => {
    fetchProject()
  }, [runId])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/agent/projects/${runId}`)
      // New endpoint returns a flat ProjectRead object directly
      setProject(res.data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"/>
          <p className="text-on-surface-variant text-sm">Loading project...</p>
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-error text-sm">{error}</p>
          <button onClick={() => navigate('/dashboard')} className="text-purple-400 text-xs hover:text-primary">← Back to Dashboard</button>
        </div>
      </div>
    </div>
  )

  // New DB model field names: .script, .summary, .product
  const script = project?.script || {}
  const scenes = script?.scenes || []
  const style = script?.style
  const summary = project?.summary || {}
  // product can be nested as {details: {...}} or flat
  const productRaw = project?.product || {}
  const productDetails = productRaw?.details || productRaw || {}
  const url = project?.url || ''

  const tabs = [
    { id: 'script', label: `Script (${scenes.length} scenes)` },
    { id: 'summary', label: 'Video Analysis' },
    { id: 'product', label: 'Product' },
    { id: 'meta', label: 'Meta' },
  ]

  const handleCopyScript = () => {
    const text = scenes.map((s) => [
      `=== Scene ${s.scene} | ${s.timestamp} ===`,
      `VISUAL: ${s.visual}`,
      s.voiceover ? `VOICEOVER: "${s.voiceover}"` : '',
      s.dialogue ? `DIALOGUE: "${s.dialogue}"` : '',
      s.camera_movement ? `CAMERA: ${s.camera_movement}` : '',
    ].filter(Boolean).join('\n')).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const text = [
      `PROJECT: ${script.title || 'Untitled'}`,
      `URL: ${url}`,
      `PRODUCT: ${productDetails.product_name || ''}`,
      '',
      ...scenes.map((s) => [
        `--- Scene ${s.scene} (${s.timestamp}, ${s.duration_seconds}s) ---`,
        `VISUAL: ${s.visual}`,
        s.camera_movement ? `CAMERA: ${s.camera_movement}` : '',
        s.voiceover ? `VOICEOVER: "${s.voiceover}"` : '',
        s.dialogue ? `DIALOGUE: "${s.dialogue}"` : '',
        s.editing ? `EDITING: ${s.editing}` : '',
        s.visual_elements?.length ? `VISUAL ELEMENTS:\n${s.visual_elements.map((e) => `  • ${e.name} (${e.size}, ${e.position})`).join('\n')}` : '',
      ].filter(Boolean).join('\n\n'))
    ].filter(Boolean).join('\n\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `adscript-${runId?.slice(0, 8)}.txt` })
    a.click()
  }

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="Project Detail" />

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-slide-up">

            {/* Back + title row */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-on-surface-variant text-xs hover:text-on-surface transition-colors mb-2">
                  <ArrowLeftIcon /> Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-on-surface">{script?.title || 'Untitled Project'}</h1>
                {url && (
                  <a href={url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-primary transition-colors mt-1 truncate max-w-md">
                    <LinkIcon /> {url}
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopyScript}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
                    ${copied ? 'border-cyan-500/40 text-cyan-400 bg-cyan-500/8' : 'border-white/12 text-on-surface-variant hover:bg-surface-high'}`}>
                  <CopyIcon /> {copied ? 'Copied!' : 'Copy Script'}
                </button>
                <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold hover:shadow-glow-purple transition-all">
                  <DownloadIcon /> Export
                </button>
              </div>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Scenes', value: scenes.length },
                { label: 'Product', value: productDetails.product_name || '—' },
                { label: 'Tone', value: style?.tone || '—' },
                { label: 'Pacing', value: style?.pacing || '—' },
              ].map((item) => (
                <div key={item.label} className="glass-card px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono text-outline uppercase">{item.label}</span>
                  <span className="text-sm font-semibold text-on-surface truncate">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-high/50 p-1 rounded-xl border border-white/8 w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all
                    ${activeTab === tab.id ? 'bg-surface-highest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── SCRIPT TAB ── */}
            {activeTab === 'script' && (
              <div className="flex flex-col gap-3">
                {style && (
                  <div className="glass-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <InfoBlock label="Tone" value={style.tone} />
                    <InfoBlock label="Pacing" value={style.pacing} />
                    <InfoBlock label="Music Mood" value={style.music_mood} />
                    <InfoBlock label="Color Palette" value={style.color_palette} />
                    {style.notes && <div className="col-span-full"><InfoBlock label="Style Notes" value={style.notes} /></div>}
                  </div>
                )}
                {scenes.length === 0 ? (
                  <div className="glass-card py-16 flex items-center justify-center">
                    <p className="text-on-surface-variant text-sm">No script generated yet.</p>
                  </div>
                ) : (
                  scenes.map((scene) => <SceneCard key={scene.scene} scene={scene} />)
                )}
              </div>
            )}

            {/* ── VIDEO ANALYSIS TAB ── */}
            {activeTab === 'summary' && (
              <div className="flex flex-col gap-4">
                {typeof summary === 'string' ? (
                  <div className="glass-card p-6">
                    <SectionLabel>Raw Analysis</SectionLabel>
                    <pre className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap leading-relaxed">{summary}</pre>
                  </div>
                ) : (
                  <>
                    {/* Audio transcript */}
                    {summary.audio_transcript && (
                      <div className="glass-card p-6">
                        <ProseBlock label="🎵 Audio Transcript" value={summary.audio_transcript} mono />
                      </div>
                    )}

                    {/* Storytelling */}
                    {summary.storytelling_structure && (
                      <div className="glass-card p-6 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-on-surface">Storytelling Structure</h3>
                        <ProseBlock label="Hook" value={summary.storytelling_structure.hook} />
                        <ProseBlock label="Problem Setup" value={summary.storytelling_structure.problem_setup} />
                        <ProseBlock label="Solution" value={summary.storytelling_structure.solution} />
                        {summary.storytelling_structure.key_benefits?.length > 0 && (
                          <div>
                            <SectionLabel>Key Benefits</SectionLabel>
                            <div className="flex flex-wrap gap-2">
                              {summary.storytelling_structure.key_benefits.map((b, i) => <Tag key={i} color="cyan">{b}</Tag>)}
                            </div>
                          </div>
                        )}
                        <ProseBlock label="Call to Action" value={summary.storytelling_structure.call_to_action} />
                      </div>
                    )}

                    {/* Marketing */}
                    {summary.marketing_strategy && (
                      <div className="glass-card p-6 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-on-surface">Marketing Strategy</h3>
                        <InfoBlock label="Target Audience" value={summary.marketing_strategy.target_audience} />
                        {summary.marketing_strategy.emotional_triggers?.length > 0 && (
                          <div>
                            <SectionLabel>Emotional Triggers</SectionLabel>
                            <div className="flex flex-wrap gap-2">
                              {summary.marketing_strategy.emotional_triggers.map((t, i) => <Tag key={i} color="purple">{t}</Tag>)}
                            </div>
                          </div>
                        )}
                        {summary.marketing_strategy.persuasion_techniques?.length > 0 && (
                          <div>
                            <SectionLabel>Persuasion Techniques</SectionLabel>
                            <div className="flex flex-wrap gap-2">
                              {summary.marketing_strategy.persuasion_techniques.map((t, i) => <Tag key={i} color="amber">{t}</Tag>)}
                            </div>
                          </div>
                        )}
                        <InfoBlock label="Branding Strategy" value={summary.marketing_strategy.branding_strategy} />
                      </div>
                    )}

                    {/* Visual elements */}
                    {summary.visual_elements && (
                      <div className="glass-card p-6 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-on-surface">Visual Elements</h3>
                        <InfoBlock label="Color Grading" value={summary.visual_elements.color_grading} />
                        <InfoBlock label="Lighting Style" value={summary.visual_elements.lighting_style} />
                        <InfoBlock label="Branding" value={summary.visual_elements.branding} />
                        {summary.visual_elements.text_overlays?.length > 0 && (
                          <div>
                            <SectionLabel>Text Overlays</SectionLabel>
                            <div className="flex flex-wrap gap-2">
                              {summary.visual_elements.text_overlays.map((t, i) => <Tag key={i} color="outline">{t}</Tag>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scene timeline */}
                    {summary.scene_timeline?.length > 0 && (
                      <div className="flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-on-surface">Reference Scene Timeline</h3>
                        {summary.scene_timeline.map((scene, i) => (
                          <div key={i} className="glass-card p-5 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">{scene.timestamp}</span>
                              {scene.transition_type && <Tag color="outline">{scene.transition_type}</Tag>}
                            </div>
                            <ProseBlock label="Visual" value={scene.visual_description} />
                            <ProseBlock label="Camera" value={scene.camera_movement} />
                            {scene.voiceover && <ProseBlock label="Voiceover" value={scene.voiceover} mono />}
                            {scene.dialogue && <ProseBlock label="Dialogue" value={scene.dialogue} mono />}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── PRODUCT TAB ── */}
            {activeTab === 'product' && (
              <div className="glass-card p-6 flex flex-col gap-5">
                <h3 className="text-sm font-bold text-on-surface">Product Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoBlock label="Name" value={productDetails.product_name} />
                  <InfoBlock label="Brand" value={productDetails.brand} />
                  <InfoBlock label="Category" value={productDetails.category} />
                  <InfoBlock label="Price" value={productDetails.price} />
                  <div className="col-span-full">
                    <InfoBlock label="Description" value={productDetails.description} />
                  </div>
                </div>
                {productDetails.product_images?.length > 0 && (
                  <div>
                    <SectionLabel>Product Images</SectionLabel>
                    <div className="flex flex-wrap gap-3">
                      {productDetails.product_images.map((img, i) => (
                        <img
                          key={i}
                          src={`http://localhost:8000/${img}`}
                          alt={`Product ${i + 1}`}
                          className="w-24 h-24 rounded-xl object-cover border border-outline-variant"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── META TAB ── */}
            {activeTab === 'meta' && (
              <div className="glass-card p-6 flex flex-col gap-4">
                <h3 className="text-sm font-bold text-on-surface">Run Metadata</h3>
                <InfoBlock label="Run ID" value={runId} />
                <InfoBlock label="Source URL" value={url} />
                <InfoBlock label="Decision — Script?" value={project?.generate_script_human_decision} />
                <InfoBlock label="Decision — Product Source?" value={project?.product_details_source_decision} />
                {summary.camera_work?.length > 0 && (
                  <div>
                    <SectionLabel>Camera Work Analysis</SectionLabel>
                    <div className="flex flex-col gap-1.5">
                      {summary.camera_work.map((c, i) => (
                        <p key={i} className="text-xs text-on-surface-variant">• {c}</p>
                      ))}
                    </div>
                  </div>
                )}
                {summary.editing_techniques?.length > 0 && (
                  <div>
                    <SectionLabel>Editing Techniques Observed</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {summary.editing_techniques.map((t, i) => <Tag key={i} color="outline">{t}</Tag>)}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}

export default ProjectDetail
