/* ============================================================
   多模型适配层
   支持 Kimi / Gemini / Claude / DeepSeek / 自定义 OpenAI 兼容
   ============================================================ */

export type ModelProvider = 'kimi' | 'gemini' | 'claude' | 'deepseek' | 'custom'

export interface LLMConfig {
  provider: ModelProvider
  apiKey: string
  baseUrl?: string
  model?: string
  enableThinking?: boolean
  enableWebSearch?: boolean
  searchApiKey?: string  // Tavily API Key
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamCallbacks {
  onToken?: (token: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

/* ------------------------------------------------------------
   Provider 配置（导出供设置面板使用）
   ------------------------------------------------------------ */

export const PROVIDER_CONFIGS: Record<ModelProvider, { baseUrl: string; defaultModel: string }> = {
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'kimi-k2-0905-preview',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3.0-flash',
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-opus-4-5-20251124',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
  },
}

/* ------------------------------------------------------------
   Tavily 搜索 (用于无原生搜索的模型)
   ------------------------------------------------------------ */

interface TavilyResult {
  title: string
  url: string
  content: string
}

async function searchWithTavily(query: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 5,
      }),
    })

    if (!response.ok) {
      console.warn('Tavily search failed:', response.status)
      return ''
    }

    const data = await response.json()
    const results = data.results as TavilyResult[] || []

    if (results.length === 0) return ''

    // 格式化搜索结果
    const formatted = results.map((r, i) =>
      `[${i + 1}] ${r.title}\n${r.content}\n来源: ${r.url}`
    ).join('\n\n')

    return formatted
  } catch (err) {
    console.warn('Tavily search error:', err)
    return ''
  }
}

/* ------------------------------------------------------------
   智能搜索关键词提取 (用 LLM 提取精准搜索词)
   ------------------------------------------------------------ */

const KEYWORD_EXTRACTION_PROMPT = `你是紫微斗数搜索助手。从命盘信息中提取最有价值的搜索关键词，用于联网搜索增强解读准确性。

## 要求：
1. 提取 2-3 个最关键的搜索查询
2. 每个查询应该是独立的、有针对性的紫微斗数术语组合
3. 优先关注：命宫主星组合、重要四化、特殊格局
4. 格式：每行一个查询，不要编号，不要其他说明

## 示例输出：
紫微斗数 天机太阴 命宫 性格事业
紫微斗数 武曲化忌 财帛宫 影响化解
紫微斗数 机月同梁格 特点`

async function extractSearchKeywords(
  config: LLMConfig,
  chartContext: string
): Promise<string[]> {
  const { provider, apiKey, baseUrl, model } = config
  const providerConfig = PROVIDER_CONFIGS[provider]

  try {
    // 使用非流式请求提取关键词
    if (provider === 'gemini') {
      // Gemini 非流式
      const url = `${baseUrl || providerConfig.baseUrl}/models/${model || providerConfig.defaultModel}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: chartContext }] }],
          systemInstruction: { parts: [{ text: KEYWORD_EXTRACTION_PROMPT }] },
        }),
      })

      if (!response.ok) return []
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      return text.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)

    } else if (provider === 'claude') {
      // Claude 非流式
      const response = await fetch(`${baseUrl || providerConfig.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || providerConfig.defaultModel,
          max_tokens: 200,
          system: KEYWORD_EXTRACTION_PROMPT,
          messages: [{ role: 'user', content: chartContext }],
        }),
      })

      if (!response.ok) return []
      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      return text.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)

    } else {
      // OpenAI 兼容 (Kimi, DeepSeek, Custom)
      const url = `${baseUrl || providerConfig.baseUrl}/chat/completions`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || providerConfig.defaultModel,
          messages: [
            { role: 'system', content: KEYWORD_EXTRACTION_PROMPT },
            { role: 'user', content: chartContext },
          ],
          max_tokens: 200,
        }),
      })

      if (!response.ok) return []
      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || ''
      return text.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
    }
  } catch (err) {
    console.warn('Keyword extraction failed:', err)
    return []
  }
}

/* ------------------------------------------------------------
   智能联网搜索 (先提取关键词，再搜索)
   ------------------------------------------------------------ */

async function performSmartSearch(
  config: LLMConfig,
  messages: ChatMessage[]
): Promise<string> {
  const { searchApiKey } = config

  if (!searchApiKey) return ''

  // 从 messages 中提取命盘上下文
  const userMessage = messages.find(m => m.role === 'user')?.content || ''

  // 用 LLM 提取搜索关键词
  const keywords = await extractSearchKeywords(config, userMessage)

  if (keywords.length === 0) {
    console.warn('No keywords extracted, skipping search')
    return ''
  }

  console.log('Search keywords:', keywords)

  // 对每个关键词进行搜索
  const allResults: string[] = []

  for (const keyword of keywords.slice(0, 3)) {
    const result = await searchWithTavily(keyword, searchApiKey)
    if (result) {
      allResults.push(`【${keyword}】\n${result}`)
    }
  }

  if (allResults.length === 0) return ''

  return `\n\n---\n【联网搜索参考资料】\n以下是针对命盘关键要素的搜索结果，请结合这些资料进行更准确的解读：\n\n${allResults.join('\n\n')}\n---\n\n`
}

/* ------------------------------------------------------------
   OpenAI 兼容格式请求 (Kimi, DeepSeek, Custom)
   ------------------------------------------------------------ */

async function* streamOpenAICompatible(
  config: LLMConfig,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const { provider, apiKey, baseUrl, model, enableThinking, enableWebSearch, searchApiKey } = config
  const providerConfig = PROVIDER_CONFIGS[provider]

  // 确定使用的模型（思考模式切换专用模型）
  let useModel = model || providerConfig.defaultModel
  if (enableThinking && !model) {
    if (provider === 'deepseek') {
      useModel = 'deepseek-v3.2-speciale'
    } else if (provider === 'kimi') {
      useModel = 'kimi-k2-thinking'
    }
  }

  const url = `${baseUrl || providerConfig.baseUrl}/chat/completions`

  // 构建请求体
  const requestBody: Record<string, unknown> = {
    model: useModel,
    messages,
    stream: true,
  }

  // Kimi 原生搜索
  if (enableWebSearch && provider === 'kimi') {
    requestBody.tools = [{
      type: 'builtin_function',
      function: { name: '$web_search' },
    }]
  }

  // 非 Kimi 且有 Tavily API，使用智能搜索
  let processedMessages = messages
  if (enableWebSearch && provider !== 'kimi' && searchApiKey) {
    const searchResult = await performSmartSearch(config, messages)
    if (searchResult) {
      processedMessages = messages.map((m, i) =>
        i === 0 && m.role === 'system'
          ? { ...m, content: m.content + searchResult }
          : m
      )
    }
    requestBody.messages = processedMessages
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // 忽略解析错误
        }
      }
    }
  }
}

/* ------------------------------------------------------------
   Gemini API 请求
   ------------------------------------------------------------ */

async function* streamGemini(
  config: LLMConfig,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const { apiKey, model, baseUrl, enableThinking, enableWebSearch } = config
  const providerConfig = PROVIDER_CONFIGS.gemini

  // 思考模式切换到 gemini-3-pro-preview
  let modelName = model || providerConfig.defaultModel
  if (enableThinking && !model) {
    modelName = 'gemini-3-pro-preview'
  }

  // 转换消息格式
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // 系统消息作为 systemInstruction
  const systemMessage = messages.find(m => m.role === 'system')

  const url = `${baseUrl || providerConfig.baseUrl}/models/${modelName}:streamGenerateContent?key=${apiKey}`

  // 构建请求体
  const requestBody: Record<string, unknown> = {
    contents,
    systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
  }

  // Gemini 原生 Google 搜索
  if (enableWebSearch) {
    requestBody.tools = [{ google_search: {} }]
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`Gemini API Error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Gemini 返回的是 JSON 数组流
    try {
      const matches = buffer.match(/\{[^{}]*"text"\s*:\s*"[^"]*"[^{}]*\}/g)
      if (matches) {
        for (const match of matches) {
          const json = JSON.parse(match)
          if (json.text) {
            yield json.text
            buffer = buffer.replace(match, '')
          }
        }
      }
    } catch {
      // 继续读取
    }
  }
}

/* ------------------------------------------------------------
   Claude API 请求（支持 extended thinking）
   ------------------------------------------------------------ */

async function* streamClaude(
  config: LLMConfig,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const { apiKey, model, baseUrl, enableThinking, enableWebSearch, searchApiKey } = config
  const providerConfig = PROVIDER_CONFIGS.claude

  // 提取系统消息
  let systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages.filter(m => m.role !== 'system')

  // 如果启用搜索且有 Tavily API，使用智能搜索
  if (enableWebSearch && searchApiKey) {
    const searchResult = await performSmartSearch(config, messages)
    if (searchResult) {
      systemMessage += searchResult
    }
  }

  // 构建请求体
  const requestBody: Record<string, unknown> = {
    model: model || providerConfig.defaultModel,
    max_tokens: enableThinking ? 16000 : 4096,
    system: systemMessage,
    messages: chatMessages,
    stream: true,
  }

  // 如果启用思考模式
  if (enableThinking) {
    requestBody.thinking = {
      type: 'enabled',
      budget_tokens: 10000,
    }
  }

  const response = await fetch(`${baseUrl || providerConfig.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(`Claude API Error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.slice(6))
          // 处理普通文本输出
          if (json.type === 'content_block_delta') {
            if (json.delta?.type === 'text_delta') {
              yield json.delta.text || ''
            }
            // thinking 内容也可以选择输出（当前跳过）
          }
        } catch {
          // 忽略
        }
      }
    }
  }
}

/* ------------------------------------------------------------
   统一流式接口
   ------------------------------------------------------------ */

export async function* streamChat(
  config: LLMConfig,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  switch (config.provider) {
    case 'gemini':
      yield* streamGemini(config, messages)
      break
    case 'claude':
      yield* streamClaude(config, messages)
      break
    case 'kimi':
    case 'deepseek':
    case 'custom':
    default:
      yield* streamOpenAICompatible(config, messages)
      break
  }
}

/* ------------------------------------------------------------
   便捷调用方法
   ------------------------------------------------------------ */

export async function chat(
  config: LLMConfig,
  messages: ChatMessage[],
  callbacks?: StreamCallbacks
): Promise<string> {
  let fullText = ''

  try {
    for await (const token of streamChat(config, messages)) {
      fullText += token
      callbacks?.onToken?.(token)
    }
    callbacks?.onComplete?.(fullText)
  } catch (error) {
    callbacks?.onError?.(error as Error)
    throw error
  }

  return fullText
}
