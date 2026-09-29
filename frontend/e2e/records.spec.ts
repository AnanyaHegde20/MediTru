import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Medical records', () => {
  test('patient uploads a lab report file', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/records');

    await expect(page.locator('#medical-records-screen')).toBeVisible();
    await page.click('#btn-upload-record');

    const name = `E2E Panel ${Date.now()}`;
    await page.setInputFiles('#lab-file-input', {
      name: 'e2e-panel.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% e2e generated lab report\n'),
    });
    await page.fill(
      'input[placeholder="e.g. Hemoglobin A1c (HbA1c) Panel"]',
      name
    );
    await page.click('button:has-text("Upload & Analyze")');

    await expect(page.getByText(`Uploaded ${name}`)).toBeVisible();
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test('upload rejects a disallowed file type', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/records');
    await page.click('#btn-upload-record');

    await page.setInputFiles('#lab-file-input', {
      name: 'malware.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('MZ fake executable'),
    });

    await expect(
      page.getByText('Unsupported file type')
    ).toBeVisible();
  });

  test('doctor creates a prescription', async ({ page }) => {
    await login(page, 'doctor');
    await page.goto('/doctor/prescriptions');

    await expect(page.locator('#medical-records-screen')).toBeVisible();
    await page.click('#btn-new-prescription');

    const medication = `E2E Rx ${Date.now()}`;
    await page.selectOption('#input-rx-patient', { index: 1 });
    await page.fill('#input-rx-medication', medication);
    await page.fill('#input-rx-dosage', '10 mg');
    await page.fill('#input-rx-frequency', 'Once daily');
    await page.click('#btn-submit-prescription');

    await expect(page.getByText(`Prescribed ${medication}`)).toBeVisible();
    await expect(page.getByText(medication).first()).toBeVisible();
  });

  test('patient downloads a prescription', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/prescriptions');

    await expect(page.locator('#medical-records-screen')).toBeVisible();
    await page.click('#records-tab-prescriptions');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[id^="btn-download-rx-"]').first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/_prescription\.txt$/);
  });
});
