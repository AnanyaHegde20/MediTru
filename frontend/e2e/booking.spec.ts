import { test, expect, Page } from '@playwright/test';
import { login } from './helpers';

async function firstDoctorSlotInfo(page: Page) {
  await page.goto('/patient/appointments');
  await expect(page.locator('#appointment-booking-screen')).toBeVisible();
  await page.locator('[id^="btn-book-doc-"]').first().click();
  const doctorName = (
    await page
      .locator('[id^="doctor-card-"]')
      .first()
      .locator('h3')
      .innerText()
  ).trim();
  const time = (await page.locator('[id^="time-slot-"]').first().innerText()).trim();
  return { doctorName, time };
}

async function cancelUpcoming(page: Page, doctorName: string, time: string) {
  await page.goto('/patient/dashboard');
  // count() does not wait, so let the appointment rows finish loading first
  await page
    .waitForSelector('[id^="upcoming-apt-"]', { timeout: 5000 })
    .catch(() => undefined);
  const cancelButton = page
    .locator('[id^="upcoming-apt-"]')
    .filter({ hasText: doctorName })
    .filter({ hasText: time })
    .locator('[title="Cancel appointment"]');
  if ((await cancelButton.count()) > 0) {
    await cancelButton.first().click();
    await expect(page.getByText('Appointment cancelled.').first()).toBeVisible();
    await expect(cancelButton).toHaveCount(0);
  }
}

async function bookFirstDoctorSlot(page: Page) {
  await page.goto('/patient/appointments');
  await expect(page.locator('#appointment-booking-screen')).toBeVisible();
  await page.locator('[id^="btn-book-doc-"]').first().click();
  await page.getByRole('button', { name: '24', exact: true }).click();
  await page.locator('[id^="time-slot-"]').first().click();
  await page.click('#btn-confirm-booking');
}

test.describe('Appointment booking', () => {
  test('patient books an appointment with a doctor', async ({ page }) => {
    await login(page, 'patient');
    const { doctorName, time } = await firstDoctorSlotInfo(page);

    // Clear any leftover booking from an interrupted earlier run
    await cancelUpcoming(page, doctorName, time);

    await bookFirstDoctorSlot(page);
    await expect(
      page.getByText(/requested and is awaiting confirmation/)
    ).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();

    // Free the slot so subsequent runs can book it again
    await cancelUpcoming(page, doctorName, time);
  });

  test('booking the same slot twice is rejected', async ({ page }) => {
    await login(page, 'patient');
    const { doctorName, time } = await firstDoctorSlotInfo(page);
    await cancelUpcoming(page, doctorName, time);

    await bookFirstDoctorSlot(page);
    await expect(
      page.getByText(/requested and is awaiting confirmation/)
    ).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();

    // Same doctor, day and time again -> backend rejects the double booking
    await page.click('#btn-confirm-booking');
    await expect(page.getByText('That time slot is already booked').first()).toBeVisible();

    await cancelUpcoming(page, doctorName, time);
  });
});
