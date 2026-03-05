import React from 'react';
import { ArrowRight, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackPromoEvent } from '../../lib/promoAnalytics';
import { PromoFileMedia, PromoHeroMedia } from './PromoMedia';
import { PROMO_HERO, PROMO_SIGNALS, PROMO_USE_CASES, PROMO_WORKSPACE } from './promoContent';
import { usePromoLocale } from './promoLocale';

export const PromoOverview: React.FC = () => {
  const { locale } = usePromoLocale();
  const isEnglish = locale === 'en';

  return (
    <div className="space-y-10 promo-fade-in">
      <section className="promo-section p-7 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] lg:items-center">
          <div className="space-y-6">
            <p className="promo-kicker">{isEnglish ? PROMO_HERO.kicker.en : PROMO_HERO.kicker.zh}</p>
            <h1
              className="promo-title text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl"
              data-testid="promo-hero-title"
            >
              {isEnglish ? PROMO_HERO.title.en : PROMO_HERO.title.zh}
            </h1>
            <p className="text-sm leading-7 text-[#6f6559] sm:text-base">
              {isEnglish ? PROMO_HERO.subtitle.en : PROMO_HERO.subtitle.zh}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/LaplaceYoung/skilLibrary"
                target="_blank"
                rel="noreferrer"
                onClick={() => trackPromoEvent('promo_cta_github', 'promo-overview')}
                className="promo-btn-primary"
              >
                <Github className="h-4 w-4" />
                {isEnglish ? PROMO_HERO.primaryCta.en : PROMO_HERO.primaryCta.zh}
              </a>
              <Link to="growth" className="promo-btn-secondary">
                {isEnglish ? PROMO_HERO.secondaryCta.en : PROMO_HERO.secondaryCta.zh}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROMO_SIGNALS.map((signal) => (
                <span key={signal.en} className="promo-pill">
                  {isEnglish ? signal.en : signal.zh}
                </span>
              ))}
            </div>
          </div>
          <PromoHeroMedia />
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="promo-kicker">{isEnglish ? 'Use cases' : '使用场景'}</p>
          <p className="text-xs uppercase tracking-[0.14em] text-[#9a8f83]">
            {isEnglish ? 'Fast, governed delivery' : '快速且可治理'}
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PROMO_USE_CASES.map((item) => (
            <article key={item.title.en} className="promo-card p-5">
              <h2 className="text-lg font-semibold text-[#1d1914]">
                {isEnglish ? item.title.en : item.title.zh}
              </h2>
              <p className="mt-2 text-sm text-[#6f6559]">
                {isEnglish ? item.detail.en : item.detail.zh}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="promo-section p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)] lg:items-center">
          <div className="space-y-4">
            <p className="promo-kicker">{isEnglish ? 'Workflow' : '工作流'}</p>
            <h2 className="promo-title text-3xl font-semibold text-[#1d1914]">
              {isEnglish ? PROMO_WORKSPACE.title.en : PROMO_WORKSPACE.title.zh}
            </h2>
            <p className="text-sm text-[#6f6559]">
              {isEnglish ? PROMO_WORKSPACE.subtitle.en : PROMO_WORKSPACE.subtitle.zh}
            </p>
            <ul className="space-y-2 text-sm text-[#6f6559]">
              {PROMO_WORKSPACE.bullets.map((bullet) => (
                <li key={bullet.en} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c88a3a]" />
                  {isEnglish ? bullet.en : bullet.zh}
                </li>
              ))}
            </ul>
          </div>
          <PromoFileMedia />
        </div>
      </section>
    </div>
  );
};
