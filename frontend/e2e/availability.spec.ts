import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Doctor availability', () => {
  test('doctor adds a slot and saves availability', async ({ page }) => {
    await login(page, 'doctor');
    await page.goto('/doctor/settings');

    await expect(page.locator('#availability-settings')).toBeVisible();

    const chip = page.getByText('07:47 PM');
    if (!(await chip.isVisible().catch(() => false))) {
      await page.fill('#input-availability-time', '19:47');
      await page.selectOption('#select-availability-period', 'evening');
      await page.click('#btn-add-availability-slot');
      await expect(chip).toBeVisible();
    }

    await page.click('#btn-save-availability');
    await expect(page.getByText(/Availability (saved|profile created)/)).toBeVisible();

    await page.reload();
    await expect(page.locator('#availability-settings')).toBeVisible();
    await expect(chip).toBeVisible();
  });
});
