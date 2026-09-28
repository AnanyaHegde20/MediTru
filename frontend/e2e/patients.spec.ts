import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Patient directory and dashboard', () => {
  test('doctor sees patients loaded from the API', async ({ page }) => {
    await login(page, 'doctor');
    await page.goto('/doctor/patients');

    await expect(page.getByText('Registered Patient Directory')).toBeVisible();
    await expect(page.getByText('Priya Sharma').first()).toBeVisible();
    await expect(page.getByText('SOAP Note').first()).toBeVisible();
  });

  test('admin dashboard shows live KPI counts', async ({ page }) => {
    await login(page, 'admin');
    await expect(page.locator('#admin-dashboard-screen')).toBeVisible();

    await expect(page.getByText('Registered accounts')).toBeVisible();
    await expect(page.getByText('On staff now')).toBeVisible();
    await expect(page.getByText('Live appointment ledger')).toBeVisible();
  });
});
