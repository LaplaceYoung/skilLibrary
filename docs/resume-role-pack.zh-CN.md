# Agent Skill Forge 简历岗位定制包（前端 / 全栈 / AI 工程）

更新时间：2026-03-02

## 1. 使用说明
- 你可以把第 2 节对应岗位内容直接放进简历“项目经历”
- 第 3 节用于 ATS 关键词和 JD 对齐
- 第 4 节用于面试 60 秒自我讲述
- 第 5 节用于面试追问应答模板

---

## 2. 三套简历条目（可直接复制）

## 2.1 前端岗位版本（Frontend Engineer）

### 项目名
- Agent Skill Forge（AI Skill 可视化 IDE）

### 项目描述（一句话）
- 面向 AI Agent 技能生态的前端 IDE，支持技能创建、导入审查、安全评分、本地安装和 MCP 工具联调。

### 职责与产出（建议放 4-6 条）
- 使用 React + TypeScript + Vite 搭建多页面前端架构，完成 Skill Library / Editor / Simulator / Settings 全链路交互。  
- 基于 Zustand 设计全局状态模型，统一管理技能数据、主题系统、MCP 连接状态和 UI 通知。  
- 实现 Discover 多源聚合（本地索引 + GitHub Repo + 外部市场源）与去重逻辑，提升技能检索与安装效率。  
- 实现安全评分前端可视化（score/riskLevel/hard-trigger），并在安装流程执行高危阻断。  
- 设计并实现三套主题系统与 p5 动态背景，提升产品差异化视觉与交互体验。  
- 完成技能编辑器多模式 UI（frontmatter 配置、指令编辑、预览、文件树管理）。

### 技术栈
- React 19, TypeScript, Vite, TailwindCSS 4, Zustand, React Router, p5.js

---

## 2.2 全栈岗位版本（Full-Stack Engineer）

### 项目名
- Agent Skill Forge（AI Skill 开发与分发平台）

### 项目描述（一句话）
- 构建前后端协同的 AI Skill 平台，覆盖技能编辑、风险审查、跨工具安装及 MCP 协议接入。

### 职责与产出（建议放 4-6 条）
- 负责前端 IDE（React + TS）与本地代理服务（Node + Express）端到端联动，实现完整技能工作流。  
- 在浏览器端打通 File System Access API，实现目录授权、技能解析、双向同步与本地落盘。  
- 设计本地代理 SSE <-> stdio 桥接机制，对接 MCP 服务并实现工具列表动态拉取。  
- 建立规则化安全扫描机制（11 条规则），输出风险评分与硬阻断策略，降低高危技能导入风险。  
- 抽象跨工具安装目标映射（20 个 target），支持一键同步到多个 Agent/IDE 目录。  
- 建立多源导入管道（GitHub、外部市场、本地索引），统一 Skill 数据结构并进行标准化处理。

### 技术栈
- Frontend: React 19, TypeScript, Vite, TailwindCSS, Zustand  
- Backend/Runtime: Node.js, Express, SSE, MCP SDK

---

## 2.3 AI 工程岗位版本（AI Engineer / AI Product Engineer）

### 项目名
- Agent Skill Forge（AI Agent Skills 安全编排平台）

### 项目描述（一句话）
- 面向 Agent 技能生态构建可视化编排平台，重点解决技能规范化、风险控制和工具协议接入问题。

### 职责与产出（建议放 4-6 条）
- 将 Skill frontmatter（name/allowed-tools/context/agent）抽象为统一数据模型，提升技能可治理性。  
- 设计并实现技能风险评估引擎（destructive / remote-exec / privilege-escalation 等类别），建立可解释评分体系。  
- 引入 hard-trigger 阻断策略，将高危技能在安装前拦截，实现“可运行前审查”。  
- 完成 MCP 接入流程，支持通过本地代理拉取可用工具，实现 Agent 工具链可视化联调。  
- 构建技能发现与导入链路（本地库 + GitHub + 市场源），形成可扩展技能供给体系。  
- 支持跨 Agent/IDE 的技能分发，降低技能迁移成本并提升生态兼容性。

### 技术栈
- Agent/Protocol: MCP, Skill Frontmatter, Rule-based Risk Scanning  
- Engineering: React, TypeScript, Node.js, Express, File System Access API

---

## 3. ATS 关键词与 JD 对齐

### 3.1 前端岗关键词
- React, TypeScript, Vite, TailwindCSS, Zustand, SPA, State Management, UI Architecture, Component Design, Performance

### 3.2 全栈岗关键词
- Node.js, Express, API Proxy, SSE, Browser File API, End-to-End Delivery, Protocol Integration, Full-Stack Collaboration

### 3.3 AI 工程岗关键词
- MCP, Agent Tooling, Prompt/Skill Engineering, Policy Enforcement, Security Scanning, Risk Scoring, Tool Orchestration

### 3.4 对齐方法（投递前 3 分钟）
1. 从 JD 提取 8-12 个高频词。  
2. 把第 2 节条目中术语替换成 JD 同义词（不要改事实）。  
3. 保持每条经历“动作 + 技术 + 结果”结构。  

---

## 4. 面试 60 秒自我讲述模板（按岗位）

## 4.1 前端岗
- 我做了一个 AI Skill IDE，核心是把“技能创建-审查-安装”流程产品化。前端上我负责多页面架构、状态建模和复杂交互，尤其是编辑器、导入流程和安全评分可视化。技术上用 React + TypeScript + Zustand，配合 File System Access API 做本地目录同步。这个项目让我积累了复杂前端状态管理、可视化流程设计和工程化落地经验。

## 4.2 全栈岗
- 我负责了这个项目的端到端交付：前端 IDE + 本地 Node 代理。前端侧完成技能编辑和发现，后端侧实现 SSE 到 stdio 的 MCP 桥接，并支持市场源代理。这个项目的挑战在于协议联动和安全边界，我用统一数据模型、规则化扫描和安装策略把流程打通，并做了可扩展的目标映射。

## 4.3 AI 工程岗
- 我做的是一个面向 Agent Skills 的编排和治理工具。重点不是单纯 UI，而是把技能规范、风险扫描、工具接入和分发策略标准化。我们定义了 Skill 模型和风险规则体系，支持高危硬阻断，并通过 MCP 连接工具端。这个项目体现了我在 AI 工具链工程化、策略设计和落地实现上的能力。

---

## 5. 面试高频追问与应答模板（岗位通用）

### Q1：你做的最有技术含量的部分是什么？
- 建议回答：本地文件系统双向同步 + 安全扫描策略。前者涉及权限模型与目录读写，后者涉及可解释风险规则和安装阻断闭环。

### Q2：为什么说这是工程项目，不是 Demo？
- 建议回答：它有可执行闭环（创建、导入、审查、安装、模拟），有状态持久化、协议接入和风险控制，不只是页面展示。

### Q3：最大的难点和取舍？
- 建议回答：难点是“可用性 vs 安全性”。我选择规则引擎先做硬门禁，保证可解释和稳定，再考虑引入 LLM 做二次审查。

### Q4：如果继续迭代你先做什么？
- 建议回答：先修复构建与 lint，恢复 CI 质量门槛；再做代理安全加固（鉴权、白名单）；最后做性能分包和测试补齐。

---

## 6. 投递前快速检查清单

1. 只保留一个岗位版本到简历正文，其他版本放求职平台附件或面试备忘。  
2. 每条经历控制在 22-35 个字（中文）或 1 行英文，避免过长。  
3. 核心指标必须真实可验证（如 11 条规则、20 个安装目标、889 条聚合技能）。  
4. 保留“技术债治理计划”一句，体现工程判断力。  

---

## 7. 招聘平台极短版（可直接粘贴）

## 7.1 前端岗（3 条）
- 负责 AI Skill IDE 前端架构与核心页面开发，覆盖技能创建、编辑、导入、安装全流程。  
- 使用 React + TypeScript + Zustand 实现复杂状态管理，并完成安全评分可视化与高危阻断交互。  
- 基于 File System Access API 实现本地目录同步与多文件编辑体验，提升工具实用性。  

## 7.2 全栈岗（3 条）
- 端到端交付 AI Skill 平台：前端 IDE + 本地 Node/Express 代理服务。  
- 实现 SSE <-> stdio 的 MCP 桥接，支持工具链连接、工具列表拉取与可视化配置。  
- 建立多源导入与规则扫描链路（11 条规则），并支持 20 个安装目标的跨工具分发。  

## 7.3 AI 工程岗（3 条）
- 将 Agent Skill frontmatter 与执行策略结构化建模，提升技能规范化与可治理性。  
- 设计规则化风险评分与硬阻断机制，实现技能安装前安全门禁。  
- 打通 MCP 接入与跨工具安装，构建“技能编排-审查-分发”闭环能力。  
