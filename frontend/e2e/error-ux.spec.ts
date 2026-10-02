import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Error UX', () => {
  test('shows a global toast when a background fetch fails offline', async ({ page }) => {
    await login(page, 'patient');

    await page.route('**/api/notifications', (route) => route.abort('connectionfailed'));
    await page.click('#btn-notifications-bell');

    await expect(page.locator('#app-toast')).toBeVisible();
    await expect(
      page.getByText('Network error — please check your connection and try again.')
    ).toBeVisible();
    await expect(page.locator('#app-toast')).toHaveAttribute('data-toast-type', 'error');
  });

  test('shows a rate-limit notice when a background fetch is throttled', async ({ page }) => {
    await login(page, 'patient');

    await page.route('**/api/notifications', (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"Too many requests"}' })
    );
    await page.click('#btn-notifications-bell');

    await expect(page.locator('#app-toast')).toBeVisible();
    await expect(
      page.getByText('Too many requests — please slow down and try again in a moment.')
    ).toBeVisible();
  });
});
