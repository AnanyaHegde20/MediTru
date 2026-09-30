import * as fs from 'fs';
import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('CSV exports', () => {
  test('admin exports the appointments CSV', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/appointments');
    await page.waitForSelector('tbody tr', { timeout: 5000 }).catch(() => {});

    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-export-appointments-csv');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('appointments.csv');
    const csv = fs.readFileSync(await download.path(), 'utf8');
    expect(csv).toContain('ID,Patient ID,Patient,Doctor ID,Doctor,Specialty,Date,Time,Status');
    expect(csv).toContain('Priya Sharma');
  });

  test('admin exports the users CSV without password data', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/users');
    await page.waitForSelector('#btn-create-user');

    const downloadPromise = page.waitForEvent('download');
    await page.click('#btn-export-users-csv');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('users.csv');
    const csv = fs.readFileSync(await download.path(), 'utf8');
    expect(csv).toContain('ID,Name,Email,Role,Phone,Age,Gender,Blood Group');
    expect(csv).toContain('admin@medicare.health');
    expect(csv.toLowerCase()).not.toContain('password');
    expect(csv).not.toContain('$2a$');
  });

  test('non-admins never see the export buttons', async ({ page }) => {
    await login(page, 'doctor');
    await page.goto('/doctor/appointments');
    await page.waitForSelector('#appointments-list-screen');
    await expect(page.locator('#btn-export-appointments-csv')).toHaveCount(0);
  });
});
