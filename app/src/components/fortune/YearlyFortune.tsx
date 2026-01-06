/* ============================================================
   年度运势组件
   基于流年盘分析当年运势
   ============================================================ */

import { useState, useCallback } from 'react'
import { useChartStore, useSettingsStore } from '@/stores'
import { streamChat, type ChatMessage, type LLMConfig } from '@/lib/llm'
import { extractKnowledge, buildPromptContext } from '@/knowledge'
import { Button, Select } from '@/components/ui'

/* ------------------------------------------------------------
   年份选项
   ------------------------------------------------------------ */

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: currentYear - 5 + i,
  label: `${currentYear - 5 + i}年`,
}))

/* ------------------------------------------------------------
   运势提示词
   ------------------------------------------------------------ */

const FORTUNE_PROMPT = `你是一位精通紫微斗数的命理师。现在需要分析命主的流年运势。

## 解读原则：
1. 结合流年四化与本命盘分析
2. 分析流年命宫、财帛、官禄、夫妻等重要宫位
3. 指出该年的机遇与需要注意的方面
4. 给出具体月份的趋势提示
5. 语言通俗易懂，积极但真实

## 解读结构：
1. **年度总览**：一句话概括这一年的主题
2. **事业运势**：工作、发展机会
3. **财运分析**：收入、投资建议
4. **感情运势**：桃花、婚姻状况
5. **健康提醒**：需要注意的身体问题
6. **重要月份**：特别需要关注的月份
7. **开运建议**：具体可执行的建议`

/* ------------------------------------------------------------
   构建流年盘详细信息
   ------------------------------------------------------------ */

interface HoroscopeData {
  heavenlyStem: string
  earthlyBranch: string
  mutagen: string[]
  index: number
  palaceNames: string[]
}

function buildYearlyContext(
  chart: { palaces: Array<{ name: unknown; majorStars: Array<{ name: unknown; brightness?: unknown; mutagen?: unknown }>; minorStars: Array<{ name: unknown; mutagen?: unknown }> }> },
  horoscope: { yearly: HoroscopeData; decadal: HoroscopeData },
  year: number
): string {
  const lines: string[] = []
  const yearly = horoscope.yearly
  const decadal = horoscope.decadal

  lines.push('【流年盘信息】')
  lines.push('')

  // 流年基础信息
  lines.push('## 流年基础')
  lines.push(`- 流年：${year}年（${yearly.heavenlyStem}${yearly.earthlyBranch}年）`)
  lines.push(`- 流年四化：${yearly.mutagen.join('、')}`)
  lines.push(`- 流年命宫位置：${yearly.palaceNames[0]}`)
  lines.push('')

  // 大限信息
  lines.push('## 当前大限')
  lines.push(`- 大限天干：${decadal.heavenlyStem}`)
  lines.push(`- 大限四化：${decadal.mutagen.join('、')}`)
  lines.push(`- 大限命宫位置：${decadal.palaceNames[0]}`)
  lines.push('')

  // 流年各宫分析（重点宫位）
  lines.push('## 流年重点宫位星曜')
  const importantPalaces = ['命宫', '财帛宫', '官禄宫', '夫妻宫', '疾厄宫', '迁移宫']

  for (const palaceName of importantPalaces) {
    const palace = chart.palaces.find(p => String(p.name) === palaceName)
    if (!palace) continue

    const majorStarsStr = palace.majorStars.map(s => {
      let str = String(s.name)
      if (s.brightness) str += `(${s.brightness})`
      if (s.mutagen) str += `[${s.mutagen}]`
      return str
    }).join('、') || '无主星'

    const minorStarsStr = palace.minorStars.map(s => {
      let str = String(s.name)
      if (s.mutagen) str += `[${s.mutagen}]`
      return str
    }).join('、')

    lines.push(`### ${palaceName}`)
    lines.push(`- 主星：${majorStarsStr}`)
    if (minorStarsStr) lines.push(`- 辅星：${minorStarsStr}`)
    lines.push('')
  }

  return lines.join('\n')
}

/* ------------------------------------------------------------
   年度运势组件
   ------------------------------------------------------------ */

export function YearlyFortune() {
  const { chart, birthInfo } = useChartStore()
  const { provider, providerSettings, enableThinking, enableWebSearch, searchApiKey } = useSettingsStore()
  const currentSettings = providerSettings[provider]

  const [year, setYear] = useState(currentYear)
  const [fortune, setFortune] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = useCallback(async () => {
    if (!chart || !birthInfo) return
    if (!currentSettings.apiKey) {
      setError('请先在设置中配置 API Key')
      return
    }

    setLoading(true)
    setError(null)
    setFortune('')

    try {
      // 获取流年运限数据
      const horoscope = chart.horoscope(new Date(`${year}-6-15`))

      // 提取本命盘完整信息
      const knowledge = extractKnowledge(chart, birthInfo.year)
      const natalContext = buildPromptContext(knowledge)

      // 构建流年盘信息
      const yearlyContext = buildYearlyContext(chart, horoscope, year)

      const userMessage = `请分析以下命盘的 ${year} 年运势：

## 基本信息
- 出生：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日
- 性别：${birthInfo.gender === 'male' ? '男' : '女'}
- 五行局：${chart.fiveElementsClass}
- 分析年份：${year}年

${natalContext}

${yearlyContext}

请结合本命盘和流年盘信息，给出详细的 ${year} 年运势分析。`

      const messages: ChatMessage[] = [
        { role: 'system', content: FORTUNE_PROMPT },
        { role: 'user', content: userMessage },
      ]

      const config: LLMConfig = {
        provider,
        apiKey: currentSettings.apiKey,
        baseUrl: currentSettings.customBaseUrl || undefined,
        model: currentSettings.customModel || undefined,
        enableThinking,
        enableWebSearch,
        searchApiKey: searchApiKey || undefined,
      }

      let fullText = ''
      for await (const token of streamChat(config, messages)) {
        fullText += token
        setFortune(fullText)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [chart, birthInfo, year, provider, currentSettings, enableThinking, enableWebSearch, searchApiKey])

  if (!chart) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：控制面板 */}
      <div className="lg:col-span-1">
        <div className="glass p-6 space-y-4">
          <h2 className="text-xl font-semibold text-amber">年度运势</h2>

          <Select
            label="选择年份"
            options={YEAR_OPTIONS}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />

          <Button
            onClick={handleAnalyze}
            disabled={loading || !currentSettings.apiKey}
            className="w-full"
          >
            {loading ? '分析中...' : '查看运势'}
          </Button>

          {error && (
            <div className="p-3 rounded-lg bg-misfortune/10 text-misfortune text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：运势结果 */}
      <div className="lg:col-span-2">
        <div className="glass p-6 h-full min-h-[400px]">
          {fortune ? (
            <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
              {fortune}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-text-muted">
              <div className="w-4 h-4 border-2 border-star border-t-transparent rounded-full animate-spin" />
              <span>正在分析 {year} 年运势...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              选择年份并点击「查看运势」开始分析
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
