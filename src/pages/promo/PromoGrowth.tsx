import React from 'react';
import { ArrowRightLeft, Bolt, GitMerge, Target } from 'lucide-react';

const growthLoops = [
  {
    title: 'Loop A: Discover -> Import -> Trust Conversion',
    description:
      '通过 Discover 和来源信号把“浏览”转成“导入”，让用户在首次会话内完成价值感知。',
    steps: ['展示热门/最近活跃 skills', '读取来源可信度并打分', '一键导入后触发模拟对话完成首次成功体验'],
  },
  {
    title: 'Loop B: Edit -> Simulate -> Install',
    description:
      '将技能编辑、模拟、安装串成单一操作回路，减少工具切换摩擦。',
    steps: ['在 IDE 模式修改 frontmatter 与 instructions', '在 Simulator 复盘行为一致性', '一键安装到多生态目录并返回结果'],
  },
  {
    title: 'Loop C: Audit -> Policy -> Team Reuse',
    description:
      '把可审计和合规门禁做成团队共享能力，形成组织级复用网络。',
    steps: ['记录关键动作审计事件', '高风险场景阻断并给出修复建议', '稳定技能模板沉淀为团队标准资产'],
  },
];

const launchPlan = [
  {
    day: 'Day 1-3',
    title: 'Narrative Fit',
    detail: '上线宣传页 + GitHub README 对齐，统一“能力资产化”产品叙事。',
    metric: 'Landing 访问到 Workspace 点击率 > 18%',
  },
  {
    day: 'Day 4-7',
    title: 'Activation Burst',
    detail: '重点引导用户完成导入、编辑、模拟、安装四步，形成第一条留存链路。',
    metric: '首次会话 4-step 完成率 > 35%',
  },
  {
    day: 'Day 8-14',
    title: 'Referral Engine',
    detail: '发布模板包与案例页，推动“复制 skill -> 改造 -> 再分发”的裂变行为。',
    metric: '模板二次分发率 > 20%',
  },
];

export const PromoGrowth: React.FC = () => {
  return (
    <div className="space-y-8 ui-page-enter">
      <section className="promo-panel p-6 sm:p-10">
        <p className="ui-kicker text-brand">Growth Blueprint</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">裂变增长引擎：不是单点功能，而是闭环系统</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-text-muted sm:text-base">
          通过三条增长回路把产品能力“滚起来”：引流转化回路、激活回路、复用回路。每一条都对应明确动作与可衡量指标。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {growthLoops.map((loop, index) => (
          <article key={loop.title} className="promo-panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="ui-badge ui-badge-brand">Loop {index + 1}</span>
              {index === 0 && <Target className="h-5 w-5 text-brand" />}
              {index === 1 && <Bolt className="h-5 w-5 text-brand" />}
              {index === 2 && <GitMerge className="h-5 w-5 text-brand" />}
            </div>
            <h2 className="text-lg font-bold leading-6">{loop.title}</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">{loop.description}</p>
            <ol className="mt-4 space-y-2 text-sm text-text-main">
              {loop.steps.map((step) => (
                <li key={step} className="rounded-[var(--radius-button)] border border-border-main bg-bg-action/40 px-3 py-2">
                  {step}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="promo-panel p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-brand" />
          <h2 className="text-2xl font-black tracking-tight">14 天上线增长计划</h2>
        </div>
        <div className="mt-5 space-y-3">
          {launchPlan.map((plan) => (
            <div key={plan.day} className="rounded-[var(--radius-base)] border border-border-main bg-bg-action/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand">{plan.day}</p>
                <span className="ui-badge ui-badge-info">{plan.title}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-text-main">{plan.detail}</p>
              <p className="mt-1 text-xs leading-5 text-text-muted">Success Metric: {plan.metric}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
