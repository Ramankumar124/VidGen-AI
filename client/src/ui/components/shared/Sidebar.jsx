import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { removeUserData } from '../../redux/features/authSlice'
import { removeToken } from '../../utils/tokenHelper'
import useAuth from '../../hooks/useAuth'

// ── Icons ─────────────────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
    <path d="M12 3l1.5 6h6l-4.8 4.1 1.9 6.4L12 15.9l-4.6 3.6 1.9-6.4L4.5 9h6z" fill="white" opacity="0.9"/>
  </svg>
)
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
)
const ProjectsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
)
const InventoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  </svg>
)
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const SupportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const navItems = [
  { label: 'Dashboard', icon: DashboardIcon, to: '/dashboard' },
  { label: 'My Projects', icon: ProjectsIcon, to: '/projects' },
  { label: 'Product Inventory', icon: InventoryIcon, to: '/inventory' },
  // { label: 'Settings', icon: SettingsIcon, to: '/settings' },
]

const Sidebar = ({ onNewProject }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLogout = () => {
    dispatch(removeUserData())
    removeToken()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-surface-low border-r border-white/8 relative flex-shrink-0">
      {/* Subtle purple glow top-left */}
      <div
        className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <SparkleIcon />
          </div>
          <div className="flex flex-col">
            <span className="text-on-surface font-bold text-base leading-tight tracking-tight">ScriptAI</span>
            <span className="text-outline text-[9px] font-mono uppercase tracking-widest leading-tight">Premium AI Engine</span>
          </div>
        </div>
      </div>

      {/* New Project CTA */}
      <div className="px-4 pb-6">
        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-semibold text-sm
            bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-cyan-500
            shadow-glow-sm transition-all duration-300 hover:shadow-glow-purple"
        >
          <PlusIcon />
          New Project
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-purple-500/20 text-primary border border-purple-500/30 shadow-glow-sm'
                : 'text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-primary' : ''}><Icon /></span>
                {label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6 flex flex-col gap-1 border-t border-white/8 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-error/10 hover:text-error transition-all duration-200 w-full text-left"
        >
          <LogoutIcon />
          Logout
        </button>

        {/* User pill */}
        {user?.email && (
          <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-high border border-white/8">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {user.email[0].toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-on-surface text-xs font-medium truncate">{user.name || 'User'}</span>
              <span className="text-outline text-[10px] truncate">{user.email}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
