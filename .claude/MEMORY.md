# MEMORY - 紫微斗数 App MVP 版本记录

> 项目状态：MVP 完成 ✅

## 项目概述

开源的紫微斗数命盘工具，精准排盘 + AI 深度解读，支持自部署和多模型切换。

**技术栈**：React 18 + TypeScript + Vite + Tailwind CSS + Recharts + ECharts + iztro

## 核心功能

### 1. 命盘排盘
- 基于 iztro 库精准排盘
- 中州派安星法 + 子初换日
- 完整十二宫 + 十四主星 + 辅煞星 + 四化

### 2. AI 解读 (三大功能)
- **命盘解读** - 传统命理师风格，结构化输出
- **年度运势** - 限流叠宫技法，月度趋势
- **双人合盘** - 四化互飞分析

### 3. 人生 K 线
- Recharts 实现 100 年 K 线图
- **AI 决策模型**：LLM 根据命盘数据决定涨跌
- 大运标注 + 峰值星标 + 深色玻璃态 Tooltip
- 算法兜底：无 API Key 时使用大运周期模型

### 4. 分享卡片
- 命格金句卡设计
- 玄黑背景 + 金色点缀 + 书法字体
- html2canvas 导出

## 技术架构

```
app/src/
├── components/
│   ├── ui/              # 基础组件 (Button/Input/Select)
│   ├── chart/           # 命盘展示 (Bento Grid)
│   ├── fortune/         # 年度运势
│   ├── kline/           # 人生K线 (Recharts) + 雷达图 (ECharts)
│   ├── match/           # 双人合盘
│   ├── share/           # 分享卡片
│   ├── BirthForm.tsx    # 出生信息表单
│   ├── AIInterpretation.tsx  # AI 解读
│   └── SettingsPanel.tsx     # 设置面板
├── lib/
│   ├── astro.ts         # iztro 排盘封装
│   ├── llm.ts           # 多模型适配层 (Kimi/Gemini/Claude/DeepSeek)
│   └── fortune-score.ts # K线生成 (LLM + 算法双模式)
├── knowledge/           # 结构化知识库 + LLM 上下文
├── stores/              # Zustand 状态管理
└── index.css            # 全局样式 (Dark + Glassmorphism)
```

## K 线生成方案

### AI 模式 (推荐)
```
命盘数据 → LLM 提示词 → AI 返回 100 年 OHLC + brief
```

LLM 接收：
- 命宫/身宫主星
- 十二宫配置（主星+辅星+亮度+四化）
- 大限走向（宫位+四化）
- 流年信息

### 算法模式 (兜底)
```
每年 open = 前一年 close
close = open + (目标分 - open) × 移动率 + 波动
目标分 = 大运基础分 + 流年修正
```

## LLM 适配

支持多模型切换：
- Kimi (kimi-k2-0905-preview)
- Gemini (gemini-3.0-flash)
- Claude (claude-opus-4-5)
- DeepSeek (deepseek-chat)
- 自定义 OpenAI 兼容 API

## 开发进度

| 阶段 | Commit | 说明 |
|------|--------|------|
| P1 | `863b7cb` | 核心排盘 + 基础UI |
| P2 | `7855b2a` | AI 解读 + 知识库 |
| P3 | `0de45af` | 年度运势 + 双人合盘 |
| P4 | `9eea111` | 分享卡片 + UI 打磨 |
| P5 | `e4c203e` | UI 全面升级 + AI 解读优化 |
| P6 | `7640f9a` | 人生 K 线 + LLM 上下文完整化 |
| P7 | `e48d665` | 三大 AI 功能界面统一 |
| P8 | `dc31508` | 分享卡片重构 - 命格金句卡 |
| P9 | `ad413da` | K 线 AI 决策方案 |

## 后续优化方向

1. **性能优化** - 代码分割减小 bundle（当前 ~2MB）
2. **分享卡片** - Canvas 直接绘制解决布局问题
3. **真太阳时** - 集成经纬度 API
4. **PWA** - 离线可用
5. **国际化** - 英文版本

## 运行命令

```bash
cd app
npm install
npm run dev      # 开发
npm run build    # 构建
```

---

**MVP 完成时间**：2026-01-09
**总开发成本**：$32.33 (Claude API)
**代码变更**：+1605 / -953 行
