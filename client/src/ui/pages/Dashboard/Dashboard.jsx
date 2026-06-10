import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import useAuth from '../../hooks/useAuth'
import api from '../../services/api'

// ── Icons ─────────────────────────────────────────────────────────────────────
const FilmIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/><line x1="2" y1="8" x2="5" y2="8"/>
    <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="8" x2="22" y2="8"/>
    <line x1="19" y1="12" x2="22" y2="12"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const ZapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.5 6h6l-4.8 4.1 1.9 6.4L12 15.9l-4.6 3.6 1.9-6.4L4.5 9h6z"/>
  </svg>
)
const BrainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
)
const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
)
const TiktokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
)

const statusColors = {
  with_script: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  without_script: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
}

const platforms = [
  { name: 'Instagram', icon: InstagramIcon, example: 'https://www.instagram.com/p/DExampleId123' },
  { name: 'YouTube',   icon: YoutubeIcon,   example: 'https://youtube.com/shorts/DExampleId123' },
  { name: 'TikTok',    icon: TiktokIcon,    example: 'https://www.tiktok.com/@user/video/DExampleId123' },
]

// ── Feature Highlights ────────────────────────────────────────────────────────
const features = [
  {
    title: 'AI Video Analysis',
    desc: 'Paste any ad URL and our engine instantly extracts scenes, pacing, camera movements, and dialogue.',
    icon: BrainIcon,
    color: 'purple'
  },
  {
    title: 'Cinematic Scripts',
    desc: 'Turn analyzed ad frameworks into production-ready cinematic scripts with professional formatting.',
    icon: SparkleIcon,
    color: 'cyan'
  },
  {
    title: 'Product Detection',
    desc: 'Automatically identify and catalog featured products directly from the reference video content.',
    icon: TargetIcon,
    color: 'purple'
  }
]

// ── Dashboard Page ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    setLoadingProjects(true)
    try {
      const res = await api.get('/agent/projects')
      setProjects(res.data)
    } catch { /* silently fail */ }
    finally { setLoadingProjects(false) }
  }

  const handleAnalyze = (e) => {
    e.preventDefault()
    if (!url.trim()) { setUrlError('Please enter a video URL.'); return }
    if (!url.startsWith('http')) { setUrlError('Please enter a valid URL starting with http/https.'); return }
    navigate(`/analyze/processing?url=${encodeURIComponent(url)}`)
  }

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="Dashboard" />

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* ── Welcome ── */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">
              Welcome back,{' '}
              <span className="text-gradient">{user?.name || user?.email?.split('@')[0] || 'User'}!</span>
            </h2>
            <p className="text-on-surface-variant mt-1 text-sm">
              Here's your workspace overview.
            </p>
          </div>

          {/* ── Feature Highlights ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-5 flex flex-col gap-3 hover:border-white/15 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                  ${feature.color === 'purple' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'}`}>
                  <feature.icon />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Main grid: Analyze hero + Recent Projects ── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* ── ANALYZE HERO (wider left) ── */}
            <div className="xl:col-span-2 glass-card p-6 flex flex-col gap-5">
              {/* Animated glow orb */}
              <div className="relative flex items-center gap-4">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 opacity-25 animate-pulse-glow" />
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-glow-purple text-white relative">
                    <ZapIcon />
                  </div>
                </div>
                <div>
                  <h3 className="text-on-surface font-bold text-base tracking-tight">Analyze a Video</h3>
                  <p className="text-on-surface-variant text-xs mt-0.5">Paste an ad URL to generate a cinematic script</p>
                </div>
              </div>

              {/* URL Form */}
              <form onSubmit={handleAnalyze} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-outline">Video URL</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                      <LinkIcon />
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
                      placeholder="https://www.instagram.com/p/..."
                      className={`w-full pl-10 pr-4 py-3 bg-surface-lowest border rounded-xl text-on-surface text-sm placeholder-outline outline-none transition-all duration-200
                        ${urlError ? 'border-error/50' : 'border-outline-variant focus:border-secondary'}`}
                    />
                  </div>
                  {urlError && <p className="text-xs text-error flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-error" />{urlError}</p>}
                </div>

                {/* Platform chips */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-mono text-outline uppercase tracking-widest">Supported Platforms</p>
                  <div className="flex gap-2 flex-wrap">
                    {platforms.map(({ name, icon: Icon, example }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => { setUrl(example); setUrlError('') }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-high border border-white/8
                          text-on-surface-variant text-xs font-medium hover:border-purple-500/30 hover:text-primary transition-all duration-200"
                      >
                        <Icon /> {name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl
                    bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm
                    hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  <ZapIcon /> Analyze Video
                </button>
              </form>

              {/* Pro tip */}
              <div className="flex gap-3 p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/15">
                <ZapIcon />
                <div>
                  <p className="text-xs text-purple-300 font-semibold mb-0.5">Pro Tip</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Use a 15–60 second ad video for best results. Our AI analyzes pacing, dialogue, and camera cuts.
                  </p>
                </div>
              </div>
            </div>

            {/* ── RECENT PROJECTS ── */}
            <div className="xl:col-span-3 glass-card flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <FilmIcon />
                  <h3 className="text-on-surface font-semibold text-sm">Recent Projects</h3>
                </div>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-xs text-purple-400 hover:text-primary font-medium transition-colors flex items-center gap-1"
                >
                  View All <ArrowRightIcon />
                </button>
              </div>

              <div className="flex flex-col divide-y divide-white/5 flex-1">
                {loadingProjects ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-on-surface-variant text-sm">
                    <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    Loading projects...
                  </div>
                ) : projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center text-outline">
                      <FilmIcon />
                    </div>
                    <p className="text-on-surface-variant text-sm">No projects yet</p>
                    <button
                      onClick={() => navigate('/analyze')}
                      className="text-purple-400 text-xs hover:text-primary font-medium transition-colors"
                    >
                      Create your first project →
                    </button>
                  </div>
                ) : (
                  projects.slice(0, 6).map((project) => (
                    <div
                      key={project.run_id}
                      onClick={() => navigate(`/projects/${project.run_id}`)}
                      className="flex items-center justify-between px-6 py-4 hover:bg-surface-high/50 transition-colors duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                          <FilmIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="text-on-surface text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {project.script_title || 'Untitled Project'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {project.product_name && (
                              <span className="text-xs text-on-surface-variant truncate max-w-[160px]">{project.product_name}</span>
                            )}
                            {project.scene_count > 0 && (
                              <span className="text-[10px] font-mono text-outline">{project.scene_count} scenes</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[10px] font-semibold font-mono px-2 py-1 rounded-full border uppercase tracking-wider ${statusColors[project.status] || statusColors.without_script}`}>
                          {project.status === 'with_script' ? 'Script' : 'Analysis'}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-outline group-hover:text-purple-400 transition-colors">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard
