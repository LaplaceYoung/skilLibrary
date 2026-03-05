import { expect, test } from '@playwright/test';

test.describe('Promo pages', () => {
  test('renders overview and navigates across promo sections', async ({ page }) => {
    await page.goto('/promo');
    await expect(page.getByTestId('promo-hero-title')).toBeVisible();
    await expect(page.getByText('Use cases')).toBeVisible();
    const promoNav = page.getByRole('navigation', { name: 'Promo desktop navigation' });

    await promoNav.getByRole('link', { name: 'Workflow', exact: true }).click();
    await expect(page).toHaveURL(/\/(?:promo\/)?growth$/);
    await expect(page.getByTestId('promo-growth-title')).toBeVisible();

    await promoNav.getByRole('link', { name: 'Govern', exact: true }).click();
    await expect(page).toHaveURL(/\/(?:promo\/)?benchmarks$/);
    await expect(page.getByTestId('promo-bench-title')).toBeVisible();
  });

  test('shows governance, modes, and faq', async ({ page }) => {
    await page.goto('/promo/benchmarks');

    await expect(page.getByText(/Safety & governance|安全与治理/)).toBeVisible();
    await expect(page.getByText(/Usage modes|使用模式/)).toBeVisible();
    await expect(page.getByText(/FAQ|常见问题/)).toBeVisible();
  });
});
