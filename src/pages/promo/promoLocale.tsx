/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type PromoLocale = 'en' | 'zh';

type PromoLocaleContextValue = {
  locale: PromoLocale;
  setLocale: (locale: PromoLocale) => void;
};

const PromoLocaleContext = createContext<PromoLocaleContextValue | null>(null);
const STORAGE_KEY = 'asf-promo-locale';

export const PromoLocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<PromoLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'zh' ? stored : 'en';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <PromoLocaleContext.Provider value={value}>{children}</PromoLocaleContext.Provider>;
};

export function usePromoLocale(): PromoLocaleContextValue {
  const ctx = useContext(PromoLocaleContext);
  if (!ctx) {
    throw new Error('usePromoLocale must be used inside PromoLocaleProvider');
  }
  return ctx;
}
