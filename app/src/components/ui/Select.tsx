/* ============================================================
   Select 组件
   ============================================================ */

import type { SelectHTMLAttributes } from 'react'

interface SelectOption {
  value: string | number
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  error?: string
}

export function Select({ label, options, error, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm text-text-secondary">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full px-4 py-2.5 rounded-xl
          bg-white/5 border border-white/10
          text-text
          focus:outline-none focus:border-star focus:ring-1 focus:ring-star/50
          transition-all duration-200
          appearance-none cursor-pointer
          ${error ? 'border-misfortune' : ''}
          ${className}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '20px',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-night text-text">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-sm text-misfortune">{error}</span>}
    </div>
  )
}
