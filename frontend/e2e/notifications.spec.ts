import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Notification bell', () => {
  test('patient sees live notifications and can mark them read', async ({ page }) => {
    await login(page, 'patient');

    // Fresh session: the bell shows unread activity from real data
    await expect(page.locator('#notification-unread-dot')).toBeVisible();

    await page.click('#btn-notifications-bell');
    await expect(page.locator('#notifications-popover')).toBeVisible();
    await expect(page.getByText('Appointment Reminder').first()).toBeVisible();
    await expect(page.getByText('Lab Report Ready').first()).toBeVisible();

    // Marking everything read clears the badge
    await page.getByRole('button', { name: 'Mark all read' }).click();
    await expect(page.locator('#notification-unread-dot')).toHaveCount(0);

    // The read state survives a reload (stored per account)
    await page.reload();
    await expect(page.locator('#notification-unread-dot')).toHaveCount(0);
    await page.click('#btn-notifications-bell');
    await expect(page.getByText("You're all caught up.")).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Mark all read' })).toHaveCount(0);
  });

  test('reminder read state is persisted on the server', async ({ page }) => {
    await login(page, 'patient');
    await expect(page.locator('#notification-unread-dot')).toBeVisible();

    await page.click('#btn-notifications-bell');
    await expect(page.locator('#notifications-popover')).toBeVisible();
    await page.getByRole('button', { name: 'Mark all read' }).click();
    await expect(page.locator('#notification-unread-dot')).toHaveCount(0);

    const result = await page.evaluate(async () => {
      const token = localStorage.getItem('meditru_token');
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rows = (await res.json()) as Array<{ readAt: string | null }>;
      return {
        status: res.status,
        total: rows.length,
        unread: rows.filter((row) => !row.readAt).length,
      };
    });

    expect(result.status).toBe(200);
    expect(result.total).toBeGreaterThan(0);
    expect(result.unread).toBe(0);
  });
});
