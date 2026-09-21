import { test as base, BrowserContext } from '@playwright/test';
import { DemoLoginPage } from '../pages/DemoLoginPage';
import { ListPage } from '../pages/ListPage';
import { NavigationPage } from '../pages/NavigationPage';
import { RecordPage } from '../pages/RecordPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HeaderPage } from '../pages/HeaderPage';

export const test = base.extend<{
  listPage: ListPage; navigation: NavigationPage; records: RecordPage; dashboard: DashboardPage; header: HeaderPage;
}, { demoState: Awaited<ReturnType<BrowserContext['storageState']>> }>({
  demoState: [async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: 'https://demo.us.espocrm.com' });
    try {
      await new DemoLoginPage(await context.newPage()).login();
      await use(await context.storageState());
    } finally { await context.close(); }
  }, { scope: 'worker' }],
  storageState: async ({ demoState }, use) => { await use(demoState); },
  listPage: async ({ page }, use) => { await use(new ListPage(page)); },
  navigation: async ({ page }, use) => { await use(new NavigationPage(page)); },
  records: async ({ page }, use) => { await use(new RecordPage(page)); },
  dashboard: async ({ page }, use) => { await use(new DashboardPage(page)); },
  header: async ({ page }, use) => { await use(new HeaderPage(page)); },
});
export { expect } from '@playwright/test';
