# Agent Skill Forge 项目复盘 + 简历与面试指南（基于当前仓库）

更新时间：2026-03-02  
分析方式：基于当前代码结构与运行结果逆向梳理（不是 Git 提交历史还原）。

## 1. 项目结构全景（已扫描）

### 1.1 仓库规模
- 全仓文件数：`25590`
- `node_modules`：`24386`（依赖目录）
- `src`：`33` 个文件，约 `3878` 行代码（核心前端）
- `temp_skills`：`1141` 个文件，其中 `SKILL.md` 为 `864` 个（技能素材库）
- `public/awesome-skills.json`：`889` 条技能记录，约 `3.66 MB`

### 1.2 目录分层（业务视角）
- `src/`：主应用（Skill Library / Editor / Simulator / Settings）
- `mcp-proxy/`：本地 Node 代理（SSE <-> stdio，市场源 CORS 代理）
- `public/`：静态资源与技能索引 JSON
- `docs/plans/`：设计方案文档（本地文件系统、多文件 IDE、V5 主题）
- `.agent/skills/`：本项目示例技能
- `temp_skills/`：导入/聚合来源的技能库素材（非主应用业务代码）

### 1.3 核心代码地图
- 路由入口：`src/App.tsx`
- 状态中心：`src/store/index.ts`、`src/store/mcpStore.ts`
- 本地文件系统：`src/lib/fsCore.ts`
- 安全扫描：`src/lib/securityScan.ts`
- 安装目标映射：`src/lib/skillTargets.ts`
- 主要页面：`src/pages/Library.tsx`、`src/pages/SkillEditor.tsx`、`src/pages/Simulator.tsx`、`src/pages/Settings.tsx`
- 背景渲染引擎：`src/components/LiveBackground.tsx` + `src/lib/p5-sketches/*`
- MCP 代理：`mcp-proxy/index.js`

---

## 2. 项目建立过程（逆向拆解）

下面是根据现有代码推断出的“可讲述版本”，适合在简历和面试中使用。

### 阶段 A：搭建前端基础框架
- 技术选型：`Vite + React 19 + TypeScript + TailwindCSS 4`
- 目标：快速形成可迭代 UI 工程，支持多页面和状态持久化
- 关键产物：路由骨架、主题变量体系、组件化布局

### 阶段 B：定义 Skill 领域模型与本地持久化
- 在 `src/store/index.ts` 定义统一 Skill 数据结构（frontmatter 字段 + 指令正文 + 元信息）
- 使用 `zustand + persist` 管理状态，降低全局状态复杂度
- 引入 `idb-keyval`，为目录句柄与部分状态提供浏览器端持久化能力

### 阶段 C：打通本地文件系统读写（关键差异化）
- 通过 File System Access API 连接本地目录（如 `.claude/skills`）
- 实现：
  - 扫描目录读取 `SKILL.md`
  - 解析 frontmatter + instructions
  - 回写技能到目标目录
  - 读取技能目录树与子文件（多文件 IDE 模式）
- 这是项目最有“工程含金量”的模块之一

### 阶段 D：做 Discover 能力（外部生态接入）
- 本地索引：`public/awesome-skills.json`
- 在线源：
  - `claude-plugins.dev`
  - `skillsllm.com`
- GitHub Repo 导入：支持 URL、`owner/repo`、`skild install owner/repo` 形式
- 统一转成内部 Skill 数据结构，并做去重

### 阶段 E：加入安全扫描与安装策略
- 在 `securityScan.ts` 建立规则引擎（`11` 条规则）
- 风险输出：
  - `score`（0-100）
  - `riskLevel`（safe/review/warning/blocked）
  - `hardTriggered`（硬阻断）
  - 分类统计（destructive/remote-exec 等）
- 在 UI 层做阻断策略：高危技能禁止安装

### 阶段 F：支持跨 IDE 安装目标
- 在 `skillTargets.ts` 建立目标映射（`20` 个目标）
- 包含 `sync-major` 一键同步策略（写入多个 `.<tool>/skills` 目录）
- 从“仅编辑器”升级成“可分发工具”

### 阶段 G：体验升级（主题 + 动态背景 + 模拟器 + MCP）
- 三套主题系统 + p5 生成式背景
- Simulator 页面做提示词沙盒演练（对话模拟）
- MCP 设置页 + 代理桥接，支持拉取工具列表

---

## 3. 你在简历里该怎么写（可直接复制）

## 3.1 一句话项目描述
- Agent Skill Forge：面向 AI Agent 技能生态的可视化 IDE，支持技能编写、导入审查、安全评分、本地安装和 MCP 工具接入。

### 3.2 技术栈写法
- 前端：`React 19`、`TypeScript`、`Vite`、`TailwindCSS 4`、`Zustand`
- 浏览器能力：`File System Access API`、`IndexedDB`
- 协议与服务：`MCP`、`SSE`、`Express`
- 工程工具：`ESLint`、`TypeScript Build`

### 3.3 项目经历（中文简历版）
- 设计并实现 AI Skill 可视化 IDE，覆盖技能创建、编辑、预览、模拟和安装全流程。  
- 基于 File System Access API 打通本地目录读写，支持技能目录扫描、frontmatter 解析、回写落盘与多文件结构管理。  
- 实现技能安全扫描引擎（11 条规则），输出风险评分与硬阻断标记，并在安装流程中执行高危拦截。  
- 建立跨工具安装目标映射（20 个 target），支持一键写入多个主流 Agent/IDE 技能目录。  
- 实现多源 Discover 能力（本地索引 + GitHub Repo + 外部市场源），统一数据模型并完成去重合并。  
- 搭建 MCP 连接链路（SSE <-> stdio 代理），在前端提供连接配置与工具列表可视化。

### 3.4 项目经历（英文简历版）
- Built a visual IDE for AI Agent skills, covering authoring, editing, simulation, security review, and installation workflows.  
- Integrated File System Access API for local directory authorization, skill parsing, bidirectional sync, and multi-file skill management.  
- Implemented a rule-based security scanner (11 rules) with risk scoring and hard-block policies for high-risk skills.  
- Designed cross-tool installation mapping (20 targets) to sync skills into major agent/IDE local directories.  
- Implemented multi-source discovery pipeline (local catalog, GitHub import, external feeds) with normalization and deduplication.  
- Added MCP integration with an SSE-to-stdio proxy and tool discovery UI.

### 3.5 面试可量化数据（建议只写已验证数据）
- 核心应用代码：`33` 文件，约 `3878` 行
- 技能样本池：`864` 个 `SKILL.md`
- 聚合索引：`889` 条技能记录
- 安装目标：`20` 个
- 安全规则：`11` 条

---

## 4. 面试官最可能追问的问题 + 应对方法

以下按“问题 -> 回答框架 -> 加分点 -> 风险点”组织。

### 4.1 为什么用 Zustand，不用 Redux？
- 回答框架：
  - 该项目状态模型相对扁平（skills、theme、MCP、toast），Zustand 上手快、样板少，适合中小规模快速迭代。
  - `persist` 能直接覆盖本项目持久化需求，且与组件耦合更低。
- 加分点：提到“后续若团队规模扩大可将关键域拆分为 slice + 中间件约束”。
- 风险点：不要说“Redux 过时”，要说“基于场景权衡”。

### 4.2 本地文件系统为什么选 File System Access API？
- 回答框架：
  - 需求是“用户授权后直接读写本地技能目录”，传统上传下载流体验差。
  - File System Access API 能获得目录句柄，支持增量读写与多文件操作。
  - 结合 IndexedDB 存句柄，可在后续会话尝试恢复连接。
- 加分点：主动补充“浏览器兼容和权限模型限制，需要降级方案”。
- 风险点：不要忽略安全边界（必须用户显式授权，不能静默越权）。

### 4.3 安全扫描为什么用规则引擎，不上 LLM 审核？
- 回答框架：
  - 首先需要可解释、可控、低成本和可离线执行，规则引擎更稳定。
  - 把高危模式（如 destructive/remote-exec）做硬触发，再叠加分级评分。
  - LLM 适合做二次审查或解释，不适合做第一道强约束门禁。
- 加分点：提“误报/漏报平衡”和“规则版本管理”。
- 风险点：不要宣称“100% 安全”。

### 4.4 你怎么处理跨 IDE 技能安装差异？
- 回答框架：
  - 抽象出 target 映射表，统一“目标目录 + 文案 + 安装策略”。
  - 通过 `sync-major` 做批量写入，减少用户重复操作。
- 加分点：提到“路径规范变化时，只需维护映射层，不改业务流程”。

### 4.5 MCP 代理为什么需要 SSE + stdio 桥接？
- 回答框架：
  - 浏览器不能直接管理本地进程，需通过本地 Node 代理中转。
  - SSE 负责浏览器到代理的长连接，stdio 负责代理到 MCP 进程通信。
- 加分点：提“连接生命周期管理（onclose/onerror）和会话隔离”。
- 风险点：必须提到代理安全（命令白名单、鉴权、域名白名单）。

### 4.6 如果面试官问：这个项目现在最大的技术债是什么？
- 推荐答法：
  - 当前已识别工程质量问题：`lint` 仍有 `20` 个 error，`build` 在 `Settings.tsx` 存在字符串/编码相关语法问题。
  - 已有明确修复优先级：先恢复构建，再做类型收敛（消除 `any`）、最后做性能分包和代理安全加固。
- 这类“主动暴露问题 + 明确治理计划”的回答通常比“说项目完美”更可信。

---

## 5. 专业名词补充（面试表达版）

### 5.1 File System Access API
- 定义：浏览器在用户授权前提下，直接访问本地文件/目录的 Web API。
- 本项目用途：连接技能目录、读取 `SKILL.md`、回写技能文件、遍历目录树。

### 5.2 Frontmatter
- 定义：Markdown 文件头部的结构化元数据（常见为 YAML）。
- 本项目用途：`name`、`description`、`allowed-tools`、`context` 等技能配置字段。

### 5.3 MCP（Model Context Protocol）
- 定义：模型与工具/资源交互的协议规范。
- 本项目用途：通过本地代理连接 MCP 服务端并列出可用工具。

### 5.4 SSE（Server-Sent Events）
- 定义：服务端到客户端的单向持续推送通道（基于 HTTP）。
- 本项目用途：浏览器与本地代理保持长连接，接收消息流。

### 5.5 Stdio Transport
- 定义：通过标准输入输出与子进程进行协议通信。
- 本项目用途：代理进程与本地 MCP Server 交互。

### 5.6 SSRF / RCE / Command Injection
- SSRF：服务端请求伪造，诱导服务访问内部或恶意地址。
- RCE：远程代码执行，攻击者控制执行任意命令。
- Command Injection：命令注入，通过拼接参数执行非预期命令。
- 面试说法：这些是本地代理和脚本导出场景中的核心安全风险点。

### 5.7 静态规则扫描（Rule-based Static Scan）
- 定义：不执行代码，只通过规则匹配文本模式进行风险识别。
- 本项目用途：在安装前做低成本、可解释、可阻断的安全门禁。

---

## 6. 面试应对策略（实战）

### 6.1 用 STAR 讲这个项目（推荐 90 秒版本）
- S（场景）：AI Agent 技能生态分散，缺少统一的技能编辑、审查和分发工具。
- T（任务）：做一个可本地落盘、可安全审查、可跨工具安装的可视化平台。
- A（行动）：实现技能模型、目录读写、Discover 导入、安全扫描、安装映射和 MCP 接入。
- R（结果）：形成端到端可用原型，覆盖“创建-审查-安装-联调”闭环，并沉淀多源技能数据集成能力。

### 6.2 面试官关注的不是“功能多”，而是“工程判断”
- 重点讲你为什么这样设计（权衡），而不是只讲做了什么（堆功能）。
- 每个核心模块都准备“一个设计取舍 + 一个风险控制 + 一个可演进点”。

### 6.3 被问到短板时怎么答
- 最优回答结构：
  - 我发现了什么问题（可验证）
  - 影响范围是什么
  - 我的修复优先级是什么
  - 我预计如何验收
- 例子：
  - “目前构建失败主因是 `Settings.tsx` 编码/字符串错误，我会先恢复 CI 可构建，再推进类型安全和代理安全治理。”

---

## 7. 你可以立刻执行的简历增强动作

1. 先修复构建与 lint（这是面试可演示的最低门槛）。  
2. 给项目补 2-3 张截图（Library/Editor/Settings），放到 README。  
3. 在 README 增加“架构图 + 数据流 + 安全模型”三张图。  
4. 准备 2 分钟演示脚本：导入一个技能 -> 扫描风险 -> 安装到目标目录 -> 模拟器验证。  
5. 把上面第 3 节简历条目直接放进项目经历，并配可量化数据。  

---

## 附：当前工程状态（本次实测）
- `npm run lint`：失败，`20` 个 error（主要是 `any` 和 `Settings.tsx` 语法问题）。
- `npm run build`：失败，`src/pages/Settings.tsx` 存在未闭合字符串和 JSX 解析错误。

这部分在面试中可以作为“我如何定位和治理技术债”的案例，不建议回避。
