import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PromoShell } from '../pages/promo/PromoShell';
import { PromoOverview } from '../pages/promo/PromoOverview';
import { PromoGrowth } from '../pages/promo/PromoGrowth';
import { PromoBenchmarks } from '../pages/promo/PromoBenchmarks';
import { PromoLocaleProvider } from '../pages/promo/promoLocale';

const routerBasename = import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

export const PromoApp: React.FC = () => {
  return (
    <PromoLocaleProvider>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/" element={<PromoShell />}>
            <Route index element={<PromoOverview />} />
            <Route path="growth" element={<PromoGrowth />} />
            <Route path="benchmarks" element={<PromoBenchmarks />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PromoLocaleProvider>
  );
};
