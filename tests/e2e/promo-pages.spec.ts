import { expect, test } from '@playwright/test';

test.describe('Promo pages', () => {
  test('renders overview and navigates across promo sections', async ({ page }) => {
    await page.goto('/promo');
    await expect(page.getByRole('heading', { level: 1, name: /Ship skills/i })).toBeVisible();
    await expect(page.getByText('System Signals')).toBeVisible();
    const promoNav = page.getByRole('navigation', { name: 'Promo desktop navigation' });

    await promoNav.getByRole('link', { name: 'Growth', exact: true }).click();
    await expect(page).toHaveURL(/\/(?:promo\/)?growth$/);
    await expect(page.getByRole('heading', { level: 1, name: /Three loops\. One compounding graph\./i })).toBeVisible();

    await promoNav.getByRole('link', { name: 'System', exact: true }).click();
    await expect(page).toHaveURL(/\/(?:promo\/)?benchmarks$/);
    await expect(page.getByRole('heading', { level: 1, name: /Operate skills with confidence\./i })).toBeVisible();
  });

  test('shows benchmark snapshot and repository cards', async ({ page }) => {
    await page.goto('/promo/benchmarks');

    await expect(page.getByText(/System Readiness|系统就绪度/)).toBeVisible();
    await expect(page.getByText(/Readiness Signals|就绪信号/)).toBeVisible();
    await expect(page.getByText(/System Pillars|系统支柱/)).toBeVisible();
  });
});
