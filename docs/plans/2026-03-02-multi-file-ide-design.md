# Multi-File Skill Structure Design (V4 - Mini IDE Mode)

## 概述 (Overview)
为了支持类似 GitHub 上 `skills-manager-client` 所述的高级特性（即一个 Skill 并非只是单一的 `SKILL.md`，还可以附带 `template.md`, `examples/sample.md`, `scripts/validate.sh` 等子附属文件系统），我们将把 Agent Skill Forge 的编辑器彻底升级为一个专门针对 Claude Skill 的**微型 IDE 编辑器**。

由于我们已经基于 `HTML5 File System Access API` 接通了本地存储 (`fsCore.ts`)，我们可以直接映射并维护一个真实的系统子文件夹。

## 架构变化设计 (Architecture Changes)

### 1. 数据模型升级 (Data Model Expansion)
在之前的单纯 `Skill` 对象层面上，需要对其外围增加一个 `SkillDirectory` 或者 `FileTree` 概念的支持：
- **核心文件 (`SKILL.md`)**：依然包含标准的 YAML Frontmatter 和主 Instructions，这是技能的“大脑”。
- **文件树映射模块 (`Virtual File System`)**：针对每个正在被编辑的 Skill 目录，提取其包含的完整文件树级结构。此状态将作为当前 Active Editor Session 的一部分，而不再需要全部强行塞入 Zustand 的 Global State 中。

### 2. UI 升级：微型 IDE 布局 (IDE Layout UI)
重构 `SkillEditor.tsx` 页面的视觉骨架：
- **左侧边栏 (File Explorer)**：采用暗黑风的极客文件树结构（File Tree Widget）。
  - 显示以当前技能名称为 Root 的树状列表。
  - 支持快捷键或 Hover 按钮进行“新建文件 (New File)”和“新建文件夹 (New Folder)”。
- **右侧主窗体 (Editor Pane)**：
  - 如果左侧点击的是 `SKILL.md`，则渲染现有的**带有 Frontmatter 可视化配置表单**的高级预览编辑器。
  - 如果左侧点击的是其他附属文件（如 `validate.sh` 等），则渲染为一个**纯文本 / 代码高亮编辑器**的简单面板，让用户直接写补充代码或内容。

### 3. I/O 底层 API 增强 (FS Core Enhancements)
当前的 `fsCore.ts` 只有 `writeSkillToDisk`（专门暴力复写 SKILL.md）。我们需要将其扩展为细粒度的 I/O 驱动组：
- `readSkillTree(skillDirHandle)`：递归读取指定技能文件夹下所有的文件结构名称和路径列表。
- `readSubFile(fileHandle)`：读取单个辅助文件的纯文本文档。
- `writeSubFile(fileHandle, content)`：写入/保存指定的辅助文件。
- `createDirectory(parentHandle, dirName)`：创建如 `scripts` 这种子目录。

## V4 实施边界与折衷 (Limitations)
- **非本地连接模式降级 (`isLocalLinked === false`)**：在此模式下，用户的内存中 Zustand Store 无法完美承载复杂的多文件模拟存储（不现实且性能差）。如果用户**没有**通过浏览器建立物理联机连接，编辑器将退回 V2 的经典级单文件 `SKILL.md` 瀑布流基础面貌。仅向接入了真物理目录的高级极客用户开放 IDE 多文件模式。

## 具体开发步骤 (Implementation Steps)
1. **重构 File System Hooks**: 扩展 `fsCore.ts`，加入针对某个 Skill 的 `tree` API。
2. **切分布局**: 将当前的 `SkillEditor.tsx` 拆分为 `EditorSidebar.tsx` (文件树) 和 `EditorWorkspace.tsx` (渲染内容)，并且受一个高阶的 `SkillIDE` 上下文管控。
3. **集成基础 Code 编辑器**: 引入一个轻量的文本域并针对非 `.md` 文件提供简单的等宽显示（暂不引入重量级的 Monaco Editor）。
4. **处理新老状态兼容**: 确保老数据在新 IDE 左侧永远保持至少有一个名为 `SKILL.md` 的常亮入口点。
