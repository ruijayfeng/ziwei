/* ============================================================
   命盘可视化组件
   紫微斗数命盘为 4x4 方格，中间为命主信息，周围十二宫
   ============================================================ */

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
   宫位卡片组件
   ------------------------------------------------------------ */

interface PalaceCardProps {
  name: string
  branch: string
  stars: string[]
  isLife?: boolean
  isBody?: boolean
}

function PalaceCard({ name, branch, stars, isLife, isBody }: PalaceCardProps) {
  return (
    <div
      className={`
        glass p-2 h-full min-h-[120px] flex flex-col
        ${isLife ? 'ring-2 ring-amber' : ''}
        ${isBody ? 'ring-2 ring-star' : ''}
      `}
    >
      {/* 宫位名称 */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">{branch}</span>
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded
            ${isLife ? 'bg-amber/20 text-amber' : ''}
            ${isBody ? 'bg-star/20 text-star-light' : ''}
            ${!isLife && !isBody ? 'text-text-secondary' : ''}
          `}
        >
          {name}
          {isLife && ' ★'}
          {isBody && ' ◎'}
        </span>
      </div>

      {/* 星曜列表 */}
      <div className="flex-1 flex flex-wrap gap-1 content-start">
        {stars.map((star, index) => (
          <span
            key={index}
            className={`
              text-xs px-1.5 py-0.5 rounded
              ${star.includes('化禄') ? 'bg-fortune/20 text-fortune' : ''}
              ${star.includes('化权') ? 'bg-amber/20 text-amber' : ''}
              ${star.includes('化科') ? 'bg-star/20 text-star-light' : ''}
              ${star.includes('化忌') ? 'bg-misfortune/20 text-misfortune' : ''}
              ${!star.includes('化') ? 'bg-white/5 text-text-secondary' : ''}
            `}
          >
            {star}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------
   中央信息区域
   ------------------------------------------------------------ */

interface CenterInfoProps {
  solarDate: string
  lunarDate: string
  gender: string
  fiveElement: string
}

function CenterInfo({ solarDate, lunarDate, gender, fiveElement }: CenterInfoProps) {
  return (
    <div className="glass p-4 flex flex-col items-center justify-center h-full">
      <h3 className="text-lg font-semibold text-amber mb-2">命盘信息</h3>
      <div className="text-sm text-text-secondary space-y-1 text-center">
        <p>阳历：{solarDate}</p>
        <p>农历：{lunarDate}</p>
        <p>性别：{gender}</p>
        <p className="text-star-light font-medium">{fiveElement}</p>
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
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-4 gap-2">
        {/* 第一行 */}
        {grid[0].map((palace, col) => (
          <div key={`0-${col}`}>
            {palace && <PalaceCard {...palace} />}
          </div>
        ))}

        {/* 第二行（左 + 中间 + 右） */}
        <div>{grid[1][0] && <PalaceCard {...grid[1][0]} />}</div>
        <div className="col-span-2 row-span-2">
          <CenterInfo
            solarDate={solarDate}
            lunarDate={lunarDate}
            gender={gender}
            fiveElement={fiveElement}
          />
        </div>
        <div>{grid[1][3] && <PalaceCard {...grid[1][3]} />}</div>

        {/* 第三行（左 + 右） */}
        <div>{grid[2][0] && <PalaceCard {...grid[2][0]} />}</div>
        <div>{grid[2][3] && <PalaceCard {...grid[2][3]} />}</div>

        {/* 第四行 */}
        {grid[3].map((palace, col) => (
          <div key={`3-${col}`}>
            {palace && <PalaceCard {...palace} />}
          </div>
        ))}
      </div>
    </div>
  )
}
