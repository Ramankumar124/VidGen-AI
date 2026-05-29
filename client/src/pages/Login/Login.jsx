import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setUserData, setLoader } from '../../redux/features/authSlice'
import useAuth from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import api from '../../services/api'
import { saveToken } from '../../utils/tokenHelper'

// ── Icon helpers ──────────────────────────────────────────────────────────────
const MailIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,12 2,6" />
  </svg>
)

const LockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const UserIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3 L13.5 9 L19.5 9 L14.7 13.1 L16.6 19.5 L12 15.9 L7.4 19.5 L9.3 13.1 L4.5 9 L10.5 9 Z" fill="currentColor" opacity="0.6" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ── Feature list for left panel ───────────────────────────────────────────────
const features = [
  'Deep video analysis with frame-level AI processing',
  'Cinematic script generation in seconds',
  'Multi-format export (PDF, Final Draft, JSON)',
  'Brand voice customization & tone matching',
]

// ── Main Login Page ───────────────────────────────────────────────────────────
const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, user } = useAuth()

  const [tab, setTab] = useState('login') // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  // Clear errors on tab switch
  useEffect(() => {
    setErrorMsg('')
    setFieldErrors({})
    setSuccessMsg('')
  }, [tab])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
    // Clear field error on type
    if (fieldErrors[id]) {
      setFieldErrors((prev) => ({ ...prev, [id]: '' }))
    }
  }

  const validateLogin = () => {
    const errs = {}
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    return errs
  }

  const validateRegister = () => {
    const errs = {}
    if (!formData.name || formData.name.length < 2) errs.name = 'Name must be at least 2 characters'
    if (!formData.email) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password || formData.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMsg('')
    setErrorMsg('')

    const errs = tab === 'login' ? validateLogin() : validateRegister()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    dispatch(setLoader(true))

    try {
      if (tab === 'login') {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        })
        
        if (response?.data?.data) {
          const token = response.data.data.access_token
          saveToken(token)
          dispatch(setUserData({ email: formData.email }))
          navigate('/dashboard')
        }
      } else {
        const response = await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
        
        if (response?.data?.data) {
          const token = response.data.data.access_token
          saveToken(token)
          dispatch(setUserData({ name: formData.name, email: formData.email }))
          setSuccessMsg('Account created! Redirecting...')
          setTimeout(() => navigate('/dashboard'), 1000)
        }
      }
    } catch (error) {
      setErrorMsg(
        error?.response?.data?.message || 
        error?.response?.data?.detail || 
        'An error occurred. Please try again.'
      )
    } finally {
      dispatch(setLoader(false))
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-lowest overflow-hidden">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/2 -right-20 w-80 h-80 rounded-full opacity-15 animate-float"
            style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-20 left-1/3 w-64 h-64 rounded-full opacity-10 animate-pulse-glow"
            style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', animationDelay: '1.5s' }}
          />
          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'radial-gradient(circle, #cbc3d7 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-glow-purple">
              <SparkleIcon />
            </div>
            <div>
              <span className="text-on-surface font-bold text-lg tracking-tight">AdScript</span>
              <span className="text-gradient font-bold text-lg tracking-tight ml-1">AI</span>
            </div>
          </div>
          <div className="mt-1">
            <span className="label-mono text-outline text-[10px]">Cinematic Intelligence Engine</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 w-fit">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-400 label-mono text-[10px]">AI-Powered Script Engine</span>
            </div>
            <h1 className="text-5xl font-bold text-on-surface leading-tight tracking-tight">
              Transform{' '}
              <span className="text-gradient">Reference Ads</span>
              {' '}Into Cinematic Scripts
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-md">
              Upload your reference video, let our deep learning models analyze the pacing, dialogue, and camera movements, then generate production-ready scripts in seconds.
            </p>
          </div>

          {/* Feature list */}
          <ul className="flex flex-col gap-3">
            {features.map((feat, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow-sm">
                  <CheckIcon />
                </div>
                <span className="text-on-surface-variant text-sm leading-relaxed">{feat}</span>
              </li>
            ))}
          </ul>

          {/* Stats bar */}
          <div className="flex items-center gap-8 pt-2 border-t border-white/8">
            {[
              { value: '10K+', label: 'Scripts Generated' },
              { value: '98%', label: 'Accuracy Rate' },
              { value: '<3s', label: 'Avg. Gen Time' },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <span className="text-2xl font-bold text-gradient">{stat.value}</span>
                <span className="label-mono text-outline text-[10px]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: 'linear-gradient(to top, #0e0e0e 0%, transparent 100%)' }}
        />
      </div>

      {/* ── Right Panel (Auth Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle gradient on right bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 60%)' }}
        />

        <div className="w-full max-w-md relative z-10 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <SparkleIcon />
            </div>
            <span className="text-on-surface font-bold">AdScript</span>
            <span className="text-gradient font-bold">AI</span>
          </div>

          {/* Card */}
          <div className="glass-card p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-on-surface tracking-tight">
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {tab === 'login'
                  ? 'Login to access your AI workspace'
                  : 'Start generating cinematic scripts today'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-surface-lowest rounded-lg">
              {['login', 'register'].map((t) => (
                <button
                  key={t}
                  id={`tab-${t}`}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all duration-200 capitalize ${
                    tab === t
                      ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-glow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {t === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Global server error */}
            {errorMsg && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-error-container/30 border border-error/20">
                <div className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0 mt-1.5" />
                <p className="text-sm text-error">{errorMsg}</p>
              </div>
            )}

            {/* Success message */}
            {successMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <CheckIcon />
                <p className="text-sm text-secondary">{successMsg}</p>
              </div>
            )}

            {/* Form */}
            <form id="auth-form" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {tab === 'register' && (
                <Input
                  id="name"
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  error={fieldErrors.name}
                  icon={UserIcon}
                  required
                  autoComplete="name"
                />
              )}

              <Input
                id="email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={fieldErrors.email}
                icon={MailIcon}
                required
                autoComplete="email"
              />

              <Input
                id="password"
                label="Password"
                type="password"
                placeholder={tab === 'register' ? 'Min. 8 characters' : '••••••••'}
                value={formData.password}
                onChange={handleChange}
                error={fieldErrors.password}
                icon={LockIcon}
                required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />

              {tab === 'register' && (
                <Input
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={fieldErrors.confirmPassword}
                  icon={LockIcon}
                  required
                  autoComplete="new-password"
                />
              )}

              {tab === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    id="forgot-password-btn"
                    className="text-xs text-on-surface-variant hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                id="auth-submit-btn"
                type="submit"
                variant="primary"
                loading={loading}
                fullWidth
                className="mt-1 py-3.5 text-base"
              >
                {loading
                  ? tab === 'login' ? 'Signing in…' : 'Creating account…'
                  : tab === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {/* Switch tab link */}
            <p className="text-center text-sm text-on-surface-variant">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                id="switch-tab-btn"
                onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
                className="text-primary hover:text-on-surface font-semibold transition-colors"
              >
                {tab === 'login' ? 'Register here' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Legal */}
          <p className="text-center text-xs text-outline mt-6 px-4">
            By continuing, you agree to our{' '}
            <span className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
            {' '}and{' '}
            <span className="text-on-surface-variant hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
