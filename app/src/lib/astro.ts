/* ============================================================
   iztro 排盘引擎封装
   ============================================================ */

import { astro } from 'iztro'
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'

export type Gender = 'male' | 'female'

export interface BirthInfo {
  year: number
  month: number
  day: number
  hour: number
  gender: Gender
  isLeapMonth?: boolean
  fixLeap?: boolean
}

/* ------------------------------------------------------------
   时辰索引转换
   ------------------------------------------------------------ */

function hourToTimeIndex(hour: number): number {
  // iztro 使用 0-12 的时辰索引
  // 0=子时(23-01), 1=丑时(01-03), ..., 12=子时(特殊)
  if (hour === 23 || hour === 0) return 0
  return Math.floor((hour + 1) / 2)
}

/* ------------------------------------------------------------
   生成命盘
   ------------------------------------------------------------ */

export function generateChart(info: BirthInfo): FunctionalAstrolabe {
  const { year, month, day, hour, gender, fixLeap = true } = info

  const dateStr = `${year}-${month}-${day}`
  const timeIndex = hourToTimeIndex(hour)
  const genderName = gender === 'male' ? '男' : '女'

  return astro.bySolar(dateStr, timeIndex, genderName, fixLeap)
}

/* ------------------------------------------------------------
   时辰选项
   ------------------------------------------------------------ */

const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

export function hourToShichen(hour: number): string {
  const index = Math.floor(((hour + 1) % 24) / 2)
  return SHICHEN_NAMES[index] + '时'
}

export function getShichenOptions() {
  return SHICHEN_NAMES.map((name, index) => {
    const startHour = index === 0 ? 23 : (index * 2 - 1)
    const endHour = index === 0 ? 1 : (index * 2 + 1)
    const label = index === 0
      ? `${name}时 (23:00-00:59)`
      : `${name}时 (${String(startHour).padStart(2, '0')}:00-${String(endHour).padStart(2, '0')}:59)`
    return {
      value: index === 0 ? 23 : index * 2,
      label,
    }
  })
}

/* ------------------------------------------------------------
   导出类型
   ------------------------------------------------------------ */

export type { FunctionalAstrolabe }
