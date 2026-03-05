import React from 'react';
import { Languages, Star } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { trackPromoEvent } from '../../lib/promoAnalytics';
import { PROMO_ANNOUNCE } from './promoContent';
import { usePromoLocale } from './promoLocale';
import './promo.css';

export const PromoShell: React.FC = () => {
  const { locale, setLocale } = usePromoLocale();
  const isEnglish = locale === 'en';
  const navItems = [
    { to: '/', label: isEnglish ? 'Overview' : '总览', end: true },
    { to: '/growth', label: isEnglish ? 'Workflow' : '流程' },
    { to: '/benchmarks', label: isEnglish ? 'Govern' : '治理' },
  ];

  return (
    <div className="promo-shell">
      <div className="promo-bg">
        <div className="promo-glow promo-glow-a" />
        <div className="promo-glow promo-glow-b" />
        <div className="promo-noise" />
      </div>

      <div className="promo-announce">{isEnglish ? PROMO_ANNOUNCE.en : PROMO_ANNOUNCE.zh}</div>

      <header className="promo-header">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border border-black/10 bg-white/80 text-center text-[11px] font-semibold leading-10 tracking-[0.2em] text-black">
              ASF
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-[0.12em] text-black">AGENT SKILL FORGE</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#7a6f62]">
                {isEnglish ? 'Product Narrative' : '产品叙事'}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Promo desktop navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn('promo-nav-link', isActive && 'promo-nav-link-active')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const nextLocale = isEnglish ? 'zh' : 'en';
                setLocale(nextLocale);
                trackPromoEvent('promo_locale_toggle', `promo-shell:${nextLocale}`);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6f6559] transition-colors hover:border-black/20 hover:text-black"
              aria-label={isEnglish ? 'Switch to Chinese' : '切换到英文'}
            >
              <Languages className="h-3.5 w-3.5" />
              {isEnglish ? '中文' : 'EN'}
            </button>
            <a
              href="https://github.com/LaplaceYoung/skilLibrary"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackPromoEvent('promo_cta_github', 'promo-shell')}
              className="inline-flex items-center gap-2 rounded-full border border-[#c88a3a]/50 bg-[#c88a3a]/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b5a22] transition-colors hover:bg-[#c88a3a]/25"
            >
              <Star className="h-3.5 w-3.5" />
              {isEnglish ? 'Star / Fork' : 'Star / Fork'}
            </a>
          </div>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-5 pb-4 pt-2 md:hidden" aria-label="Promo mobile tabs">
          {navItems.map((item) => (
            <NavLink
              key={`mobile-${item.to}`}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('promo-nav-link', isActive && 'promo-nav-link-active')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Outlet />
      </main>
    </div>
  );
};
