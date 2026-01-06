# MEMORY - 易失性工作区

> 当前任务栈、开发进度、核心逻辑地图

## 当前状态

```
[UI 全面升级完成] 2026-01-06
Dark Mode + Glassmorphism + Aurora UI + Bento Grid
高端命理产品设计语言
```

## 变更日志

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
   - `Button`: 4种变体 (primary/secondary/ghost/gold)，渐变背景 + 发光阴影
   - `Input`: 玻璃态风格，聚焦紫光外环
   - `Select`: 自定义下拉箭头，悬浮态变色

4. **导航系统**
   - Header: sticky 毛玻璃导航
   - Logo: 图标卡片 + shimmer 流光文字
   - 桌面导航: 下划线渐变指示器
   - 移动端: 底部固定导航栏
   - 设置按钮: 玻璃态圆角

5. **空状态组件 (EmptyState)**
   - 统一的空状态展示
   - 星号装饰 + 引导按钮

### 2026-01-06 UI 深度优化 (UI Pro Max 插件指导)
**设计风格定位**
- Dark Mode (OLED) + Glassmorphism + Aurora UI 三位一体
- 契合命理/占星神秘主题，高端奢华感

**P0: 字体升级**
- 标题: Noto Serif SC（宋体优雅感）
- 正文: Noto Sans SC（清晰可读）
- Logo: serif 字体 + shimmer 流光动画

**P1: 色彩强化**
- 夜空更深: `#1a1b3a` → `#0f0f23`
- 紫微更紫: `#6366f1` → `#7c3aed`（皇家气质）
- 真金取代琥珀: `#f59e0b` → `#D4AF37`
- 背景: 多层渐变（紫光 + 金光叠加）

**P2: 交互增强**
- `.btn` / `.btn-primary` / `.btn-gold`: 渐变按钮 + 发光效果
- `.glass-glow` / `.glass-gold`: 边缘发光毛玻璃
- `.hover-glow`: 悬停发光效果
- `.card-lift`: 卡片悬停提升
- `.tab-indicator`: 标签下划线指示器
- `.input-glow`: 输入框聚焦发光
- `.shooting-star`: 流星动画（可选）

**P3: Aurora 极光背景**
- `.aurora-bg`: 流动渐变背景层
- 紫色 + 金色极光缓慢漂移
- 20-25s 周期动画，增强神秘氛围

### 2026-01-05 智能搜索关键词提取
**问题**
- 原搜索直接用整个 user message，包含大量命盘数据，搜索不精准

**解决方案**
- 新增 `extractSearchKeywords()`: 用 LLM 从命盘信息提取 2-3 个精准搜索词
- 新增 `performSmartSearch()`: 先提取关键词，再对每个关键词搜索
- 关键词格式: "紫微斗数 天机太阴 命宫 性格事业"

**搜索流程**
```
命盘上下文 → LLM 提取关键词 → Tavily 多次搜索 → 结果注入 system prompt
```

### 2026-01-05 Web 端布局优化
**布局重构**
- 主容器: `max-w-4xl` → `max-w-[1600px]` 宽屏适配
- Header: Logo + 导航左对齐，设置按钮右对齐
- 导航栏: 桌面端集成到 Header，移动端单独显示
- 命盘页面: 桌面端双栏（左命盘/右 AI 解读），移动端单栏
- 年度运势: 左侧控制面板 + 右侧结果展示
- 双人合盘: 左侧输入 + 右侧结果展示

**响应式断点**
- `lg:` (1024px+): 双栏/三栏布局
- `xl:` (1280px+): 命盘页面双栏
- `md:` (768px+): Header 导航显示

### 2026-01-05 联网搜索功能
**新增功能**
- 联网搜索开关：在高级设置中开启
- Kimi：使用原生 `$web_search` 工具
- Gemini：使用原生 `google_search` 工具
- Claude/DeepSeek/Custom：支持 Tavily 第三方搜索 API
- 搜索结果注入：自动将搜索结果添加到系统提示词

**实现细节**
- stores/index.ts: 新增 `enableWebSearch` 和 `searchApiKey` 状态
- lib/llm.ts: 添加 `searchWithTavily()` 函数和各模型搜索逻辑
- SettingsPanel.tsx: 联网搜索开关 + Tavily API Key 输入框
- AIInterpretation/YearlyFortune/MatchAnalysis: 传递搜索配置

### 2026-01-05 迭代优化
**品牌升级**
- 产品名: "紫微斗数" → "紫微知道"
- 副标题: "基于紫微斗数的 AI 命理工具"
- 表单: 明确标注"阳历"，底部提示更清晰

**设置面板重构**
- 高级设置折叠区，支持自定义 BaseURL/Model
- 每厂商独立配置：apiKey/baseUrl/model 按厂商存储
- 未保存修改提示：切换厂商时弹窗确认
- 输入框高亮：修改后 amber 边框

**多模型思考模式**
| 厂商 | 默认模型 | 思考模型 |
|------|----------|----------|
| Kimi | kimi-k2-0905-preview | kimi-k2-thinking |
| Gemini | gemini-3.0-flash | gemini-3-pro-preview |
| Claude | claude-opus-4-5-20251124 | extended thinking |
| DeepSeek | deepseek-chat | deepseek-v3.2-speciale |

## 开发进度

| 阶段 | 状态 | Commit | 说明 |
|------|------|--------|------|
| P1 | ✅ | `863b7cb` | 核心排盘 + 基础UI |
| P2 | ✅ | `7855b2a` | AI 解读 + 知识库 |
| P3 | ✅ | `0de45af` | 年度运势 + 双人合盘 |
| P4 | ✅ | `9eea111` | 分享卡片 + UI 打磨 |

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
│   │   │   ├── ui/           # 基础组件 (Button/Input/Select)
│   │   │   ├── chart/        # 命盘组件 (ChartDisplay)
│   │   │   ├── fortune/      # 年度运势 (YearlyFortune)
│   │   │   ├── match/        # 双人合盘 (MatchAnalysis)
│   │   │   ├── share/        # 分享卡片 (ShareCard)
│   │   │   ├── BirthForm.tsx # 生辰输入表单
│   │   │   ├── AIInterpretation.tsx # AI 解读面板
│   │   │   └── SettingsPanel.tsx    # 设置面板
│   │   ├── lib/
│   │   │   ├── astro.ts      # iztro 排盘封装
│   │   │   └── llm.ts        # 多模型适配层 (Kimi/Gemini/Claude/DeepSeek)
│   │   ├── knowledge/         # 结构化知识库
│   │   │   ├── stars/        # 十四主星属性
│   │   │   ├── palaces/      # 十二宫位关系
│   │   │   ├── sihua/        # 四化飞星规则
│   │   │   └── index.ts      # 知识检索入口
│   │   ├── stores/           # Zustand 状态管理
│   │   │   └── index.ts      # chartStore + settingsStore
│   │   ├── App.tsx           # 主入口（标签导航）
│   │   └── index.css         # 全局样式（星空主题）
│   ├── package.json          # 依赖: react, iztro, zustand, html2canvas
│   └── vite.config.ts        # Vite 配置
├── 01-排盘算法/               # 知识文档（算法原理）
├── 02-星曜体系/               # 十四主星 + 六吉六煞
├── 03-宫位系统/               # 十二宫详解
├── 04-四化飞星/               # 四化规则 + 十干四化表
├── 05-格局判断/               # 经典格局
├── 06-运限系统/               # 大限流年
├── 99-参考资源/               # 学习资源
└── docs/plans/                # 设计文档
    └── 2026-01-04-ziwei-app-design.md
```

## 模块职责

| 模块 | 职责 | 关键接口 |
|------|------|----------|
| `lib/astro.ts` | iztro 排盘封装 | `generateChart(birthInfo)` |
| `lib/llm.ts` | 多模型适配层 | `streamChat(messages, config)` |
| `knowledge/` | 结构化 RAG | `extractKnowledge(chart)` |
| `components/chart/` | 命盘可视化 | 4x4 十二宫布局 |
| `components/fortune/` | 年度运势 | 流年四化分析 |
| `components/match/` | 双人合盘 | 契合度计算 |
| `components/share/` | 分享卡片 | html2canvas 导出 PNG |
| `stores/` | 全局状态 | chart, birthInfo, settings |

## 技术要点备忘

### iztro 库使用
```typescript
import { astro } from 'iztro'
// 参数: 日期字符串, 时辰索引(0-12), 性别('男'/'女'), 是否修正闰月
const chart = astro.bySolar('1990-1-1', 6, '男', true)
```

### 多模型流式响应
```typescript
// lib/llm.ts 支持 async generator
for await (const chunk of streamChat(messages, config)) {
  // chunk 为文本片段
}
```

### 知识检索
```typescript
// 根据命盘提取相关知识构建 prompt
const knowledge = extractKnowledge(chart, { focus: '事业' })
```

## 未来优化方向

1. **性能优化**: 代码分割减小 bundle（当前 916KB）
2. **真太阳时**: 集成经纬度 API 实现精确校正
3. **更多格局**: 扩展格局判断规则
4. **数据导出**: 支持 PDF 命盘报告
5. **PWA**: 离线可用 + 安装到桌面
6. **国际化**: 英文/繁体支持
