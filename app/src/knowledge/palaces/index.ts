/* ============================================================
   十二宫位知识库
   来源：03-宫位系统/01-十二宫详解.md
   ============================================================ */

export interface PalaceInfo {
  name: string
  index: number
  domain: string
  description: string
  sanfang: string[]  // 三方（会照宫位）
  duigong: string    // 对宫
  keywords: string[]
}

export const PALACES: Record<string, PalaceInfo> = {
  '命宫': {
    name: '命宫',
    index: 0,
    domain: '自我、性格、外貌、能力、一生总论',
    description: '命宫是整个命盘的核心，代表命主的先天特质、性格、外貌、能力倾向以及一生的总体格局。命宫主星及其组合决定了人生的基调。',
    sanfang: ['财帛宫', '官禄宫'],
    duigong: '迁移宫',
    keywords: ['性格', '外貌', '能力', '命运'],
  },
  '兄弟宫': {
    name: '兄弟宫',
    index: 1,
    domain: '兄弟姐妹、朋友、合作伙伴、竞争对手',
    description: '兄弟宫主管与兄弟姐妹、朋友、同事的关系。现代解读延伸为合作伙伴、竞争对手等平辈关系。',
    sanfang: ['疾厄宫', '田宅宫'],
    duigong: '仆役宫',
    keywords: ['兄弟', '朋友', '合作', '竞争'],
  },
  '夫妻宫': {
    name: '夫妻宫',
    index: 2,
    domain: '婚姻、感情、配偶、亲密关系',
    description: '夫妻宫主管婚姻感情生活，可看出配偶的特质、婚姻状况、感情模式等。',
    sanfang: ['迁移宫', '福德宫'],
    duigong: '官禄宫',
    keywords: ['婚姻', '感情', '配偶', '恋爱'],
  },
  '子女宫': {
    name: '子女宫',
    index: 3,
    domain: '子女、晚辈、学生、下属、性生活',
    description: '子女宫主管与子女、晚辈的关系，也代表性生活、创造力、投资行为等。',
    sanfang: ['父母宫', '仆役宫'],
    duigong: '田宅宫',
    keywords: ['子女', '晚辈', '创造', '投资'],
  },
  '财帛宫': {
    name: '财帛宫',
    index: 4,
    domain: '财运、收入、理财能力、金钱观',
    description: '财帛宫主管财富运势，包括赚钱能力、收入状况、理财方式、金钱价值观等。',
    sanfang: ['命宫', '官禄宫'],
    duigong: '福德宫',
    keywords: ['财运', '收入', '理财', '金钱'],
  },
  '疾厄宫': {
    name: '疾厄宫',
    index: 5,
    domain: '健康、疾病、灾厄、身体状况',
    description: '疾厄宫主管身体健康状况，可看出容易患的疾病类型、身体弱点、意外灾厄等。',
    sanfang: ['兄弟宫', '田宅宫'],
    duigong: '父母宫',
    keywords: ['健康', '疾病', '灾厄', '身体'],
  },
  '迁移宫': {
    name: '迁移宫',
    index: 6,
    domain: '出外、旅行、人际关系、社会表现',
    description: '迁移宫主管外出运势、社交能力、在外的表现。与命宫对照可看出内外差异。',
    sanfang: ['夫妻宫', '福德宫'],
    duigong: '命宫',
    keywords: ['出外', '旅行', '社交', '表现'],
  },
  '仆役宫': {
    name: '仆役宫',
    index: 7,
    domain: '下属、员工、朋友、社交圈',
    description: '仆役宫主管与下属、员工、朋友的关系，也代表社交圈、人脉资源等。现代也称"交友宫"。',
    sanfang: ['子女宫', '父母宫'],
    duigong: '兄弟宫',
    keywords: ['下属', '员工', '朋友', '人脉'],
  },
  '官禄宫': {
    name: '官禄宫',
    index: 8,
    domain: '事业、工作、职业、社会地位',
    description: '官禄宫主管事业运势，包括职业选择、工作表现、事业成就、社会地位等。是论断事业的主要宫位。',
    sanfang: ['命宫', '财帛宫'],
    duigong: '夫妻宫',
    keywords: ['事业', '工作', '职业', '地位'],
  },
  '田宅宫': {
    name: '田宅宫',
    index: 9,
    domain: '房产、不动产、家庭环境、祖产',
    description: '田宅宫主管不动产运势，包括房产、土地、家庭环境、居住条件、祖产继承等。',
    sanfang: ['兄弟宫', '疾厄宫'],
    duigong: '子女宫',
    keywords: ['房产', '不动产', '家庭', '祖产'],
  },
  '福德宫': {
    name: '福德宫',
    index: 10,
    domain: '精神生活、福气、享受、兴趣爱好',
    description: '福德宫主管精神生活层面，包括内心世界、福气、享受能力、兴趣爱好、晚年状况等。',
    sanfang: ['夫妻宫', '迁移宫'],
    duigong: '财帛宫',
    keywords: ['精神', '福气', '享受', '兴趣'],
  },
  '父母宫': {
    name: '父母宫',
    index: 11,
    domain: '父母、长辈、上司、贵人',
    description: '父母宫主管与父母、长辈的关系，也代表上司、贵人、学业、名誉等。',
    sanfang: ['子女宫', '仆役宫'],
    duigong: '疾厄宫',
    keywords: ['父母', '长辈', '上司', '贵人'],
  },
}

/* ------------------------------------------------------------
   根据宫位名称获取信息
   ------------------------------------------------------------ */

export function getPalaceInfo(palaceName: string): PalaceInfo | undefined {
  return PALACES[palaceName]
}

/* ------------------------------------------------------------
   获取三方四正宫位
   ------------------------------------------------------------ */

export function getSanfangSizheng(palaceName: string): string[] {
  const palace = PALACES[palaceName]
  if (!palace) return []
  return [palaceName, ...palace.sanfang, palace.duigong]
}
