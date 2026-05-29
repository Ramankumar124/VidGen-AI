import React from 'react'
import useAuth from '../../hooks/useAuth'

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const DashboardHeader = ({ title = 'Dashboard' }) => {
  const { user } = useAuth()

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-white/8 bg-surface-lowest/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-lg font-semibold text-on-surface tracking-tight">{title}</h1>
        <p className="text-xs text-outline font-mono uppercase tracking-widest">AI Workspace</p>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Status pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-cyan-400 text-xs font-mono font-medium">AI Engine Active</span>
        </div>

        {/* Notification
        <button className="relative w-9 h-9 rounded-xl bg-surface-high border border-white/8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-highest transition-all duration-200">
          <BellIcon />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
        </button> */}

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-glow-sm cursor-pointer">
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
