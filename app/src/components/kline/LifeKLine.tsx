/* ============================================================
   人生 K 线 - 主组件
   ============================================================

   三种时间维度:
   - 大限 (10年): 人生全貌
   - 三年 (年度): 当前 + 未来3年
   - 当月 (月度): 选定年份12个月
   ============================================================ */

import { useState, useMemo, useCallback, useRef } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { CandlestickChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartStore, useSettingsStore, useContentCacheStore } from '@/stores'
import { EventCard } from './EventCard'
import { ScoreRadar } from './ScoreRadar'
import {
  generateDecadalKLines,
  generateYearlyKLines,
  generateMonthlyKLines,
  type KLineData,
  type EventData,
} from '@/lib/fortune-score'
import { streamChat, type LLMConfig } from '@/lib/llm'

// 注册 ECharts 组件
echarts.use([
  CandlestickChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
  CanvasRenderer,
])

/* ============================================================
   类型定义
   ============================================================ */

type ViewMode = 'decadal' | 'yearly' | 'monthly'

/* ============================================================
   主组件
   ============================================================ */

export function LifeKLine() {
  const { chart, birthInfo } = useChartStore()
  const { provider, getCurrentSettings, enableThinking, enableWebSearch, searchApiKey } = useSettingsStore()
  const { klineCache, klineEvents, setKlineCache, setKlineEvent } = useContentCacheStore()

  const [viewMode, setViewMode] = useState<ViewMode>('decadal')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedPeriod, setSelectedPeriod] = useState<KLineData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const chartRef = useRef<ReactEChartsCore>(null)

  // 构建 LLM 配置
  const llmConfig: LLMConfig = useMemo(() => {
    const settings = getCurrentSettings()
    return {
      provider,
      apiKey: settings.apiKey,
      baseUrl: settings.customBaseUrl || undefined,
      model: settings.customModel || undefined,
      enableThinking,
      enableWebSearch,
      searchApiKey,
    }
  }, [provider, getCurrentSettings, enableThinking, enableWebSearch, searchApiKey])

  /* ------------------------------------------------------------
     生成 K 线数据
     ------------------------------------------------------------ */

  const generateKLines = useCallback(() => {
    if (!chart) return

    setIsGenerating(true)

    const decadal = generateDecadalKLines(chart)
    const yearly = generateYearlyKLines(chart)
    const monthly: Record<number, KLineData[]> = {}

    // 预生成当前年和未来3年的月度数据
    const currentYear = new Date().getFullYear()
    for (let y = currentYear; y <= currentYear + 3; y++) {
      monthly[y] = generateMonthlyKLines(chart, y)
    }

    // 保存到全局缓存
    setKlineCache({
      decadal,
      yearly,
      monthly,
    })

    setIsGenerating(false)
  }, [chart, setKlineCache])

  /* ------------------------------------------------------------
     当前显示的 K 线数据
     ------------------------------------------------------------ */

  const currentKLines = useMemo(() => {
    if (!klineCache) return []

    switch (viewMode) {
      case 'decadal':
        return klineCache.decadal
      case 'yearly':
        return klineCache.yearly
      case 'monthly':
        return klineCache.monthly[selectedYear] || []
      default:
        return []
    }
  }, [klineCache, viewMode, selectedYear])

  /* ------------------------------------------------------------
     ECharts 配置
     ------------------------------------------------------------ */

  const chartOption = useMemo(() => {
    if (currentKLines.length === 0) return {}

    const categories = currentKLines.map(k => k.period)
    const ohlcData = currentKLines.map(k => [k.open, k.close, k.low, k.high])

    // 标记点: 最高和最低
    const maxIdx = currentKLines.reduce((max, k, i) =>
      k.close > currentKLines[max].close ? i : max, 0)
    const minIdx = currentKLines.reduce((min, k, i) =>
      k.close < currentKLines[min].close ? i : min, 0)

    return {
      backgroundColor: 'transparent',
      grid: {
        left: '8%',
        right: '8%',
        top: '12%',
        bottom: '18%',
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        axisLabel: {
          color: 'rgba(255,255,255,0.6)',
          fontSize: 11,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: {
          color: 'rgba(255,255,255,0.4)',
          fontSize: 10,
        },
        splitLine: {
          lineStyle: { color: 'rgba(255,255,255,0.05)' },
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,15,35,0.95)',
        borderColor: 'rgba(124,58,237,0.3)',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        formatter: (params: unknown[]) => {
          const p = params[0] as { name: string; data: number[] }
          const [open, close, low, high] = p.data
          const trend = close >= open ? '↑' : '↓'
          const color = close >= open ? '#22c55e' : '#ef4444'
          return `
            <div style="font-family: var(--font-serif);">
              <div style="font-size: 14px; margin-bottom: 8px;">${p.name}</div>
              <div style="color: ${color}; font-size: 20px; font-weight: bold;">
                ${Math.round(close)} ${trend}
              </div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 6px;">
                高 ${Math.round(high)} · 低 ${Math.round(low)}
              </div>
            </div>
          `
        },
      },
      series: [
        {
          name: '运势',
          type: 'candlestick',
          data: ohlcData,
          itemStyle: {
            color: '#22c55e',       // 涨 (close > open)
            color0: '#ef4444',      // 跌 (close < open)
            borderColor: '#22c55e',
            borderColor0: '#ef4444',
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 8,
            data: [
              {
                name: '最高',
                coord: [categories[maxIdx], currentKLines[maxIdx].high],
                itemStyle: { color: '#fbbf24' },
              },
              {
                name: '最低',
                coord: [categories[minIdx], currentKLines[minIdx].low],
                itemStyle: { color: '#8b5cf6' },
              },
            ],
            label: { show: false },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: 'rgba(212,175,55,0.3)',
              type: 'dashed',
            },
            data: [
              { yAxis: 60, name: '吉' },
              { yAxis: 40, name: '凶' },
            ],
            label: {
              color: 'rgba(255,255,255,0.3)',
              fontSize: 10,
            },
          },
        },
        // 趋势线
        {
          name: '趋势',
          type: 'line',
          data: currentKLines.map(k => k.close),
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: 'rgba(124,58,237,0.5)',
            width: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(124,58,237,0.2)' },
              { offset: 1, color: 'rgba(124,58,237,0)' },
            ]),
          },
        },
      ],
    }
  }, [currentKLines])

  /* ------------------------------------------------------------
     图表点击事件
     ------------------------------------------------------------ */

  const onChartClick = useCallback((params: { dataIndex?: number }) => {
    if (params.dataIndex !== undefined && currentKLines[params.dataIndex]) {
      setSelectedPeriod(currentKLines[params.dataIndex])
    }
  }, [currentKLines])

  /* ------------------------------------------------------------
     LLM 生成事件描述
     ------------------------------------------------------------ */

  const generateEventDescription = useCallback(async (event: EventData, period: string) => {
    const key = `${period}-${event.title}`
    if (klineEvents[key]) return

    if (!llmConfig.apiKey) {
      setKlineEvent(key, '请配置 API Key 以获取详细解读')
      return
    }

    const prompt = `作为紫微斗数大师，用一句话解读以下运势事件（不超过30字）：

时期：${period}
事件：${event.title}
相关星曜：${event.stars.join('、')}
性质：${event.type === 'positive' ? '吉' : '凶'}

直接给出解读，不要任何前缀。`

    try {
      let result = ''
      for await (const chunk of streamChat(llmConfig, [
        { role: 'user', content: prompt }
      ])) {
        result += chunk
      }
      setKlineEvent(key, result.trim())
    } catch {
      setKlineEvent(key, '解读生成失败')
    }
  }, [llmConfig, klineEvents, setKlineEvent])

  /* ------------------------------------------------------------
     渲染
     ------------------------------------------------------------ */

  if (!chart) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* 标题区 */}
      <div className="text-center">
        <h2
          className="
            text-2xl font-bold
            bg-gradient-to-r from-star-light via-gold to-star-light
            bg-clip-text text-transparent
          "
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          人生 K 线
        </h2>
        <p className="text-text-muted text-sm mt-2">
          {birthInfo?.year}年生 · 运势起伏一目了然
        </p>
      </div>

      {/* 生成按钮 / 时间维度切换 */}
      {!klineCache ? (
        <div className="flex justify-center">
          <button
            onClick={generateKLines}
            disabled={isGenerating}
            className="
              px-8 py-3 rounded-xl
              bg-gradient-to-r from-star to-gold
              text-night font-medium
              hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]
              transition-all duration-300
              disabled:opacity-50
            "
          >
            {isGenerating ? '生成中...' : '✨ 生成人生 K 线'}
          </button>
        </div>
      ) : (
        <>
          {/* 时间维度切换 */}
          <div className="flex justify-center gap-2">
            {[
              { key: 'decadal', label: '大限 (10年)', icon: '◈' },
              { key: 'yearly', label: '三年', icon: '◎' },
              { key: 'monthly', label: '月度', icon: '◇' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key as ViewMode)}
                className={`
                  px-4 py-2 rounded-lg text-sm
                  transition-all duration-200
                  ${viewMode === tab.key
                    ? 'bg-star/20 text-star-light border border-star/30'
                    : 'bg-white/[0.04] text-text-muted hover:bg-white/[0.08]'
                  }
                `}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* 月度模式年份选择 */}
          {viewMode === 'monthly' && klineCache && (
            <div className="flex justify-center gap-2">
              {Object.keys(klineCache.monthly).map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(parseInt(year))}
                  className={`
                    px-3 py-1 rounded-md text-sm
                    ${selectedYear === parseInt(year)
                      ? 'bg-gold/20 text-gold'
                      : 'text-text-muted hover:text-text'
                    }
                  `}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* K 线图 */}
          <div
            className="
              relative p-4 rounded-2xl
              bg-white/[0.02] border border-white/[0.06]
              backdrop-blur-sm
            "
          >
            {/* 顶部发光线 */}
            <div
              className="
                absolute top-0 left-1/2 -translate-x-1/2
                w-1/2 h-px
                bg-gradient-to-r from-transparent via-star/50 to-transparent
              "
            />

            <ReactEChartsCore
              ref={chartRef}
              echarts={echarts}
              option={chartOption}
              style={{ height: '360px' }}
              onEvents={{ click: onChartClick }}
              opts={{ renderer: 'canvas' }}
            />

            {/* 图例 */}
            <div className="flex justify-center gap-6 mt-4 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-[#22c55e]" /> 上涨
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-[#ef4444]" /> 下跌
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24]" /> 峰值
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> 谷底
              </span>
            </div>
          </div>

          {/* 选中时期详情 */}
          {selectedPeriod && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 雷达图 */}
              <ScoreRadar score={selectedPeriod.score} period={selectedPeriod.period} />

              {/* 事件卡片 */}
              <div className="space-y-3">
                <h3 className="text-sm text-text-muted font-medium">
                  📌 关键事件
                </h3>
                {selectedPeriod.events.length > 0 ? (
                  selectedPeriod.events.map((event, idx) => (
                    <EventCard
                      key={idx}
                      event={event}
                      description={klineEvents[`${selectedPeriod.period}-${event.title}`]}
                      onRequestDescription={() => generateEventDescription(event, selectedPeriod.period)}
                    />
                  ))
                ) : (
                  <div className="text-text-muted text-sm p-4 text-center bg-white/[0.02] rounded-xl">
                    此时期无特殊事件标注
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ============================================================
   空状态组件
   ============================================================ */

function EmptyState() {
  return (
    <div
      className="
        text-center p-8 rounded-2xl
        bg-white/[0.02] border border-white/[0.06]
      "
    >
      <div className="text-4xl mb-4 opacity-30">📈</div>
      <p className="text-text-muted mb-4">
        请先在「命盘解读」中输入您的生辰信息
      </p>
    </div>
  )
}
