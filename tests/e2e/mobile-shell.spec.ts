import { expect, test } from '@playwright/test';

test.describe('Mobile shell', () => {
  test('navigates promo routes from mobile tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/promo');

    const mobileTabs = page.getByRole('navigation', { name: 'Promo mobile tabs' });
    await expect(mobileTabs).toBeVisible();

    await mobileTabs.getByRole('link', { name: 'Growth', exact: true }).click();
    await expect(page).toHaveURL(/\/growth$/);
    await expect(page.getByRole('heading', { level: 1, name: /Three loops\. One compounding graph\./i })).toBeVisible();

    await mobileTabs.getByRole('link', { name: 'System', exact: true }).click();
    await expect(page).toHaveURL(/\/benchmarks$/);
    await expect(page.getByRole('heading', { level: 1, name: /Operate skills with confidence\./i })).toBeVisible();
  });
});
