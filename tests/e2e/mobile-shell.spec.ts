import { expect, test } from '@playwright/test';

test.describe('Mobile shell', () => {
  test('navigates promo routes from mobile tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/promo');

    const mobileTabs = page.getByRole('navigation', { name: 'Promo mobile tabs' });
    await expect(mobileTabs).toBeVisible();

    await mobileTabs.getByRole('link', { name: 'Workflow', exact: true }).click();
    await expect(page).toHaveURL(/\/growth$/);
    await expect(page.getByTestId('promo-growth-title')).toBeVisible();

    await mobileTabs.getByRole('link', { name: 'Govern', exact: true }).click();
    await expect(page).toHaveURL(/\/benchmarks$/);
    await expect(page.getByTestId('promo-bench-title')).toBeVisible();
  });
});
