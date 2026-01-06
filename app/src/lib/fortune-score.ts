/* ============================================================
   人生 K 线 - 运势评分引擎
   ============================================================

   评分公式:
   总分 = Σ(星曜基础分 × 亮度系数) + 四化修正 + 格局加成

   分数范围: 0-100
   - 80+ 大吉
   - 60-79 吉
   - 40-59 平
   - 20-39 凶
   - 0-19 大凶
   ============================================================ */

import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'

/* ============================================================
   类型定义
   ============================================================ */

export interface FortuneScore {
  total: number              // 综合得分 0-100
  trend: 'up' | 'down' | 'flat'  // 涨跌趋势
  dimensions: {
    career: number           // 事业运 (官禄宫)
    wealth: number           // 财运 (财帛宫)
    relationship: number     // 感情运 (夫妻宫)
    health: number           // 健康运 (疾厄宫)
  }
}

export interface KLineData {
  period: string             // "6-15" (大限) 或 "2025" (流年)
  type: 'decadal' | 'yearly' | 'monthly'
  open: number               // 期初运势
  high: number               // 最高点
  low: number                // 最低点
  close: number              // 期末运势
  score: FortuneScore        // 详细评分
  events: EventData[]        // 关键事件
}

export interface EventData {
  type: 'positive' | 'negative'
  title: string              // 简短标题
  description?: string       // LLM 生成的详细描述
  stars: string[]            // 相关星曜
}

/* ============================================================
   星曜基础分表
   ============================================================

   分值设计原则:
   - 紫微、天府等帝星: +15~20
   - 六吉星: +8~12
   - 中性主星: +5~10
   - 六煞星: -8~15
   - 化禄/权/科加成, 化忌减分
   ============================================================ */

const STAR_BASE_SCORE: Record<string, number> = {
  // ─── 紫微星系 (帝王之星) ───
  '紫微': 18,
  '天机': 10,
  '太阳': 12,
  '武曲': 11,
  '天同': 9,
  '廉贞': 8,

  // ─── 天府星系 (财官之星) ───
  '天府': 16,
  '太阴': 11,
  '贪狼': 10,
  '巨门': 6,
  '天相': 12,
  '天梁': 11,
  '七杀': 7,
  '破军': 6,

  // ─── 六吉星 ───
  '左辅': 10,
  '右弼': 10,
  '文昌': 9,
  '文曲': 9,
  '天魁': 11,
  '天钺': 11,

  // ─── 六煞星 ───
  '擎羊': -12,
  '陀罗': -10,
  '火星': -8,
  '铃星': -8,
  '地空': -9,
  '地劫': -9,

  // ─── 禄存天马 ───
  '禄存': 12,
  '天马': 8,

  // ─── 其他辅星 ───
  '红鸾': 6,
  '天喜': 6,
  '天刑': -4,
  '天姚': 3,
  '天哭': -3,
  '天虚': -3,
  '龙池': 4,
  '凤阁': 4,
  '华盖': 2,
  '咸池': -2,
  '天德': 5,
  '月德': 5,
  '天官': 4,
  '天福': 4,
  '解神': 5,
  '天巫': 3,
  '天月': -2,
  '阴煞': -5,
  '台辅': 3,
  '封诰': 3,
  '三台': 4,
  '八座': 4,
  '恩光': 3,
  '天贵': 3,
}

/* ============================================================
   亮度系数表
   ============================================================ */

const BRIGHTNESS_COEF: Record<string, number> = {
  '庙': 1.5,
  '旺': 1.3,
  '得': 1.1,
  '利': 1.0,
  '平': 0.9,
  '不': 0.7,
  '陷': 0.5,
}

/* ============================================================
   四化修正值
   ============================================================ */

const SIHUA_MODIFIER: Record<string, number> = {
  '禄': 15,   // 化禄: 财运亨通
  '权': 12,   // 化权: 权力提升
  '科': 10,   // 化科: 名声贵人
  '忌': -18,  // 化忌: 阻碍困扰
}

/* ============================================================
   宫位权重 (用于分维度计算)
   ============================================================ */

const PALACE_WEIGHTS = {
  career: ['官禄', '命宫', '迁移'],
  wealth: ['财帛', '福德', '田宅'],
  relationship: ['夫妻', '子女', '兄弟'],
  health: ['疾厄', '父母', '命宫'],
}

/* ============================================================
   核心评分函数
   ============================================================ */

/**
 * 计算单个宫位的得分
 */
function calculatePalaceScore(palace: {
  majorStars: Array<{ name: string; brightness?: string; mutagen?: string[] }>
  minorStars: Array<{ name: string; mutagen?: string[] }>
  adjectiveStars?: Array<{ name: string }>
}): number {
  let score = 50  // 基础分 50

  // 主星评分
  for (const star of palace.majorStars) {
    const baseName = star.name.replace(/[化禄权科忌]/, '')
    const baseScore = STAR_BASE_SCORE[baseName] || 0

    // 亮度系数
    const brightness = star.brightness || '平'
    const coef = BRIGHTNESS_COEF[brightness] || 1.0

    score += baseScore * coef

    // 四化修正
    if (star.mutagen) {
      for (const m of star.mutagen) {
        score += SIHUA_MODIFIER[m] || 0
      }
    }
  }

  // 辅星评分
  for (const star of palace.minorStars) {
    const baseName = star.name.replace(/[化禄权科忌]/, '')
    score += STAR_BASE_SCORE[baseName] || 0

    if (star.mutagen) {
      for (const m of star.mutagen) {
        score += SIHUA_MODIFIER[m] || 0
      }
    }
  }

  // 杂曜评分 (权重较低)
  if (palace.adjectiveStars) {
    for (const star of palace.adjectiveStars) {
      score += (STAR_BASE_SCORE[star.name] || 0) * 0.5
    }
  }

  return score
}

/**
 * 计算指定时间段的综合运势
 */
export function calculatePeriodScore(
  chart: FunctionalAstrolabe,
  year: number
): FortuneScore {
  const horoscope = chart.horoscope(new Date(`${year}-6-15`))
  const palaces = chart.palaces

  // 计算各宫位得分
  const palaceScores: Record<string, number> = {}

  for (const palace of palaces) {
    // 转换 mutagen 类型: iztro 返回 string | string[] | undefined，统一为 string[]
    const normalizeMutagen = (m: unknown): string[] | undefined => {
      if (!m) return undefined
      if (Array.isArray(m)) return m as string[]
      if (typeof m === 'string') return [m]
      return undefined
    }

    const palaceData = {
      majorStars: palace.majorStars.map(s => ({
        name: String(s.name),
        brightness: s.brightness ? String(s.brightness) : undefined,
        mutagen: normalizeMutagen(s.mutagen),
      })),
      minorStars: palace.minorStars.map(s => ({
        name: String(s.name),
        mutagen: normalizeMutagen(s.mutagen),
      })),
      adjectiveStars: palace.adjectiveStars?.map(s => ({ name: String(s.name) })),
    }
    palaceScores[palace.name] = calculatePalaceScore(palaceData)
  }

  // 流年四化加成
  const yearlyMutagen = horoscope.yearly.mutagen || []
  let yearlyBonus = 0
  for (const star of yearlyMutagen) {
    const mutagen = star.includes('禄') ? '禄'
                  : star.includes('权') ? '权'
                  : star.includes('科') ? '科'
                  : star.includes('忌') ? '忌' : null
    if (mutagen) {
      yearlyBonus += SIHUA_MODIFIER[mutagen] || 0
    }
  }

  // 计算分维度得分
  const dimensions = {
    career: calculateDimensionScore(palaceScores, PALACE_WEIGHTS.career),
    wealth: calculateDimensionScore(palaceScores, PALACE_WEIGHTS.wealth),
    relationship: calculateDimensionScore(palaceScores, PALACE_WEIGHTS.relationship),
    health: calculateDimensionScore(palaceScores, PALACE_WEIGHTS.health),
  }

  // 综合得分 = 各维度加权平均 + 流年加成
  const total = Math.round(
    (dimensions.career * 0.3 +
     dimensions.wealth * 0.25 +
     dimensions.relationship * 0.25 +
     dimensions.health * 0.2 +
     yearlyBonus)
  )

  // 归一化到 0-100
  const normalizedTotal = Math.max(0, Math.min(100, total))

  return {
    total: normalizedTotal,
    trend: 'flat',  // 后续根据前后对比计算
    dimensions: {
      career: normalize(dimensions.career),
      wealth: normalize(dimensions.wealth),
      relationship: normalize(dimensions.relationship),
      health: normalize(dimensions.health),
    },
  }
}

/**
 * 计算维度得分
 */
function calculateDimensionScore(
  palaceScores: Record<string, number>,
  palaceNames: string[]
): number {
  let sum = 0
  let count = 0
  for (const name of palaceNames) {
    if (palaceScores[name] !== undefined) {
      sum += palaceScores[name]
      count++
    }
  }
  return count > 0 ? sum / count : 50
}

/**
 * 归一化到 0-100
 */
function normalize(score: number): number {
  // 原始分数大概在 30-80 范围，映射到 0-100
  const min = 20
  const max = 90
  const normalized = ((score - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, Math.round(normalized)))
}

/* ============================================================
   K 线数据生成
   ============================================================ */

/**
 * 生成大限 K 线数据
 * 每个大限的 OHLC 基于该大限期间内10年的真实数据
 */
export function generateDecadalKLines(
  chart: FunctionalAstrolabe
): KLineData[] {
  const klines: KLineData[] = []
  const palaces = chart.palaces
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - 30 // 假设用户约30岁，可从birthInfo获取

  // 遍历每个宫位的大限
  for (const palace of palaces) {
    const decadal = palace.decadal
    if (!decadal?.range) continue

    const [startAge, endAge] = decadal.range

    // 计算该大限对应的年份范围
    const startYear = birthYear + startAge
    const endYear = birthYear + endAge

    // 计算该大限期间内每年的分数
    const yearlyScores: number[] = []
    for (let year = startYear; year <= endYear; year++) {
      // 获取该年12个月的平均分
      const monthlyScores = calculateRealMonthlyScoresForDecadal(chart, year, palace)
      const avgScore = monthlyScores.reduce((a, b) => a + b, 0) / monthlyScores.length
      yearlyScores.push(avgScore)
    }

    // 如果没有有效数据，使用宫位基础评分
    if (yearlyScores.length === 0) {
      const baseScore = calculatePalaceBaseScore(palace)
      yearlyScores.push(baseScore, baseScore * 0.95, baseScore * 1.05)
    }

    // 转换 palace 类型供 generateBasicEvents 使用
    const normalizeMutagen = (m: unknown): string[] | undefined => {
      if (!m) return undefined
      if (Array.isArray(m)) return m as string[]
      if (typeof m === 'string') return [m]
      return undefined
    }

    const palaceForEvents = {
      name: String(palace.name),
      majorStars: palace.majorStars.map(s => ({
        name: String(s.name),
        mutagen: normalizeMutagen(s.mutagen),
      })),
      minorStars: palace.minorStars.map(s => ({
        name: String(s.name),
      })),
    }

    // 计算综合得分
    const avgScore = yearlyScores.reduce((a, b) => a + b, 0) / yearlyScores.length

    klines.push({
      period: `${startAge}-${endAge}`,
      type: 'decadal',
      open: yearlyScores[0],
      high: Math.max(...yearlyScores),
      low: Math.min(...yearlyScores),
      close: yearlyScores[yearlyScores.length - 1],
      score: {
        total: Math.round(avgScore),
        trend: 'flat',
        dimensions: calculateDecadalDimensions(palace),
      },
      events: generateBasicEvents(palaceForEvents, { total: avgScore, trend: 'flat', dimensions: { career: 50, wealth: 50, relationship: 50, health: 50 } }),
    })
  }

  // 按年龄排序
  klines.sort((a, b) => {
    const aStart = parseInt(a.period.split('-')[0])
    const bStart = parseInt(b.period.split('-')[0])
    return aStart - bStart
  })

  // 计算趋势
  for (let i = 1; i < klines.length; i++) {
    const prev = klines[i - 1].close
    const curr = klines[i].close
    klines[i].score.trend = curr > prev ? 'up' : curr < prev ? 'down' : 'flat'
  }

  return klines
}

/**
 * 计算大限期间某年的月度分数 (简化版，基于大限宫位)
 */
function calculateRealMonthlyScoresForDecadal(
  chart: FunctionalAstrolabe,
  year: number,
  decadalPalace: typeof chart.palaces[0]
): number[] {
  const scores: number[] = []
  const palaceBaseScore = calculatePalaceBaseScore(decadalPalace)

  for (let month = 1; month <= 12; month++) {
    try {
      const date = new Date(`${year}-${String(month).padStart(2, '0')}-15`)
      const horoscope = chart.horoscope(date)

      let monthScore = palaceBaseScore

      // 流月四化调整
      const monthlyMutagen = horoscope.monthly.mutagen || []
      for (const star of monthlyMutagen) {
        const starName = String(star)
        if (starName.includes('禄')) monthScore += 10
        else if (starName.includes('权')) monthScore += 8
        else if (starName.includes('科')) monthScore += 6
        else if (starName.includes('忌')) monthScore -= 12
      }

      // 流年四化调整
      const yearlyMutagen = horoscope.yearly.mutagen || []
      for (const star of yearlyMutagen) {
        const starName = String(star)
        if (starName.includes('禄')) monthScore += 6
        else if (starName.includes('权')) monthScore += 5
        else if (starName.includes('科')) monthScore += 4
        else if (starName.includes('忌')) monthScore -= 8
      }

      scores.push(Math.max(15, Math.min(95, monthScore)))
    } catch {
      scores.push(palaceBaseScore)
    }
  }

  return scores
}

/**
 * 计算宫位基础分数
 */
function calculatePalaceBaseScore(palace: { majorStars: Array<{ name: unknown; brightness?: unknown; mutagen?: unknown }>; minorStars: Array<{ name: unknown }> }): number {
  let score = 50

  // 主星评分
  for (const star of palace.majorStars) {
    const name = String(star.name)
    const baseScore = STAR_BASE_SCORE[name] || 0
    const brightness = star.brightness ? String(star.brightness) : '平'
    const coef = BRIGHTNESS_COEF[brightness] || 1.0

    score += baseScore * coef * 0.5

    // 四化
    if (star.mutagen) {
      const mutagen = String(star.mutagen)
      if (mutagen.includes('禄')) score += 8
      else if (mutagen.includes('权')) score += 6
      else if (mutagen.includes('科')) score += 5
      else if (mutagen.includes('忌')) score -= 10
    }
  }

  // 辅星
  for (const star of palace.minorStars) {
    const name = String(star.name)
    score += (STAR_BASE_SCORE[name] || 0) * 0.3
  }

  return Math.max(20, Math.min(90, score))
}

/**
 * 计算大限四维度分数
 */
function calculateDecadalDimensions(palace: { majorStars: Array<{ name: unknown; brightness?: unknown; mutagen?: unknown }>; minorStars: Array<{ name: unknown }> }): FortuneScore['dimensions'] {
  const base = calculatePalaceBaseScore(palace)

  return {
    career: normalize(base + (Math.random() - 0.5) * 15),
    wealth: normalize(base * 0.9 + (Math.random() - 0.5) * 15),
    relationship: normalize(base * 0.85 + (Math.random() - 0.5) * 15),
    health: normalize(base * 0.95 + (Math.random() - 0.5) * 15),
  }
}

/**
 * 生成流年 K 线数据 (当前年 + 未来3年)
 * 每年的 OHLC 基于12个月的真实流月盘数据
 */
export function generateYearlyKLines(
  chart: FunctionalAstrolabe,
  startYear?: number
): KLineData[] {
  const currentYear = startYear || new Date().getFullYear()
  const klines: KLineData[] = []

  for (let year = currentYear; year <= currentYear + 3; year++) {
    // 计算12个月的真实分数
    const monthlyScores = calculateRealMonthlyScores(chart, year)
    const yearScore = calculatePeriodScore(chart, year)

    // 找出最高和最低月份用于事件标注
    const maxMonth = monthlyScores.indexOf(Math.max(...monthlyScores)) + 1
    const minMonth = monthlyScores.indexOf(Math.min(...monthlyScores)) + 1

    const events: EventData[] = []
    if (Math.max(...monthlyScores) - Math.min(...monthlyScores) > 15) {
      events.push({
        type: 'positive',
        title: `${maxMonth}月运势高峰`,
        stars: [],
      })
      events.push({
        type: 'negative',
        title: `${minMonth}月运势低谷`,
        stars: [],
      })
    }

    klines.push({
      period: String(year),
      type: 'yearly',
      open: monthlyScores[0],
      high: Math.max(...monthlyScores),
      low: Math.min(...monthlyScores),
      close: monthlyScores[11],
      score: yearScore,
      events,
    })
  }

  // 计算趋势
  for (let i = 1; i < klines.length; i++) {
    const prev = klines[i - 1].close
    const curr = klines[i].close
    klines[i].score.trend = curr > prev ? 'up' : curr < prev ? 'down' : 'flat'
  }

  return klines
}

/**
 * 生成月度 K 线数据 (指定年份12个月)
 * 使用真实流月盘数据
 */
export function generateMonthlyKLines(
  chart: FunctionalAstrolabe,
  year: number
): KLineData[] {
  const klines: KLineData[] = []

  // 计算12个月的真实分数
  const monthlyScores = calculateRealMonthlyScores(chart, year)

  for (let month = 1; month <= 12; month++) {
    const monthScore = monthlyScores[month - 1]

    // 计算该月内的周度波动 (基于月度分数的小范围真实波动)
    const weeklyScores = calculateWeeklyVariation(chart, year, month, monthScore)

    // 获取该月的流月盘数据生成事件
    const events = generateMonthlyEvents(chart, year, month)

    klines.push({
      period: `${month}月`,
      type: 'monthly',
      open: weeklyScores[0],
      high: Math.max(...weeklyScores),
      low: Math.min(...weeklyScores),
      close: weeklyScores[3],
      score: {
        total: Math.round(monthScore),
        trend: 'flat',
        dimensions: calculateMonthlyDimensions(chart, year, month),
      },
      events,
    })
  }

  // 计算趋势
  for (let i = 1; i < klines.length; i++) {
    const prev = klines[i - 1].close
    const curr = klines[i].close
    klines[i].score.trend = curr > prev ? 'up' : curr < prev ? 'down' : 'flat'
  }

  return klines
}

/**
 * 计算某年12个月的真实分数
 * 基于流月盘的四化和星曜
 */
function calculateRealMonthlyScores(
  chart: FunctionalAstrolabe,
  year: number
): number[] {
  const scores: number[] = []

  for (let month = 1; month <= 12; month++) {
    const date = new Date(`${year}-${String(month).padStart(2, '0')}-15`)
    const horoscope = chart.horoscope(date)

    // 基础分：流年分数
    let baseScore = 50

    // 流月四化加成
    const monthlyMutagen = horoscope.monthly.mutagen || []
    for (const star of monthlyMutagen) {
      const starName = String(star)
      if (starName.includes('禄')) baseScore += 12
      else if (starName.includes('权')) baseScore += 10
      else if (starName.includes('科')) baseScore += 8
      else if (starName.includes('忌')) baseScore -= 15
    }

    // 流年四化叠加
    const yearlyMutagen = horoscope.yearly.mutagen || []
    for (const star of yearlyMutagen) {
      const starName = String(star)
      if (starName.includes('禄')) baseScore += 8
      else if (starName.includes('权')) baseScore += 6
      else if (starName.includes('科')) baseScore += 5
      else if (starName.includes('忌')) baseScore -= 10
    }

    // 流月命宫位置影响 (不同宫位有不同基础运势)
    const monthlyPalaceIndex = horoscope.monthly.index
    const palaceModifier = getPalaceModifier(chart, monthlyPalaceIndex)
    baseScore += palaceModifier

    // 归一化
    scores.push(Math.max(15, Math.min(95, baseScore)))
  }

  return scores
}

/**
 * 获取宫位的运势修正值
 */
function getPalaceModifier(chart: FunctionalAstrolabe, palaceIndex: number): number {
  const palace = chart.palaces[palaceIndex]
  if (!palace) return 0

  let modifier = 0

  // 主星评分
  for (const star of palace.majorStars) {
    const name = String(star.name)
    const baseScore = STAR_BASE_SCORE[name] || 0

    // 亮度系数
    const brightness = star.brightness ? String(star.brightness) : '平'
    const coef = BRIGHTNESS_COEF[brightness] || 1.0

    modifier += baseScore * coef * 0.3  // 降低权重避免过大波动

    // 四化
    if (star.mutagen) {
      const mutagen = String(star.mutagen)
      if (mutagen.includes('禄')) modifier += 5
      else if (mutagen.includes('权')) modifier += 4
      else if (mutagen.includes('科')) modifier += 3
      else if (mutagen.includes('忌')) modifier -= 8
    }
  }

  // 辅星
  for (const star of palace.minorStars) {
    const name = String(star.name)
    modifier += (STAR_BASE_SCORE[name] || 0) * 0.2
  }

  return modifier
}

/**
 * 计算周度波动 (4周)
 */
function calculateWeeklyVariation(
  chart: FunctionalAstrolabe,
  year: number,
  month: number,
  baseScore: number
): number[] {
  const weeks: number[] = []

  for (let week = 1; week <= 4; week++) {
    const day = Math.min(week * 7, 28)
    const date = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)

    try {
      const horoscope = chart.horoscope(date)

      // 流日四化微调
      let weekScore = baseScore
      const dailyMutagen = horoscope.daily?.mutagen || []

      for (const star of dailyMutagen) {
        const starName = String(star)
        if (starName.includes('禄')) weekScore += 3
        else if (starName.includes('权')) weekScore += 2
        else if (starName.includes('科')) weekScore += 2
        else if (starName.includes('忌')) weekScore -= 5
      }

      weeks.push(Math.max(10, Math.min(95, weekScore)))
    } catch {
      weeks.push(baseScore)
    }
  }

  return weeks
}

/**
 * 计算月度四维度分数
 */
function calculateMonthlyDimensions(
  chart: FunctionalAstrolabe,
  year: number,
  month: number
): FortuneScore['dimensions'] {
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-15`)
  const horoscope = chart.horoscope(date)

  // 基于流月命宫位置计算各维度
  const monthlyPalaceIndex = horoscope.monthly.index

  // 简化计算：基于宫位轮转
  const base = 50
  const palaceBonus = getPalaceModifier(chart, monthlyPalaceIndex)

  return {
    career: normalize(base + palaceBonus + (Math.random() - 0.5) * 10),
    wealth: normalize(base + palaceBonus * 0.8 + (Math.random() - 0.5) * 10),
    relationship: normalize(base + palaceBonus * 0.6 + (Math.random() - 0.5) * 10),
    health: normalize(base + palaceBonus * 0.7 + (Math.random() - 0.5) * 10),
  }
}

/**
 * 生成月度事件
 */
function generateMonthlyEvents(
  chart: FunctionalAstrolabe,
  year: number,
  month: number
): EventData[] {
  const events: EventData[] = []
  const date = new Date(`${year}-${String(month).padStart(2, '0')}-15`)

  try {
    const horoscope = chart.horoscope(date)
    const monthlyMutagen = horoscope.monthly.mutagen || []

    for (const star of monthlyMutagen) {
      const starName = String(star)
      if (starName.includes('禄')) {
        events.push({
          type: 'positive',
          title: starName,
          stars: [starName.replace('化禄', '')],
        })
      } else if (starName.includes('忌')) {
        events.push({
          type: 'negative',
          title: starName,
          stars: [starName.replace('化忌', '')],
        })
      }
    }
  } catch {
    // 忽略错误
  }

  return events
}

/* ============================================================
   事件生成 (基础版，LLM 增强版在组件中)
   ============================================================ */

function generateBasicEvents(
  palace: {
    name: string
    majorStars: Array<{ name: string; mutagen?: string[] }>
    minorStars: Array<{ name: string }>
  },
  _score: FortuneScore
): EventData[] {
  const events: EventData[] = []

  // 检测四化事件
  for (const star of palace.majorStars) {
    if (star.mutagen?.includes('禄')) {
      events.push({
        type: 'positive',
        title: `${star.name}化禄`,
        stars: [star.name],
      })
    }
    if (star.mutagen?.includes('忌')) {
      events.push({
        type: 'negative',
        title: `${star.name}化忌`,
        stars: [star.name],
      })
    }
  }

  // 检测吉星汇聚
  const auspiciousStars = ['左辅', '右弼', '天魁', '天钺', '文昌', '文曲']
  const presentAuspicious = palace.minorStars
    .filter(s => auspiciousStars.includes(s.name))
    .map(s => s.name)

  if (presentAuspicious.length >= 2) {
    events.push({
      type: 'positive',
      title: '吉星汇聚',
      stars: presentAuspicious,
    })
  }

  // 检测煞星冲击
  const maleficStars = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫']
  const presentMalefic = palace.minorStars
    .filter(s => maleficStars.includes(s.name))
    .map(s => s.name)

  if (presentMalefic.length >= 2) {
    events.push({
      type: 'negative',
      title: '煞星云集',
      stars: presentMalefic,
    })
  }

  return events
}

/* ============================================================
   导出
   ============================================================ */

export { STAR_BASE_SCORE, BRIGHTNESS_COEF, SIHUA_MODIFIER }
