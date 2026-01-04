/* ============================================================
   全局状态管理
   ============================================================ */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FunctionalAstrolabe } from '@/lib/astro'
import type { BirthInfo } from '@/lib/astro'

/* ------------------------------------------------------------
   命盘状态
   ------------------------------------------------------------ */

interface ChartState {
  birthInfo: BirthInfo | null
  chart: FunctionalAstrolabe | null
  setBirthInfo: (info: BirthInfo) => void
  setChart: (chart: FunctionalAstrolabe) => void
  clear: () => void
}

export const useChartStore = create<ChartState>()((set) => ({
  birthInfo: null,
  chart: null,
  setBirthInfo: (info) => set({ birthInfo: info }),
  setChart: (chart) => set({ chart }),
  clear: () => set({ birthInfo: null, chart: null }),
}))

/* ------------------------------------------------------------
   设置状态
   ------------------------------------------------------------ */

interface SettingsState {
  apiKey: string
  model: 'kimi' | 'gemini' | 'claude' | 'deepseek' | 'custom'
  customEndpoint: string
  setApiKey: (key: string) => void
  setModel: (model: SettingsState['model']) => void
  setCustomEndpoint: (endpoint: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'kimi',
      customEndpoint: '',
      setApiKey: (key) => set({ apiKey: key }),
      setModel: (model) => set({ model }),
      setCustomEndpoint: (endpoint) => set({ customEndpoint: endpoint }),
    }),
    {
      name: 'ziwei-settings',
    }
  )
)
