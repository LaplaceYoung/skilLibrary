export type LocalizedText = { en: string; zh: string };

export const PROMO_ANNOUNCE: LocalizedText = {
  en: 'Desktop-first · Local-first · Governed delivery',
  zh: '桌面优先 · 本地优先 · 治理交付',
};

export const PROMO_HERO = {
  kicker: { en: 'Agent Skill Forge', zh: 'Agent Skill Forge' },
  title: { en: 'Ship skills with control.', zh: '技能交付，始终可控。' },
  subtitle: {
    en: 'Build, simulate, govern, distribute — one flow for durable skill delivery.',
    zh: '构建、模拟、治理、分发，形成可持续的技能交付流程。',
  },
  primaryCta: { en: 'Star / Fork', zh: 'Star / Fork' },
  secondaryCta: { en: 'See workflow', zh: '查看流程' },
};

export const PROMO_SIGNALS: LocalizedText[] = [
  { en: 'Governed', zh: '治理' },
  { en: 'Simulated', zh: '可模拟' },
  { en: 'Distributed', zh: '可分发' },
];

export const PROMO_USE_CASES = [
  {
    title: { en: 'Skill curation', zh: '技能策展' },
    detail: { en: 'Collect, version, and reuse.', zh: '收集、版本化、复用。' },
  },
  {
    title: { en: 'Policy gates', zh: '策略闸门' },
    detail: { en: 'Approve before install.', zh: '安装前审批。' },
  },
  {
    title: { en: 'Simulation lab', zh: '模拟实验室' },
    detail: { en: 'Replay scenarios safely.', zh: '安全回放场景。' },
  },
  {
    title: { en: 'Multi-agent rollout', zh: '多代理分发' },
    detail: { en: 'Ship to many runtimes.', zh: '覆盖多端运行。' },
  },
];

export const PROMO_WORKSPACE = {
  title: { en: 'Work in your files', zh: '在文件里工作' },
  subtitle: { en: 'Skills live with context, not in tabs.', zh: '技能与上下文一起被管理。' },
  bullets: [
    { en: 'Structured skill bundles', zh: '结构化技能包' },
    { en: 'Editable prompts & inputs', zh: '可编辑提示与输入' },
    { en: 'Exportable outputs', zh: '可导出输出' },
  ],
};

export const PROMO_WORKFLOW_STEPS = [
  { en: 'Discover', zh: '发现' },
  { en: 'Install', zh: '安装' },
  { en: 'Simulate', zh: '模拟' },
  { en: 'Govern', zh: '治理' },
];

export const PROMO_COMPONENTS = [
  {
    title: { en: 'Skill packs', zh: '技能包' },
    detail: { en: 'Reusable units for teams.', zh: '团队复用单元。' },
    tags: [
      { en: 'Reusable', zh: '复用' },
      { en: 'Versioned', zh: '版本化' },
    ],
  },
  {
    title: { en: 'Policy sets', zh: '策略集' },
    detail: { en: 'Guardrails before release.', zh: '发布前约束。' },
    tags: [
      { en: 'Review', zh: '评审' },
      { en: 'Govern', zh: '治理' },
    ],
  },
  {
    title: { en: 'Scenario runs', zh: '场景运行' },
    detail: { en: 'Replay to validate.', zh: '回放验证。' },
    tags: [
      { en: 'Simulate', zh: '模拟' },
      { en: 'Audit', zh: '审计' },
    ],
  },
];

export const PROMO_INDUSTRIES = [
  {
    title: { en: 'Product', zh: '产品' },
    detail: { en: 'Ship workflows faster.', zh: '更快交付流程。' },
  },
  {
    title: { en: 'Research', zh: '研究' },
    detail: { en: 'Keep experiments governed.', zh: '实验过程可治理。' },
  },
  {
    title: { en: 'Operations', zh: '运营' },
    detail: { en: 'Standardize repeatable runs.', zh: '标准化重复任务。' },
  },
  {
    title: { en: 'Education', zh: '教育' },
    detail: { en: 'Teach by reusable skills.', zh: '用技能复用教学。' },
  },
];

export const PROMO_SAFETY = {
  title: { en: 'Safety & governance', zh: '安全与治理' },
  subtitle: { en: 'Control what ships, track what changes.', zh: '控制交付，追踪变化。' },
  bullets: [
    { en: 'Policy checks before install', zh: '安装前策略校验' },
    { en: 'Versioned releases', zh: '版本化发布' },
    { en: 'Local-first data flow', zh: '本地优先数据流' },
    { en: 'Audit-ready trails', zh: '可审计轨迹' },
  ],
};

export const PROMO_USAGE_MODES = [
  {
    title: { en: 'Personal', zh: '个人' },
    detail: { en: 'Local-first workspace.', zh: '本地优先工作区。' },
    accent: { en: 'Local', zh: '本地' },
  },
  {
    title: { en: 'Team', zh: '团队' },
    detail: { en: 'Shared skill catalog.', zh: '共享技能目录。' },
    accent: { en: 'Shared', zh: '共享' },
  },
  {
    title: { en: 'Organization', zh: '组织' },
    detail: { en: 'Governed distribution.', zh: '治理式分发。' },
    accent: { en: 'Governed', zh: '治理' },
  },
];

export const PROMO_FAQ = [
  {
    q: { en: 'Is this an AI model?', zh: '这是一个 AI 模型吗？' },
    a: { en: 'No. It is a workflow layer for skill delivery.', zh: '不是。这是技能交付的工作流层。' },
  },
  {
    q: { en: 'Can I use it offline?', zh: '可以离线使用吗？' },
    a: { en: 'Yes. Local-first by default.', zh: '可以，本地优先。' },
  },
  {
    q: { en: 'How do I share skills?', zh: '如何共享技能？' },
    a: { en: 'Package and share via GitHub.', zh: '打包并通过 GitHub 分发。' },
  },
  {
    q: { en: 'Is it open source?', zh: '是开源的吗？' },
    a: { en: 'Yes. The repository is public.', zh: '是的，仓库公开。' },
  },
  {
    q: { en: 'How can I contribute?', zh: '如何贡献？' },
    a: { en: 'Fork, improve, and open a PR.', zh: 'Fork 改进并提交 PR。' },
  },
];

export const PROMO_FINAL_CTA = {
  title: { en: 'Build the skill stack.', zh: '搭建你的技能栈。' },
  subtitle: { en: 'Governed delivery starts here.', zh: '治理式交付，从这里开始。' },
};
