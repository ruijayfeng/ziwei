/* ============================================================
   双人合盘组件
   分析两人命盘的契合度
   ============================================================ */

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

const MATCH_PROMPT = `# Role
你是一位擅长推演人际姻缘的紫微斗数专家。根据提供的命盘信息进行解读。在合盘分析中，你不仅观察表面的星情互补，更注重通过"飞星四化"来推演两人深层的缘分羁绊与利弊关系。

# Analysis Logic
1.  **星情对看**：分析两人命宫主星的性质是否匹配（如：强弱搭配、动静结合）。
2.  **四化互飞**：推演A的命宫四化飞入B的宫位，判断A对B是生助（化禄）还是刑克（化忌），反之亦然。
3.  **宫位参合**：观察双方夫妻宫的意象是否与对方吻合。

# Output Format
请严格按照以下结构输出分析报告：

## 双人命盘合参解析

### 壹· 缘分深浅
* **契合综述**：不使用分数，而是用定性描述（如：天作之合、欢喜冤家、因缘波折、相辅相成）。
* **关系本质**：从命理角度解析，两人相遇是互相成就，还是互相偿还宿债。

### 贰· 性情互动
* **相合之处**：两人性格中能够产生共鸣或互补的地方。
* **磨合难点**：两人性格中容易产生摩擦或误解的本质原因（如：一方重情，一方重利）。

### 叁· 命理羁绊（四化互飞）
* **助益分析**：分析两人在一起，谁能旺谁？（如：对方是否有助于你的事业或财运）。
* **隐忧所在**：命理上是否存在互相刑克或拖累的情况？

### 肆· 现实展望
* **未来挑战**：若长期相处或步入婚姻，最需要共同面对的现实考验是什么？
* **相处建议**：针对两人的命局特点，给出具体的相处之道与沟通建议。

---
*注：缘分天定，份在人为。合盘分析旨在增进了解，非绝对定论。*`

/* ------------------------------------------------------------
   Markdown 自定义样式组件
   ------------------------------------------------------------ */

const MarkdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-2xl font-bold text-gold mt-6 mb-3 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-semibold text-gold/90 mt-5 mb-2">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-medium text-star-light mt-4 mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-gold font-semibold">{children}</strong>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-none space-y-1.5 mb-3 pl-4">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside space-y-1.5 mb-3 pl-2">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="relative pl-4 before:content-['◆'] before:absolute before:left-0 before:text-star/60 before:text-xs">
      {children}
    </li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-gold/40 pl-4 my-3 italic text-text-secondary">
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-text-muted not-italic">{children}</em>
  ),
}

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
    <div
      className="
        relative p-5
        bg-gradient-to-br from-white/[0.04] to-transparent
        backdrop-blur-xl border border-white/[0.08] rounded-xl
        shadow-[0_4px_20px_rgba(0,0,0,0.2)]
      "
    >
      <h3
        className="text-lg font-medium mb-4 bg-gradient-to-r from-star-light to-gold bg-clip-text text-transparent"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {label}
      </h3>
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
      const knowledge1 = extractKnowledge(chart1, person1.year)
      const knowledge2 = extractKnowledge(chart2, person2.year)
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
    <div className="animate-fade-in space-y-8 max-w-6xl mx-auto">
      {/* 顶部：双人信息输入 + 按钮 */}
      <div
        className="
          relative p-6 lg:p-8
          bg-gradient-to-br from-white/[0.04] to-transparent
          backdrop-blur-xl border border-white/[0.08] rounded-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        "
      >
        {/* 顶部发光线 */}
        <div
          className="
            absolute top-0 left-1/2 -translate-x-1/2
            w-1/3 h-px
            bg-gradient-to-r from-transparent via-gold/50 to-transparent
          "
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <h2
            className="
              text-xl lg:text-2xl font-semibold
              bg-gradient-to-r from-gold via-gold-light to-gold
              bg-clip-text text-transparent
            "
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            双人合盘
          </h2>

          <Button
            onClick={handleAnalyze}
            disabled={loading || !currentSettings.apiKey}
            size="sm"
            variant="gold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-night border-t-transparent rounded-full animate-spin" />
                分析中
              </span>
            ) : currentSettings.apiKey ? '开始合盘分析' : '请先配置 API'}
          </Button>
        </div>

        {/* 双人信息输入区 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PersonInput label="第一人" value={person1} onChange={setPerson1} />
          <PersonInput label="第二人" value={person2} onChange={setPerson2} />
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-misfortune/10 text-misfortune text-sm border border-misfortune/20">
            {error}
          </div>
        )}
      </div>

      {/* 下方：分析结果 */}
      <div
        className="
          relative p-6 lg:p-8
          bg-gradient-to-br from-white/[0.04] to-transparent
          backdrop-blur-xl border border-white/[0.08] rounded-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        "
      >
        {/* 顶部发光线 */}
        <div
          className="
            absolute top-0 left-1/2 -translate-x-1/2
            w-1/3 h-px
            bg-gradient-to-r from-transparent via-star/50 to-transparent
          "
        />

        {/* 未配置提示 */}
        {!currentSettings.apiKey && !result && (
          <div className="text-text-muted text-sm py-8 text-center">
            <div className="text-3xl mb-3 opacity-30">⚭</div>
            请先在设置中配置 AI 模型的 API Key，即可获得双人合盘分析。
          </div>
        )}

        {/* 未分析提示 */}
        {currentSettings.apiKey && !result && !loading && (
          <div className="text-text-muted text-sm py-8 text-center">
            <div className="text-3xl mb-3 opacity-30">⚭</div>
            输入双方信息并点击「开始合盘分析」
          </div>
        )}

        {/* 加载中 */}
        {loading && !result && (
          <div className="flex items-center justify-center gap-3 text-text-muted py-12">
            <div className="w-5 h-5 border-2 border-star border-t-transparent rounded-full animate-spin" />
            <span>正在分析两人契合度...</span>
          </div>
        )}

        {/* 分析结果 - 书法字体 + Markdown 渲染 */}
        {result && (
          <div
            className="
              prose prose-invert max-w-none
              text-text-secondary text-lg lg:text-xl leading-loose
            "
            style={{ fontFamily: 'var(--font-brush)' }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {result}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
