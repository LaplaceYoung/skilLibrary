import React from 'react';
import { ArrowRight, Github, ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackPromoEvent } from '../../lib/promoAnalytics';
import { usePromoLocale } from './promoLocale';

const highlights = [
  { title: { en: 'Policy-first', zh: '合规优先' }, detail: { en: 'Guarded delivery', zh: '有闸门的交付' } },
  { title: { en: 'Reusable units', zh: '可复用单元' }, detail: { en: 'Skills as assets', zh: '技能即资产' } },
  { title: { en: 'Multi-agent', zh: '多代理分发' }, detail: { en: 'One skill, many runtimes', zh: '一份技能，多端运行' } },
];

export const PromoOverview: React.FC = () => {
  const { locale } = usePromoLocale();
  const isEnglish = locale === 'en';

  return (
    <div className="space-y-8 sm:space-y-10 promo-fade-in">
      <section className="promo-surface promo-float rounded-[28px] p-7 sm:p-10 lg:p-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)] lg:items-end">
          <div className="space-y-6 promo-stagger">
            <p className="promo-reveal text-xs uppercase tracking-[0.18em] text-[#d7a768]">
              {isEnglish ? 'Agent Skill Operating System' : '技能操作系统'}
            </p>
            <h1 className="promo-reveal text-4xl font-semibold leading-[1.03] tracking-[-0.03em] text-[#f9f6ef] sm:text-6xl">
              {isEnglish ? 'Ship skills. Governed.' : '技能交付，先有闸门。'}
            </h1>
            <p className="promo-reveal max-w-2xl text-sm leading-7 text-[#cbc3b4] sm:text-base">
              {isEnglish
                ? 'Edit, simulate, govern, distribute. One flow for durable skill delivery.'
                : '编辑·模拟·合规·分发，一体化交付流程。'}
            </p>
            <div className="promo-reveal flex flex-wrap gap-3">
              <a
                href="https://github.com/LaplaceYoung/skilLibrary"
                target="_blank"
                rel="noreferrer"
                onClick={() => trackPromoEvent('promo_cta_github', 'promo-overview')}
                className="ui-btn-primary rounded-full px-6 py-3 text-sm"
              >
                <Github className="h-4 w-4" />
                {isEnglish ? 'Star / Fork' : 'Star / Fork'}
              </a>
              <Link to="growth" className="ui-btn-secondary rounded-full px-6 py-3 text-sm">
                {isEnglish ? 'Explore Flow' : '查看流程'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="promo-stat-card rounded-2xl border border-white/15 bg-[#14120d]/70 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#9f9787]">{isEnglish ? 'Policy Gates' : '策略闸门'}</p>
              <p className="mt-2 text-3xl font-semibold text-[#ffe2b8]">Policy</p>
            </div>
            <div className="promo-stat-card rounded-2xl border border-white/15 bg-[#14120d]/70 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#9f9787]">{isEnglish ? 'Install Targets' : '安装目标'}</p>
              <p className="mt-2 text-3xl font-semibold text-[#ffe2b8]">Multi</p>
            </div>
          </div>
        </div>
      </section>

      <section className="promo-surface rounded-2xl p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-[#d7a768]">
          {isEnglish ? 'System Signals' : '系统信号'}
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-[#14120d]/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[#9e9585]">{isEnglish ? 'Governance' : '治理'}</p>
            <p className="mt-2 text-2xl font-semibold text-[#ffe2b8]">{isEnglish ? 'Policy + Audit' : '策略 + 审计'}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-[#14120d]/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[#9e9585]">{isEnglish ? 'Simulation' : '模拟'}</p>
            <p className="mt-2 text-2xl font-semibold text-[#ffe2b8]">{isEnglish ? 'Scenario Run' : '场景回放'}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-[#14120d]/70 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[#9e9585]">{isEnglish ? 'Distribution' : '分发'}</p>
            <p className="mt-2 text-2xl font-semibold text-[#ffe2b8]">{isEnglish ? 'Multi-agent' : '多代理'}</p>
          </article>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item, index) => (
          <article key={item.title.en} className="promo-surface promo-card-glow rounded-2xl p-5">
            <div className="mb-3 inline-flex rounded-full border border-[#f4b367]/50 bg-[#f4b367]/15 p-2 text-[#ffcc8f]">
              {index === 0 && <ShieldCheck className="h-4 w-4" />}
              {index === 1 && <Sparkles className="h-4 w-4" />}
              {index === 2 && <Workflow className="h-4 w-4" />}
            </div>
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#f6f2e9]">
              {isEnglish ? item.title.en : item.title.zh}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#bbb2a2]">
              {isEnglish ? item.detail.en : item.detail.zh}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
};
