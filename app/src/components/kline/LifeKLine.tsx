/* ============================================================
   人生 K 线 - Recharts 实现
   ============================================================

   核心特性:
   - 1-100 岁完整人生 K 线
   - 大运分界标注
   - 峰值红星标记
   - 深色玻璃态 Tooltip
   ============================================================ */

import { useState, useMemo, useCallback } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
  LabelList,
} from 'recharts'
import { useChartStore, useSettingsStore, useContentCacheStore } from '@/stores'
import { ScoreRadar } from './ScoreRadar'
import {
  generateLifetimeKLines,
  generateKLinesWithLLM,
  type LifetimeKLinePoint,
} from '@/lib/fortune-score'
import { type LLMConfig } from '@/lib/llm'

/* ============================================================
   自定义 Tooltip (深色玻璃态)
   ============================================================ */

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: LifetimeKLinePoint }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const isUp = data.close >= data.open
  const scoreLevel = data.score >= 80 ? '大吉' :
                     data.score >= 60 ? '吉' :
                     data.score >= 40 ? '平' :
                     data.score >= 20 ? '凶' : '大凶'

  return (
    <div className="bg-night/95 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-white/10 z-50 w-[320px] md:w-[380px]">
      {/* ─── Header ─── */}
      <div className="flex justify-between items-start mb-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
            {data.year} {data.ganZhi}年
            <span className="text-base text-text-muted ml-2">({data.age}岁)</span>
          </p>
          <p className="text-sm text-star-light font-medium mt-1">
            大运：{data.daYun} ({data.daYunRange})
          </p>
        </div>
        <div className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
          data.score >= 60 ? 'bg-green-500/20 text-green-400' :
          data.score >= 40 ? 'bg-amber-500/20 text-amber-400' :
          'bg-rose-500/20 text-rose-400'
        }`}>
          {scoreLevel} {data.score}分
        </div>
      </div>

      {/* ─── OHLC Grid ─── */}
      <div className="grid grid-cols-4 gap-2 text-xs mb-4 bg-white/[0.03] p-3 rounded-lg">
        <div className="text-center">
          <span className="block text-text-muted mb-1">年初</span>
          <span className="font-mono text-white font-bold">{data.open}</span>
        </div>
        <div className="text-center">
          <span className="block text-text-muted mb-1">年末</span>
          <span className={`font-mono font-bold ${isUp ? 'text-green-400' : 'text-rose-400'}`}>{data.close}</span>
        </div>
        <div className="text-center">
          <span className="block text-text-muted mb-1">年内高</span>
          <span className="font-mono text-gold font-bold">{data.high}</span>
        </div>
        <div className="text-center">
          <span className="block text-text-muted mb-1">年内低</span>
          <span className="font-mono text-rose-400 font-bold">{data.low}</span>
        </div>
      </div>

      {/* ─── Reason ─── */}
      <div className="text-sm text-text-secondary leading-relaxed max-h-[120px] overflow-y-auto"
           style={{ fontFamily: 'var(--font-brush)' }}>
        {data.reason || (
          <span className="text-text-muted flex items-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            AI 解读生成中...
          </span>
        )}
      </div>

      {/* ─── 流年四化 ─── */}
      {data.yearlyMutagens && data.yearlyMutagens.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
          {data.yearlyMutagens.map((m, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-xs bg-star/20 text-star-light">
              {m}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   自定义蜡烛图形状
   ============================================================ */

interface CandleShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  payload?: LifetimeKLinePoint
  yAxis?: { scale: (value: number) => number }
}

function CandleShape(props: CandleShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload, yAxis } = props
  if (!payload) return null

  const isUp = payload.close >= payload.open
  const color = isUp ? '#22c55e' : '#ef4444'
  const strokeColor = isUp ? '#15803d' : '#b91c1c'

  let highY = y
  let lowY = y + height

  if (yAxis && typeof yAxis.scale === 'function') {
    try {
      highY = yAxis.scale(payload.high)
      lowY = yAxis.scale(payload.low)
    } catch {
      highY = y
      lowY = y + height
    }
  }

  const center = x + width / 2
  const renderHeight = height < 2 ? 2 : height

  return (
    <g>
      {/* 影线 */}
      <line x1={center} y1={highY} x2={center} y2={lowY} stroke={strokeColor} strokeWidth={1.5} />
      {/* 蜡烛体 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={renderHeight}
        fill={color}
        stroke={strokeColor}
        strokeWidth={0.5}
        rx={1}
      />
    </g>
  )
}

/* ============================================================
   峰值星标组件
   ============================================================ */

interface PeakLabelProps {
  x?: number
  y?: number
  width?: number
  value?: number
  maxHigh: number
}

function PeakLabel(props: PeakLabelProps) {
  const { x = 0, y = 0, width = 0, value, maxHigh } = props
  if (value !== maxHigh) return null

  return (
    <g>
      {/* 金色星星 - 只标注峰值位置，不显示分数 */}
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        transform={`translate(${x + width / 2 - 6}, ${y - 18}) scale(0.5)`}
        fill="#fbbf24"
        stroke="#b45309"
        strokeWidth="1"
      />
    </g>
  )
}

/* ============================================================
   主组件
   ============================================================ */

export function LifeKLine() {
  const { chart, birthInfo } = useChartStore()
  const { provider, getCurrentSettings, enableThinking, enableWebSearch, searchApiKey } = useSettingsStore()
  const { klineCache, setKlineCache } = useContentCacheStore()

  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [selectedPoint, setSelectedPoint] = useState<LifetimeKLinePoint | null>(null)

  // LLM 配置
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
     生成 K 线数据 (由 AI 决定涨跌)
     ------------------------------------------------------------ */

  const generateKLines = useCallback(async () => {
    if (!chart || !birthInfo) return

    setIsGenerating(true)
    setProgress('初始化...')

    try {
      let lifetime: LifetimeKLinePoint[]

      if (llmConfig.apiKey) {
        // 使用 LLM 生成 (AI 决定涨跌)
        lifetime = await generateKLinesWithLLM(
          chart,
          birthInfo.year,
          llmConfig,
          setProgress
        )
      } else {
        // 无 API Key 时使用算法生成
        setProgress('正在计算运势...')
        lifetime = generateLifetimeKLines(chart, birthInfo.year)
      }

      setKlineCache({ lifetime, isGenerating: false })
      setProgress('')
    } catch (error) {
      console.error('K 线生成失败:', error)
      setProgress('生成失败，请重试')

      // 失败时使用算法兜底
      const lifetime = generateLifetimeKLines(chart, birthInfo.year)
      setKlineCache({ lifetime, isGenerating: false })
    }

    setIsGenerating(false)
  }, [chart, birthInfo, llmConfig, setKlineCache])

  /* ------------------------------------------------------------
     数据转换
     ------------------------------------------------------------ */

  const chartData = useMemo(() => {
    if (!klineCache?.lifetime) return []
    return klineCache.lifetime.map(d => ({
      ...d,
      bodyRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
    }))
  }, [klineCache])

  // 大运变化点
  const daYunChanges = useMemo(() => {
    if (!chartData.length) return []
    return chartData.filter((d, i) => {
      if (i === 0) return true
      return d.daYun !== chartData[i - 1].daYun
    })
  }, [chartData])

  // 最高点
  const maxHigh = useMemo(() => {
    if (!chartData.length) return 100
    return Math.max(...chartData.map(d => d.high))
  }, [chartData])

  /* ------------------------------------------------------------
     图表点击
     ------------------------------------------------------------ */

  const handleChartClick = useCallback((data: unknown) => {
    const chartData = data as { activePayload?: Array<{ payload: LifetimeKLinePoint }> }
    if (chartData.activePayload?.[0]?.payload) {
      setSelectedPoint(chartData.activePayload[0].payload)
    }
  }, [])

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
      {/* ─── 标题区 ─── */}
      <div className="text-center">
        <h2
          className="text-2xl font-bold bg-gradient-to-r from-star-light via-gold to-star-light bg-clip-text text-transparent"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          人生 K 线
        </h2>
        <p className="text-text-muted text-sm mt-2">
          {birthInfo?.year}年生 · 100 年运势起伏一目了然
        </p>
      </div>

      {/* ─── 生成按钮 / K 线图 ─── */}
      {!klineCache ? (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={generateKLines}
            disabled={isGenerating}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-star to-gold text-night font-medium hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all duration-300 disabled:opacity-50"
          >
            {isGenerating ? (progress || '生成中...') : '✨ AI 生成人生 K 线'}
          </button>
          {!llmConfig.apiKey && (
            <p className="text-text-muted text-xs">提示：配置 API Key 可使用 AI 分析命盘生成</p>
          )}
        </div>
      ) : (
        <>
          {/* ─── K 线图 ─── */}
          <div className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
            {/* 顶部发光线 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-star/50 to-transparent" />

            {/* 图表标题 */}
            <div className="mb-4 flex justify-between items-center px-2">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                人生流年大运 K 线图
              </h3>
              <div className="flex gap-3 text-xs font-medium">
                <span className="flex items-center text-green-400 bg-green-500/10 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-green-500 mr-2 rounded-full" /> 吉运
                </span>
                <span className="flex items-center text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-rose-500 mr-2 rounded-full" /> 凶运
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart
                data={chartData}
                margin={{ top: 30, right: 10, left: 0, bottom: 20 }}
                onClick={handleChartClick}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.05)"
                />

                <XAxis
                  dataKey="age"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  interval={9}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                  label={{
                    value: '年龄',
                    position: 'insideBottomRight',
                    offset: -5,
                    fontSize: 10,
                    fill: 'rgba(255,255,255,0.3)',
                  }}
                />

                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{
                    value: '运势分',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 10,
                    fill: 'rgba(255,255,255,0.3)',
                  }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: 'rgba(124,58,237,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />

                {/* 大运分界线 */}
                {daYunChanges.map((point, index) => (
                  <ReferenceLine
                    key={`dayun-${index}`}
                    x={point.age}
                    stroke="rgba(124,58,237,0.3)"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  >
                    <Label
                      value={point.daYun}
                      position="top"
                      fill="#a78bfa"
                      fontSize={9}
                      fontWeight="bold"
                    />
                  </ReferenceLine>
                ))}

                {/* K 线蜡烛 */}
                <Bar
                  dataKey="bodyRange"
                  shape={<CandleShape />}
                  isAnimationActive={true}
                  animationDuration={1500}
                >
                  <LabelList
                    dataKey="high"
                    position="top"
                    content={<PeakLabel maxHigh={maxHigh} />}
                  />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>

            {/* 生成状态 */}
            {klineCache.isGenerating && (
              <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs text-text-muted bg-night/80 px-3 py-1.5 rounded-lg">
                <span className="inline-block w-3 h-3 border-2 border-star border-t-transparent rounded-full animate-spin" />
                AI 正在生成运势解读...
              </div>
            )}
          </div>

          {/* ─── 选中年份详情 ─── */}
          {selectedPoint && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 雷达图 */}
              <ScoreRadar
                score={{
                  total: selectedPoint.score,
                  trend: selectedPoint.close >= selectedPoint.open ? 'up' : 'down',
                  dimensions: selectedPoint.dimensions,
                }}
                period={`${selectedPoint.year}年 (${selectedPoint.age}岁)`}
              />

              {/* 详细信息卡片 */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm">
                <h3 className="text-sm text-text-muted font-medium mb-4">
                  📌 {selectedPoint.year}年 {selectedPoint.ganZhi} · {selectedPoint.age}岁
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">所属大运</span>
                    <span className="text-star-light font-medium">{selectedPoint.daYun} ({selectedPoint.daYunRange})</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">综合评分</span>
                    <span className={`font-bold ${
                      selectedPoint.score >= 70 ? 'text-gold' :
                      selectedPoint.score >= 50 ? 'text-green-400' :
                      selectedPoint.score >= 30 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {selectedPoint.score} 分
                    </span>
                  </div>

                  {selectedPoint.yearlyMutagens && selectedPoint.yearlyMutagens.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <span className="text-text-muted text-sm block mb-2">流年四化</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPoint.yearlyMutagens.map((m, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs bg-star/20 text-star-light">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPoint.reason && (
                    <div className="pt-3 border-t border-white/10">
                      <span className="text-text-muted text-sm block mb-2">运势解读</span>
                      <p className="text-text-secondary text-sm leading-relaxed" style={{ fontFamily: 'var(--font-brush)' }}>
                        {selectedPoint.reason}
                      </p>
                    </div>
                  )}
                </div>
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
    <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
      <div className="text-4xl mb-4 opacity-30">📈</div>
      <p className="text-text-muted mb-4">
        请先在「命盘解读」中输入您的生辰信息
      </p>
    </div>
  )
}
