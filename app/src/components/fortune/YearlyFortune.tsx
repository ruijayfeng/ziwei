/* ============================================================
   年度运势组件
   基于流年盘分析当年运势
   ============================================================ */

import { useState, useCallback } from 'react'
import { useChartStore, useSettingsStore } from '@/stores'
import { streamChat, type ChatMessage, type LLMConfig } from '@/lib/llm'
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
   年度运势组件
   ------------------------------------------------------------ */

export function YearlyFortune() {
  const { chart, birthInfo } = useChartStore()
  const { provider, providerSettings, enableThinking } = useSettingsStore()
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
      const yearly = horoscope.yearly

      // 提取流年信息
      const yearlyInfo = [
        `流年天干：${yearly.heavenlyStem}`,
        `流年地支：${yearly.earthlyBranch}`,
        `流年四化：${yearly.mutagen.join('、')}`,
        `流年命宫：${yearly.palaceNames[0]}`,
      ].join('\n')

      const userMessage = `请分析以下命盘的 ${year} 年运势：

## 基本信息
- 出生：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日
- 性别：${birthInfo.gender === 'male' ? '男' : '女'}
- 五行局：${chart.fiveElementsClass}
- 分析年份：${year}年

## 流年盘信息
${yearlyInfo}

请给出详细的年度运势分析。`

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
  }, [chart, birthInfo, year, provider, currentSettings, enableThinking])

  if (!chart) return null

  return (
    <div className="glass p-6 w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-amber mb-4">年度运势</h2>

      <div className="flex gap-4 mb-4">
        <Select
          options={YEAR_OPTIONS}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-32"
        />
        <Button
          onClick={handleAnalyze}
          disabled={loading || !currentSettings.apiKey}
        >
          {loading ? '分析中...' : '查看运势'}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-misfortune/10 text-misfortune text-sm mb-4">
          {error}
        </div>
      )}

      {fortune && (
        <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
          {fortune}
        </div>
      )}

      {loading && !fortune && (
        <div className="flex items-center gap-2 text-text-muted">
          <div className="w-4 h-4 border-2 border-star border-t-transparent rounded-full animate-spin" />
          <span>正在分析 {year} 年运势...</span>
        </div>
      )}
    </div>
  )
}
