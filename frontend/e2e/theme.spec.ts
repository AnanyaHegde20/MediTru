import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dark mode', () => {
  test('toggle switches the theme and persists across reload', async ({ page }) => {
    await login(page, 'patient');
    const html = page.locator('html');

    await expect(html).not.toHaveClass(/dark/);

    await page.click('#btn-toggle-theme');
    await expect(html).toHaveClass(/dark/);
    await expect(page.locator('#btn-toggle-theme')).toHaveAttribute('aria-label', 'Switch to light mode');

    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await page.click('#btn-toggle-theme');
    await expect(html).not.toHaveClass(/dark/);
    await expect(page.locator('#btn-toggle-theme')).toHaveAttribute('aria-label', 'Switch to dark mode');
  });

  test('admin can toggle dark mode on the audit log screen', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/audit');
    await expect(page.locator('#audit-log-screen')).toBeVisible();

    await page.click('#btn-toggle-theme');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('#audit-log-screen')).toBeVisible();
  });
});
