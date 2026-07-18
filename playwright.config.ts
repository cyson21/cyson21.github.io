import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '4321';
const baseURL = `http://127.0.0.1:${port}`;
const canonicalSuites = /(?:responsive-quality|visual-regression)\.spec\.ts/;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './artifacts/playwright',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{platform}-{projectName}{ext}',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  ...(process.env.CI ? { workers: 4 } : {}),
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.001,
      scale: 'css',
      threshold: 0.2,
    },
  },
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
    {
      name: 'desktop',
      testIgnore: canonicalSuites,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      testIgnore: canonicalSuites,
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'canonical-chromium',
      testMatch: canonicalSuites,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
});
