import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SYSTEM_METRICS, SYSTEM_PILLARS, SYSTEM_READINESS, SYSTEM_SNAPSHOT_DATE } from './benchmarkData';
import { usePromoLocale } from './promoLocale';

export const PromoBenchmarks: React.FC = () => {
  const { locale } = usePromoLocale();
  const isEnglish = locale === 'en';

  return (
    <div className="space-y-8 promo-fade-in">
      <section className="promo-surface rounded-[28px] p-7 sm:p-10">
        <p className="text-xs uppercase tracking-[0.18em] text-[#d7a768]">
          {isEnglish ? 'System Readiness' : '系统就绪度'}
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-[#f9f6ef] sm:text-5xl">
          {isEnglish ? 'Operate skills with confidence.' : '技能以系统化方式交付。'}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[#c3b9aa]">
          {isEnglish
            ? `Snapshot: ${SYSTEM_SNAPSHOT_DATE}.`
            : `快照：${SYSTEM_SNAPSHOT_DATE}。`}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {SYSTEM_METRICS.map((metric) => (
          <article key={metric.label.en} className="promo-surface rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#a89f8f]">
              {isEnglish ? metric.label.en : metric.label.zh}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#ffe2b8]">
              {isEnglish ? metric.value.en : metric.value.zh}
            </p>
          </article>
        ))}
      </section>

      <section className="promo-surface rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#d7a768]">
            {isEnglish ? 'Readiness Signals' : '就绪信号'}
          </p>
          <p className="text-xs uppercase tracking-[0.16em] text-[#9f9787]">
            {isEnglish ? 'Internal system view' : '内部系统视图'}
          </p>
        </div>
        <div className="mt-4 space-y-4">
          {SYSTEM_READINESS.map((signal) => (
            <div key={signal.label.en} className="promo-meter">
              <div className="flex items-center justify-between gap-3 text-sm text-[#e6dfd2]">
                <span>{isEnglish ? signal.label.en : signal.label.zh}</span>
                <span>{signal.score}</span>
              </div>
              <div className="promo-meter-track">
                <div className="promo-meter-fill" style={{ width: `${signal.score}%` }} />
              </div>
              <p className="mt-2 text-xs text-[#b9af9f]">
                {isEnglish ? signal.detail.en : signal.detail.zh}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="promo-surface rounded-2xl p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-[#d7a768]">
          {isEnglish ? 'System Pillars' : '系统支柱'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SYSTEM_PILLARS.map((pillar) => (
            <span key={pillar.en} className="promo-chip">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isEnglish ? pillar.en : pillar.zh}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
