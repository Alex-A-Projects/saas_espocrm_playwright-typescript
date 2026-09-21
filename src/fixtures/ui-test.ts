import { BrowserContext } from '@playwright/test';
import { test as base } from './test';
import { LoginPage } from '../pages/LoginPage';
import { assertWriteTarget, env } from '../config/env';
import { ListPage } from '../pages/ListPage';
import { CalendarPage } from '../pages/CalendarPage';
import { DocumentPage } from '../pages/DocumentPage';
import { EmailPage } from '../pages/EmailPage';
import { LeadPage } from '../pages/LeadPage';

export const test = base.extend<{ listPage: ListPage; calendar: CalendarPage; documents:DocumentPage; email:EmailPage; leads:LeadPage }, { authenticatedState: Awaited<ReturnType<BrowserContext['storageState']>> }>({
  authenticated: true,
  listPage: async ({ page }, use) => { await use(new ListPage(page)); },
  calendar: async ({ page }, use) => { await use(new CalendarPage(page)); },
  documents: async ({ page,api },use) => { await use(new DocumentPage(page,(e,id)=>api.track(e,id))); },
  email: async ({ page,api },use) => { await use(new EmailPage(page,(e,id)=>api.track(e,id))); },
  leads: async ({ page,api },use) => { await use(new LeadPage(page,(e,id)=>api.track(e,id))); },
  authenticatedState: [async ({ browser }, use) => {
    assertWriteTarget();
    const context = await browser.newContext({ baseURL: env.baseURL });
    let state: Awaited<ReturnType<BrowserContext['storageState']>>;
    try {
      await new LoginPage(await context.newPage()).login();
      state = await context.storageState();
    } finally { await context.close(); }
    await use(state);
  }, { scope: 'worker' }],
  storageState: async ({ authenticatedState }, use) => { await use(authenticatedState); },
});
export { expect } from '@playwright/test';
