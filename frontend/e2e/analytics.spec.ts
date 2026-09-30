import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Analytics views', () => {
  test('admin analytics shows KPIs, charts and revenue by doctor', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/analytics');

    await expect(page.locator('#admin-analytics-screen')).toBeVisible();
    await expect(page.locator('#kpi-total-revenue')).toBeVisible();
    await expect(page.locator('#chart-appointments-trend')).toBeVisible();
    await expect(page.locator('#chart-status-breakdown')).toBeVisible();
    await expect(page.locator('#chart-specialty-bookings')).toBeVisible();
    await expect(page.locator('#chart-revenue-by-doctor')).toBeVisible();

    // The dashboard no longer duplicates the charts
    await page.goto('/admin/dashboard');
    await expect(page.locator('#admin-dashboard-screen')).toBeVisible();
    await expect(page.getByText('Live appointment ledger')).toBeVisible();
    await expect(page.getByText('Appointments by Date')).toHaveCount(0);
  });

  test('doctor analytics is scoped to the signed-in doctor', async ({ page }) => {
    await login(page, 'doctor');
    await page.goto('/doctor/analytics');

    await expect(page.locator('#doctor-analytics-screen')).toBeVisible();
    await expect(page.getByText('My Practice Analytics')).toBeVisible();
    await expect(page.locator('#kpi-total-visits')).toBeVisible();
    await expect(page.locator('#kpi-earnings')).toBeVisible();
    await expect(page.locator('#chart-appointments-trend')).toBeVisible();
    // The doctor workspace must not render the admin dashboard here
    await expect(page.getByText('Total Patients')).toHaveCount(0);
    await expect(page.getByText('Add Doctor')).toHaveCount(0);
  });
});
