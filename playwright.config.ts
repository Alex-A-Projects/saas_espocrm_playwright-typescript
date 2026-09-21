import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';
const suite = process.env.SALES_UI === '1' ? 'sales' : process.env.DEMO_UI === '1' ? 'demo' : 'local';
const reportFolder = suite === 'local' ? 'playwright-report' : `playwright-report-${suite}`;
const reportPrefix = suite === 'local' ? '' : `${suite}-`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: Number(process.env.WORKERS || 2),
  timeout: 45_000,
  outputDir: `test-results/${suite}`,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: reportFolder }],
    ['junit', { outputFile: `test-results/${reportPrefix}junit.xml` }],
    ['json', { outputFile: `test-results/${reportPrefix}results.json` }],
  ],
  use: {
    baseURL: env.baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.RECORD_VIDEO === 'true' ? 'retain-on-failure' : 'off',
    actionTimeout: 15_000,
  },
  projects: [
    ...(process.env.SALES_UI === '1' ? [{name:'ui-sales',testDir:'./tests/ui-sales',workers:1,timeout:60_000,use:{...devices['Desktop Chrome'],baseURL:'https://demo.us.espocrm.com'}}] : []),
    ...(process.env.DEMO_UI === '1' ? [{
      name: 'ui-demo', testDir: './tests/ui-demo', workers: 1,
      use: { ...devices['Desktop Chrome'], baseURL: 'https://demo.us.espocrm.com' },
    }] : []),
    { name: 'api', testDir: './tests/api' },
    { name: 'database', testDir: './tests/database', workers: 1 },
    { name: 'ui-chromium', testDir: './tests/ui', workers: 1, use: { ...devices['Desktop Chrome'] } },
    ...(process.env.CROSS_BROWSER === '1' ? [
      { name: 'ui-firefox', testDir: './tests/ui', workers: 1, use: { ...devices['Desktop Firefox'] } },
      { name: 'ui-webkit', testDir: './tests/ui', workers: 1, use: { ...devices['Desktop Safari'] } },
    ] : []),
  ],
});
