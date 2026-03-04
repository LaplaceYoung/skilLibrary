import React from 'react';
import { ArrowRight, CheckCircle2, Compass, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

const engineCards = [
  {
    title: 'Assetize Skills',
    icon: Compass,
    description: '将零散提示词转成结构化资产：frontmatter、instructions、attachments。',
  },
  {
    title: 'Govern Before Action',
    icon: ShieldCheck,
    description: '保存/导入/安装/导出前执行安全扫描与策略门禁，控制高风险行为。',
  },
  {
    title: 'Distribute to Many Agents',
    icon: Workflow,
    description: '同一份 skill 可安装到 .claude/.codex/.cursor/.windsurf/.github/.gemini。',
  },
  {
    title: 'Close the Learning Loop',
    icon: Sparkles,
    description: '通过 Simulator、审计日志与命令面板高频迭代，提高可复用率与转化率。',
  },
];

const kpis = [
  { value: '6+', label: '主流 Agent 生态可安装' },
  { value: '4', label: '关键动作合规闸口' },
  { value: '11 + 4', label: 'Smoke + A11y E2E 已落地' },
  { value: 'Local-first', label: '本地优先 + MCP 可扩展' },
];

export const PromoOverview: React.FC = () => {
  return (
    <div className="space-y-8 sm:space-y-10 ui-page-enter">
      <section className="promo-panel p-6 sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] lg:items-end">
          <div className="space-y-5">
            <p className="ui-kicker text-brand">Product Positioning</p>
            <h1 className="text-4xl font-black leading-tight tracking-[-0.02em] text-text-main sm:text-5xl lg:text-6xl">
              把 Agent Skill
              <br />
              从“仓库收藏”升级成
              <span className="text-brand">可增长产品</span>
            </h1>
            <p className="max-w-2xl text-base leading-7 text-text-muted sm:text-lg">
              Agent Skill Forge 面向 AI 产品和平台团队：让 skill 具备可编辑、可验证、可安装、可传播的完整闭环，
              让每一次能力沉淀都能带来下一次增长裂变。
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/editor" className="ui-btn-primary px-5 py-3 text-sm sm:text-base">
                立即创建增长技能
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/promo/growth" className="ui-btn-secondary px-5 py-3 text-sm sm:text-base">
                查看裂变增长引擎
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-[var(--radius-base)] border border-border-main bg-bg-action/60 p-4 sm:p-5">
                <p className="text-2xl font-black tracking-tight text-brand sm:text-3xl">{kpi.value}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted sm:text-sm">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">能力裂变引擎</h2>
          <span className="ui-badge ui-badge-brand">From idea to install</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {engineCards.map((card) => (
            <article key={card.title} className="promo-panel p-5 sm:p-6">
              <div className="mb-3 inline-flex rounded-[var(--radius-button)] border border-brand/30 bg-brand/10 p-2 text-brand">
                <card.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold leading-6 text-text-main">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-muted">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-panel p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="ui-kicker">Value Narrative</p>
            <p className="mt-2 text-base leading-7 text-text-muted">
              对外讲“分发效率”，对内讲“合规与可维护性”，让研发、产品、运营都能在同一套 skill 工具链里协作。
            </p>
          </div>
          <Link to="/promo/benchmarks" className="ui-btn-secondary px-4 py-2.5 text-sm">
            查看同类仓库对标
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-base)] border border-emerald-400/25 bg-emerald-500/8 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              面向面试叙事
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-200/80">可直接映射 AI 产品岗位：能力资产化、工作流标准化、交付可验证。</p>
          </div>
          <div className="rounded-[var(--radius-base)] border border-sky-400/25 bg-sky-500/8 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300">
              <CheckCircle2 className="h-4 w-4" />
              面向业务增长
            </p>
            <p className="mt-1 text-xs leading-5 text-sky-200/80">可扩展至模板市场、团队协作、私域知识注入与分发转化漏斗。</p>
          </div>
        </div>
      </section>
    </div>
  );
};
