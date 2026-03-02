import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useSkillStore, type Skill } from './store';
import { Suspense, lazy, useEffect } from 'react';
import { ToastProvider } from './components/Toast';

const Library = lazy(() => import('./pages/Library').then((module) => ({ default: module.Library })));
const SkillEditor = lazy(() => import('./pages/SkillEditor').then((module) => ({ default: module.SkillEditor })));
const Simulator = lazy(() => import('./pages/Simulator').then((module) => ({ default: module.Simulator })));
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

const RouteSkeleton = () => (
  <div className="themed-panel min-h-[40vh] flex items-center justify-center border-dashed">
    <p className="text-text-muted font-mono tracking-wide">Loading workspace...</p>
  </div>
);

const INITIAL_SKILLS: Skill[] = [
  {
    id: 'skl-v2-explain',
    name: 'explain-code',
    description: '通过可视化图示和通俗类比解释代码。用户询问“这段代码如何工作？”时调用。',
    author: 'Claude Code',
    tags: ['解释', '代码', '新手友好'],
    disableModelInvocation: false,
    userInvocable: true,
    allowedTools: ['Read', 'Grep'],
    context: 'none',
    instructions: '# 代码讲解助手\n当你解释代码时，始终包含：\n1. **先用类比建立直觉**：把逻辑对应到日常场景。\n2. **给出结构图**：用 ASCII 图展示模块与数据流。\n3. **分步推演**：按执行顺序说明每一步发生了什么。\n4. **指出常见坑**：补充容易出错的边界条件与修复建议。\n\n如果问题过于抽象，优先结合 `$ARGUMENTS` 给出示例，再解释原理。',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now()
  },
  {
    id: 'skl-v2-deploy',
    name: 'deploy',
    description: '安全的部署流水线模板。涉及生产环境副作用时，默认需要显式授权后执行。',
    author: 'Agent Skill Forge',
    tags: ['devops', '部署', '高风险工具'],
    disableModelInvocation: true,
    userInvocable: true,
    allowedTools: ['Bash'],
    context: 'none',
    instructions: '# 生产部署执行规范\n将应用 `$ARGUMENTS` 部署到线上前，按顺序执行：\n1. 运行 `npm run test`，确保测试通过。\n2. 运行 `npm run build`，确保构建成功。\n3. 将变更推送到目标分支并触发 CI/CD。\n4. 验证部署结果与回滚入口可用。\n5. 输出部署摘要（版本、环境、风险、回滚命令）。',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now()
  },
  {
    id: 'skl-v2-research',
    name: 'deep-research',
    description: '针对复杂课题创建 Explore 隔离流程（Subagent）进行深度研究。',
    author: 'Claude Core',
    tags: ['研究', 'subagent', '隔离执行'],
    disableModelInvocation: false,
    userInvocable: true,
    allowedTools: ['Read', 'Grep', 'Glob'],
    context: 'fork',
    agent: 'Explore',
    instructions: '# 深度研究协议\n围绕课题 `$ARGUMENTS` 执行：\n1. 使用 `Glob`、`Grep`、`Read` 收集相关代码与文档。\n2. 对关键实现做逐段阅读，记录证据与文件行号。\n3. 提炼结论、风险和未决问题，并给出可执行建议。\n4. 输出结构化报告：背景、发现、证据、建议、下一步。',
    createdAt: Date.now() - 10000000,
    updatedAt: Date.now()
  }
];

function App() {
  const { loadInitialSkills, activeTheme } = useSkillStore();

  useEffect(() => {
    // Sync theme to HTML root element
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    // 初始化预置技能
    loadInitialSkills(INITIAL_SKILLS);
  }, [loadInitialSkills]);

  return (
    <Router>
      <Layout>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/editor" element={<SkillEditor />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>
      <ToastProvider />
    </Router>
  );
}

export default App;
