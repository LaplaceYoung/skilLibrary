# 2026-03-03 GitHub 对标与合规审查记录

## 1. 当前项目功能基线（Agent Skill Forge）
- 技能库：本地/发现源双视图、搜索、导入、安装、导出。
- 编辑器：Frontmatter + Instructions + 多文件工作区（保存后支持侧边文件树）。
- 安全/合规：内容安全扫描、操作级合规决策、MCP 命令与市场 URL 约束。
- 工程能力：本地目录同步、MCP 代理连接、审计事件与验证摘要、主题与语言设置。

## 2. GitHub 同类项目样本（检索时间：2026-03-03）
- [PromptHub](https://github.com/legeling/PromptHub)：本地优先、技能商店、版本控制、收藏置顶、跨平台分发。
- [CC Switch](https://github.com/farion1231/cc-switch)：统一 Skills/MCP 管理、GitHub/ZIP 一键安装、配置安全写入与备份。
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)：大规模技能目录与持续更新生态。
- [awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)：跨代理技能聚合与可发现性导向组织方式。

## 3. 借鉴并已集成的优化
### 3.1 来源可信度（借鉴“技能商店/目录化治理”）
- 新增来源元数据（Stars/Forks/License/Archive/更新时间）建模。
- 新增 `sourceTrust` 评分：综合安全分与来源活跃度，生成 `high/medium/low` 等级。
- Discover 卡片展示 `Trust 分` + 关键来源信号（Stars、Forks、License、更新时间）。

### 3.2 Discover 排序增强（借鉴“商店检索体验”）
- 新增排序维度：`Trust score`、`Most starred`、`Recently updated`、`Relevance`。
- 发现页可按可信度优先浏览，降低低质量来源干扰。

### 3.3 本地收藏置顶（借鉴 PromptHub 收藏能力）
- 新增技能置顶能力（Pin/Unpin）。
- 本地列表排序调整为：置顶优先，再按更新时间排序。

### 3.4 合规策略增强（借鉴生态治理经验）
- 新增来源合规规则：
  - 归档仓库：`deny`（阻断安装/导入）。
  - 许可证缺失或不明确：`warn`。
  - 长期不更新（>540 天）：`warn`。
  - 来源信任分过低：`warn`。

## 4. 合规设计说明
- 目标：从“仅内容安全”扩展为“内容安全 + 来源治理”双维审查。
- 结果：对高风险来源形成前置拦截，对灰区来源提供明确告警，不阻断可控试用。
- 实施位置：
  - 来源评分：`src/lib/sourceTrust.ts`
  - 合规决策：`src/lib/compliancePolicy.ts`
  - GitHub 导入来源信息：`src/components/RepoImporterModal.tsx`
  - 发现页与置顶交互：`src/pages/Library.tsx`

## 5. 本地验证结果
- 执行时间：2026-03-03
- 命令：`npm run check`
- 结果：`lint` 与 `build` 均通过。
