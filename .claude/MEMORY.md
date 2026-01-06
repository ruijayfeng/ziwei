# MEMORY - 易失性工作区

> 当前任务栈、开发进度、核心逻辑地图

## 当前状态

```
[文墨天机标准对齐] 2026-01-06
安星法改中州派 + 子初换日 + 命盘显示全面扩展
```

## 变更日志

### 2026-01-06 文墨天机标准对齐

**配置调整 (astro.ts)**
- 安星法: `default` → `zhongzhou` (中州派)
- 子初换日: 23:00 即换日 (`dayDivide: forward`)
- 时辰映射修正: hour=23 → timeIndex=12 (晚子时)

**命盘显示扩展 (ChartDisplay.tsx)**
- 宫干显示: `stem` + `branch` (如 "戊寅")
- 大限范围: `decadal.range` (如 "26-35")
- 命主/身主: `chart.soul` / `chart.body`
- 纳音五行: 六十甲子纳音表查询
- 生肖/星座: `chart.zodiac` / `chart.sign`

**星曜显示**
- 完整辅星: 不再 `slice(0, 4)`
- 亮度显示: 庙旺得利平不陷
- 杂曜: `adjectiveStars` 完整显示

**十二神系**
- 长生十二神: `changsheng12`
- 博士十二神: `boshi12`

### 2026-01-06 AI 解读体验优化

**布局调整**
- 命盘解读页面：双栏 → 上下结构
- 命盘在上：`max-w-5xl mx-auto`，横向展开更大气
- AI 解读在下：与命盘等宽，内容自然延伸无空旷感
- 宫格高度：`min-h-[100px] lg:min-h-[140px]`
- 中央信息区：`min-h-[220px] lg:min-h-[300px]`

**丝滑均匀输出**
- 问题：LLM 流式返回 chunk 大小不一，文字出现忽快忽慢
- 方案：字符缓冲队列 + 固定频率定时器
  ```
  LLM chunks → fullTextRef 缓冲 → setInterval 35ms/字符 → 均匀显示
  ```
- 关键：使用 `loadingRef` (ref) 而非 `loading` (state) 避免闭包陷阱

**书法字体**
- 新增：Ma Shan Zheng（马善政楷书）
- CSS 变量：`--font-brush`
- 解读内容：`text-lg lg:text-xl leading-loose`
- 效果：道士批命的仪式感

**Markdown 渲染**
- 依赖：`react-markdown` + `remark-gfm`
- 自定义样式组件：
  - 标题 h1/h2/h3：金色渐变
  - 加粗 strong：金色
  - 列表 li：紫色菱形符号 `◆`
  - 引用 blockquote：金色左边框
- 光标指示器：金色闪烁 `animate-pulse`

**技术要点**
```typescript
// 避免 setInterval 闭包陷阱
const loadingRef = useRef(false)

// 定时器中使用 ref.current 而非 state
setInterval(() => {
  if (!loadingRef.current) { /* ... */ }
}, CHAR_INTERVAL)
```

### 2026-01-06 UI 全面升级 (基于 UI Pro Max 插件)

**设计风格定位**
- Dark Mode (OLED) + Glassmorphism + Aurora UI 三位一体
- 参考：Co-Star / Calm / Linear / Vercel 设计语言
- 契合命理/占星神秘主题，高端奢华感

**核心组件重构**

1. **命盘宫格 (ChartDisplay)**
   - Bento Grid 风格重构
   - 宫格悬浮：边框紫光 + 底部渐变指示线
   - 四化星曜：渐变背景 + 脉冲动画指示点
   - 命宫/身宫：角落发光点标识
   - 中央信息区：太极暗纹装饰 + 五行局胶囊标签
   - 新增图例说明栏

2. **生辰表单 (BirthForm)**
   - 高级玻璃态卡片设计
   - 顶部发光线装饰
   - 性别选择：胶囊按钮组 + 选中发光点
   - 金色渐变提交按钮 + 箭头动画
   - 角落同心圆装饰

3. **UI 组件库升级**
   - `Button`: 4种变体 (primary/secondary/ghost/gold)
   - `Input`: 玻璃态风格，聚焦紫光外环
   - `Select`: 自定义下拉箭头，悬浮态变色

4. **导航系统**
   - Header: sticky 毛玻璃导航
   - Logo: 图标卡片 + shimmer 流光文字
   - 桌面导航: 下划线渐变指示器
   - 移动端: 底部固定导航栏

5. **色彩与字体**
   - 夜空：`#0f0f23`
   - 紫微：`#7c3aed`（皇家紫）
   - 真金：`#D4AF37`
   - 字体：Noto Serif SC + Noto Sans SC + Ma Shan Zheng

### 2026-01-05 智能搜索关键词提取

**搜索流程**
```
命盘上下文 → LLM 提取关键词 → Tavily 多次搜索 → 结果注入 system prompt
```

### 2026-01-05 联网搜索功能

- Kimi：原生 `$web_search` 工具
- Gemini：原生 `google_search` 工具
- Claude/DeepSeek/Custom：Tavily API

## 开发进度

| 阶段 | 状态 | Commit | 说明 |
|------|------|--------|------|
| P1 | ✅ | `863b7cb` | 核心排盘 + 基础UI |
| P2 | ✅ | `7855b2a` | AI 解读 + 知识库 |
| P3 | ✅ | `0de45af` | 年度运势 + 双人合盘 |
| P4 | ✅ | `9eea111` | 分享卡片 + UI 打磨 |
| P5 | ✅ | `e4c203e` | UI 全面升级 + AI 解读优化 |

## 架构地图

```
zwds/
├── .claude/                    # 上下文内核
│   ├── CLAUDE.md              # BIOS - 索引
│   ├── MEMORY.md              # RAM - 任务/进度/地图
│   ├── RULES.md               # ROM - 偏好/护栏/决策
│   └── skills/                # 技能插件
│       └── ui-ux-pro-max/     # UI 设计参考库
├── app/                        # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── components/        # UI 组件
│   │   │   ├── ui/           # Button/Input/Select
│   │   │   ├── chart/        # ChartDisplay (Bento Grid)
│   │   │   ├── fortune/      # YearlyFortune
│   │   │   ├── match/        # MatchAnalysis
│   │   │   ├── share/        # ShareCard
│   │   │   ├── BirthForm.tsx # 生辰表单 (玻璃态)
│   │   │   ├── AIInterpretation.tsx # AI 解读 (书法+Markdown)
│   │   │   └── SettingsPanel.tsx
│   │   ├── lib/
│   │   │   ├── astro.ts      # iztro 排盘封装
│   │   │   └── llm.ts        # 多模型适配层
│   │   ├── knowledge/         # 结构化知识库
│   │   ├── stores/           # Zustand 状态管理
│   │   ├── App.tsx           # 主入口（上下布局）
│   │   └── index.css         # 全局样式 (Aurora + Glass)
│   └── package.json          # +react-markdown, remark-gfm
└── docs/plans/
```

## 模块职责

| 模块 | 职责 | 关键接口 |
|------|------|----------|
| `lib/astro.ts` | iztro 排盘封装 | `generateChart(birthInfo)` |
| `lib/llm.ts` | 多模型适配层 | `streamChat(messages, config)` |
| `knowledge/` | 结构化 RAG | `extractKnowledge(chart)` |
| `components/chart/` | 命盘可视化 | Bento Grid 4x4 布局 |
| `components/AIInterpretation` | AI 解读 | 丝滑输出 + Markdown |
| `stores/` | 全局状态 | chart, birthInfo, settings |

## 技术要点备忘

### 丝滑流式输出
```typescript
// 字符缓冲 + 均匀输出
const fullTextRef = useRef('')
const loadingRef = useRef(false)

// LLM 返回写入缓冲
for await (const token of streamChat(config, messages)) {
  fullTextRef.current += token
}

// 定时器均匀取出
setInterval(() => {
  if (displayIndexRef.current < fullTextRef.current.length) {
    displayIndexRef.current++
    setDisplayText(fullTextRef.current.slice(0, displayIndexRef.current))
  }
}, 35) // 35ms/字符
```

### Markdown 渲染
```typescript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={MarkdownComponents}
>
  {displayText}
</ReactMarkdown>
```

## 未来优化方向

1. **性能优化**: 代码分割减小 bundle（当前 ~1.1MB）
2. **真太阳时**: 集成经纬度 API 实现精确校正
3. **更多格局**: 扩展格局判断规则
4. **数据导出**: 支持 PDF 命盘报告
5. **PWA**: 离线可用 + 安装到桌面
6. **国际化**: 英文/繁体支持
