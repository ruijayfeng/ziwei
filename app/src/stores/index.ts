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

type ModelProvider = 'kimi' | 'gemini' | 'claude' | 'deepseek' | 'custom'

interface ProviderSettings {
  apiKey: string
  customBaseUrl: string
  customModel: string
}

const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  apiKey: '',
  customBaseUrl: '',
  customModel: '',
}

interface SettingsState {
  provider: ModelProvider
  providerSettings: Record<ModelProvider, ProviderSettings>
  enableThinking: boolean

  setProvider: (provider: ModelProvider) => void
  updateCurrentProvider: (settings: Partial<ProviderSettings>) => void
  setEnableThinking: (enable: boolean) => void

  // 便捷访问当前厂商配置
  getCurrentSettings: () => ProviderSettings
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      provider: 'kimi',
      providerSettings: {
        kimi: { ...DEFAULT_PROVIDER_SETTINGS },
        gemini: { ...DEFAULT_PROVIDER_SETTINGS },
        claude: { ...DEFAULT_PROVIDER_SETTINGS },
        deepseek: { ...DEFAULT_PROVIDER_SETTINGS },
        custom: { ...DEFAULT_PROVIDER_SETTINGS },
      },
      enableThinking: false,

      setProvider: (provider) => set({ provider }),

      updateCurrentProvider: (settings) => set((state) => ({
        providerSettings: {
          ...state.providerSettings,
          [state.provider]: {
            ...state.providerSettings[state.provider],
            ...settings,
          },
        },
      })),

      setEnableThinking: (enable) => set({ enableThinking: enable }),

      getCurrentSettings: () => {
        const state = get()
        return state.providerSettings[state.provider]
      },
    }),
    {
      name: 'ziwei-settings',
    }
  )
)
