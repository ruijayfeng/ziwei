# MEMORY - 易失性工作区

> 当前任务栈、开发进度、核心逻辑地图

## 当前状态

```
[分享卡片重构] 2026-01-07
命格金句卡设计 + html2canvas 兼容性修复（布局一致性待优化）
```

## 变更日志

### 2026-01-07 分享卡片重构 - 命格金句卡

**设计理念**
- 面向小红书用户：颜值 > 信息量，金句 > 长篇分析
- 紫微命理风格：玄黑背景 + 金色点缀 + 书法字体
- 社交传播优化：戳心金句引发共鸣，非命盘信息堆砌

**功能实现**
- AI 提示词增加"陆· 命格金句"章节
- 自动从 AI 解读中提取金句 (`extractQuote`)
- 支持用户自定义编辑金句
- 显示：命宫主星、格局名称、五行局、干支年份

**html2canvas 兼容性修复**
- Tailwind v4 使用 oklab 颜色空间，html2canvas 不支持
- 解决：卡片区域全部使用硬编码 hex/rgba 颜色
- CSS 变量 `var(--font-brush)` → 硬编码 `'Ma Shan Zheng'`
- 移除不支持的样式：`linear-gradient`、`textShadow`、`inset`

**待解决问题**
- 预览与下载图片布局不完全一致（flex 布局在 html2canvas 中表现异常）
- 可能需要换用 Canvas 直接绘制方案

### 2026-01-07 三大 AI 功能界面统一

**统一风格**
- 命盘解读 / 年度运势 / 双人合盘
- 布局：垂直结构，输入在上，结果在下
- 宽度：`max-w-6xl mx-auto` 与命盘对齐
- 渲染：ReactMarkdown + remarkGfm
- 字体：`var(--font-brush)` 书法风格
- 样式：玻璃态卡片 + 顶部发光线

**系统提示词优化**
- 命盘解读：传统命理师风格，结构化输出
- 年度运势：限流叠宫技法，月度趋势
- 双人合盘：四化互飞分析，无百分比评分

### 2026-01-06 LLM 上下文完整化

**extractKnowledge 扩展**
- 完整十二宫：主星 + 辅星 + 亮度 + 宫干
- 十二大限：宫位 + 年龄范围 + 大限天干 + 大限四化
- 流年信息：过去10年 + 未来5年 + 流年四化

**数据结构**
```typescript
interface DecadalData {
  palaceName: string
  ageRange: string       // "6-15"
  stem: string           // 大限天干
  mutagens: string[]     // 大限四化
}

interface YearlyData {
  year: number
  stem: string
  branch: string
  mutagens: string[]
  palaceName: string     // 流年命宫位置
}
```

### 2026-01-06 人生 K 线功能

**核心功能**
- 运势评分引擎：星曜基础分 × 亮度系数 + 四化修正
- 三种时间维度：大限(10年) / 三年 / 月度
- K 线可视化：ECharts Candlestick + 趋势线
- 四维度雷达图：事业/财运/感情/健康

**评分算法 (fortune-score.ts)**
```
总分 = Σ(星曜基础分 × 亮度系数) + 四化修正
- 紫微+18, 天府+16, 六吉+9~11, 六煞-8~12
- 亮度: 庙×1.5, 旺×1.3, 平×0.9, 陷×0.5
- 四化: 禄+15, 权+12, 科+10, 忌-18
```

### 2026-01-06 文墨天机标准对齐

**配置调整 (astro.ts)**
- 安星法: `default` → `zhongzhou` (中州派)
- 子初换日: 23:00 即换日 (`dayDivide: forward`)

### 2026-01-06 UI 全面升级

- Dark Mode (OLED) + Glassmorphism + Aurora UI
- Bento Grid 命盘宫格
- 丝滑均匀 AI 输出（字符缓冲 + 定时器）
- 书法字体 Ma Shan Zheng

## 开发进度

| 阶段 | 状态 | Commit | 说明 |
|------|------|--------|------|
| P1 | ✅ | `863b7cb` | 核心排盘 + 基础UI |
| P2 | ✅ | `7855b2a` | AI 解读 + 知识库 |
| P3 | ✅ | `0de45af` | 年度运势 + 双人合盘 |
| P4 | ✅ | `9eea111` | 分享卡片 + UI 打磨 |
| P5 | ✅ | `e4c203e` | UI 全面升级 + AI 解读优化 |
| P6 | ✅ | `7640f9a` | 人生 K 线 + LLM 上下文完整化 |
| P7 | ✅ | `e48d665` | 三大 AI 功能界面统一 |
| P8 | ✅ | `dc31508` | 分享卡片重构 - 命格金句卡 |

## 架构地图

```
zwds/
├── .claude/                    # 上下文内核
│   ├── CLAUDE.md              # BIOS - 索引
│   ├── MEMORY.md              # RAM - 任务/进度/地图
│   └── RULES.md               # ROM - 偏好/护栏/决策
├── app/                        # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── components/        # UI 组件
│   │   │   ├── ui/           # Button/Input/Select
│   │   │   ├── chart/        # ChartDisplay (Bento Grid)
│   │   │   ├── fortune/      # YearlyFortune
│   │   │   ├── kline/        # LifeKLine/EventCard/ScoreRadar
│   │   │   ├── match/        # MatchAnalysis
│   │   │   ├── share/        # ShareCard (命格金句卡)
│   │   │   ├── BirthForm.tsx
│   │   │   ├── AIInterpretation.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── lib/
│   │   │   ├── astro.ts      # iztro 排盘封装
│   │   │   ├── llm.ts        # 多模型适配层
│   │   │   └── fortune-score.ts # 运势评分引擎
│   │   ├── knowledge/         # 结构化知识库 + LLM 上下文
│   │   ├── stores/           # Zustand 状态管理
│   │   ├── App.tsx           # 主入口
│   │   └── index.css         # 全局样式
│   └── package.json
└── docs/plans/
```

## 待办事项

1. **分享卡片布局一致性** - html2canvas flex 布局渲染问题，考虑 Canvas 直接绘制
2. **性能优化** - 代码分割减小 bundle（当前 ~1.7MB）
3. **真太阳时** - 集成经纬度 API
4. **PWA** - 离线可用

## Git 分支

- 主分支：`main`（已从 master 迁移）
- 远程：`origin/main`
