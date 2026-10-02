import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Global search', () => {
  test('admin searches for a doctor and lands on the filtered directory', async ({ page }) => {
    await login(page, 'admin');
    await page.fill('#global-search-input', 'Jenkins');

    const listbox = page.locator('#global-search-results');
    await expect(listbox).toBeVisible();
    await expect(page.locator('#global-search-option-0')).toContainText('Dr. Sarah Jenkins');

    await page.keyboard.press('Enter');
    await page.waitForURL(/\/admin\/doctors\?q=/);
    await expect(page.locator('#input-doctor-directory-search')).toHaveValue('Dr. Sarah Jenkins');
    await expect(page.getByText('Dr. Sarah Jenkins').first()).toBeVisible();
    await expect(page.getByText('Dr. Alan Stone')).toHaveCount(0);
  });

  test('patient search jumps to the booking view filtered to the doctor', async ({ page }) => {
    await login(page, 'patient');
    await page.fill('#global-search-input', 'Jenkins');

    await expect(page.locator('#global-search-results')).toBeVisible();
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/patient\/appointments\?q=/);
    await expect(page.locator('#doctor-search-input')).toHaveValue('Dr. Sarah Jenkins');
    await expect(page.getByText('Dr. Sarah Jenkins').first()).toBeVisible();
    await expect(page.getByText('Dr. Alan Stone')).toHaveCount(0);
  });

  test('search dropdown supports keyboard hints and closes with Escape', async ({ page }) => {
    await login(page, 'patient');
    const input = page.locator('#global-search-input');
    await expect(input).toHaveAttribute('aria-expanded', 'false');

    await input.fill('Jenkins');
    await expect(page.locator('#global-search-results')).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');

    await input.press('ArrowDown');
    const activeDescendant = await input.getAttribute('aria-activedescendant');
    expect(activeDescendant).toMatch(/^global-search-option-\d+$/);

    await input.press('Escape');
    await expect(page.locator('#global-search-results')).toHaveCount(0);
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
