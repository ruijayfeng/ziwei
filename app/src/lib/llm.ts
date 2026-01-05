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
   Provider 配置
   ------------------------------------------------------------ */

const PROVIDER_CONFIGS: Record<ModelProvider, { baseUrl: string; defaultModel: string }> = {
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-1.5-flash',
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  custom: {
    baseUrl: '',
    defaultModel: 'gpt-3.5-turbo',
  },
}

/* ------------------------------------------------------------
   OpenAI 兼容格式请求 (Kimi, DeepSeek, Custom)
   ------------------------------------------------------------ */

async function* streamOpenAICompatible(
  config: LLMConfig,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const { provider, apiKey, baseUrl, model } = config
  const providerConfig = PROVIDER_CONFIGS[provider]

  const url = `${baseUrl || providerConfig.baseUrl}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || providerConfig.defaultModel,
      messages,
      stream: true,
    }),
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
  const { apiKey, model } = config
  const modelName = model || PROVIDER_CONFIGS.gemini.defaultModel

  // 转换消息格式
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // 系统消息作为 systemInstruction
  const systemMessage = messages.find(m => m.role === 'system')

  const url = `${PROVIDER_CONFIGS.gemini.baseUrl}/models/${modelName}:streamGenerateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
    }),
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
   Claude API 请求
   ------------------------------------------------------------ */

async function* streamClaude(
  config: LLMConfig,
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const { apiKey, model } = config

  // 提取系统消息
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const chatMessages = messages.filter(m => m.role !== 'system')

  const response = await fetch(`${PROVIDER_CONFIGS.claude.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || PROVIDER_CONFIGS.claude.defaultModel,
      max_tokens: 4096,
      system: systemMessage,
      messages: chatMessages,
      stream: true,
    }),
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
          if (json.type === 'content_block_delta') {
            yield json.delta?.text || ''
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
