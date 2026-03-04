import React from 'react';
import { ArrowRight, Github, Rocket } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { cn } from '../../lib/utils';

const navItems = [
  { to: '/promo', label: 'Overview' },
  { to: '/promo/growth', label: 'Growth Engine' },
  { to: '/promo/benchmarks', label: 'Benchmarks' },
];

export const PromoShell: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base text-text-main">
      <div className="pointer-events-none fixed inset-0 z-0 promo-grid-bg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(165,243,252,0.16),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_25%,rgba(255,130,65,0.12),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_88%,rgba(112,255,196,0.1),transparent_45%)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border-main/80 bg-bg-base/85 backdrop-blur-md">
        <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/promo" className="inline-flex items-center gap-3">
            <div className="rounded-[var(--radius-button)] border border-brand/30 bg-brand/15 p-2.5 text-brand">
              <Logo className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-5 tracking-tight">Agent Skill Forge</p>
              <p className="ui-caption">Launch Narrative Pages</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Promo sections">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-[var(--radius-button)] border px-3 py-2 text-sm font-semibold transition-colors',
                    isActive
                      ? 'border-brand/40 bg-brand/15 text-brand'
                      : 'border-border-main bg-bg-action/50 text-text-muted hover:bg-bg-action hover:text-text-main',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/LaplaceYoung/skilLibrary"
              target="_blank"
              rel="noreferrer"
              className="hidden ui-btn-secondary px-3 py-2 text-sm sm:inline-flex"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <Link to="/" className="ui-btn-primary px-3 py-2 text-sm">
              <Rocket className="h-4 w-4" />
              Open Workspace
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-border-main bg-bg-base/90">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Built for growth-stage AI product teams: package, govern, distribute.</p>
          <Link to="/editor" className="inline-flex items-center gap-1 text-brand hover:opacity-85">
            Start with your first growth skill
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
};
