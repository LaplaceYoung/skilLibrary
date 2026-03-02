# V5 Global UI/UX Redesign: "The Three Philosophies"
*(Multi-Theme Generative Aesthetic Architecture)*

## 核心理念 (Core Philosophy)
遵从于 `canvas-design` 和 `algorithmic-art` 中的“将工程打造成博物馆展品”的理念，Agent Skill Forge V5 将不再局限于一种 UI 风格。我们将内置三个具有独立视觉哲学的**生成式主题引擎**，供极客用户在 Settings 中自由切换。不仅是换色的表皮，更是**布局、交互反馈与潜藏生命力（p5.js 算法背景）**的彻底改变。

## 主题设计解析 (Theme Definitions)

### 1. 主题 A: Geometric Silence (绝对理性与科技硬核)
* **视觉哲学**: 纯粹的秩序和克制。网格化精度，极端的负空间。
* **色彩空间**: 绝对的黑 `#000000` 底色，极少量的白与亮青色点缀。完全无圆角（0px border-radius），只有锋利的线条。
* **生成式生命 (p5.js)**: 背景潜伏着极低对比度（opacity: 0.05）的 **流体粒子系统 (Flow Fields)**。它们并不是为了炫技，而是像暗网的数据流一样，缓慢而不可抗拒地在留白处涌动。
* **排版**: 巨大厚重的无衬线标语搭配**极小号的等宽代码字体 (Monospace 10px)** 旁注。

### 2. 主题 B: Chromatic Language (复古工业与信息编译)
* **视觉哲学**: 信息即色彩。色彩作为最高级别的信息传递工具。抛弃渐变与玻璃态。
* **色彩空间**: 高级饱和度降低的纯色块嵌套。深海军蓝、复古暗琥珀色、灰鼠尾草绿底色切割。界面像一个精密的 70 年代大型实体计算机面板控制台。
* **生成式生命 (p5.js)**: 交互反馈基于**量子谐波 (Quantum Harmonics)**。当用户鼠标滑过组件或者点击时，底层的 Canvas 会产生色彩的极简波纹干涉效应（而非简单的发光），如模拟合成器般运作。
* **排版**: 极其严谨的数据对齐模式，没有无意义的留白，所有信息被精准“框定”在自己的色块专属领地内。

### 3. 主题 C: Organic Systems (生成禅意与生长)
* **视觉哲学**: 模拟冥想。圆润、无边界的组件仿佛漂浮在数字生态系统中。大面积的柔软灰褐色背景。
* **色彩空间**: 大地色系暗调。全界面极致的大圆角与无声阴影（Analog Meditation）。
* **生成式生命 (p5.js)**: 背景是**随机生长的分形学 (Recursive Whispers)**。它平时是静止的，但当你“创建新技能”、“存盘”、“报错”时，从角落会以算法驱动缓慢生长出几根绝不重复的树枝或几何分形，作为对你操作的生命态回应。
* **排版**: 极其纤细、干净的字体系统（Light / Thin weights）。字数最少化，克制即美学。

---

## 架构重构方案 (Architectural Refactoring)

为了支持这么深度的多套设计哲学大一统，需要进行底层彻底的重构：

### 1. 全局主题 Store (`src/store/themeStore.ts`)
引入一个新的 Zustand Store 来专门控制全局样式：
```typescript
interface ThemeStore {
    activeTheme: 'geometric' | 'chromatic' | 'organic';
    setTheme: (theme: 'geometric' | 'chromatic' | 'organic') => void;
}
```

### 2. 动态 CSS 变量注入 (Tailwind V4 深度运用)
废弃目前写死的 `bg-white/10` 或 `glass` 类。
采用在 `<html data-theme="...">` 挂载属性来切换数百个核心颜色与间距设计 Token (`index.css` 重构)。

### 3. Canvas 隔离渲染系统 (`src/components/canvas/*`)
开发三种基于 `p5.js` 封装的 React 组件： `<FlowFieldCanvas />`, `<HarmonicsCanvas />`, `<RecursiveCanvas />`。通过 `Zustand` 监听应用生命周期钩子（如 `onSave`, `onHover`），将这些命令传递给 `p5.js` 实例去执行对应的生成式交互动画。它们将作为 `z-index: -1` 的层永远垫在 App 的最下层。

### 4. 彻底清理现有组件
- 移除所有旧的 `glass`, `backdrop-blur` 样式。
- 根据 `activeTheme` 的不同属性条件渲染不同的 SVG Icon（甚至完全抛弃默认 Icon，改用纯几何代码绘制渲染图形）。
