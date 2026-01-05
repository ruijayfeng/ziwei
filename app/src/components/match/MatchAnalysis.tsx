/* ============================================================
   双人合盘组件
   分析两人命盘的契合度
   ============================================================ */

import { useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores'
import { generateChart, type BirthInfo, type Gender } from '@/lib/astro'
import { extractKnowledge, buildPromptContext } from '@/knowledge'
import { streamChat, type ChatMessage, type LLMConfig } from '@/lib/llm'
import { Button, Select } from '@/components/ui'

/* ------------------------------------------------------------
   年份/月份/日期选项
   ------------------------------------------------------------ */

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => ({
  value: currentYear - i,
  label: `${currentYear - i}年`,
}))
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}))
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}日`,
}))
const HOUR_OPTIONS = [
  { value: 23, label: '子时 (23:00-00:59)' },
  { value: 2, label: '丑时 (01:00-02:59)' },
  { value: 4, label: '寅时 (03:00-04:59)' },
  { value: 6, label: '卯时 (05:00-06:59)' },
  { value: 8, label: '辰时 (07:00-08:59)' },
  { value: 10, label: '巳时 (09:00-10:59)' },
  { value: 12, label: '午时 (11:00-12:59)' },
  { value: 14, label: '未时 (13:00-14:59)' },
  { value: 16, label: '申时 (15:00-16:59)' },
  { value: 18, label: '酉时 (17:00-18:59)' },
  { value: 20, label: '戌时 (19:00-20:59)' },
  { value: 22, label: '亥时 (21:00-22:59)' },
]
const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
]

/* ------------------------------------------------------------
   合盘提示词
   ------------------------------------------------------------ */

const MATCH_PROMPT = `你是一位精通紫微斗数的命理师。现在需要分析两人的命盘契合度。

## 分析原则：
1. 对比双方命宫主星的相性
2. 分析双方夫妻宫的匹配度
3. 观察双方四化是否互补
4. 找出相处中可能的问题点
5. 给出相处建议

## 解读结构：
1. **整体契合度**：用百分比和简短描述概括
2. **性格匹配**：双方性格的互补与冲突
3. **感情模式**：双方对感情的态度
4. **相处优势**：在一起的好处
5. **潜在挑战**：可能遇到的问题
6. **相处建议**：具体的相处之道

语言温暖真诚，既指出问题也给予希望。`

/* ------------------------------------------------------------
   个人信息输入组件
   ------------------------------------------------------------ */

interface PersonInputProps {
  label: string
  value: BirthInfo
  onChange: (info: BirthInfo) => void
}

function PersonInput({ label, value, onChange }: PersonInputProps) {
  const update = (field: keyof BirthInfo, val: number | Gender) => {
    onChange({ ...value, [field]: val })
  }

  return (
    <div className="glass p-4 flex-1">
      <h3 className="text-lg font-medium text-star-light mb-3">{label}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Select
            label="年"
            options={YEAR_OPTIONS}
            value={value.year}
            onChange={(e) => update('year', Number(e.target.value))}
          />
          <Select
            label="月"
            options={MONTH_OPTIONS}
            value={value.month}
            onChange={(e) => update('month', Number(e.target.value))}
          />
          <Select
            label="日"
            options={DAY_OPTIONS}
            value={value.day}
            onChange={(e) => update('day', Number(e.target.value))}
          />
        </div>
        <Select
          label="时辰"
          options={HOUR_OPTIONS}
          value={value.hour}
          onChange={(e) => update('hour', Number(e.target.value))}
        />
        <div className="flex gap-2">
          {GENDER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`
                flex-1 py-2 px-3 rounded-lg text-center text-sm cursor-pointer transition-all
                ${value.gender === opt.value
                  ? 'bg-star text-white'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }
              `}
            >
              <input
                type="radio"
                value={opt.value}
                checked={value.gender === opt.value}
                onChange={() => update('gender', opt.value as Gender)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------
   双人合盘主组件
   ------------------------------------------------------------ */

export function MatchAnalysis() {
  const { provider, providerSettings, enableThinking, enableWebSearch, searchApiKey } = useSettingsStore()
  const currentSettings = providerSettings[provider]

  const [person1, setPerson1] = useState<BirthInfo>({
    year: 1990, month: 1, day: 1, hour: 12, gender: 'male',
  })
  const [person2, setPerson2] = useState<BirthInfo>({
    year: 1992, month: 6, day: 15, hour: 14, gender: 'female',
  })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = useCallback(async () => {
    if (!currentSettings.apiKey) {
      setError('请先在设置中配置 API Key')
      return
    }

    setLoading(true)
    setError(null)
    setResult('')

    try {
      // 生成两人命盘
      const chart1 = generateChart(person1)
      const chart2 = generateChart(person2)

      // 提取知识上下文
      const knowledge1 = extractKnowledge(chart1)
      const knowledge2 = extractKnowledge(chart2)
      const context1 = buildPromptContext(knowledge1)
      const context2 = buildPromptContext(knowledge2)

      const userMessage = `请分析以下两人的命盘契合度：

## 第一人
- 出生：${person1.year}年${person1.month}月${person1.day}日
- 性别：${person1.gender === 'male' ? '男' : '女'}
- 五行局：${chart1.fiveElementsClass}

${context1}

## 第二人
- 出生：${person2.year}年${person2.month}月${person2.day}日
- 性别：${person2.gender === 'male' ? '男' : '女'}
- 五行局：${chart2.fiveElementsClass}

${context2}

请分析两人的契合度和相处建议。`

      const messages: ChatMessage[] = [
        { role: 'system', content: MATCH_PROMPT },
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
        setResult(fullText)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [person1, person2, provider, currentSettings, enableThinking, enableWebSearch, searchApiKey])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：双人输入 */}
      <div className="lg:col-span-1 space-y-4">
        <PersonInput label="第一人" value={person1} onChange={setPerson1} />
        <PersonInput label="第二人" value={person2} onChange={setPerson2} />

        <Button
          onClick={handleAnalyze}
          disabled={loading || !currentSettings.apiKey}
          className="w-full"
        >
          {loading ? '分析中...' : currentSettings.apiKey ? '开始合盘分析' : '请先配置 API'}
        </Button>
      </div>

      {/* 右侧：分析结果 */}
      <div className="lg:col-span-2">
        {error && (
          <div className="glass p-4 bg-misfortune/10 text-misfortune text-sm mb-4">
            {error}
          </div>
        )}

        <div className="glass p-6 h-full min-h-[500px]">
          {result ? (
            <>
              <h2 className="text-xl font-semibold text-amber mb-4">合盘分析结果</h2>
              <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            </>
          ) : loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-text-muted">
              <div className="w-4 h-4 border-2 border-star border-t-transparent rounded-full animate-spin" />
              <span>正在分析两人契合度...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              输入双方信息并点击「开始合盘分析」
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
