import { test, expect } from '../../src/fixtures/test';
import { env } from '../../src/config/env';
import { LoginPage } from '../../src/pages/LoginPage';

test('login page provides username and masked password inputs @smoke', async ({ loginPage }) => {
  await loginPage.open();
  await expect(loginPage.username).toBeVisible();
  await expect(loginPage.password).toHaveAttribute('type', 'password');
  await expect(loginPage.submit).toBeEnabled();
});
test('valid credentials open the dashboard @smoke', async ({ loginPage, navigation }) => {
  await loginPage.login();
  await expect(navigation.dashboardActivities).toBeVisible();
});
test('invalid credentials leave the user on the login page', async ({ loginPage, page }) => {
  await loginPage.open();
  const responsePromise = page.waitForResponse(r => r.url().includes('/api/v1/App/user') && r.status() === 401);
  await loginPage.signIn('pw-nonexistent-user', 'invalid-password');
  await responsePromise;
  await expect(loginPage.username).toBeVisible();
  await expect(loginPage.content).toBeHidden();
});
test('empty credentials cannot access the dashboard', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.submit.click();
  await expect(loginPage.username).toBeVisible();
  await expect(loginPage.content).toBeHidden();
});
test('authenticated session survives a page reload', async ({ loginPage, page, navigation }) => {
  await loginPage.login();
  await page.reload();
  await expect(navigation.dashboardActivities).toBeVisible();
  await expect(loginPage.username).toBeHidden();
});
test('a new browser context does not inherit another login', async ({ loginPage, browser }) => {
  await loginPage.login();
  const context = await browser.newContext({ baseURL: env.baseURL });
  try {
    const page = await context.newPage();
    const isolatedLogin = new LoginPage(page);
    await isolatedLogin.navigate('Account');
    await expect(isolatedLogin.username).toBeVisible();
  } finally { await context.close(); }
});
