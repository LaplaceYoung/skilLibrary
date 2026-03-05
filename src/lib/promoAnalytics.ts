export type PromoEventType =
  | 'promo_cta_workspace'
  | 'promo_cta_benchmarks'
  | 'promo_cta_growth'
  | 'promo_cta_share'
  | 'promo_cta_github'
  | 'promo_locale_toggle';

export interface PromoEvent {
  event: PromoEventType;
  page: string;
  timestamp: string;
}

const STORAGE_KEY = 'agent-skill-forge-promo-events';

export function trackPromoEvent(event: PromoEventType, page: string): void {
  const payload: PromoEvent = {
    event,
    page,
    timestamp: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as PromoEvent[]) : [];
    const next = [payload, ...existing].slice(0, 200);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore telemetry failures to avoid impacting primary UX.
  }
}
