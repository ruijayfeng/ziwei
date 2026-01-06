/* ============================================================
   年度运势组件
   基于流年盘分析当年运势
   ============================================================ */

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChartStore, useSettingsStore, useContentCacheStore } from '@/stores'
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

const FORTUNE_PROMPT = `# Role
你是一位精通流年推算的紫微斗数专家。根据提供的命盘信息进行解读。在分析流年时，你严格遵循"本命为体，大限为用，流年为应"的原则，运用"限流叠宫"和"流年四化"技法，精准捕捉该年份的吉凶趋势。

# Analysis Logic
1.  **叠宫分析**：推演流年命宫叠入本命/大限何宫，以此判断今年的核心际遇（例如：流年命宫叠本命官禄，主事业变动）。
2.  **四化引动**：重点分析流年天干引发的四化（禄权科忌）落入何宫，指出得失所在。
3.  **时间应期**：结合月令，指出吉凶可能发生的具体时间段。

# Output Format
请严格按照以下结构输出分析报告：

## [年份] 岁次流年运程

### 壹· 年度总象
* **流年定调**：给这一年定一个关键词（如：破局之年、蛰伏之年、开拓之年）。
* **核心际遇**：基于"叠宫"理论，简述今年最核心的关注点是什么（是求财、升迁，还是由于家庭变故分心）。

### 贰· 名利机缘（事业/财运）
* **事业走势**：流年官禄宫分析。是否有升职、跳槽或创业的契机？工作压力源自何处？
* **求财建议**：流年财帛宫分析。适合进取投资还是保守储蓄？是否有意外破耗？

### 叁· 情感与家宅
* **流年姻缘**：流年夫妻宫分析。单身者是否有正缘？已婚者感情是否和睦？
* **家宅平安**：流年田宅与父母宫分析。是否涉及房产变动、装修或长辈健康问题。

### 肆· 月令趋势
* **吉运月份**：指出运势较顺遂的农历月份，适合开展重要事项。
* **注意月份**：指出压力较大或易出问题的农历月份，提示需谨慎行事。

### 伍· 锦囊寄语
* **行事准则**：给出一句针对今年的具体行动建议（如：宜静不宜动，宜守不宜攻）。
* **关键提醒**：关于健康或安全的特别嘱咐。

---
*注：流年运势受多方因素影响，分析仅供参考，切勿执着。*`

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
  const { yearlyFortune, setYearlyFortune } = useContentCacheStore()
  const currentSettings = providerSettings[provider]

  const [year, setYear] = useState(currentYear)
  const [fortune, setFortune] = useState(yearlyFortune[currentYear] || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 切换年份时加载缓存
  const handleYearChange = useCallback((newYear: number) => {
    setYear(newYear)
    setFortune(yearlyFortune[newYear] || '')
  }, [yearlyFortune])

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

      // 保存到全局缓存
      setYearlyFortune(year, fullText)
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [chart, birthInfo, year, provider, currentSettings, enableThinking, enableWebSearch, searchApiKey, setYearlyFortune])

  if (!chart) return null

  return (
    <div className="animate-fade-in space-y-8 max-w-6xl mx-auto">
      {/* 顶部：年份选择控制面板 */}
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2
            className="
              text-xl lg:text-2xl font-semibold
              bg-gradient-to-r from-gold via-gold-light to-gold
              bg-clip-text text-transparent
            "
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            年度运势
          </h2>

          <div className="flex items-center gap-4">
            <Select
              options={YEAR_OPTIONS}
              value={year}
              onChange={(e) => handleYearChange(Number(e.target.value))}
            />

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
              ) : currentSettings.apiKey ? '查看运势' : '请先配置 API'}
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-misfortune/10 text-misfortune text-sm border border-misfortune/20">
            {error}
          </div>
        )}
      </div>

      {/* 下方：运势内容 */}
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
        {!currentSettings.apiKey && !fortune && (
          <div className="text-text-muted text-sm py-8 text-center">
            <div className="text-3xl mb-3 opacity-30">◎</div>
            请先在设置中配置 AI 模型的 API Key，即可获得年度运势分析。
          </div>
        )}

        {/* 未分析提示 */}
        {currentSettings.apiKey && !fortune && !loading && (
          <div className="text-text-muted text-sm py-8 text-center">
            <div className="text-3xl mb-3 opacity-30">◎</div>
            选择年份并点击「查看运势」开始分析
          </div>
        )}

        {/* 加载中 */}
        {loading && !fortune && (
          <div className="flex items-center justify-center gap-3 text-text-muted py-12">
            <div className="w-5 h-5 border-2 border-star border-t-transparent rounded-full animate-spin" />
            <span>正在分析 {year} 年运势...</span>
          </div>
        )}

        {/* 运势内容 - 书法字体 + Markdown 渲染 */}
        {fortune && (
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
              {fortune}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
