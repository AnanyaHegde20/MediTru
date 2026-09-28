import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Appointment booking', () => {
  test('patient books an appointment with a doctor', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/appointments');

    await expect(page.locator('#appointment-booking-screen')).toBeVisible();

    // Select the first doctor card
    await page.locator('[id^="btn-book-doc-"]').first().click();

    // Pick a calendar day and confirm the booking
    await page.getByRole('button', { name: '24', exact: true }).click();
    await page.click('#btn-confirm-booking');

    await expect(
      page.getByText(/requested and is awaiting confirmation/)
    ).toBeVisible();
  });
});
