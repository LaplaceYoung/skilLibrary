# Agent Skill Forge 优化建议（2026-03-02）

> 进展（2026-03-02 晚）：已完成第一轮落地，包括 MCP 代理鉴权/白名单、本地清理策略收敛、导出脚本安全加固、文件名与 frontmatter 写盘转义；并推进下一阶段基线优化（移除未使用 `@xenova/transformers` 依赖、背景动画改为空闲加载、仓库导入并发池与取消/重试机制），当前 `npm run lint` 与 `npm run build` 均通过。

## 1. 审查范围与结论
- 范围：`src/` 前端、`mcp-proxy/` 本地代理、构建与 lint、导入/安装/扫描主流程。
- 结论：项目方向正确（技能发现 + 安装 + 安全扫描 + MCP 连接），但当前有 **P0 安全风险** 和 **工程化短板**，需要先修复再扩展功能。

## 2. 关键问题（按优先级）

### P0（立即处理）
1. MCP 代理存在命令执行与开放代理风险。
- 证据：`mcp-proxy/index.js:33`、`mcp-proxy/index.js:34` 直接接收 `cmd/args` 并启动进程；`mcp-proxy/index.js:111` 到 `mcp-proxy/index.js:124` 允许代理任意 URL。
- 风险：本地 RCE、SSRF、数据外传。
- 建议：
  - 增加代理鉴权 token（参考 MCP Inspector 的默认 token 模式）。
  - 对 `cmd` 做白名单（如仅允许 `npx`/`node`），对 `args` 做 schema 校验。
  - `proxy-market` 只允许 `claude-plugins.dev`、`skillsllm.com` 等白名单域名。
  - 强制仅绑定 `127.0.0.1`，并在 UI 明确风险提示。

2. 导出安装脚本存在注入与转义风险。
- 证据：`src/pages/Library.tsx:241` 到 `src/pages/Library.tsx:247` 把技能内容直接拼接进 shell heredoc；`src/pages/Library.tsx:253` 文件名直接使用 `skill.name`。
- 风险：恶意技能名/内容可污染脚本。
- 建议：
  - 默认导出 zip（目录结构）而不是可执行 shell。
  - 若保留 shell 导出，需对 `skill.name` 做 slug 化并对 heredoc 边界做随机化和冲突检查。

3. 技能写盘路径和 frontmatter 未做充分转义。
- 证据：`src/lib/fsCore.ts:301` 直接以 `skill.name` 建目录；`src/lib/fsCore.ts:307` 到 `src/lib/fsCore.ts:317` 手工拼 YAML。
- 风险：非法路径名、frontmatter 断裂、元数据污染。
- 建议：
  - 新增 `sanitizeSkillDirName()`，禁止路径分隔符和保留名。
  - 使用 YAML 序列化库统一输出 frontmatter。

4. 清理数据会误删同域其他数据。
- 证据：`src/pages/Settings.tsx:43` 使用 `localStorage.clear()`。
- 风险：误清空同域其他应用缓存。
- 建议：只删除本应用 key（`agent-skill-forge-storage-v5`、`mcp-storage`、`agent-forge-dir-handle`）。

### P1（1-2 周内）
5. UI 文案出现大量乱码（疑似编码问题）。
- 证据：`src/App.tsx`、`src/pages/Settings.tsx`、`src/pages/SkillEditor.tsx`、`src/components/ide/*` 多处中文为 mojibake。
- 影响：可用性和专业感明显下降。
- 建议：统一 UTF-8 编码并抽离文案到 i18n 资源文件。

6. 工程质量门禁未通过。
- 证据：`npm run lint` 报错 41 个 error（`any`、空 catch、unused vars 等），`npm run build` 虽通过但有超大 chunk 告警。
- 影响：类型安全、长期可维护性下降。
- 建议：
  - 把 `lint` 纳入 CI 必过。
  - 清理 `any`（优先 `fsCore.ts`、`SkillEditor.tsx`、`mcpStore.ts`）。
  - 禁止空 `catch`，统一错误上报。

7. 首屏包体偏大。
- 证据：`npm run build` 产物 `dist/assets/index-B26hxJ3s.js` 约 1969 KB（gzip 547 KB）。
- 影响：首屏加载慢，移动端体验差。
- 建议：
  - 对 `p5` 背景和模拟器模块做动态加载（按路由/按需）。
  - 移除未使用依赖 `@xenova/transformers`（仅在 `package.json` 中声明，源码未引用）。
  - 为市场页、编辑器页做路由级代码分割。

8. 本地同步与重命名流程不完整。
- 证据：`SkillEditor` 保存时仅写新目录（`src/pages/SkillEditor.tsx:101`），未处理旧目录迁移/删除。
- 影响：重命名后易出现重复技能和历史残留目录。
- 建议：保存时记录 `originalName`，重命名走事务式迁移（copy + verify + delete old）。

### P2（持续优化）
9. 仓库导入流程串行抓取，缺少限流与取消机制。
- 证据：`src/components/RepoImporterModal.tsx:132` 到 `src/components/RepoImporterModal.tsx:176` 串行 `fetch`。
- 建议：并发池（如 5 并发）+ AbortController + 429 重试退避。

10. 自定义组件可访问性不足。
- 证据：`src/components/Select.tsx` 为 div 模拟选择器，缺少 ARIA role、键盘导航、焦点管理。
- 建议：补齐 `role="listbox"` / `option` 语义和键盘操作。

## 3. 开源对标与可借鉴功能（已用工具检索）

> 说明：Star 数据为本次检索页面读数（2026-03-02）。

| 项目 | 热度 | 可借鉴功能 | 建议落地到本项目 |
|---|---:|---|---|
| [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | 68.4k⭐ | SDK / CLI / Local GUI 三层产品结构，Local GUI 提供 REST API | 增加 `agent-skill-forge` 的轻量本地 API（导入、扫描、安装），让 UI 和 CLI 共享能力 |
| [cline/cline](https://github.com/cline/cline) | 58.5k⭐ | Checkpoints（Compare/Restore）、文件变更时间线、后台任务继续执行 | 给 SkillEditor 增加“保存快照/回滚”，并在安装流程增加后台任务状态 |
| [modelcontextprotocol/inspector](https://github.com/modelcontextprotocol/inspector) | 8.9k⭐ | 代理默认鉴权 token、`mcp.json` 导出、CLI 模式 | 为 `mcp-proxy` 增加 token 鉴权；在设置页增加 MCP 配置导出 |
| [libukai/awesome-agent-skills](https://github.com/libukai/awesome-agent-skills) | 2.3k⭐ | 全平台 skills 路径矩阵、官方/社区技能索引 | 用其路径矩阵校准 `skillTargets`，并给 Discover 增加“官方集合”筛选 |
| [gotalab/skillport](https://github.com/gotalab/skillport) | 329⭐ | `validate`（可 CI）、search-first loading、MCP/CLI 双通道 | 增加 `validate` 命令与搜索优先加载策略，减少一次性加载大技能内容 |
| [brucevanfdm/agent-skills-guard](https://github.com/brucevanfdm/agent-skills-guard) | 266⭐ | 更细粒度安全扫描（多风险类别、硬触发、并行扫描、报告） | 扩展 `securityScan` 规则库和扫描报告结构，支持批量并行扫描 |

## 4. 建议落地顺序（可执行）

### Sprint 1（安全加固，3-5 天）
- 完成 `mcp-proxy` 鉴权 + 命令白名单 + 域名白名单。
- 修复脚本导出注入风险，默认改为 zip 导出。
- 修复 `localStorage.clear()` 为精准 key 删除。

### Sprint 2（工程质量，3-5 天）
- 处理 41 个 lint error，CI 增加 `lint + build` 必过。
- 修复中文乱码并接入基础 i18n。
- 移除未用依赖，完成首屏分包。

### Sprint 3（功能增强，5-7 天）
- 引入快照回滚（借鉴 Cline checkpoints）。
- 增加 MCP 配置导出（借鉴 Inspector servers file export）。
- 增强安全扫描报告（借鉴 Agent Skills Guard 维度）。

## 5. 可量化目标（优化验收）
- 安全：`mcp-proxy` 未鉴权访问应全部 401；非白名单 URL 请求应 403。
- 质量：`npm run lint` error = 0。
- 性能：主 chunk gzip 从约 547 KB 降到 < 300 KB。
- 体验：中文文案乱码 0 处；导入流程支持取消与失败重试。

## 6. 下一阶段迭代升级计划（Phase 2，2026-03-03 至 2026-03-21）

### 6.1 迭代目标
- 完成“性能、可维护性、可观测性”三条主线升级，形成可持续发布节奏。
- 在不破坏现有功能的前提下，把项目从“可用”提升到“可稳定扩展”。

### 6.2 里程碑安排
1. Milestone A（2026-03-03 至 2026-03-07）：性能与依赖治理
- 任务：移除未使用依赖、背景动画空闲加载、路由与组件级延迟加载复查、首屏关键资源压缩。
- 验收：`npm run build` 后首屏主入口 gzip < 220 KB；交互首屏可用时间下降 20% 以上。

2. Milestone B（2026-03-08 至 2026-03-13）：编辑与导入链路稳定性
- 任务：技能重命名迁移（旧目录清理）、导入并发池与取消机制、导入失败重试与限流。
- 验收：重命名后无重复目录；导入 200 个候选文件时可取消且 UI 不冻结。

3. Milestone C（2026-03-14 至 2026-03-21）：体验一致性与发布质量门禁
- 任务：中文乱码修复、i18n 基础资源抽离、E2E 冒烟用例（Library/Editor/Settings/MCP）。
- 验收：乱码问题归零；CI 增加 `lint + build + smoke` 必过；发布前检查清单固化。

### 6.3 需求冻结与发布节奏
- 2026-03-12 18:00：冻结 Milestone B 新需求。
- 2026-03-20 18:00：冻结 Phase 2 全部新需求，仅允许阻塞级修复。
- 2026-03-21：产出 `v0.6` 版本候选与变更说明。

### 6.4 关键风险与预案
- 风险：`p5` 仍然占据较大 chunk，导致弱网首屏延迟。
- 预案：增加“静态背景降级开关”，在低性能设备默认禁用实时背景。
- 风险：多源导入接口限流导致发现页空白。
- 预案：本地缓存最近一次成功结果，并提供“离线只读模式”提示。
- 风险：Windows 文件系统命名差异导致迁移失败。
- 预案：统一使用路径清洗函数，并在迁移前做 dry-run 校验。

### 6.5 周会检查点（建议）
1. 2026-03-06：Milestone A 验收评审。
2. 2026-03-13：Milestone B 验收评审。
3. 2026-03-20：Phase 2 发布候选评审。

## 7. 状态跟踪（截至 2026-03-02）
- 已完成：MCP 代理 token 鉴权、命令白名单、市场域名白名单、仅本地监听。
- 已完成：导出脚本安全加固（目录名清洗、heredoc 边界防冲突）。
- 已完成：本地数据清理改为精准 key 删除，不再使用全量 `localStorage.clear()`。
- 已完成：写盘路径与 frontmatter 转义增强（目录名与附件名清洗、YAML 字段转义）。
- 已完成：技能重命名事务迁移（先复制目录，保存成功后删除旧目录，避免残留重复）。
- 已完成：移除未使用 `@xenova/transformers` 依赖声明并清理 lock 引用。
- 已完成：实时背景改为空闲时加载，并对“减少动态效果”用户默认不加载动画。
- 已完成：仓库导入改为并发池（5 并发）+ 可取消 + 429/5xx 重试退避，并保持结果按候选顺序稳定去重。
- 已完成：关键路径乱码修复（`App.tsx` 预置技能文案、`mcpStore.ts` MCP 连接提示）。
- 已完成：i18n 基线落地（新增 `src/i18n/messages.ts` 与 `useI18n`，接入 `Select`、`WorkspaceParams`、`WorkspaceInstructions`、`Simulator`，设置页新增语言切换）。
- 已完成：Phase 3 基础模块落地（`compliancePolicy` 合规决策、`skillValidator` 统一校验、`skillIndex` 多源索引、`auditLog` 审计事件）。
- 已完成：主链路接入合规与校验（Library 导入/安装/导出、SkillEditor 保存、RepoImporter 导入）。
- 已完成：审计事件贯通（导入、安装、保存、MCP 连接/断开/异常）并在 store 中保留最近 500 条。
- 已完成：MCP 代理增加 traceId 与策略决策输出（`x-trace-id`、`x-policy-decision`），并补齐 `/message` 鉴权与策略化错误响应。
- 待完成：其余页面文案继续抽离（优先 `WorkspaceMeta`、`Library`、`Settings` 其余区块）与 E2E 冒烟测试。
