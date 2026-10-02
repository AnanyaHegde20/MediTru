import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Admin audit log', () => {
  test('admin opens the audit log from the sidebar and filters it', async ({ page }) => {
    await login(page, 'admin');
    await page.click('a[href="/admin/audit"]');
    await page.waitForURL(/\/admin\/audit/);

    await expect(page.locator('#audit-log-screen')).toBeVisible();
    await expect(page.locator('#select-audit-action')).toBeVisible();
    await expect(page.locator('#btn-audit-prev')).toBeDisabled();
    await expect(page.getByText(/^Page 1 of/)).toBeVisible();
    await expect(page.getByText('LOGIN_SUCCESS').first()).toBeVisible();

    await page.selectOption('#select-audit-action', 'LOGIN_SUCCESS');
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await expect(firstRow).toContainText('LOGIN_SUCCESS');
  });

  test('patients cannot reach the audit log', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/admin/audit');
    await page.waitForURL(/\/patient\/dashboard/);
    await expect(page.locator('#audit-log-screen')).toHaveCount(0);
  });
});
