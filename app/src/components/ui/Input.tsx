/* ============================================================
   Input 组件 - 高级玻璃态风格
   ============================================================ */

import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm text-text-secondary font-medium"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-white/[0.04] backdrop-blur-sm
            border border-white/[0.08]
            text-text placeholder:text-text-muted/60
            transition-all duration-200
            focus:outline-none focus:bg-white/[0.06]
            focus:border-star/50 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]
            hover:bg-white/[0.06] hover:border-white/[0.12]
            ${error ? 'border-misfortune/50 focus:border-misfortune focus:shadow-[0_0_0_3px_rgba(248,113,113,0.1)]' : ''}
            ${className}
          `}
          {...props}
        />
        {/* 底部发光线 */}
        <div
          className="
            absolute bottom-0 left-1/2 -translate-x-1/2
            w-0 h-px rounded-full
            bg-gradient-to-r from-star via-star-light to-star
            transition-all duration-300
            peer-focus:w-1/2
          "
        />
      </div>
      {hint && !error && (
        <span className="text-xs text-text-muted">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-misfortune flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </span>
      )}
    </div>
  )
}
