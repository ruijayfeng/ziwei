/* ============================================================
   紫微斗数 App - 主入口
   ============================================================ */

import { useState } from 'react'
import { BirthForm } from '@/components/BirthForm'
import { ChartDisplay } from '@/components/chart'
import { AIInterpretation } from '@/components/AIInterpretation'
import { SettingsPanel } from '@/components/SettingsPanel'
import { YearlyFortune } from '@/components/fortune'
import { MatchAnalysis } from '@/components/match'
import { ShareCard } from '@/components/share'
import { useChartStore } from '@/stores'

type TabType = 'chart' | 'fortune' | 'match'

const TABS: Array<{ key: TabType; label: string; needsChart: boolean }> = [
  { key: 'chart', label: '命盘解读', needsChart: true },
  { key: 'fortune', label: '年度运势', needsChart: true },
  { key: 'match', label: '双人合盘', needsChart: false },
]

export default function App() {
  const { chart } = useChartStore()
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('chart')

  return (
    <div className="min-h-screen flex flex-col">
      {/* 星点背景 */}
      <div className="star-bg" />

      {/* 头部 */}
      <header className="py-6 px-6 lg:px-12 border-b border-white/5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-star-light to-amber bg-clip-text text-transparent">
                紫微知道
              </h1>
              <p className="text-text-muted text-sm mt-0.5">
                基于紫微斗数的 AI 命理工具
              </p>
            </div>

            {/* 标签导航 - 桌面端 */}
            <nav className="hidden md:flex gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === tab.key
                      ? 'bg-star text-white'
                      : 'text-text-muted hover:text-text hover:bg-white/5'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-muted hover:text-text"
            title="设置"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* 移动端标签栏 */}
      <nav className="md:hidden px-4 py-3 border-b border-white/5">
        <div className="flex gap-2 justify-center">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.key
                  ? 'bg-star text-white'
                  : 'text-text-muted hover:text-text hover:bg-white/5'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 主内容 */}
      <main className="flex-1 px-4 lg:px-12 py-8">
        <div className="max-w-[1600px] mx-auto">
          {/* 命盘解读标签 */}
          {activeTab === 'chart' && (
            !chart ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <BirthForm />
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* 双栏布局：命盘 + AI 解读 */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* 左侧：命盘 */}
                  <div className="space-y-6">
                    <ChartDisplay />
                    <ShareCard />
                  </div>

                  {/* 右侧：AI 解读 */}
                  <div>
                    <AIInterpretation />
                  </div>
                </div>

                {/* 重新输入按钮 */}
                <div className="text-center mt-8">
                  <button
                    onClick={() => useChartStore.getState().clear()}
                    className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                  >
                    ← 重新输入
                  </button>
                </div>
              </div>
            )
          )}

          {/* 年度运势标签 */}
          {activeTab === 'fortune' && (
            !chart ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <p className="text-text-muted mb-4">请先在「命盘解读」中输入您的生辰信息</p>
                  <button
                    onClick={() => setActiveTab('chart')}
                    className="text-star hover:text-star-light transition-colors"
                  >
                    前往输入 →
                  </button>
                </div>
              </div>
            ) : (
              <YearlyFortune />
            )
          )}

          {/* 双人合盘标签 */}
          {activeTab === 'match' && <MatchAnalysis />}
        </div>
      </main>

      {/* 设置弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <SettingsPanel onClose={() => setShowSettings(false)} />
        </div>
      )}

      {/* 底部 */}
      <footer className="py-6 text-center text-text-muted text-sm border-t border-white/5">
        <p>紫微知道 · 开源命理工具</p>
      </footer>
    </div>
  )
}
