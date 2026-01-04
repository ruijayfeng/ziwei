/* ============================================================
   Input 组件
   ============================================================ */

import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5 rounded-xl
          bg-white/5 border border-white/10
          text-text placeholder:text-text-muted
          focus:outline-none focus:border-star focus:ring-1 focus:ring-star/50
          transition-all duration-200
          ${error ? 'border-misfortune' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-sm text-misfortune">{error}</span>}
    </div>
  )
}
