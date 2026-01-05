# MEMORY - 易失性工作区

> 当前任务栈、开发进度、核心逻辑地图

## 当前状态

```
[MVP 已完成] 2026-01-05
所有核心功能开发完毕，可进入迭代优化阶段
```

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
