import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Doctor directory', () => {
  test('admin creates, edits and deletes a doctor profile', async ({ page }) => {
    await login(page, 'admin');
    const name = `Dr. Dir ${Date.now()}`;

    // Create a provider from the admin dashboard
    await page.goto('/admin/dashboard');
    await page.click('#btn-admin-add-doctor');
    await page.fill('#input-add-doctor-name', name);
    const postResponse = page.waitForResponse(
      (r) => r.url().includes('/api/doctors') && r.request().method() === 'POST'
    );
    await page.click('#btn-submit-add-doctor');
    await postResponse;

    // The directory lists the new profile
    await page.goto('/admin/doctors');
    await expect(page.locator('#doctors-directory-view')).toBeVisible();
    const row = page.locator(`[data-doctor-name="${name}"]`);
    await expect(row).toBeVisible();

    // Edit the specialty
    await row.locator('[id^="btn-edit-doctor-"]').click();
    await expect(page.locator('#doctor-edit-modal')).toBeVisible();
    await page.selectOption('#select-edit-doctor-specialty', 'Neurology');
    await page.click('#btn-save-doctor-edit');
    await expect(page.getByText('Doctor profile updated.')).toBeVisible();
    await expect(row).toContainText('Neurology');

    // Remove the profile again
    await row.locator('[id^="btn-delete-doctor-"]').click();
    await row.locator('[id^="btn-confirm-delete-doctor-"]').click();
    await expect(page.getByText('removed from the directory.')).toBeVisible();
    await expect(row).toHaveCount(0);
  });
});
