import { test, expect } from '@playwright/test';
import { login } from './helpers';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.describe('Profile avatar upload', () => {
  test('patient uploads a photo from settings and it persists', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/settings');

    await page.setInputFiles('#input-avatar-file', {
      name: 'me.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64'),
    });

    await expect(page.getByText('Profile photo updated.')).toBeVisible();
    const preview = page.locator('img[alt="Avatar preview"]');
    await expect(preview).toHaveAttribute('src', /\/api\/users\/\d+\/avatar\?v=/);

    await page.reload();
    await page.waitForURL(/\/patient\/settings/);
    await expect(page.locator('img[alt="Avatar preview"]')).toHaveAttribute(
      'src',
      /\/api\/users\/\d+\/avatar\?v=/
    );
  });

  test('rejects files larger than 2 MB', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/settings');

    await page.setInputFiles('#input-avatar-file', {
      name: 'huge.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });

    await expect(page.getByText('Image must be 2 MB or smaller.')).toBeVisible();
  });
});
