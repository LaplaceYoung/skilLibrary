# Local File System Integration Design (Option A)

## 概述 (Overview)
为了赋予纯 Web 端应用（Agent Skill Forge）扫描、读取和写入用户本地操作系统中 `.claude/skills` 目录的底层能力，我们将采用现代浏览器的 **HTML5 File System Access API**（具体为 `window.showDirectoryPicker`）。

## 架构与数据流 (Architecture & Data Flow)

### 1. 目录访问与授权绑定 (Directory Access)
- **UI 触发器**: 在主侧边栏或系统设置页增加一个 "Connect Local `.claude/skills` Folder" (连接本地技能库) 按钮。
- **权限流**:
  1. 用户点击按钮，触发 `showDirectoryPicker({ mode: 'readwrite' })`。
  2. 浏览器拉起操作系统的原生文件夹选择窗口。
  3. 用户选中 `C:\Users\[username]\.claude\skills`。
  4. 浏览器系统级弹窗向用户索要读写权限。
  5. 授权成功后，前端获取到一个 `FileSystemDirectoryHandle`。
  6. **持久化关联**: 我们将这个 Handle 存入 **Zustand store** 持久化，并存储在 [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) 中（因为 LocalStorage 无法序列化并存储复杂的句柄对象）。需要借助第三方库，如 `idb-keyval`。每次刷新网页，我们尝试从 IDB 唤醒该句柄，再次向用户请求权限静默连接。

### 2. 本地解析与双向联通 (Parsing & Syncing)
- **读取 (Import/Scan)**:
  - 遍历该 Handle 下的所有子文件夹（每一个子文件夹即一个 Claude Skill）。
  - 在每个子文件夹内，定位到 `SKILL.md` 文件。
  - 读取原生的 Markdown 内容文本。
  - 使用预设的正则表达式（或库，如 `gray-matter`）萃取其 YAML Frontmatter 头和正文 Instruction。
  - 将萃取出的数据标准化为当前的 `Skill` 接口载入 Zustand store（如果是已存在的技能，进行合并；如果是新的，直接追加）。
- **写入 (Export/Save)**:
  - 当用户在 Skill Editor 中点击原有的“保存”，检查是否已绑定本地 `FileSystemDirectoryHandle`。
  - 如果具备本地句柄：直接在底层目录新建对应 `name` 的子文件夹（如果不存在），并复写覆写其内部的一份 `SKILL.md`。
  - 摒弃了原有的 Bash ".sh 下载生成器" 的繁琐流程。

### 3. 安全扫描与检测机制 (Security Scanning - Optional Enhancement)
- 在读取每个 `SKILL.md` 时，使用正则引擎静态扫描文件内容。
- 如果检测出危险指令调用（例如：`rm -rf`, `curl <未知远端>`, 或敏感的系统级注入钩子），则在载入 Store 时为其自动打上风险标记警告，在库卡片上给出红色的 "Security Warning" 标签。

## 端到端异常降级处理 (Error Handling & Fallback)
1. **浏览器不兼容 / HTTPS 缺失**: 
   - `showDirectoryPicker` 要求环境必须是安全上下文（HTTPS 或 Localhost）且通常仅支持 Chromium 内核。
   - **降级机制**: UI 面板将捕捉 `window.showDirectoryPicker === undefined`，呈现 "需使用 Chrome/Edge 解锁全部原生体验" 的友善提示，退回普通态。
2. **授权拒绝 (`NotAllowedError`)**: 
   - 提供柔和的红色 Toaster 提示，允许用户重新发起验证授权流程。
3. **格式破损**:
   - 某些本地生成的 `SKILL.md` 的 YAML 头可能残缺，应用提供默认容错参数填补，而不使 UI 白屏崩溃。

## 组件变更预案 (Component Updates)
- `src/store/index.ts`: 引入 `idb-keyval` 用于句柄缓存。
- `src/pages/Settings.tsx` & `src/components/Sidebar.tsx`: 加入“本地文件夹授权管理”状态面板。
- `src/lib/os.ts` (新建): 封装全部的 `idb-keyval` 读取、FS 权限验证以及递归提取文件的核心逻辑与工具函数。
- `src/pages/SkillEditor.tsx`: 保存时直接异步调用 `os.ts` 中的文件复写 API。
