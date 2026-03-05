import React from 'react';
import { Boxes, ShieldCheck, Sparkles } from 'lucide-react';
import { PROMO_COMPONENTS, PROMO_INDUSTRIES, PROMO_WORKFLOW_STEPS } from './promoContent';
import { usePromoLocale } from './promoLocale';

const componentIcons = [Sparkles, ShieldCheck, Boxes];

export const PromoGrowth: React.FC = () => {
  const { locale } = usePromoLocale();
  const isEnglish = locale === 'en';

  return (
    <div className="space-y-10 promo-fade-in">
      <section className="promo-section p-7 sm:p-10">
        <p className="promo-kicker">{isEnglish ? 'How it works' : '如何运作'}</p>
        <h1
          className="promo-title mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl"
          data-testid="promo-growth-title"
        >
          {isEnglish ? 'Four steps. One governed flow.' : '四步一体，治理交付。'}
        </h1>
        <p className="mt-4 text-sm text-[#6f6559] sm:text-base">
          {isEnglish ? 'Discover, install, simulate, govern.' : '发现、安装、模拟、治理。'}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PROMO_WORKFLOW_STEPS.map((step, index) => (
            <article key={step.en} className="promo-card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[#9a8f83]">{`0${index + 1}`}</p>
              <p className="mt-2 text-lg font-semibold text-[#1d1914]">
                {isEnglish ? step.en : step.zh}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="promo-kicker">{isEnglish ? 'Components' : '组成模块'}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-[#9a8f83]">{isEnglish ? 'Core building blocks' : '核心构件'}</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PROMO_COMPONENTS.map((item, index) => {
            const Icon = componentIcons[index % componentIcons.length];
            return (
              <article key={item.title.en} className="promo-card p-5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/80 text-[#8b5a22]">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-[#1d1914]">
                  {isEnglish ? item.title.en : item.title.zh}
                </h2>
                <p className="mt-2 text-sm text-[#6f6559]">
                  {isEnglish ? item.detail.en : item.detail.zh}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span key={tag.en} className="promo-pill">
                      {isEnglish ? tag.en : tag.zh}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <p className="promo-kicker">{isEnglish ? 'Where it lands' : '适用领域'}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PROMO_INDUSTRIES.map((item) => (
            <article key={item.title.en} className="promo-card p-5">
              <h3 className="text-lg font-semibold text-[#1d1914]">
                {isEnglish ? item.title.en : item.title.zh}
              </h3>
              <p className="mt-2 text-sm text-[#6f6559]">
                {isEnglish ? item.detail.en : item.detail.zh}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <p className="promo-kicker">{isEnglish ? 'Flow rail' : '流程轨道'}</p>
        <div className="promo-rail mt-6">
          {PROMO_WORKFLOW_STEPS.map((step) => (
            <div key={`rail-${step.en}`} className="promo-rail-node">
              {isEnglish ? step.en : step.zh}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
