import React from 'react';
import { Languages, Star } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { trackPromoEvent } from '../../lib/promoAnalytics';
import { usePromoLocale } from './promoLocale';

export const PromoShell: React.FC = () => {
  const { locale, setLocale } = usePromoLocale();
  const isEnglish = locale === 'en';
  const navItems = [
    { to: '/', label: isEnglish ? 'Overview' : '总览', end: true },
    { to: '/growth', label: isEnglish ? 'Growth' : '循环' },
    { to: '/benchmarks', label: isEnglish ? 'System' : '系统' },
  ];
  return (
    <div className="promo-canvas min-h-screen text-[#f6f4ef]">
      <div className="promo-orb promo-orb-a" />
      <div className="promo-orb promo-orb-b" />
      <div className="promo-orb promo-orb-c" />
      <div className="promo-noise" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0e0d0a]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="promo-mark">ASF</div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-[0.08em] text-[#f8f6f1]">AGENT SKILL FORGE</p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#a79f8d]">
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
                  cn(
                    'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all',
                    isActive
                      ? 'border-[#f4b367]/70 bg-[#f4b367]/15 text-[#ffd8a7]'
                      : 'border-white/15 bg-white/[0.04] text-[#c9c0b1] hover:border-white/30 hover:text-[#f6f3ea]',
                  )
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
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#d4ccbd] transition-colors hover:border-white/30 hover:text-[#f6f3ea]"
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
              className="inline-flex items-center gap-2 rounded-full border border-[#f4b367]/60 bg-[#f4b367]/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#ffe2bb] transition-colors hover:bg-[#f4b367]/30"
            >
              <Star className="h-3.5 w-3.5" />
              {isEnglish ? 'Star / Fork' : 'Star / Fork'}
            </a>
          </div>
        </div>
        <nav className="promo-mobile-nav md:hidden" aria-label="Promo mobile tabs">
          {navItems.map((item) => (
            <NavLink
              key={`mobile-${item.to}`}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all',
                  isActive
                    ? 'border-[#f4b367]/70 bg-[#f4b367]/15 text-[#ffd8a7]'
                    : 'border-white/15 bg-white/[0.04] text-[#c9c0b1]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <Outlet />
      </main>
    </div>
  );
};
