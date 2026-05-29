import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import DashboardHeader from '../../components/shared/DashboardHeader'
import api from '../../services/api'

const ScriptIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>)
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>)
const ArrowRightIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>)
const LinkIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>)
const CalendarIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)
const PlusIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)
const FilmIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/></svg>)

const StatusBadge = ({ status }) => {
  const isScript = status === 'with_script'
  return (
    <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${isScript ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20'}`}>
      {isScript ? 'Script Ready' : 'Analysis Only'}
    </span>
  )
}

const ProjectCard = ({ project, onClick }) => {
  const createdAt = project.created_at
    ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null
  const displayUrl = project.url ? project.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 38) + (project.url.length > 48 ? '…' : '') : null

  return (
    <div onClick={onClick} className="glass-card p-5 flex flex-col gap-4 cursor-pointer group hover:border-purple-500/30 hover:shadow-glow-sm transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
          <ScriptIcon />
        </div>
        <StatusBadge status={project.status} />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-on-surface font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {project.script_title || 'Untitled Project'}
        </h3>
        {project.product_name && <p className="text-xs text-on-surface-variant truncate">{project.product_name}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        {displayUrl && (
          <div className="flex items-center gap-1.5 text-outline">
            <LinkIcon /><span className="text-[10px] font-mono truncate">{displayUrl}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {project.scene_count > 0 && <span className="text-[10px] font-mono text-outline">{project.scene_count} scenes</span>}
            {createdAt && <span className="flex items-center gap-1 text-[10px] text-outline"><CalendarIcon /> {createdAt}</span>}
          </div>
          <span className="text-purple-400 group-hover:translate-x-0.5 transition-transform"><ArrowRightIcon /></span>
        </div>
      </div>
    </div>
  )
}

const ProjectsPage = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/agent/projects').then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q || (p.script_title || '').toLowerCase().includes(q) || (p.product_name || '').toLowerCase().includes(q) || (p.url || '').toLowerCase().includes(q)
    return matchSearch && (filter === 'all' || p.status === filter)
  })

  return (
    <div className="min-h-screen flex bg-surface-lowest text-on-surface">
      <Sidebar onNewProject={() => navigate('/analyze')} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader title="My Projects" />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-slide-up">

            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-on-surface tracking-tight">My Projects</h1>
                <p className="text-on-surface-variant text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
              </div>
              <button onClick={() => navigate('/analyze')} className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:shadow-glow-purple transition-all">
                <PlusIcon /> New Project
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"><SearchIcon /></span>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-low border border-outline-variant rounded-xl text-on-surface text-sm placeholder-outline outline-none focus:border-secondary transition-colors" />
              </div>
              <div className="flex gap-1 bg-surface-high/50 p-1 rounded-xl border border-white/8">
                {[{ id: 'all', label: 'All' }, { id: 'with_script', label: 'With Script' }, { id: 'without_script', label: 'Analysis Only' }].map(f => (
                  <button key={f.id} onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f.id ? 'bg-surface-highest text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  <p className="text-on-surface-variant text-sm">Loading projects...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-high flex items-center justify-center text-outline"><FilmIcon /></div>
                <div>
                  <p className="text-on-surface font-semibold">{search || filter !== 'all' ? 'No projects match your filters' : 'No projects yet'}</p>
                  <p className="text-on-surface-variant text-sm mt-1">{search || filter !== 'all' ? 'Try adjusting your search or filter' : 'Analyze a video to create your first project'}</p>
                </div>
                {!search && filter === 'all' && (
                  <button onClick={() => navigate('/analyze')} className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm hover:shadow-glow-purple transition-all">
                    <PlusIcon /> Create First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => <ProjectCard key={p.run_id} project={p} onClick={() => navigate(`/projects/${p.run_id}`)} />)}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProjectsPage
