/* ============================================================
   AI 解读组件
   流式输出命盘分析结果
   ============================================================ */

import { useState, useCallback } from 'react'
import { useChartStore, useSettingsStore } from '@/stores'
import { extractKnowledge, buildPromptContext } from '@/knowledge'
import { streamChat, type ChatMessage, type LLMConfig } from '@/lib/llm'
import { Button } from '@/components/ui'

/* ------------------------------------------------------------
   系统提示词
   ------------------------------------------------------------ */

const SYSTEM_PROMPT = `你是一位精通紫微斗数的命理师，名为"星图先生"。你的风格亲和、专业但不故弄玄虚。

## 解读原则：
1. 用通俗易懂的语言解释命理概念，避免堆砌术语
2. 结合现代生活场景，让解读更有共鸣
3. 既要指出优势，也要坦诚说明需要注意的地方
4. 给出具体可行的建议，而不是泛泛而谈
5. 保持积极但真实的态度，不盲目夸大也不危言耸听

## 解读结构：
1. **总体格局**：一句话概括命格特点
2. **性格特质**：命宫主星带来的性格倾向
3. **事业方向**：官禄宫分析，适合的职业领域
4. **财运分析**：财帛宫分析，理财建议
5. **感情婚姻**：夫妻宫分析，感情模式
6. **需要注意**：化忌或煞星带来的提醒
7. **开运建议**：具体可执行的建议

请根据提供的命盘信息进行解读。`

/* ------------------------------------------------------------
   AI 解读面板组件
   ------------------------------------------------------------ */

export function AIInterpretation() {
  const { chart, birthInfo } = useChartStore()
  const { apiKey, model: provider, customEndpoint } = useSettingsStore()

  const [interpretation, setInterpretation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInterpret = useCallback(async () => {
    if (!chart || !birthInfo) return
    if (!apiKey) {
      setError('请先在设置中配置 API Key')
      return
    }

    setLoading(true)
    setError(null)
    setInterpretation('')

    try {
      // 提取知识上下文
      const knowledge = extractKnowledge(chart)
      const contextStr = buildPromptContext(knowledge)

      // 构建用户消息
      const userMessage = `请解读以下命盘：

## 基本信息
- 阳历：${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日
- 性别：${birthInfo.gender === 'male' ? '男' : '女'}
- 五行局：${chart.fiveElementsClass}

${contextStr}

请给出详细但通俗易懂的命盘解读。`

      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ]

      const config: LLMConfig = {
        provider,
        apiKey,
        baseUrl: provider === 'custom' ? customEndpoint : undefined,
      }

      // 流式输出
      let fullText = ''
      for await (const token of streamChat(config, messages)) {
        fullText += token
        setInterpretation(fullText)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '解读失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [chart, birthInfo, apiKey, provider, customEndpoint])

  if (!chart) return null

  return (
    <div className="glass p-6 w-full max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-amber">AI 命盘解读</h2>
        <Button
          onClick={handleInterpret}
          disabled={loading || !apiKey}
          size="sm"
        >
          {loading ? '解读中...' : apiKey ? '开始解读' : '请先配置 API'}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-misfortune/10 text-misfortune text-sm mb-4">
          {error}
        </div>
      )}

      {!apiKey && !interpretation && (
        <div className="text-text-muted text-sm">
          请先在设置中配置 AI 模型的 API Key，即可获得深度命盘解读。
        </div>
      )}

      {interpretation && (
        <div className="prose prose-invert max-w-none">
          <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
            {interpretation}
          </div>
        </div>
      )}

      {loading && !interpretation && (
        <div className="flex items-center gap-2 text-text-muted">
          <div className="w-4 h-4 border-2 border-star border-t-transparent rounded-full animate-spin" />
          <span>正在分析命盘...</span>
        </div>
      )}
    </div>
  )
}
