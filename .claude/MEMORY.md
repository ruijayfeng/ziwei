# MEMORY - 易失性工作区

> 当前任务栈、开发进度、核心逻辑地图

## 当前任务栈

```
[完成] P1: 核心排盘 + 基础UI
[完成] P2: AI 解读 + 知识库
[完成] P3: 年度运势 + 双人合盘
[待做] P4: 分享卡片 + 打磨
```

## 开发进度

| 阶段 | 状态 | Commit |
|------|------|--------|
| P1 | ✅ | `863b7cb` |
| P2 | ✅ | `7855b2a` |
| P3 | ✅ | `0de45af` |
| P4 | ⏳ | - |

## 架构地图

```
zwds/
├── .claude/                    # 上下文内核
│   ├── CLAUDE.md              # BIOS - 索引
│   ├── MEMORY.md              # RAM - 任务/进度/地图
│   └── RULES.md               # ROM - 偏好/护栏/决策
├── app/                        # 前端应用
│   ├── src/
│   │   ├── components/        # UI 组件
│   │   │   ├── ui/           # 基础组件 (Button/Input/Select)
│   │   │   ├── chart/        # 命盘组件 (ChartDisplay)
│   │   │   ├── fortune/      # 年度运势 (YearlyFortune)
│   │   │   ├── match/        # 双人合盘 (MatchAnalysis)
│   │   │   ├── BirthForm.tsx # 生辰输入
│   │   │   ├── AIInterpretation.tsx # AI 解读
│   │   │   └── SettingsPanel.tsx    # 设置面板
│   │   ├── lib/
│   │   │   ├── astro.ts      # iztro 排盘封装
│   │   │   └── llm.ts        # 多模型适配层
│   │   ├── knowledge/         # 结构化知识库
│   │   │   ├── stars/        # 十四主星
│   │   │   ├── palaces/      # 十二宫位
│   │   │   ├── sihua/        # 四化飞星
│   │   │   └── index.ts      # 知识检索
│   │   ├── stores/           # Zustand 状态
│   │   └── App.tsx           # 主入口
│   └── ...
├── 01-排盘算法/               # 知识文档
├── 02-星曜体系/
├── 03-宫位系统/
├── 04-四化飞星/
├── 05-格局判断/
├── 06-运限系统/
├── 99-参考资源/
└── docs/plans/                # 设计文档
```

## 模块职责

| 模块 | 职责 |
|------|------|
| `lib/astro.ts` | iztro 排盘引擎封装，生辰→命盘 |
| `lib/llm.ts` | 多模型适配层，统一流式 API |
| `knowledge/` | 结构化知识库 + RAG 检索 |
| `components/chart/` | 命盘可视化（十二宫布局） |
| `components/fortune/` | 年度运势分析 |
| `components/match/` | 双人合盘分析 |
| `components/AIInterpretation` | AI 解读面板 |
| `stores/` | 全局状态（命盘、设置） |
