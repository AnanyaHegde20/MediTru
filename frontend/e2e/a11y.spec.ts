import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('accessibility pass', () => {
  test('create user modal is a labelled dialog, traps Tab, closes with Escape', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/users');
    await page.click('#btn-create-user');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName('Create User Account');

    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null
      );
      expect(inside).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    const focusedId = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(focusedId).toBe('btn-create-user');
  });

  test('notification bell popover exposes expanded state and closes with Escape', async ({ page }) => {
    await login(page, 'patient');
    const bell = page.locator('#btn-notifications-bell');
    await expect(bell).toHaveAttribute('aria-expanded', 'false');

    await bell.click();
    await expect(page.locator('#notifications-popover')).toBeVisible();
    await expect(bell).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(page.locator('#notifications-popover')).toHaveCount(0);
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
  });

  test('role switcher menu exposes expanded state and closes with Escape', async ({ page }) => {
    await login(page, 'patient');
    const switcher = page.locator('#btn-role-switcher');
    await expect(switcher).toHaveAttribute('aria-expanded', 'false');

    await switcher.click();
    await expect(page.locator('#role-switch-dropdown')).toBeVisible();
    await expect(switcher).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(page.locator('#role-switch-dropdown')).toHaveCount(0);
    await expect(switcher).toHaveAttribute('aria-expanded', 'false');
  });
});
