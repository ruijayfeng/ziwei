/* ============================================================
   设置面板组件
   配置 API Key、模型选择等
   ============================================================ */

import { useState } from 'react'
import { useSettingsStore } from '@/stores'
import { Button, Input, Select } from '@/components/ui'
import type { ModelProvider } from '@/lib/llm'

const MODEL_OPTIONS: Array<{ value: ModelProvider; label: string }> = [
  { value: 'kimi', label: 'Kimi (月之暗面)' },
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: '自定义 (OpenAI 兼容)' },
]

interface SettingsPanelProps {
  onClose?: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    apiKey,
    model,
    customEndpoint,
    setApiKey,
    setModel,
    setCustomEndpoint,
  } = useSettingsStore()

  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [localEndpoint, setLocalEndpoint] = useState(customEndpoint)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setApiKey(localApiKey)
    setCustomEndpoint(localEndpoint)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="glass p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">设置</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 模型选择 */}
        <Select
          label="AI 模型"
          options={MODEL_OPTIONS}
          value={model}
          onChange={(e) => setModel(e.target.value as ModelProvider)}
        />

        {/* API Key */}
        <Input
          label="API Key"
          type="password"
          placeholder="输入你的 API Key"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
        />

        {/* 自定义端点 */}
        {model === 'custom' && (
          <Input
            label="自定义端点"
            placeholder="https://api.example.com/v1"
            value={localEndpoint}
            onChange={(e) => setLocalEndpoint(e.target.value)}
          />
        )}

        {/* API 获取提示 */}
        <div className="text-xs text-text-muted space-y-1">
          {model === 'kimi' && (
            <p>获取 API Key: <a href="https://platform.moonshot.cn" target="_blank" rel="noopener" className="text-star hover:underline">platform.moonshot.cn</a></p>
          )}
          {model === 'gemini' && (
            <p>获取 API Key: <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-star hover:underline">aistudio.google.com</a></p>
          )}
          {model === 'claude' && (
            <p>获取 API Key: <a href="https://console.anthropic.com" target="_blank" rel="noopener" className="text-star hover:underline">console.anthropic.com</a></p>
          )}
          {model === 'deepseek' && (
            <p>获取 API Key: <a href="https://platform.deepseek.com" target="_blank" rel="noopener" className="text-star hover:underline">platform.deepseek.com</a></p>
          )}
        </div>

        {/* 保存按钮 */}
        <Button onClick={handleSave} className="w-full">
          {saved ? '✓ 已保存' : '保存设置'}
        </Button>

        {/* 隐私提示 */}
        <p className="text-xs text-text-muted text-center">
          API Key 仅保存在你的浏览器本地，不会上传到任何服务器。
        </p>
      </div>
    </div>
  )
}
