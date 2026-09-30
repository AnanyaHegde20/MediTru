import { Page, expect, test } from '@playwright/test';
import { DEMO } from './helpers';

const TEMP_PASSWORD = 'TempPass9x!';

async function fillPasswordForm(page: Page, current: string, next: string) {
  await page.fill('#input-password-current', current);
  await page.fill('#input-password-new', next);
  await page.fill('#input-password-confirm', next);
  await page.click('#btn-save-password');
}

async function signIn(page: Page, email: string, password: string, role = 'patient') {
  await page.goto('/login');
  await page.fill('#login-email-input', email);
  await page.fill('#login-password-input', password);
  await page.click('#btn-submit-signin');
  await page.waitForURL(new RegExp(`/${role}/dashboard`));
}

async function currentSessionStatus(page: Page, token: string | null): Promise<number> {
  return page.evaluate(async (bearer) => {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    return res.status;
  }, token);
}

test.describe('Session revocation', () => {
  test('logging out revokes the token server-side', async ({ page }) => {
    await signIn(page, DEMO.patient.email, DEMO.patient.password);
    const token = await page.evaluate(() => localStorage.getItem('meditru_token'));
    expect(token).toBeTruthy();

    await page.click('#btn-logout');
    await page.waitForURL(/\/login/);

    expect(await currentSessionStatus(page, token)).toBe(401);
  });

  test('changing the password forces re-login and revokes the old session', async ({ page }) => {
    // Disposable account so a failed assertion can never break later specs
    const email = `session-${Date.now()}@example.com`;
    await page.goto('/login');
    const register = await page.evaluate(
      (body) =>
        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).then((res) => res.status),
      { name: 'Session Tester', email, password: 'password' },
    );
    expect(register).toBe(200);

    await signIn(page, email, 'password');
    const oldToken = await page.evaluate(() => localStorage.getItem('meditru_token'));

    await page.goto('/patient/settings');
    await fillPasswordForm(page, 'password', TEMP_PASSWORD);

    await expect(page.getByText('Password updated. Please sign in again.')).toBeVisible();
    await page.waitForURL(/\/login/);

    // The pre-change token is dead
    expect(await currentSessionStatus(page, oldToken)).toBe(401);

    // The new password signs in
    await signIn(page, email, TEMP_PASSWORD);
    expect(await currentSessionStatus(
      page,
      await page.evaluate(() => localStorage.getItem('meditru_token')),
    )).toBe(200);
  });
});
