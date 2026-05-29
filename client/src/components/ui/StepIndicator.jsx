// Shared step indicator used across all 4 analysis steps
import React from 'react'

const steps = [
  { num: 1, label: 'Analyze Video' },
  { num: 2, label: 'AI Processing' },
  { num: 3, label: 'Select Products' },
  { num: 4, label: 'Script Editor' },
]

const StepIndicator = ({ current }) => (
  <div className="flex items-center gap-0 w-full max-w-2xl mx-auto">
    {steps.map((step, i) => {
      const isDone = step.num < current
      const isActive = step.num === current
      const isUpcoming = step.num > current

      return (
        <React.Fragment key={step.num}>
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            {/* Circle */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
              ${isDone ? 'bg-gradient-to-br from-purple-500 to-cyan-500 border-transparent text-white shadow-glow-sm' : ''}
              ${isActive ? 'bg-surface-high border-purple-500 text-purple-400 shadow-glow-sm' : ''}
              ${isUpcoming ? 'bg-surface-high border-outline-variant text-outline' : ''}
            `}>
              {isDone ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : step.num}
            </div>
            {/* Label */}
            <span className={`text-[10px] font-mono uppercase tracking-wider whitespace-nowrap
              ${isActive ? 'text-purple-400' : isDone ? 'text-cyan-400' : 'text-outline'}
            `}>
              {step.label}
            </span>
          </div>

          {/* Connector line (not after last) */}
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-5 transition-all duration-500
              ${isDone ? 'bg-gradient-to-r from-purple-500 to-cyan-500' : 'bg-outline-variant/40'}
            `} />
          )}
        </React.Fragment>
      )
    })}
  </div>
)

export default StepIndicator
