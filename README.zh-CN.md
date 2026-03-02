<p align="center">
  <img src="./public/logo.svg" alt="Agent Skill Forge Logo" width="120">
</p>
# Agent Skill Forge（中文）

<p align="center">
  面向多种编程助手的 Agent Skill 可视化 IDE：创建、验证、导入、安装一体化。
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-0f766e.svg">
  <img alt="React 19" src="https://img.shields.io/badge/react-19-149eca.svg">
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-5.x-3178c6.svg">
  <img alt="Vite" src="https://img.shields.io/badge/vite-7.x-646cff.svg">
</p>

[主 README](./README.md) | [English](./README.en.md)

## 目录

- [项目定位](#项目定位)
- [功能总览](#功能总览)
- [架构概览](#架构概览)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [MCP Proxy 配置](#mcp-proxy-配置)
- [项目结构](#项目结构)
- [质量门禁](#质量门禁)
- [文档导航](#文档导航)
- [路线图](#路线图)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目定位

Agent Skill Forge 聚焦一个核心场景：把零散的提示词想法沉淀成可审查、可测试、可安装的技能包，并分发到不同 Agent 生态。

它不是普通 Markdown 编辑器，核心能力包括：

- 以技能库为中心的工作流（本地 + Discover + GitHub 仓库导入）。
- 结构化技能编辑（元数据、指令、附属文件、预览）。
- 在保存/导入/安装/导出前执行安全与合规校验。
- 多目标安装输出（`.claude`、`.codex`、`.cursor`、`.windsurf`、`.github`、`.gemini` 等）。

## 功能总览

| 模块 | 说明 | 状态 |
| --- | --- | --- |
| Skill Library | 本地/发现双视图、搜索、导入、安装、导出 | 可用 |
| Skill Editor | Frontmatter + Instructions + Preview + 多文件 IDE | 可用 |
| Local Sync | 基于 File System Access API 的目录连接与同步 | 可用 |
| Security Scan | 风险评分（`safe/review/warning/blocked`） | 可用 |
| Compliance Policy | save/import/install/export 动作级策略控制 | 可用 |
| MCP Integration | 连接本地 MCP 代理并查看工具列表 | 可用 |
| Skill Simulator | 技能指令驱动的模拟对话环境 | 可用 |
| i18n + Themes | `zh-CN/en-US` + p5 主题动态背景 | 可用 |

## 架构概览

```text
UI（React 页面与组件）
        |
        v
状态层（Zustand + Persist + IndexedDB 句柄）
        |
        +--> 技能域（校验、安全扫描、合规策略）
        |
        +--> 文件域（本地目录读写、树同步、安装目标）
        |
        +--> 发现域（本地目录 + 市场代理聚合）
        |
        +--> MCP 域（代理连接与工具发现）
```

## 技术栈

- React 19 + TypeScript + Vite
- Zustand（含 `persist`）+ `idb-keyval`
- Tailwind CSS v4
- p5.js（主题驱动背景引擎）
- Express + MCP SDK（本地代理桥）

## 快速开始

### 1）安装依赖

```bash
npm install
```

### 2）启动前端

```bash
npm run dev
```

访问 `http://localhost:5173`。

### 3）可选：启动 MCP 本地代理

```bash
npm run mcp
```

### 4）可选：刷新本地 skills catalog

```bash
npm run sync:awesome
```

## MCP Proxy 配置

代理入口文件：[`mcp-proxy/index.js`](./mcp-proxy/index.js)

支持环境变量：

| 变量 | 默认值 | 作用 |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | 代理监听地址 |
| `PORT` | `3001` | 代理端口 |
| `MCP_PROXY_TOKEN` | 空 | `/sse` 与 `/api/proxy-market` 的可选鉴权 |
| `MCP_ALLOWED_COMMANDS` | `npx,node` | 启动 stdio 命令白名单 |
| `MCP_ALLOWED_MARKET_HOSTS` | `claude-plugins.dev,skillsllm.com` | 市场来源域名白名单 |

示例：

```bash
MCP_PROXY_TOKEN=your-token npm run mcp
```

在应用 Settings 中配置：

- Proxy SSE URL: `http://localhost:3001/sse`
- Auth Token: 与 `MCP_PROXY_TOKEN` 保持一致（如启用）
- Command/Args: 按你的 MCP 运行命令填写

## 项目结构

```text
.
├─ docs/                 # 文档导航、计划、笔记、仓库整理清单
├─ mcp-proxy/            # 本地 MCP 代理服务
├─ public/               # 静态资源与 skills catalog
├─ scripts/              # 维护脚本
├─ src/
│  ├─ components/        # 通用 UI 与 IDE 组件
│  │  └─ ide/            # 文件树与代码编辑区
│  ├─ pages/             # Library / SkillEditor / Simulator / Settings
│  ├─ lib/               # fs、校验、合规、安全、索引
│  ├─ store/             # 应用与 MCP 状态管理
│  └─ i18n/              # 国际化文案
├─ CONTRIBUTING.md
├─ LICENSE
└─ README*.md
```

审查导向结构说明： [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)

## 质量门禁

```bash
npm run lint
npm run build
```

或一次执行：

```bash
npm run check
```

## 文档导航

- 文档总览： [docs/README.md](./docs/README.md)
- 结构审查说明： [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)
- 远端仓库整理清单： [docs/repository/REMOTE_REPO_CLEANUP.md](./docs/repository/REMOTE_REPO_CLEANUP.md)

## 路线图

- 增加 import/edit/install/sync 端到端测试。
- 强化 discover 源质量评分与可信度标注。
- 增加技能模板与首次使用向导。

## 贡献指南

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

MIT，见 [LICENSE](./LICENSE)。
