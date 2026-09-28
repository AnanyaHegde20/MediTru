import { defineConfig } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3000';
const HEALTH_URL = 'http://localhost:3001/api/health';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: FRONTEND_URL,
    // Use the machine's installed Chrome — no browser download required
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'mvn spring-boot:run',
      cwd: '../backend',
      url: HEALTH_URL,
      timeout: 300_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        // Raise the rate limit so UI traffic does not trip the per-IP limiter
        MEDITRU_RATELIMIT_MAXREQUESTS: '100000',
      },
    },
    {
      command: 'npm run dev',
      url: FRONTEND_URL,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
