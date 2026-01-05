/* ============================================================
   设置面板组件
   配置 API Key、模型选择等
   ============================================================ */

import { useState } from 'react'
import { useSettingsStore } from '@/stores'
import { Button, Input, Select } from '@/components/ui'
import type { ModelProvider } from '@/lib/llm'
import { PROVIDER_CONFIGS } from '@/lib/llm'

/* ------------------------------------------------------------
   厂商选项
   ------------------------------------------------------------ */

const PROVIDER_OPTIONS: Array<{ value: ModelProvider; label: string }> = [
  { value: 'kimi', label: 'Kimi (月之暗面)' },
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'custom', label: '自定义 (OpenAI 兼容)' },
]

const API_DOCS: Record<ModelProvider, string> = {
  kimi: 'https://platform.moonshot.cn',
  gemini: 'https://aistudio.google.com/apikey',
  claude: 'https://console.anthropic.com',
  deepseek: 'https://platform.deepseek.com',
  custom: '',
}

/* ------------------------------------------------------------
   设置面板
   ------------------------------------------------------------ */

interface SettingsPanelProps {
  onClose?: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    provider,
    providerSettings,
    enableThinking,
    setProvider,
    updateCurrentProvider,
    setEnableThinking,
  } = useSettingsStore()

  // 当前厂商的配置
  const currentSettings = providerSettings[provider]

  const [localApiKey, setLocalApiKey] = useState(currentSettings.apiKey)
  const [localBaseUrl, setLocalBaseUrl] = useState(currentSettings.customBaseUrl)
  const [localModel, setLocalModel] = useState(currentSettings.customModel)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pendingProvider, setPendingProvider] = useState<ModelProvider | null>(null)

  // 检查是否有未保存的修改
  const hasUnsavedChanges =
    localApiKey !== currentSettings.apiKey ||
    localBaseUrl !== currentSettings.customBaseUrl ||
    localModel !== currentSettings.customModel

  // 切换厂商时，检查是否有未保存修改
  const handleProviderChange = (newProvider: ModelProvider) => {
    if (newProvider === provider) return

    if (hasUnsavedChanges) {
      setPendingProvider(newProvider)
    } else {
      switchToProvider(newProvider)
    }
  }

  // 实际切换厂商
  const switchToProvider = (newProvider: ModelProvider) => {
    setProvider(newProvider)
    const newSettings = providerSettings[newProvider]
    setLocalApiKey(newSettings.apiKey)
    setLocalBaseUrl(newSettings.customBaseUrl)
    setLocalModel(newSettings.customModel)
    setPendingProvider(null)
  }

  // 保存并切换
  const handleSaveAndSwitch = () => {
    updateCurrentProvider({
      apiKey: localApiKey,
      customBaseUrl: localBaseUrl,
      customModel: localModel,
    })
    if (pendingProvider) {
      switchToProvider(pendingProvider)
    }
  }

  // 放弃修改并切换
  const handleDiscardAndSwitch = () => {
    if (pendingProvider) {
      switchToProvider(pendingProvider)
    }
  }

  // 当前厂商的默认配置
  const defaultConfig = PROVIDER_CONFIGS[provider]
  const docUrl = API_DOCS[provider]

  const handleSave = () => {
    updateCurrentProvider({
      apiKey: localApiKey,
      customBaseUrl: localBaseUrl,
      customModel: localModel,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // 判断是否有自定义值（用于高亮显示）
  const hasCustomBaseUrl = localBaseUrl.trim() !== ''
  const hasCustomModel = localModel.trim() !== ''

  return (
    <div className="glass p-6 w-full max-w-md relative">
      {/* 未保存修改确认对话框 */}
      {pendingProvider && (
        <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center z-10 p-4">
          <div className="bg-surface p-5 rounded-xl max-w-sm w-full space-y-4">
            <p className="text-text-secondary text-sm">
              当前配置有未保存的修改，切换厂商将丢失这些修改。
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleDiscardAndSwitch}
                className="flex-1 !bg-white/10 hover:!bg-white/20"
              >
                放弃修改
              </Button>
              <Button onClick={handleSaveAndSwitch} className="flex-1">
                保存并切换
              </Button>
            </div>
            <button
              onClick={() => setPendingProvider(null)}
              className="w-full text-sm text-text-muted hover:text-text transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
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

      {/* 横幅提示 */}
      <div className="mb-4 p-3 rounded-lg bg-star/10 border border-star/20 text-sm text-text-secondary">
        <span className="text-star">ⓘ</span> 使用中转 API？展开下方「高级设置」修改 URL 和模型
      </div>

      <div className="space-y-4">
        {/* 厂商选择 */}
        <Select
          label="AI 厂商"
          options={PROVIDER_OPTIONS}
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
        />

        {/* API Key */}
        <Input
          label="API Key"
          type="password"
          placeholder="输入你的 API Key"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
        />

        {/* API 文档链接 */}
        {docUrl && (
          <p className="text-xs text-text-muted">
            获取 API Key:{' '}
            <a href={docUrl} target="_blank" rel="noopener" className="text-star hover:underline">
              {docUrl.replace('https://', '')}
            </a>
          </p>
        )}

        {/* 高级设置折叠区 */}
        <div className="border-t border-white/10 pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors w-full"
          >
            <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
            高级设置
            {(hasCustomBaseUrl || hasCustomModel) && (
              <span className="text-xs text-amber px-1.5 py-0.5 rounded bg-amber/10">已修改</span>
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              {/* BaseURL */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  BaseURL
                  {hasCustomBaseUrl && <span className="text-amber ml-2 text-xs">已覆盖</span>}
                </label>
                <input
                  type="text"
                  placeholder={defaultConfig.baseUrl}
                  value={localBaseUrl}
                  onChange={(e) => setLocalBaseUrl(e.target.value)}
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white/5 border transition-colors
                    placeholder:text-text-muted/50
                    focus:outline-none focus:ring-1
                    ${hasCustomBaseUrl
                      ? 'border-amber/50 focus:border-amber focus:ring-amber/30 text-text'
                      : 'border-white/10 focus:border-star focus:ring-star/30 text-text-secondary'
                    }
                  `}
                />
                <p className="text-xs text-text-muted mt-1">
                  默认: {defaultConfig.baseUrl}
                </p>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Model
                  {hasCustomModel && <span className="text-amber ml-2 text-xs">已覆盖</span>}
                </label>
                <input
                  type="text"
                  placeholder={defaultConfig.defaultModel}
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  className={`
                    w-full px-3 py-2 rounded-lg text-sm
                    bg-white/5 border transition-colors
                    placeholder:text-text-muted/50
                    focus:outline-none focus:ring-1
                    ${hasCustomModel
                      ? 'border-amber/50 focus:border-amber focus:ring-amber/30 text-text'
                      : 'border-white/10 focus:border-star focus:ring-star/30 text-text-secondary'
                    }
                  `}
                />
                <p className="text-xs text-text-muted mt-1">
                  默认: {defaultConfig.defaultModel}
                </p>
              </div>

              {/* 思考模式开关 */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`
                    w-10 h-6 rounded-full relative transition-colors
                    ${enableThinking ? 'bg-star' : 'bg-white/10'}
                  `}
                  onClick={() => setEnableThinking(!enableThinking)}
                >
                  <div
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                      ${enableThinking ? 'left-5' : 'left-1'}
                    `}
                  />
                </div>
                <div>
                  <span className="text-sm text-text-secondary group-hover:text-text transition-colors">
                    启用深度思考
                  </span>
                  <p className="text-xs text-text-muted">
                    需模型支持 (Claude/DeepSeek/Gemini 等)
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <Button onClick={handleSave} className="w-full" disabled={!hasUnsavedChanges && !saved}>
          {saved ? '✓ 已保存' : hasUnsavedChanges ? '保存设置 *' : '保存设置'}
        </Button>

        {/* 隐私提示 */}
        <p className="text-xs text-text-muted text-center">
          API Key 仅保存在你的浏览器本地，不会上传到任何服务器。
        </p>
      </div>
    </div>
  )
}
