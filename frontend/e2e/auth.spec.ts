import { test, expect } from '@playwright/test';
import { DEMO, login } from './helpers';

test.describe('Authentication', () => {
  test('patient signs in and reaches the dashboard', async ({ page }) => {
    await login(page, 'patient');
    await expect(page).toHaveURL(/\/patient\/dashboard/);
    await expect(page.locator('#sidebar-container')).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Records' })).toBeVisible();
  });

  test('wrong password shows an error and stays on login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email-input', DEMO.patient.email);
    await page.fill('#login-password-input', 'definitely-not-the-password');
    await page.click('#btn-submit-signin');
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('doctor signs in to the doctor workspace', async ({ page }) => {
    await login(page, 'doctor');
    await expect(page).toHaveURL(/\/doctor\/dashboard/);
    await expect(page.getByRole('link', { name: 'My Patients' })).toBeVisible();
  });

  test('admin signs in to the admin workspace', async ({ page }) => {
    await login(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.getByRole('link', { name: 'Patients Directory' })).toBeVisible();
  });

  test('protected route redirects logged-out users to login', async ({ page }) => {
    await page.goto('/patient/records');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#login-email-input')).toBeVisible();
  });
});
