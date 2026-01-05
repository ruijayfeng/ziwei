/* ============================================================
   知识检索服务
   根据命盘数据检索相关知识，组装 AI 解读所需的上下文
   ============================================================ */

import { getStarInfo, type StarInfo } from './stars/majorStars'
import { getPalaceInfo, type PalaceInfo } from './palaces'
import { getSihuaInfo, type SihuaInfo } from './sihua'
import type FunctionalAstrolabe from 'iztro/lib/astro/FunctionalAstrolabe'

/* ------------------------------------------------------------
   知识上下文类型
   ------------------------------------------------------------ */

export interface KnowledgeContext {
  命宫主星: StarInfo[]
  身宫主星: StarInfo[]
  重要宫位: Array<{
    palace: PalaceInfo
    stars: StarInfo[]
    mutagens: Array<{ star: string; mutagen: SihuaInfo }>
  }>
  四化分布: Array<{
    sihua: SihuaInfo
    star: string
    palace: string
  }>
  格局提示: string[]
}

/* ------------------------------------------------------------
   从命盘提取知识上下文
   ------------------------------------------------------------ */

export function extractKnowledge(chart: FunctionalAstrolabe): KnowledgeContext {
  const context: KnowledgeContext = {
    命宫主星: [],
    身宫主星: [],
    重要宫位: [],
    四化分布: [],
    格局提示: [],
  }

  const palaces = chart.palaces || []

  // 提取命宫和身宫主星
  for (const palace of palaces) {
    const palaceName = palace.name as string
    const majorStars = palace.majorStars || []

    // 命宫主星
    if (palaceName === '命宫') {
      for (const star of majorStars) {
        const info = getStarInfo(star.name as string)
        if (info) context.命宫主星.push(info)
      }
    }

    // 身宫主星
    if (palace.isBodyPalace) {
      for (const star of majorStars) {
        const info = getStarInfo(star.name as string)
        if (info) context.身宫主星.push(info)
      }
    }

    // 收集四化分布
    for (const star of majorStars) {
      if (star.mutagen) {
        const sihuaInfo = getSihuaInfo(star.mutagen as string)
        if (sihuaInfo) {
          context.四化分布.push({
            sihua: sihuaInfo,
            star: star.name as string,
            palace: palaceName,
          })
        }
      }
    }
  }

  // 提取重要宫位信息（命宫三方四正 + 财帛 + 官禄 + 夫妻）
  const importantPalaces = ['命宫', '财帛宫', '官禄宫', '夫妻宫', '福德宫']

  for (const palaceName of importantPalaces) {
    const palace = palaces.find(p => p.name === palaceName)
    if (!palace) continue

    const palaceInfo = getPalaceInfo(palaceName)
    if (!palaceInfo) continue

    const stars: StarInfo[] = []
    const mutagensList: Array<{ star: string; mutagen: SihuaInfo }> = []

    for (const star of palace.majorStars || []) {
      const starInfo = getStarInfo(star.name as string)
      if (starInfo) stars.push(starInfo)

      if (star.mutagen) {
        const sihuaInfo = getSihuaInfo(star.mutagen as string)
        if (sihuaInfo) {
          mutagensList.push({ star: star.name as string, mutagen: sihuaInfo })
        }
      }
    }

    context.重要宫位.push({
      palace: palaceInfo,
      stars,
      mutagens: mutagensList,
    })
  }

  // 生成格局提示
  context.格局提示 = detectPatterns(chart)

  return context
}

/* ------------------------------------------------------------
   格局检测（简化版）
   ------------------------------------------------------------ */

function detectPatterns(chart: FunctionalAstrolabe): string[] {
  const patterns: string[] = []
  const palaces = chart.palaces || []

  // 找命宫
  const lifePalace = palaces.find(p => p.name === '命宫')
  if (!lifePalace) return patterns

  const majorStarNames = (lifePalace.majorStars || []).map(s => s.name as string)

  // 紫府同宫
  if (majorStarNames.includes('紫微') && majorStarNames.includes('天府')) {
    patterns.push('紫府同宫：紫微与天府同在命宫，帝星与财库星同宫，富贵格局。')
  }

  // 紫杀同宫
  if (majorStarNames.includes('紫微') && majorStarNames.includes('七杀')) {
    patterns.push('紫杀同宫：紫微与七杀同宫，权威与冲劲结合，有开创能力。')
  }

  // 机月同梁
  const hasJiyue = majorStarNames.includes('天机') || majorStarNames.includes('太阴')
  const hasTongliang = majorStarNames.includes('天同') || majorStarNames.includes('天梁')
  if (hasJiyue && hasTongliang) {
    patterns.push('机月同梁：文星组合，适合公职、文教、服务类工作。')
  }

  // 空宫
  if (majorStarNames.length === 0) {
    patterns.push('命宫无主星：需借对宫星曜论断，人生较多变化。')
  }

  // 检查化忌入命
  for (const star of lifePalace.majorStars || []) {
    if (String(star.mutagen) === '化忌') {
      patterns.push(`${star.name}化忌入命：需特别关注该星所主事项，有执着与困扰。`)
    }
  }

  return patterns
}

/* ------------------------------------------------------------
   生成 AI 提示词上下文
   ------------------------------------------------------------ */

export function buildPromptContext(context: KnowledgeContext): string {
  const lines: string[] = []

  lines.push('【命盘关键信息】')
  lines.push('')

  // 命宫主星
  if (context.命宫主星.length > 0) {
    lines.push('## 命宫主星')
    for (const star of context.命宫主星) {
      lines.push(`- ${star.name}（${star.group}）：${star.description}`)
    }
    lines.push('')
  }

  // 身宫主星
  if (context.身宫主星.length > 0) {
    lines.push('## 身宫主星')
    for (const star of context.身宫主星) {
      lines.push(`- ${star.name}：${star.description}`)
    }
    lines.push('')
  }

  // 重要宫位
  lines.push('## 重要宫位分析')
  for (const item of context.重要宫位) {
    const starNames = item.stars.map(s => s.name).join('、') || '无主星'
    const mutagenStr = item.mutagens.map(m => `${m.star}${m.mutagen.name}`).join('、')
    lines.push(`- ${item.palace.name}（${item.palace.domain}）：${starNames}${mutagenStr ? ` [${mutagenStr}]` : ''}`)
  }
  lines.push('')

  // 四化分布
  if (context.四化分布.length > 0) {
    lines.push('## 四化分布')
    for (const item of context.四化分布) {
      lines.push(`- ${item.star}${item.sihua.name}入${item.palace}：${item.sihua.effect}`)
    }
    lines.push('')
  }

  // 格局提示
  if (context.格局提示.length > 0) {
    lines.push('## 格局提示')
    for (const pattern of context.格局提示) {
      lines.push(`- ${pattern}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/* ------------------------------------------------------------
   导出知识库模块
   ------------------------------------------------------------ */

export * from './stars/majorStars'
export * from './palaces'
export * from './sihua'
