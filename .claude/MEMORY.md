# MEMORY - 易失性工作区

> 当前任务栈、开发进度、核心逻辑地图

## 当前状态

```
[人生K线重构] 2026-01-07
ECharts → Recharts，100年视图，大运标注，峰值星标，LLM批量生成reason
```

## 变更日志

### 2026-01-07 人生K线重构 - Recharts 方案

**设计目标**
- 参考 lifekline 开源项目的 K 线绘制方式
- 统一为 1-100 岁完整人生视图（移除大限/三年/月度切换）
- 保持深色玻璃态视觉风格

**技术变更**
- 图表库：ECharts → Recharts (ComposedChart + Bar)
- K 线实现：自定义 CandleShape 组件（影线 + 蜡烛体）
- 大运标注：ReferenceLine + Label（紫色虚线 + 顶部干支）
- 峰值标记：金色五角星 SVG 标记人生巅峰
- Tooltip：深色玻璃态，显示年份/干支/大运/OHLC/四化/reason

**数据结构 (LifetimeKLinePoint)**
```typescript
interface LifetimeKLinePoint {
  age: number              // 1-100
  year: number             // 公历年份
  ganZhi: string           // 流年干支
  daYun: string            // 大运干支（10年一变）
  daYunRange: string       // 大运年龄范围
  open/close/high/low: number
  score: number
  reason?: string          // LLM 生成
  dimensions: { career, wealth, relationship, health }
  yearlyMutagens?: string[]
}
```

**LLM reason 生成**
- 一次性调用 LLM 生成 100 条运势描述
- 先显示 K 线图，后台异步生成 reason
- 生成完成后更新缓存刷新 UI

**大运周期模型 (核心算法)**
```
Y轴 = 运势评分 (固定 0-100)
每年独立评分 = 大运基础分 + 流年修正 + 月度波动

大运基础分 (20-90): 大限宫位星曜决定 10 年水位
流年修正 (-25~+25): 流年四化 + 流年命宫
月度波动: 12 个月各自评分，产生 OHLC

效果：好大运整体在 60-95 区间，差大运在 15-50 区间
```

**修改文件**
- `package.json`: 添加 recharts 依赖
- `fortune-score.ts`: 大运周期模型、generateLifetimeKLines()、六十甲子表
- `stores/index.ts`: 简化 KLineCache 类型
- `LifeKLine.tsx`: Recharts 实现 + 固定 Y轴 0-100 + 运势等级显示

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
| P9 | ✅ | - | 人生 K 线重构 - Recharts + 累积值模型 |

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
│   │   │   ├── kline/        # LifeKLine (Recharts) + ScoreRadar (ECharts)
│   │   │   ├── match/        # MatchAnalysis
│   │   │   ├── share/        # ShareCard (命格金句卡)
│   │   │   ├── BirthForm.tsx
│   │   │   ├── AIInterpretation.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── lib/
│   │   │   ├── astro.ts      # iztro 排盘封装
│   │   │   ├── llm.ts        # 多模型适配层
│   │   │   └── fortune-score.ts # 运势评分引擎 + generateLifetimeKLines
│   │   ├── knowledge/         # 结构化知识库 + LLM 上下文
│   │   ├── stores/           # Zustand 状态管理
│   │   ├── App.tsx           # 主入口
│   │   └── index.css         # 全局样式
│   └── package.json          # 依赖: recharts, echarts, iztro...
├── lifekline/                  # 参考开源项目 (Git 子仓库)
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
