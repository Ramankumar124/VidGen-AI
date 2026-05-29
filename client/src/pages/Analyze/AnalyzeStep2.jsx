import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import StepIndicator from '../../components/ui/StepIndicator'
import api from '../../services/api'

// ── Analysis sub-tasks shown while processing ─────────────────────────────────
const analysisTasks = [
  { id: 'structural', label: 'Structural Synthesis', desc: 'Mapping narrative arcs in real-time' },
  { id: 'visual', label: 'Visual Pattern Recognition', desc: 'Detecting scene cuts & camera motions' },
  { id: 'audio', label: 'Audio Transcription', desc: 'Extracting dialogue & voice tone' },
  { id: 'sentiment', label: 'Sentiment Analysis', desc: 'Identifying emotional pacing & hooks' },
  { id: 'script', label: 'Script Generation', desc: 'Synthesizing cinematic output' },
]

// ── AI pulsing orb ────────────────────────────────────────────────────────────
const AIOrb = () => (
  <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
    {/* Outer ring */}
    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-spin-slow" />
    {/* Mid ring */}
    <div className="absolute inset-3 rounded-full border border-cyan-500/30 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '5s' }} />
    {/* Glow blob */}
    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-purple-500/40 to-cyan-500/30 animate-pulse-glow blur-sm" />
    {/* Center icon */}
    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shadow-glow-purple">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
      </svg>
    </div>
  </div>
)

// ── Step 2: AI Processing ─────────────────────────────────────────────────────
const AnalyzeStep2 = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const url = searchParams.get('url') || ''
  const runIdRef = useRef(null)

  const [completedTasks, setCompletedTasks] = useState([])
  const [currentTaskIdx, setCurrentTaskIdx] = useState(0)
  const [status, setStatus] = useState('running') // running | needs_input | done | error
  const [interrupt, setInterrupt] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // ── Start agent on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (!url) {
      navigate('/analyze')
      return
    }
    startAgent()
  }, [])

  const startAgent = async () => {
    try {
      const response = await api.post('/agent/run', url, {
        headers: { 'Content-Type': 'application/json' }
      })
      const { run_id, status: agentStatus, interrupt: agentInterrupt, data } = response.data
      runIdRef.current = run_id
      console.log('agent data',response.data);
      

      if (agentStatus === 'waiting' && agentInterrupt) {
        // Agent needs user input (product selection step)
        setStatus('needs_input')
        setInterrupt(agentInterrupt)
        // Animate tasks as done quickly, then navigate
        simulateTaskProgress(() => {
          navigate(`/analyze/products?run_id=${run_id}&interrupt=${encodeURIComponent(JSON.stringify(agentInterrupt))}`)
        })
      } else if (agentStatus === 'completed') {
        setStatus('done')
        simulateTaskProgress(() => {
          navigate(`/analyze/script?run_id=${run_id}&data=${encodeURIComponent(JSON.stringify(data))}`)
        })
      }
    } catch (error) {
      console.log(error);
      setStatus('error')
      setErrorMsg(
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        'Analysis failed. Please try again.'
      )
    }
  }

  // Animate task completion for UX feedback
  const simulateTaskProgress = (onComplete) => {
    let idx = 0
    const interval = setInterval(() => {
      setCurrentTaskIdx(idx)
      setCompletedTasks((prev) => [...prev, analysisTasks[idx]?.id])
      idx++
      if (idx >= analysisTasks.length) {
        clearInterval(interval)
        setTimeout(onComplete, 600)
      }
    }, 700)
  }

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />

      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="Analyzing Video" />

        <main className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-2xl flex flex-col gap-8 animate-slide-up">
            <StepIndicator current={2} />

            <div className="glass-card p-8 flex flex-col gap-8">
              {/* AI Orb + headline */}
              <div className="flex flex-col items-center gap-4 text-center">
                <AIOrb />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="label-mono text-cyan-400 text-[10px]">Deep Learning Models Engaged</span>
                  </div>
                  <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                    {status === 'error' ? 'Analysis Failed' : 'Analyzing video...'}
                  </h2>
                  {url && (
                    <p className="text-on-surface-variant text-xs truncate max-w-sm">
                      {decodeURIComponent(url)}
                    </p>
                  )}
                </div>
              </div>

              {/* Error state */}
              {status === 'error' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-error/5 border border-error/20 w-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-error">{errorMsg}</p>
                  </div>
                  <button
                    onClick={() => navigate('/analyze')}
                    className="flex items-center gap-2 py-2.5 px-6 rounded-xl border border-white/15 text-on-surface-variant text-sm font-semibold hover:bg-surface-high transition-all duration-200"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Task progress list */}
              {status !== 'error' && (
                <div className="flex flex-col gap-3">
                  {analysisTasks.map((task, i) => {
                    const isDone = completedTasks.includes(task.id)
                    const isActive = i === currentTaskIdx && !isDone

                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-500
                          ${isDone ? 'bg-cyan-500/5 border-cyan-500/20' : ''}
                          ${isActive ? 'bg-purple-500/8 border-purple-500/25' : ''}
                          ${!isDone && !isActive ? 'bg-surface-high/30 border-white/5' : ''}
                        `}
                      >
                        {/* Status icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                          ${isDone ? 'bg-cyan-500/15 text-cyan-400' : ''}
                          ${isActive ? 'bg-purple-500/15 text-purple-400' : ''}
                          ${!isDone && !isActive ? 'bg-surface-high text-outline' : ''}
                        `}>
                          {isDone ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : isActive ? (
                            <div className="w-3 h-3 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-outline-variant" />
                          )}
                        </div>

                        {/* Labels */}
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <span className={`text-sm font-semibold ${isDone ? 'text-cyan-300' : isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                            {task.label}
                          </span>
                          <span className="text-xs text-outline">{task.desc}</span>
                        </div>

                        {/* Shimmer progress bar for active */}
                        {isActive && (
                          <div className="w-24 h-1 bg-surface-highest rounded-full overflow-hidden flex-shrink-0">
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                          </div>
                        )}
                        {isDone && (
                          <span className="label-mono text-[9px] text-cyan-400 flex-shrink-0">Done</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Footer note */}
              {status === 'running' && (
                <p className="text-center text-xs text-outline">
                  This usually takes 15–30 seconds. Please don't close this tab.
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyzeStep2
