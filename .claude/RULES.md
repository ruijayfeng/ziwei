# 紫微斗数 App - 开发规范

> 修改此项目时必须遵守的约束和偏好。

## 设计原则

**必须**:
- 温暖插画风 + Apple 质感 + 星空主题
- 深靛蓝 (#1a1b3a) + 暖琥珀 (#f59e0b)
- 毛玻璃效果、微动画

**禁止**:
- 廉价感、土味命理风
- AI 典型的蓝紫渐变僵硬质感
- 过度装饰、花哨边框

## 技术约束

| 约束 | 规格 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 7 |
| 样式 | Tailwind CSS 4 (CSS 配置) |
| 排盘 | iztro 2.5.4 |
| 状态 | Zustand |
| 部署 | 纯前端静态，无后端 |

## 代码规范

- 文件 < 800 行
- 函数 < 20 行
- 缩进 < 3 层
- 注释用中文 + ASCII 分块风格
- 优先消除特殊情况，而非堆叠 if/else

## AI 模型支持

优先级：Kimi > Gemini > Claude > DeepSeek > 自定义

不优先 OpenAI（用户明确要求）。

## 架构决策

1. **纯前端**: 无后端，API Key 存 localStorage，隐私友好
2. **结构化 RAG**: 知识库按星曜/宫位/四化分类，精确检索优于向量
3. **多模型适配**: `lib/llm.ts` 统一流式接口，支持热切换
4. **iztro 封装**: `lib/astro.ts` 屏蔽库细节，提供简洁 API

## 已完成功能

| 功能 | 组件 |
|------|------|
| 命盘排盘 | `ChartDisplay` |
| AI 解读 | `AIInterpretation` |
| 年度运势 | `YearlyFortune` |
| 双人合盘 | `MatchAnalysis` |
| 分享卡片 | `ShareCard` |
| 多模型设置 | `SettingsPanel` |
