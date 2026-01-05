/* ============================================================
   分享卡片组件
   将命盘信息渲染为可分享的图片
   ============================================================ */

import { useRef, useState, useCallback } from 'react'
import html2canvas from 'html2canvas'
import { useChartStore } from '@/stores'
import { Button } from '@/components/ui'

/* ------------------------------------------------------------
   宫位简化布局
   ------------------------------------------------------------ */

const PALACE_POSITIONS = [
  { x: 1, y: 0, palace: 3 },  // 巳
  { x: 2, y: 0, palace: 4 },  // 午
  { x: 3, y: 0, palace: 5 },  // 未
  { x: 4, y: 0, palace: 6 },  // 申
  { x: 4, y: 1, palace: 7 },  // 酉
  { x: 4, y: 2, palace: 8 },  // 戌
  { x: 4, y: 3, palace: 9 },  // 亥
  { x: 3, y: 3, palace: 10 }, // 子
  { x: 2, y: 3, palace: 11 }, // 丑
  { x: 1, y: 3, palace: 0 },  // 寅
  { x: 0, y: 2, palace: 1 },  // 卯
  { x: 0, y: 1, palace: 2 },  // 辰
] as const

/* ------------------------------------------------------------
   分享卡片组件
   ------------------------------------------------------------ */

export function ShareCard() {
  const { chart, birthInfo } = useChartStore()
  const cardRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return

    setGenerating(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a12',
        scale: 2,
        useCORS: true,
      })

      const link = document.createElement('a')
      link.download = `紫微命盘-${birthInfo?.year || ''}年生.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('生成图片失败:', err)
    } finally {
      setGenerating(false)
    }
  }, [birthInfo])

  if (!chart || !birthInfo) return null

  const palaces = chart.palaces

  return (
    <div className="space-y-4">
      {/* 预览卡片 */}
      <div
        ref={cardRef}
        className="p-6 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 50%, #0a0a12 100%)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
        }}
      >
        {/* 标题 */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            紫微知道 命盘
          </h2>
          <p className="text-amber-400/60 text-sm mt-1">
            {birthInfo.year}年{birthInfo.month}月{birthInfo.day}日 · {birthInfo.gender === 'male' ? '乾造' : '坤造'}
          </p>
        </div>

        {/* 命盘简图 */}
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            width: '320px',
            height: '256px',
          }}
        >
          {/* 中心信息 */}
          <div
            className="col-start-2 col-span-3 row-start-2 row-span-2 flex flex-col items-center justify-center rounded-lg"
            style={{ background: 'rgba(255, 215, 0, 0.05)' }}
          >
            <p className="text-amber-400 text-sm">{chart.fiveElementsClass}</p>
            <p className="text-amber-300/80 text-xs mt-1">
              命主 · {palaces[0]?.majorStars?.[0]?.name || ''}
            </p>
          </div>

          {/* 十二宫 */}
          {PALACE_POSITIONS.map(({ x, y, palace }) => {
            const p = palaces[palace]
            if (!p) return null

            const isLife = p.name === '命宫'
            const isBody = p.name === '身宫'

            return (
              <div
                key={palace}
                className="rounded text-center p-1 flex flex-col justify-center"
                style={{
                  gridColumn: x + 1,
                  gridRow: y + 1,
                  background: isLife
                    ? 'rgba(255, 215, 0, 0.15)'
                    : isBody
                    ? 'rgba(255, 215, 0, 0.08)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isLife ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <p className="text-amber-400/80 text-[10px]">{p.name}</p>
                <p className="text-amber-200 text-[9px] truncate">
                  {p.majorStars?.slice(0, 2).map((s) => s.name.replace('星', '')).join(' ')}
                </p>
              </div>
            )
          })}
        </div>

        {/* 底部水印 */}
        <div className="text-center mt-4 pt-3 border-t border-amber-400/10">
          <p className="text-amber-400/40 text-xs">紫微知道 · 开源命理工具</p>
        </div>
      </div>

      {/* 下载按钮 */}
      <div className="text-center">
        <Button onClick={handleDownload} disabled={generating}>
          {generating ? '生成中...' : '下载分享图'}
        </Button>
      </div>
    </div>
  )
}
