import React from 'react';
import { ArrowUpRight, Github, ShieldCheck } from 'lucide-react';
import { trackPromoEvent } from '../../lib/promoAnalytics';
import { PROMO_FAQ, PROMO_FINAL_CTA, PROMO_SAFETY, PROMO_USAGE_MODES } from './promoContent';
import { usePromoLocale } from './promoLocale';

export const PromoBenchmarks: React.FC = () => {
  const { locale } = usePromoLocale();
  const isEnglish = locale === 'en';

  return (
    <div className="space-y-10 promo-fade-in">
      <section className="promo-section p-7 sm:p-10">
        <p className="promo-kicker">{isEnglish ? PROMO_SAFETY.title.en : PROMO_SAFETY.title.zh}</p>
        <h1
          className="promo-title mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl"
          data-testid="promo-bench-title"
        >
          {isEnglish ? 'Operate skills with confidence.' : '让技能交付更可控。'}
        </h1>
        <p className="mt-4 text-sm text-[#6f6559] sm:text-base">
          {isEnglish ? PROMO_SAFETY.subtitle.en : PROMO_SAFETY.subtitle.zh}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PROMO_SAFETY.bullets.map((bullet) => (
            <article key={bullet.en} className="promo-card flex items-start gap-3 p-4">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#8b5a22]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1d1914]">
                  {isEnglish ? bullet.en : bullet.zh}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="promo-kicker">{isEnglish ? 'Usage modes' : '使用模式'}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-[#9a8f83]">
            {isEnglish ? 'Free · GitHub first' : '免费 · GitHub 优先'}
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PROMO_USAGE_MODES.map((mode) => (
            <article key={mode.title.en} className="promo-card p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[#9a8f83]">
                {isEnglish ? mode.accent.en : mode.accent.zh}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[#1d1914]">
                {isEnglish ? mode.title.en : mode.title.zh}
              </h3>
              <p className="mt-2 text-sm text-[#6f6559]">
                {isEnglish ? mode.detail.en : mode.detail.zh}
              </p>
              <a
                href="https://github.com/LaplaceYoung/skilLibrary"
                target="_blank"
                rel="noreferrer"
                onClick={() => trackPromoEvent('promo_cta_github', `promo-mode:${mode.title.en}`)}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8b5a22]"
              >
                {isEnglish ? 'Go to GitHub' : '前往 GitHub'}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <p className="promo-kicker">{isEnglish ? 'FAQ' : '常见问题'}</p>
        <div className="mt-6 space-y-3">
          {PROMO_FAQ.map((item) => (
            <details key={item.q.en} className="promo-faq">
              <summary>{isEnglish ? item.q.en : item.q.zh}</summary>
              <p className="mt-2 text-sm text-[#6f6559]">
                {isEnglish ? item.a.en : item.a.zh}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="promo-kicker">{isEnglish ? 'Get started' : '开始使用'}</p>
            <h2 className="promo-title mt-3 text-3xl font-semibold text-[#1d1914]">
              {isEnglish ? PROMO_FINAL_CTA.title.en : PROMO_FINAL_CTA.title.zh}
            </h2>
            <p className="mt-2 text-sm text-[#6f6559]">
              {isEnglish ? PROMO_FINAL_CTA.subtitle.en : PROMO_FINAL_CTA.subtitle.zh}
            </p>
          </div>
          <a
            href="https://github.com/LaplaceYoung/skilLibrary"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackPromoEvent('promo_cta_github', 'promo-final')}
            className="promo-btn-primary"
          >
            <Github className="h-4 w-4" />
            {isEnglish ? 'Star / Fork' : 'Star / Fork'}
          </a>
        </div>
      </section>
    </div>
  );
};
