/* ============================================================
   生辰日期选项工具
   ============================================================ */

export interface DateOption {
  value: number
  label: string
}

export function getYearOptions(years = 100): DateOption[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: years }, (_, i) => {
    const year = currentYear - i
    return { value: year, label: `${year}年` }
  })
}

export function getMonthOptions(): DateOption[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return { value: month, label: `${month}月` }
  })
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getDayOptions(year: number, month: number): DateOption[] {
  const days = getDaysInMonth(year, month)
  return Array.from({ length: days }, (_, i) => {
    const day = i + 1
    return { value: day, label: `${day}日` }
  })
}

export function clampDayToMonth(year: number, month: number, day: number): number {
  return Math.min(day, getDaysInMonth(year, month))
}
