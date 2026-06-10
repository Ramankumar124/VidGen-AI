import React from 'react'

// Spinner component for loading states
const Spinner = ({ size = 'sm', color = 'white' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  }
  const colors = {
    white: 'border-white/20 border-t-white',
    purple: 'border-purple-500/20 border-t-purple-500',
    cyan: 'border-cyan-500/20 border-t-cyan-500',
  }
  return (
    <div
      className={`rounded-full animate-spin ${sizes[size]} ${colors[color]}`}
      aria-label="Loading"
    />
  )
}

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = '',
  id,
  ...props
}) => {
  const isDisabled = disabled || loading

  const baseClasses = `
    relative inline-flex items-center justify-center gap-2
    font-semibold text-sm tracking-wide
    rounded-lg transition-all duration-300 cursor-pointer
    focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50
    select-none
    ${fullWidth ? 'w-full' : ''}
    ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}
  `

  const variants = {
    primary: `
      px-6 py-3 text-white
      bg-gradient-to-r from-purple-500 to-cyan-500
      hover:shadow-glow-purple hover:scale-[1.02] active:scale-[0.98]
      disabled:hover:scale-100 disabled:hover:shadow-none
    `,
    secondary: `
      px-6 py-3 text-on-surface
      bg-surface-high border border-white/15
      hover:bg-surface-highest hover:border-white/25 active:scale-[0.98]
    `,
    ghost: `
      px-4 py-2 text-on-surface-variant
      hover:text-primary hover:bg-surface-high
    `,
  }

  return (
    <button
      id={id}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" color="white" />}
      {children}
    </button>
  )
}

export default Button
