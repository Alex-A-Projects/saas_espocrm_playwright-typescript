import { test as base, expect } from '@playwright/test';
import { EspoClient } from '../api/EspoClient';
import { Database } from '../db/Database';
import { LoginPage } from '../pages/LoginPage';
import { RecordPage } from '../pages/RecordPage';
import { NavigationPage } from '../pages/NavigationPage';
import { assertWriteTarget } from '../config/env';

export const test = base.extend<{
  api: EspoClient;
  db: Database;
  loginPage: LoginPage;
  records: RecordPage;
  navigation: NavigationPage;
  authenticated: boolean;
}>({
  authenticated: [false, { option: true }],
  api: async ({}, use) => {
    assertWriteTarget();
    const api = await EspoClient.connect();
    try { await use(api); } finally { await api.cleanup(); }
  },
  db: async ({}, use) => {
    const db = new Database();
    try { await use(db); } finally { await db.close(); }
  },
  loginPage: async ({ page }, use) => { await use(new LoginPage(page)); },
  navigation: async ({ page }, use) => { await use(new NavigationPage(page)); },
  records: async ({ page, authenticated, api }, use) => {
    assertWriteTarget();
    if (!authenticated) throw new Error('Record tests must use test.use({ authenticated: true }).');
    await page.goto('/');
    await expect(page.locator('#content')).toBeVisible();
    await use(new RecordPage(page, (entity, id) => api.track(entity, id)));
  },
});
export { expect };
