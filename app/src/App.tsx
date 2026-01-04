/* ============================================================
   紫微斗数 App - 主入口
   ============================================================ */

import { BirthForm } from '@/components/BirthForm'
import { ChartDisplay } from '@/components/chart'
import { useChartStore } from '@/stores'

export default function App() {
  const { chart } = useChartStore()

  return (
    <div className="min-h-screen">
      {/* 星点背景 */}
      <div className="star-bg" />

      {/* 头部 */}
      <header className="py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-star-light to-amber bg-clip-text text-transparent">
            紫微斗数
          </h1>
          <p className="text-text-secondary mt-2">
            探索你的命运星图
          </p>
        </div>
      </header>

      {/* 主内容 */}
      <main className="px-4 pb-12">
        {!chart ? (
          /* 未排盘：显示输入表单 */
          <BirthForm />
        ) : (
          /* 已排盘：显示命盘 */
          <div className="space-y-6">
            <ChartDisplay />

            {/* 重新排盘按钮 */}
            <div className="text-center">
              <button
                onClick={() => useChartStore.getState().clear()}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                ← 重新输入
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 底部 */}
      <footer className="py-6 text-center text-text-muted text-sm">
        <p>紫微斗数 · 开源命理工具</p>
      </footer>
    </div>
  )
}
