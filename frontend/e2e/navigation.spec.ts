import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Dashboard navigation', () => {
  test('View Records shortcut opens the records screen', async ({ page }) => {
    await login(page, 'patient');
    await page.getByRole('button', { name: 'View Records' }).click();
    await expect(page).toHaveURL(/\/patient\/records/);
    await expect(page.locator('#medical-records-screen')).toBeVisible();
  });

  test('dashboard AI quick-ask opens the AI assistant with the query', async ({ page }) => {
    await login(page, 'patient');
    const prompt = 'What should I eat for breakfast?';
    const input = page.getByPlaceholder('Ask anything about your health, lab reports, or medication...');
    await input.fill(prompt);
    await input.press('Enter');
    await expect(page).toHaveURL(/\/patient\/ai-assistant/);
    await expect(page.locator('#ai-assistant-screen')).toBeVisible();
  });
});
