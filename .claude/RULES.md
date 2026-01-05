# RULES - 持久化约束区

> 用户偏好、不可变护栏、架构决策

## 用户偏好

- **设计风格**: 温暖插画 + Apple 质感 + 星空主题
- **避免**: 廉价感、AI 蓝紫渐变僵硬质感、土味命理风
- **色彩**: 深靛蓝夜空 (#1a1b3a) + 暖琥珀点缀 (#f59e0b)
- **交互语言**: 中文
- **注释规范**: 中文 + ASCII 分块注释
- **AI 模型偏好**: Kimi/Gemini/Claude/DeepSeek（不优先 OpenAI）

## 不可变护栏

### 技术栈
- React 18 + TypeScript
- Vite 7
- Tailwind CSS 4（CSS-based 配置）
- iztro 2.5.4 排盘库
- Zustand 状态管理
- html2canvas 图片导出

### 部署约束
- 纯前端静态部署（Vercel / Netlify 一键部署）
- 数据存储在 localStorage / IndexedDB
- 无后端依赖
- API Key 存浏览器本地

### 代码规范
- 文件不超过 800 行
- 文件夹每层不超过 8 个文件
- 函数不超过 20 行
- 缩进不超过 3 层
- 优先消除特殊情况而非增加 if/else

## 架构决策记录 (ADR)

### ADR-001: 纯前端架构
- **决策**: 纯前端静态应用，无后端
- **原因**: 开源自部署友好，隐私保护，成本为零
- **影响**: API Key 存浏览器本地，数据无跨设备同步

### ADR-002: 多模型适配层
- **决策**: 支持 Kimi/Gemini/Claude/DeepSeek/自定义 OpenAI 兼容
- **原因**: 国内用户友好，降低使用门槛
- **实现**: `lib/llm.ts` 统一流式 API

### ADR-003: 结构化 RAG
- **决策**: 知识库按星曜/宫位/四化结构化存储，精确检索
- **原因**: 紫微斗数知识高度结构化，比向量检索更精准
- **实现**: `knowledge/` 目录，`extractKnowledge()` 函数

### ADR-004: 混合知识检索
- **决策**: 离线知识库 + 可选联网搜索增强
- **原因**: 保证基础可用，同时支持深度扩展
- **影响**: 联网需用户配置搜索 API

### ADR-005: iztro 排盘引擎
- **决策**: 使用 iztro 开源库而非自研
- **原因**: 成熟稳定，社区维护，算法准确
- **实现**: `lib/astro.ts` 封装层

## 功能规格

### MVP 功能（已完成）
| 功能 | 状态 | 组件 |
|------|------|------|
| 命盘排盘 | ✅ | `lib/astro.ts` + `ChartDisplay` |
| AI 深度解读 | ✅ | `AIInterpretation` + `knowledge/` |
| 年度运势 | ✅ | `YearlyFortune` |
| 双人合盘 | ✅ | `MatchAnalysis` |
| 分享卡片 | ✅ | `ShareCard` |
| 多模型支持 | ✅ | `lib/llm.ts` |
| 设置面板 | ✅ | `SettingsPanel` |

### 输入字段
| 字段 | 必填 | 说明 |
|------|------|------|
| 出生日期 | ✅ | 年月日（阳历，自动转农历） |
| 出生时间 | ✅ | 时辰（子丑寅卯...） |
| 性别 | ✅ | 决定大限顺逆 |
| 出生地 | ⚪ | 真太阳时校正（待实现） |

## 启动命令

```bash
cd /home/kevin/projest/zwds/app
npm install    # 首次安装依赖
npm run dev    # 开发服务器 http://localhost:5173
npm run build  # 生产构建
```
