/* ============================================================
   命盘可视化组件
   紫微斗数命盘为 4x4 方格，中间为命主信息，周围十二宫
   Bento Grid 风格 + 悬浮交互 + 星光效果
   ============================================================ */

import { useState } from 'react'
import { useChartStore } from '@/stores'
import type { FunctionalAstrolabe } from '@/lib/astro'

/* ------------------------------------------------------------
   十二宫位置映射
   传统命盘布局：

   [巳] [午] [未] [申]
   [辰]         [酉]
   [卯]         [戌]
   [寅] [丑] [子] [亥]
   ------------------------------------------------------------ */

const PALACE_POSITIONS: Record<string, { row: number; col: number }> = {
  '巳': { row: 0, col: 0 },
  '午': { row: 0, col: 1 },
  '未': { row: 0, col: 2 },
  '申': { row: 0, col: 3 },
  '辰': { row: 1, col: 0 },
  '酉': { row: 1, col: 3 },
  '卯': { row: 2, col: 0 },
  '戌': { row: 2, col: 3 },
  '寅': { row: 3, col: 0 },
  '丑': { row: 3, col: 1 },
  '子': { row: 3, col: 2 },
  '亥': { row: 3, col: 3 },
}

/* ------------------------------------------------------------
   宫位数据类型
   ------------------------------------------------------------ */

interface PalaceData {
  name: string
  branch: string
  stars: string[]
  isLife: boolean
  isBody: boolean
}

/* ------------------------------------------------------------
   星曜标签组件 - 带四化高亮
   ------------------------------------------------------------ */

interface StarTagProps {
  star: string
}

function StarTag({ star }: StarTagProps) {
  const hasLu = star.includes('化禄')
  const hasQuan = star.includes('化权')
  const hasKe = star.includes('化科')
  const hasJi = star.includes('化忌')
  const hasMutagen = hasLu || hasQuan || hasKe || hasJi

  return (
    <span
      className={`
        inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded
        transition-all duration-200
        ${hasLu ? 'bg-gradient-to-r from-fortune/20 to-fortune/10 text-fortune font-medium' : ''}
        ${hasQuan ? 'bg-gradient-to-r from-gold/20 to-gold/10 text-gold font-medium' : ''}
        ${hasKe ? 'bg-gradient-to-r from-star/20 to-star/10 text-star-light font-medium' : ''}
        ${hasJi ? 'bg-gradient-to-r from-misfortune/20 to-misfortune/10 text-misfortune font-medium' : ''}
        ${!hasMutagen ? 'bg-white/5 text-text-secondary hover:bg-white/10' : ''}
      `}
    >
      {star}
      {hasMutagen && (
        <span className="w-1 h-1 rounded-full bg-current opacity-60 animate-pulse" />
      )}
    </span>
  )
}

/* ------------------------------------------------------------
   宫位卡片组件 - Bento 风格
   ------------------------------------------------------------ */

interface PalaceCardProps {
  name: string
  branch: string
  stars: string[]
  isLife?: boolean
  isBody?: boolean
  isSelected?: boolean
  onClick?: () => void
}

function PalaceCard({ name, branch, stars, isLife, isBody, isSelected, onClick }: PalaceCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        group relative p-3 lg:p-4 h-full min-h-[100px] lg:min-h-[140px] flex flex-col
        bg-white/[0.03] backdrop-blur-sm
        border border-white/[0.06] rounded-xl
        transition-all duration-300 cursor-pointer
        hover:bg-white/[0.06] hover:border-white/[0.12]
        hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]
        ${isLife ? 'ring-1 ring-gold/50 bg-gold/[0.03]' : ''}
        ${isBody ? 'ring-1 ring-star/50 bg-star/[0.03]' : ''}
        ${isSelected ? 'ring-2 ring-star shadow-[0_0_40px_rgba(124,58,237,0.2)]' : ''}
      `}
    >
      {/* 角落发光点 - 命宫/身宫 */}
      {(isLife || isBody) && (
        <div
          className={`
            absolute -top-1 -right-1 w-2 h-2 rounded-full
            ${isLife ? 'bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]' : ''}
            ${isBody ? 'bg-star-light shadow-[0_0_8px_rgba(167,139,250,0.6)]' : ''}
            animate-pulse
          `}
        />
      )}

      {/* 宫位头部 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-text-muted font-mono">{branch}</span>
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded font-medium
            transition-colors duration-200
            ${isLife ? 'bg-gold/20 text-gold' : ''}
            ${isBody ? 'bg-star/20 text-star-light' : ''}
            ${!isLife && !isBody ? 'text-text-secondary group-hover:text-text' : ''}
          `}
        >
          {name}
        </span>
      </div>

      {/* 星曜列表 */}
      <div className="flex-1 flex flex-wrap gap-1 content-start">
        {stars.map((star, index) => (
          <StarTag key={index} star={star} />
        ))}
      </div>

      {/* 悬浮指示线 */}
      <div
        className={`
          absolute bottom-0 left-1/2 -translate-x-1/2
          w-0 h-0.5 rounded-full
          bg-gradient-to-r from-star via-gold to-star
          transition-all duration-300
          group-hover:w-3/4
          ${isSelected ? 'w-3/4' : ''}
        `}
      />
    </div>
  )
}

/* ------------------------------------------------------------
   中央信息区域 - 高级卡片风格
   ------------------------------------------------------------ */

interface CenterInfoProps {
  solarDate: string
  lunarDate: string
  gender: string
  fiveElement: string
}

function CenterInfo({ solarDate, lunarDate, gender, fiveElement }: CenterInfoProps) {
  return (
    <div
      className="
        relative h-full min-h-[220px] lg:min-h-[300px] p-4 lg:p-6
        flex flex-col items-center justify-center
        bg-gradient-to-br from-white/[0.04] to-white/[0.02]
        backdrop-blur-md border border-white/[0.08] rounded-xl
        overflow-hidden
      "
    >
      {/* 背景装饰 - 太极图案暗纹 */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white" />
      </div>

      {/* 标题 */}
      <h3
        className="
          relative text-xl lg:text-2xl font-semibold mb-4
          bg-gradient-to-r from-gold via-gold-light to-gold
          bg-clip-text text-transparent
        "
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        命盘信息
      </h3>

      {/* 信息列表 */}
      <div className="relative text-sm lg:text-base text-text-secondary space-y-2 text-center">
        <p className="flex items-center justify-center gap-2">
          <span className="text-text-muted">阳历</span>
          <span className="text-text">{solarDate}</span>
        </p>
        <p className="flex items-center justify-center gap-2">
          <span className="text-text-muted">农历</span>
          <span className="text-text">{lunarDate}</span>
        </p>
        <p className="flex items-center justify-center gap-2">
          <span className="text-text-muted">性别</span>
          <span className="text-text">{gender}</span>
        </p>
        <div className="pt-2">
          <span
            className="
              inline-block px-3 py-1 rounded-full
              bg-gradient-to-r from-star/20 to-gold/20
              text-star-light font-medium
              border border-star/20
            "
          >
            {fiveElement}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------
   解析命盘数据
   ------------------------------------------------------------ */

function parsePalaces(chart: FunctionalAstrolabe): PalaceData[] {
  const palaces = chart.palaces || []

  return palaces.map((palace) => {
    // 处理主星
    const majorStars = palace.majorStars?.map((star) => {
      let name = star.name as string
      if (star.mutagen) name += star.mutagen
      return name
    }) || []

    // 处理辅星（只取部分重要的）
    const minorStars = palace.minorStars?.slice(0, 4).map((star) => star.name as string) || []

    return {
      name: palace.name as string,
      branch: palace.earthlyBranch as string,
      stars: [...majorStars, ...minorStars],
      isLife: palace.name === '命宫',
      isBody: palace.isBodyPalace === true,
    }
  })
}

/* ------------------------------------------------------------
   主命盘组件
   ------------------------------------------------------------ */

export function ChartDisplay() {
  const { chart, birthInfo } = useChartStore()
  const [selectedPalace, setSelectedPalace] = useState<string | null>(null)

  if (!chart || !birthInfo) {
    return null
  }

  // 解析宫位数据
  const palaceData = parsePalaces(chart)

  // 构建网格
  const grid: (PalaceData | null)[][] = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
  ]

  palaceData.forEach((palace) => {
    const pos = PALACE_POSITIONS[palace.branch]
    if (pos) {
      grid[pos.row][pos.col] = palace
    }
  })

  // 命盘基本信息
  const solarDate = `${birthInfo.year}年${birthInfo.month}月${birthInfo.day}日`
  const lunarDate = chart.lunarDate || '---'
  const gender = birthInfo.gender === 'male' ? '男' : '女'
  const fiveElement = chart.fiveElementsClass || '---'

  return (
    <div
      className="
        relative p-4 lg:p-8
        bg-gradient-to-br from-white/[0.04] to-transparent
        backdrop-blur-xl border border-white/[0.08] rounded-2xl
        shadow-[0_8px_32px_rgba(0,0,0,0.3)]
        max-w-5xl mx-auto
      "
    >
      {/* 顶部发光线条 */}
      <div
        className="
          absolute top-0 left-1/2 -translate-x-1/2
          w-1/3 h-px
          bg-gradient-to-r from-transparent via-star/50 to-transparent
        "
      />

      {/* 命盘网格 */}
      <div className="grid grid-cols-4 gap-2 lg:gap-3">
        {/* 第一行 */}
        {grid[0].map((palace, col) => (
          <div key={`0-${col}`}>
            {palace && (
              <PalaceCard
                {...palace}
                isSelected={selectedPalace === palace.name}
                onClick={() => setSelectedPalace(
                  selectedPalace === palace.name ? null : palace.name
                )}
              />
            )}
          </div>
        ))}

        {/* 第二行（左 + 中间 + 右） */}
        <div>
          {grid[1][0] && (
            <PalaceCard
              {...grid[1][0]}
              isSelected={selectedPalace === grid[1][0].name}
              onClick={() => setSelectedPalace(
                selectedPalace === grid[1][0]!.name ? null : grid[1][0]!.name
              )}
            />
          )}
        </div>
        <div className="col-span-2 row-span-2">
          <CenterInfo
            solarDate={solarDate}
            lunarDate={lunarDate}
            gender={gender}
            fiveElement={fiveElement}
          />
        </div>
        <div>
          {grid[1][3] && (
            <PalaceCard
              {...grid[1][3]}
              isSelected={selectedPalace === grid[1][3].name}
              onClick={() => setSelectedPalace(
                selectedPalace === grid[1][3]!.name ? null : grid[1][3]!.name
              )}
            />
          )}
        </div>

        {/* 第三行（左 + 右） */}
        <div>
          {grid[2][0] && (
            <PalaceCard
              {...grid[2][0]}
              isSelected={selectedPalace === grid[2][0].name}
              onClick={() => setSelectedPalace(
                selectedPalace === grid[2][0]!.name ? null : grid[2][0]!.name
              )}
            />
          )}
        </div>
        <div>
          {grid[2][3] && (
            <PalaceCard
              {...grid[2][3]}
              isSelected={selectedPalace === grid[2][3].name}
              onClick={() => setSelectedPalace(
                selectedPalace === grid[2][3]!.name ? null : grid[2][3]!.name
              )}
            />
          )}
        </div>

        {/* 第四行 */}
        {grid[3].map((palace, col) => (
          <div key={`3-${col}`}>
            {palace && (
              <PalaceCard
                {...palace}
                isSelected={selectedPalace === palace.name}
                onClick={() => setSelectedPalace(
                  selectedPalace === palace.name ? null : palace.name
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_6px_rgba(212,175,55,0.5)]" />
          <span className="text-xs text-text-muted">命宫</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-star-light shadow-[0_0_6px_rgba(167,139,250,0.5)]" />
          <span className="text-xs text-text-muted">身宫</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-fortune" />
          <span className="text-xs text-text-muted">化禄</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-misfortune" />
          <span className="text-xs text-text-muted">化忌</span>
        </div>
      </div>
    </div>
  )
}
