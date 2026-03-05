import React from 'react';
import { ArrowRightLeft, Flame, Orbit, Repeat } from 'lucide-react';
import { usePromoLocale } from './promoLocale';

const loops = [
  {
    title: { en: 'Discover -> Install', zh: '发现 -> 安装' },
    icon: Orbit,
    detail: { en: 'Trust to first value', zh: '信任到达首个价值' },
  },
  {
    title: { en: 'Edit -> Simulate', zh: '编辑 -> 模拟' },
    icon: Repeat,
    detail: { en: 'Fast validation loop', zh: '快速验证闭环' },
  },
  {
    title: { en: 'Govern -> Reuse', zh: '治理 -> 复用' },
    icon: Flame,
    detail: { en: 'Policy for scale', zh: '策略驱动规模' },
  },
];

export const PromoGrowth: React.FC = () => {
  const { locale } = usePromoLocale();
  const isEnglish = locale === 'en';

  return (
    <div className="space-y-8 promo-fade-in">
      <section className="promo-surface rounded-[28px] p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[#d7a768]">
          {isEnglish ? 'Growth Design' : '增长设计'}
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#f9f6ef] sm:text-5xl">
          {isEnglish ? 'Three loops. One compounding graph.' : '三条闭环，一个增长图。'}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#c7beaf] sm:text-base">
          {isEnglish
            ? 'Acquire, activate, retain — stitched into one governed system.'
            : '获客、激活、留存，连接成一体化治理系统。'}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {loops.map((loop) => (
          <article key={loop.title.en} className="promo-surface promo-card-glow rounded-2xl p-5">
            <div className="mb-4 inline-flex rounded-full border border-[#f4b367]/50 bg-[#f4b367]/15 p-2 text-[#ffcb8a]">
              <loop.icon className="h-4 w-4" />
            </div>
            <h2 className="text-lg font-semibold text-[#f7f3ea]">{isEnglish ? loop.title.en : loop.title.zh}</h2>
            <p className="mt-2 text-sm leading-6 text-[#beb5a5]">{isEnglish ? loop.detail.en : loop.detail.zh}</p>
          </article>
        ))}
      </section>

      <section className="promo-surface promo-card-glow rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2 text-[#ffd8a7]">
          <ArrowRightLeft className="h-5 w-5" />
          <p className="text-xs uppercase tracking-[0.16em]">{isEnglish ? 'Execution Rhythm' : '执行节奏'}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#14120d]/65 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[#a69d8d]">{isEnglish ? 'Phase 1' : '阶段一'}</p>
            <p className="mt-2 text-sm text-[#f4efe4]">{isEnglish ? 'Discover -> Install' : '发现 -> 安装'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#14120d]/65 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[#a69d8d]">{isEnglish ? 'Phase 2' : '阶段二'}</p>
            <p className="mt-2 text-sm text-[#f4efe4]">{isEnglish ? 'Simulate + Govern' : '模拟 + 治理'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#14120d]/65 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[#a69d8d]">{isEnglish ? 'Outcome' : '结果'}</p>
            <p className="mt-2 text-sm text-[#f4efe4]">{isEnglish ? 'Scale-ready' : '可规模化'}</p>
          </div>
        </div>
      </section>

      <section className="promo-surface rounded-2xl p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-[#d7a768]">{isEnglish ? 'Flow Rail' : '流程轨道'}</p>
        <div className="promo-rail mt-4">
          <div className="promo-rail-line" />
          <div className="promo-rail-node">
            <span>{isEnglish ? 'Discover' : '发现'}</span>
          </div>
          <div className="promo-rail-node">
            <span>{isEnglish ? 'Simulate' : '模拟'}</span>
          </div>
          <div className="promo-rail-node">
            <span>{isEnglish ? 'Govern' : '治理'}</span>
          </div>
          <div className="promo-rail-node">
            <span>{isEnglish ? 'Scale' : '规模'}</span>
          </div>
        </div>
      </section>

      <section className="promo-ticker-wrap">
        <div className="promo-ticker">
          <span>{isEnglish ? 'Agent Skill Forge' : 'Agent Skill Forge'}</span>
          <span>{isEnglish ? 'Governed Delivery' : '治理交付'}</span>
          <span>{isEnglish ? 'Install Reliability' : '安装可靠性'}</span>
          <span>{isEnglish ? 'Simulation Loop' : '模拟闭环'}</span>
          <span>{isEnglish ? 'Multi-Agent' : '多代理'}</span>
          <span>{isEnglish ? 'Agent Skill Forge' : 'Agent Skill Forge'}</span>
          <span>{isEnglish ? 'Governed Delivery' : '治理交付'}</span>
          <span>{isEnglish ? 'Install Reliability' : '安装可靠性'}</span>
        </div>
      </section>
    </div>
  );
};
