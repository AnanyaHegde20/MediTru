import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Admin user management', () => {
  test('admin creates a doctor account that can sign in', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/users');
    await expect(page.locator('#user-accounts-view')).toBeVisible();

    const email = `dr-${Date.now()}@medicare.health`;
    await page.click('#btn-create-user');
    await page.fill('#input-user-name', 'Dr. Playground');
    await page.fill('#input-user-email', email);
    await page.fill('#input-user-password', 'secret123');
    await page.selectOption('#select-user-role', 'doctor');
    await page.click('#btn-submit-create-user');
    await expect(page.getByText('Account created for Dr. Playground.')).toBeVisible();
    await expect(page.locator(`[data-user-email="${email}"]`)).toBeVisible();

    await page.click('#btn-logout');
    await page.goto('/login');
    await page.fill('#login-email-input', email);
    await page.fill('#login-password-input', 'secret123');
    await page.click('#btn-submit-signin');
    await page.waitForURL(/\/doctor\/dashboard/);
  });

  test('admin promotes a temp account and can delete it', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/users');
    await expect(page.locator('#user-accounts-view')).toBeVisible();

    const email = `temp-${Date.now()}@medicare.health`;
    await page.click('#btn-create-user');
    await page.fill('#input-user-name', 'Temp Member');
    await page.fill('#input-user-email', email);
    await page.fill('#input-user-password', 'secret123');
    await page.selectOption('#select-user-role', 'patient');
    await page.click('#btn-submit-create-user');
    await expect(page.getByText('Account created for Temp Member.')).toBeVisible();

    const row = page.locator(`[data-user-email="${email}"]`);
    await row.locator('select').selectOption('doctor');
    await expect(page.getByText('Role updated to doctor.')).toBeVisible();

    await row.locator('button[title^="Delete"]').click();
    await row.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByText('Account deleted for Temp Member.')).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});
