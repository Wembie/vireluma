import { defineConfig, devices } from '@playwright/test';

/**
 * E2E runs against the production build served by `astro preview`, so base
 * path handling (/vireluma/) is exercised exactly as on GitHub Pages.
 */
// Dedicated port so tests never hit a running `astro dev` server (4321) by accident.
const PORT = Number(process.env.E2E_PORT ?? 4329);
const BASE_PATH = process.env.PUBLIC_BASE_PATH ?? '/vireluma';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `pnpm exec astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}${BASE_PATH}/`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
