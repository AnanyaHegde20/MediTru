import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('List pagination', () => {
  test('admin user list paginates after creating bulk accounts', async ({ page }) => {
    await login(page, 'admin');

    const token = await page.evaluate(() => localStorage.getItem('meditru_token'));
    await page.evaluate(async ({ token }) => {
      for (let i = 0; i < 12; i++) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name: `Bulk User ${i}`,
            email: `bulk.user${i}@meditru.test`,
            password: 'secret123',
            role: 'patient',
          }),
        });
      }
    }, { token: token ?? '' });

    await page.goto('/admin/users');
    await expect(page.locator('#input-user-search')).toBeVisible();
    await expect(page.locator('#btn-users-prev')).toBeDisabled();
    await expect(page.locator('#btn-users-next')).toBeEnabled();

    await page.click('#btn-users-next');
    await expect(page.getByText(/^Page 2 of/)).toBeVisible();
    await expect(page.locator('#btn-users-prev')).toBeEnabled();

    await page.click('#btn-users-prev');
    await expect(page.getByText(/^Page 1 of/)).toBeVisible();
  });

  test('admin user list filters server-side via the search box', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/users');

    const allRows = page.locator('tr[data-user-email]');
    await expect(allRows.first()).toBeVisible();
    const beforeCount = await allRows.count();
    expect(beforeCount).toBeGreaterThan(0);

    await page.fill('#input-user-search', 'admin@medicare.health');
    await expect(page.locator('tr[data-user-email]')).toHaveCount(1);
    await expect(page.locator('[data-user-email="admin@medicare.health"]')).toBeVisible();
  });

  test('user list pre-fills the search box from the query string', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/users?q=admin@medicare.health');

    await expect(page.locator('#input-user-search')).toHaveValue('admin@medicare.health');
    await expect(page.locator('[data-user-email="admin@medicare.health"]')).toBeVisible();
  });

  test('appointment list shows pagination controls and pre-fills from the query string', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/appointments?q=Priya');

    await expect(page.locator('#input-appointments-search')).toHaveValue('Priya');
    await expect(page.locator('#btn-appointments-prev')).toBeDisabled();
    await expect(page.getByText(/^Page 1 of/)).toBeVisible();
    await expect(page.getByText('Priya Sharma').first()).toBeVisible();
    await expect(page.getByText(/^\d+ appointments$/)).toBeVisible();
  });
});
