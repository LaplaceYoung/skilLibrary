# UI/UX 升级方案（ReactBits + GitHub 对标）

## 1. 当前产品 UI/UX 基线

### 信息架构
- 全局布局：左侧固定导航 + 右侧主工作区（`Layout.tsx`）。
- 主流程：`Library`（发现/管理） -> `SkillEditor`（编辑） -> `Simulator`（验证） -> `Settings`（系统配置）。
- 视觉系统：三套主题 token（`geometric/chromatic/organic`）+ 通用语义类（`themed-panel/action/input`）。

### 现有优势
- 主题切换和背景生成式动效已打通（含 `prefers-reduced-motion` 分支）。
- 页面进入/状态反馈动效覆盖较完整（加载、弹层、消息、状态指示）。
- 关键功能在单页内完成闭环，交互密度高，工程可迭代性好。

### 主要体验问题
- 组件交互语言不统一：同一功能区域存在原生 `alert/prompt` 与自定义 Toast/Panel 并存，破坏沉浸感。
- 动效“有数量但缺层级”：较多 `animate-*` 是微动效叠加，缺少“页面级叙事动效”与状态节奏控制。
- 可访问性基础薄弱：部分可点击 `div` 无键盘语义/焦点规范，Select 主要是鼠标交互。
- 桌面优先明显，移动适配策略偏保守，信息密度与可点击区域在小屏下不稳定。

## 2. 对标来源与可复用方向

## ReactBits（重点：视觉冲击 + 动效氛围）
- 官方站点展示了按类别组织的可复用动画组件（Text / Background / Animations / Components）。
- 适配方向：
  - 引入“页面级背景与过渡”而非只在局部加 `animate-*`。
  - 将 `Library` 与 `Simulator` 的空状态、加载态升级为品牌化“情境反馈”。
  - 在不影响可读性的前提下，控制动效密度并建立停用策略。

## GitHub 高质量参考（重点：稳定性 + 设计体系）
- `DavidHDev/react-bits`：高质量动画组件集合，可用于快速搭建视觉层。
- `magicuidesign/magicui`：大量可组合 UI + motion 片段，适合 marketing-like 区块和状态卡。
- `shadcn-ui/ui`：工程化组件范式（可复制到项目、可控样式），适合重建交互一致性。
- `radix-ui/primitives`：可访问性强的低层交互原语，适合下拉、弹层、对话框等基础件。
- `motiondivision/motion`：复杂动效编排与页面转场能力强，适合建立统一动效语言。

## 3. 升级目标（下一版本）

### 产品级目标
- 视觉风格：从“功能工具 UI”升级到“专业创作工作台 UI”。
- 交互体验：统一反馈方式，减少系统弹窗，建立状态一致性。
- 动效策略：形成“页面级 -> 模块级 -> 控件级”三层动效架构。
- 可访问性：核心组件支持键盘导航、焦点可见、语义化结构。

### 可量化指标
- 原生 `alert/prompt` 使用点：11 -> 0。
- 关键流程（导入、保存、安装、同步）统一反馈组件覆盖率：100%。
- 主要可交互组件键盘可达率：>= 95%（导航、Tab、Select、Modal）。
- 首屏交互稳定（避免重动画卡顿）：保留 `prefers-reduced-motion`，并提供“低动态模式”开关。

## 4. 分阶段改造路线

### Phase 1（1-2 天）：交互一致性与可访问性打底
- 统一系统反馈：替换 `alert/prompt` 为 `Dialog/Toast/Inline Notice`。
- 为点击型 `div` 补全语义与键盘交互，统一 `focus-visible` 样式。
- 重构 Select/Dropdown 的键盘导航（上下键、回车、Esc、焦点循环）。

### Phase 2（2-3 天）：设计系统升级
- 建立 `tokens + component variants + interaction states` 三层结构。
- 梳理字体层级与字号策略，减少 `text-[10px]` 超小字高频使用。
- 统一卡片、按钮、输入框、标签、状态徽章的视觉规则。

### Phase 3（2-3 天）：动效语言与场景化表达
- 引入 Motion 编排：页面切换、面板进出、列表重排、状态切换。
- 结合 ReactBits/Magic UI，升级：
  - `Library`：筛选、安装、导入过程反馈。
  - `Simulator`：消息流与系统提示折叠区域。
  - `Settings`：连接态/错误态/完成态。
- 增加动效分级策略：`full / reduced / off`。

### Phase 4（1-2 天）：性能与验收
- 复查重绘热点（背景动画、阴影、blur 区域、过多 transition）。
- 做交互压测（大列表 + 高频筛选 + 导入并发）保证帧率与响应。
- 输出设计回归清单与演示脚本，便于面试/发布展示。

## 5. 技术实施建议（与现代码映射）

### 先改这些文件
- `src/pages/SkillEditor.tsx`：去除 `alert/prompt`，替换成统一交互反馈。
- `src/pages/Settings.tsx`：错误与确认流程改为对话框+Toast。
- `src/components/Select.tsx`：补键盘导航与可访问性语义。
- `src/components/Sidebar.tsx`：可点击区域语义化（button/link），统一焦点态。
- `src/index.css`：补充 `focus-visible`、动效分级变量、字号层级 token。

### 库选型建议（最小可行组合）
- `radix-ui` + `shadcn`：用来统一基础交互组件与可访问性。
- `motion`：用来统一动画时间曲线和编排层级。
- `react-bits`/`magicui`：仅用于“品牌感场景块”，避免全站过度装饰。

## 6. 风险与控制

- 风险：风格升级过猛影响功能辨识度。
- 控制：优先“流程清晰度 > 视觉冲击”，保留对比 A/B 分支。

- 风险：动效叠加导致性能下降。
- 控制：建立预算（动画时长、同时活跃动画数、blur 限制）并在低动态模式降级。

- 风险：组件迁移期间出现交互回归。
- 控制：按页面分批替换，先 `Settings/Editor` 再 `Library/Simulator`，每阶段跑 lint/build 与手动回归。
