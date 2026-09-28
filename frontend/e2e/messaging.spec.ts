import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Messaging', () => {
  test('patient sends a message in a thread', async ({ page }) => {
    await login(page, 'patient');
    await page.goto('/patient/messages');

    const composer = page.locator('input[placeholder^="Message "]');
    await expect(composer).toBeVisible();

    const unique = `e2e-ping-${Date.now()}`;
    await composer.fill(unique);
    await composer.press('Enter');

    // The text matches both the thread preview and the sent message bubble
    await expect(page.getByText(unique).last()).toBeVisible();
  });
});
