import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import StepIndicator from '../../components/ui/StepIndicator'

// ── Icons ─────────────────────────────────────────────────────────────────────
const LinkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
)
const TiktokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
)
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const ZapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const platforms = [
  { name: 'Instagram', icon: InstagramIcon, example: 'https://www.instagram.com/p/...' },
  { name: 'YouTube', icon: YoutubeIcon, example: 'https://youtube.com/shorts/...' },
  { name: 'TikTok', icon: TiktokIcon, example: 'https://www.tiktok.com/@user/video/...' },
]

// ── Step 1: Enter URL ──────────────────────────────────────────────────────────
const AnalyzeStep1 = () => {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!url.trim()) {
      setError('Please enter a video URL.')
      return
    }
    if (!url.startsWith('http')) {
      setError('Please enter a valid URL starting with http/https.')
      return
    }
    // Pass URL to next step via query param
    navigate(`/analyze/processing?url=${encodeURIComponent(url)}`)
  }

  const setExample = (example) => {
    setUrl(example.replace('...', 'DExampleId123'))
    setError('')
  }

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="New Project" />

        <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-2xl flex flex-col gap-8 animate-slide-up">

            {/* Step indicator */}
            <StepIndicator current={1} />

            {/* Card */}
            <div className="glass-card p-8 flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
                    <LinkIcon />
                  </div>
                  <span className="label-mono text-purple-400 text-[10px]">Step 1 of 4</span>
                </div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">Enter Ad Video URL</h1>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  Paste the reference ad video URL to analyze and generate a script. We support major video platforms and direct links.
                </p>
              </div>

              {/* URL Input */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label-mono text-on-surface-variant text-[10px]">Video URL</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                      <LinkIcon />
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setError('') }}
                      placeholder="https://www.instagram.com/p/..."
                      className={`w-full pl-12 pr-4 py-4 bg-surface-lowest rounded-xl text-on-surface text-sm placeholder-outline outline-none transition-all duration-200
                        border ${error ? 'border-error/50 focus:border-error' : 'border-outline-variant focus:border-secondary'}
                      `}
                      style={{ boxShadow: 'none' }}
                      onFocus={(e) => e.target.style.boxShadow = error
                        ? '0 0 0 4px rgba(255,180,171,0.1)'
                        : '0 0 0 4px rgba(76,215,246,0.1)'}
                      onBlur={(e) => e.target.style.boxShadow = 'none'}
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-error flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Platform quick fill */}
                <div className="flex flex-col gap-2">
                  <p className="label-mono text-outline text-[10px]">Quick Fill — Supported Platforms</p>
                  <div className="flex gap-2 flex-wrap">
                    {platforms.map(({ name, icon: Icon, example }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setExample(example)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-high border border-white/8
                          text-on-surface-variant text-xs font-medium hover:border-purple-500/30 hover:text-primary
                          transition-all duration-200"
                      >
                        <Icon />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tips box */}
                <div className="flex gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/15">
                  <ZapIcon />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-purple-300 font-semibold">Pro Tip</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      For best results, use a 15–60 second ad video. Our AI analyzes pacing, dialogue, camera cuts, and emotion to generate a production-ready script.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
                    bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm
                    hover:shadow-glow-purple transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                >
                  Analyze Video
                  <ArrowRightIcon />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyzeStep1
