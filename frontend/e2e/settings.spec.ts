import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Account settings', () => {
  test('patient edits their profile and it persists after reload', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/settings');
    await expect(page.locator('#profile-settings')).toBeVisible();

    const phone = `555-${Date.now().toString().slice(-4)}`;
    await page.fill('#input-profile-phone', phone);
    await page.fill('#input-profile-allergies', 'Penicillin, Dust');
    await page.click('#btn-save-profile');
    await expect(page.getByText('Profile saved.')).toBeVisible();

    await page.reload();
    await expect(page.locator('#input-profile-phone')).toHaveValue(phone);
    await expect(page.locator('#input-profile-allergies')).toHaveValue('Penicillin, Dust');
  });

  test('wrong current password is rejected by the server', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/settings');

    await page.fill('#input-password-current', 'not-my-current-password');
    await page.fill('#input-password-new', 'brandNewPass9');
    await page.fill('#input-password-confirm', 'brandNewPass9');
    await page.click('#btn-save-password');
    await expect(page.getByText('Current password is incorrect')).toBeVisible();
  });

  test('mismatched password confirmation is rejected client-side', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/settings');

    await page.fill('#input-password-current', 'password');
    await page.fill('#input-password-new', 'brandNewPass9');
    await page.fill('#input-password-confirm', 'differentPass9');
    await page.click('#btn-save-password');
    await expect(page.getByText('New passwords do not match.')).toBeVisible();
  });
});
