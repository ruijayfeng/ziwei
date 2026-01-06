/* ============================================================
   Button 组件 - 高级渐变风格
   ============================================================ */

import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    relative inline-flex items-center justify-center
    font-medium transition-all duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-star/50 focus-visible:ring-offset-2 focus-visible:ring-offset-night
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    overflow-hidden
  `

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-star to-star-dark
      text-white rounded-xl
      shadow-[0_4px_20px_rgba(124,58,237,0.3)]
      hover:shadow-[0_6px_28px_rgba(124,58,237,0.4)]
      hover:from-star-light hover:to-star
      active:scale-[0.98]
    `,
    secondary: `
      bg-white/[0.06] backdrop-blur-sm
      border border-white/[0.1] rounded-xl
      text-text
      hover:bg-white/[0.1] hover:border-white/[0.15]
      active:scale-[0.98]
    `,
    ghost: `
      text-text-secondary rounded-lg
      hover:bg-white/[0.06] hover:text-text
      active:scale-[0.98]
    `,
    gold: `
      bg-gradient-to-r from-gold to-gold-dark
      text-night font-semibold rounded-xl
      shadow-[0_4px_20px_rgba(212,175,55,0.3)]
      hover:shadow-[0_6px_28px_rgba(212,175,55,0.4)]
      hover:from-gold-light hover:to-gold
      active:scale-[0.98]
    `,
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {/* 悬浮光效层 */}
      <span
        className="
          absolute inset-0 opacity-0
          bg-gradient-to-r from-white/0 via-white/20 to-white/0
          -translate-x-full
          group-hover:translate-x-full group-hover:opacity-100
          transition-all duration-500 ease-out
          pointer-events-none
        "
      />
      {/* 内容 */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  )
}
