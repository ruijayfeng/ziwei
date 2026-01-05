# 紫微斗数 App - 项目认知

> 这是一个已完成 MVP 的紫微斗数命理工具，新会话请先阅读此文件理解项目全貌。

## 项目定位

开源紫微斗数排盘工具，核心卖点：
- **精准排盘**: 基于 iztro 库，算法准确
- **AI 解读**: 多模型支持，流式输出
- **纯前端**: 无后端依赖，Vercel 一键部署

## 技术架构

```
app/src/
├── lib/
│   ├── astro.ts          # iztro 封装，核心排盘入口
│   └── llm.ts            # 多模型适配层（Kimi/Gemini/Claude/DeepSeek）
├── knowledge/            # 结构化知识库（星曜/宫位/四化）
├── stores/index.ts       # Zustand 状态（chart + settings）
├── components/
│   ├── chart/            # 命盘可视化（4x4 十二宫布局）
│   ├── fortune/          # 年度运势分析
│   ├── match/            # 双人合盘
│   ├── share/            # 分享卡片（html2canvas）
│   ├── BirthForm.tsx     # 生辰输入
│   ├── AIInterpretation.tsx  # AI 解读面板
│   └── SettingsPanel.tsx # API 设置
└── App.tsx               # 主入口，标签导航
```

## 核心代码模式

### 排盘调用
```typescript
import { astro } from 'iztro'
// 参数: 日期, 时辰索引(0-12), 性别, 是否修正闰月
const chart = astro.bySolar('1990-1-1', 6, '男', true)
```

### 多模型流式
```typescript
// lib/llm.ts 返回 async generator
for await (const chunk of streamChat(messages, config)) {
  appendText(chunk)
}
```

### 知识检索
```typescript
// 根据命盘自动提取相关知识
const prompt = buildPromptWithKnowledge(chart, { focus: '事业' })
```

## 样式系统

- **主题**: 深靛蓝夜空 + 暖琥珀点缀
- **特效**: 星点闪烁动画、毛玻璃卡片
- **配置**: Tailwind CSS 4，样式在 `src/index.css`

## 开发命令

```bash
cd /home/kevin/projest/zwds/app
npm run dev    # 开发 http://localhost:5173
npm run build  # 构建
```

## 知识文档位置

紫微斗数算法原理文档在项目根目录：
- `01-排盘算法/` - 命宫定位、五行局、安星诀
- `02-星曜体系/` - 十四主星、六吉六煞
- `03-宫位系统/` - 十二宫详解
- `04-四化飞星/` - 四化规则
- `05-格局判断/` - 经典格局
- `06-运限系统/` - 大限流年

## 待优化项

1. 代码分割（bundle 916KB 过大）
2. 真太阳时校正（需经纬度 API）
3. PWA 离线支持
4. PDF 导出
