/* ============================================================
   全局状态管理
   ============================================================ */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FunctionalAstrolabe } from '@/lib/astro'
import type { BirthInfo } from '@/lib/astro'
import type { LifetimeKLinePoint } from '@/lib/fortune-score'

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
  clear: () => {
    set({ birthInfo: null, chart: null })
    // 同时清除内容缓存
    useContentCacheStore.getState().clearAll()
  },
}))

/* ------------------------------------------------------------
   内容缓存状态 (AI解读、K线等)
   ------------------------------------------------------------ */

interface KLineCache {
  lifetime: LifetimeKLinePoint[]  // 1-100 岁完整数据
  isGenerating: boolean           // 是否正在生成 reason
}

interface ContentCacheState {
  // AI 命盘解读
  aiInterpretation: string | null
  setAiInterpretation: (content: string) => void

  // 年度运势解读 (按年份缓存)
  yearlyFortune: Record<number, string>
  setYearlyFortune: (year: number, content: string) => void

  // K 线数据
  klineCache: KLineCache | null
  setKlineCache: (cache: KLineCache) => void
  updateKlineReasons: (reasons: { age: number; reason: string }[]) => void
  setKlineGenerating: (isGenerating: boolean) => void

  // 清除所有缓存
  clearAll: () => void
}

export const useContentCacheStore = create<ContentCacheState>()((set) => ({
  aiInterpretation: null,
  yearlyFortune: {},
  klineCache: null,

  setAiInterpretation: (content) => set({ aiInterpretation: content }),

  setYearlyFortune: (year, content) => set((state) => ({
    yearlyFortune: { ...state.yearlyFortune, [year]: content },
  })),

  setKlineCache: (cache) => set({ klineCache: cache }),

  updateKlineReasons: (reasons) => set((state) => {
    if (!state.klineCache) return state
    const updatedLifetime = state.klineCache.lifetime.map(point => {
      const found = reasons.find(r => r.age === point.age)
      return found ? { ...point, reason: found.reason } : point
    })
    return {
      klineCache: {
        ...state.klineCache,
        lifetime: updatedLifetime,
        isGenerating: false,
      },
    }
  }),

  setKlineGenerating: (isGenerating) => set((state) => {
    if (!state.klineCache) return state
    return {
      klineCache: { ...state.klineCache, isGenerating },
    }
  }),

  clearAll: () => set({
    aiInterpretation: null,
    yearlyFortune: {},
    klineCache: null,
  }),
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
  enableWebSearch: boolean   // 启用联网搜索
  searchApiKey: string       // 第三方搜索 API (Tavily)

  setProvider: (provider: ModelProvider) => void
  updateCurrentProvider: (settings: Partial<ProviderSettings>) => void
  setEnableThinking: (enable: boolean) => void
  setEnableWebSearch: (enable: boolean) => void
  setSearchApiKey: (key: string) => void

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
      enableWebSearch: false,
      searchApiKey: '',

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
      setEnableWebSearch: (enable) => set({ enableWebSearch: enable }),
      setSearchApiKey: (key) => set({ searchApiKey: key }),

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
