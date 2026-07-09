import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env.local for test helpers (SUPABASE_SERVICE_ROLE_KEY, etc.)
dotenvConfig({ path: '.env.local' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // run serially — tests share database state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // one worker because tests mutate shared DB state
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
