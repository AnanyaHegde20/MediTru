import { Page, expect } from '@playwright/test';

export const DEMO = {
  patient: { email: 'priya.sharma@example.com', password: 'password' },
  doctor: { email: 'rajesh.kumar@medicare.health', password: 'password' },
  admin: { email: 'admin@medicare.health', password: 'password' },
} as const;

export type DemoRole = keyof typeof DEMO;

export async function login(page: Page, role: DemoRole = 'patient') {
  const { email, password } = DEMO[role];
  await page.goto('/login');
  await page.fill('#login-email-input', email);
  await page.fill('#login-password-input', password);
  await page.click('#btn-submit-signin');
  await page.waitForURL(new RegExp(`/${role}/dashboard`));
}
