import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '4321';
const baseURL = `http://127.0.0.1:${port}`;
const singleRunSuites = /(?:publishing|experience-skills|home-hero|home-github-link|portfolio-reading|portfolio-mobile)\.spec\.ts/;
const canonicalSuites = /(?:responsive-quality|layout-health)\.spec\.ts/;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './artifacts/playwright',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  ...(process.env.CI ? { workers: 4 } : {}),
  use: {
    baseURL,
    browserName: 'chromium',
    colorScheme: 'light',
    locale: 'ko-KR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `pnpm preview --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'single-chromium', testMatch: singleRunSuites, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'release-api', testMatch: /release\.spec\.ts/ },
    {
      name: 'desktop',
      testIgnore: [canonicalSuites, singleRunSuites, /release\.spec\.ts/],
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      testIgnore: [canonicalSuites, singleRunSuites, /release\.spec\.ts/],
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'canonical-chromium',
      testMatch: canonicalSuites,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
});
