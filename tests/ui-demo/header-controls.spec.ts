import { test, expect } from '../../src/fixtures/demo-test';

const quickCreateEntities = [
  ['Account', 'Account'], ['Contact', 'Contact'], ['Lead', 'Lead'],
  ['Opportunity', 'Opportunity'], ['Meeting', 'Meeting'], ['Call', 'Call'],
  ['Task', 'Task'], ['Case', 'Case'], ['Email', 'Email'], ['ProjectTask', 'Project Task'],
] as const;

test.describe('Top-right header controls @demo', () => {
  test.beforeEach(async ({ navigation }) => { await navigation.home(); });

  test('shows Search, Last Viewed, Create, Notifications, and Menu controls', async ({ header }) => {
    await expect(header.searchInput).toBeVisible();
    await expect(header.searchButton).toBeVisible();
    await expect(header.lastViewedButton).toBeVisible();
    await expect(header.createButton).toBeVisible();
    await expect(header.notificationsButton).toBeVisible();
    await expect(header.menuButton).toBeVisible();
  });

  test('Search icon exposes matching global-search suggestions', async ({ header }) => {
    await header.searchInput.fill('Intelacard');
    await header.searchButton.click();
    await expect(header.searchInput).toHaveValue('Intelacard');
    await expect(header.navbar.getByRole('link', { name: 'Intelacard', exact: true })).toBeVisible();
  });

  test('global search suggestion opens the matching record', async ({ header, page }) => {
    await header.searchInput.fill('Intelacard');
    await header.searchButton.click();
    await header.navbar.getByRole('link', { name: 'Intelacard', exact: true }).click();
    await expect(page).toHaveURL(/#Account\/view\/[a-zA-Z0-9]+/);
    await expect(page.locator('#content')).toContainText('Intelacard');
  });

  test('Last Viewed opens recent records and a recent record is navigable', async ({ header, page }) => {
    await header.openLastViewed();
    await expect(header.lastViewedPanel).toContainText('Last Viewed');
    const record = header.lastViewedPanel.locator('a[href*="/view/"]').first();
    await expect(record).toBeVisible();
    await record.click();
    await expect(page).toHaveURL(/#[A-Za-z]+\/view\/[a-zA-Z0-9]+/);
  });

  test('Create menu exposes every configured quick-create command', async ({ header }) => {
    await header.openCreate();
    for (const [entity, label] of quickCreateEntities) {
      await expect(header.visibleDropdown.locator(`a[data-action="quickCreate"][data-name="${entity}"]`)).toContainText(label);
    }
  });

  for (const [entity, label] of quickCreateEntities) {
    test(`Create menu opens and cancels ${label} quick create`, async ({ header }) => {
      await header.openCreate();
      await header.visibleDropdown.locator(`a[data-action="quickCreate"][data-name="${entity}"]`).click();
      await expect(header.dialog).toBeVisible();
      await expect(header.dialog.getByRole('button', { name: entity === 'Email' ? 'Send' : 'Save', exact: true })).toBeVisible();
      await header.dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(header.dialog).toBeHidden();
    });
  }

  test('Notifications opens its panel and shows available state/actions', async ({ header }) => {
    await header.openNotifications();
    await expect(header.notificationsPanel).toContainText('Notifications');
    await expect(header.notificationsPanel).toContainText(/Mark all read|No Data/);
  });

  test('Menu exposes the signed-in user and every command', async ({ header }) => {
    await header.openMenu();
    await expect(header.visibleDropdown).toContainText('Jack Adams');
    for (const command of ['Administration', 'Preferences', 'About', 'Log Out']) {
      await expect(header.visibleDropdown.getByText(command, { exact: true })).toBeVisible();
    }
  });

  for (const [command, route] of [['Administration', 'Admin'], ['Preferences', 'Preferences']] as const) {
    test(`${command} command opens its page`, async ({ header, page }) => {
      await header.openMenu();
      await header.visibleDropdown.getByText(command, { exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${route}`));
      await expect(page.locator('#content')).toBeVisible();
    });
  }

  test('About command opens the About page or dialog', async ({ header, page }) => {
    await header.openMenu();
    await header.visibleDropdown.getByText('About', { exact: true }).click();
    await expect(page.locator('#content').getByText(/EspoCRM/i).first().or(header.dialog)).toBeVisible();
  });

  test('Log Out ends the demo session and returns to Login', async ({ header, page }) => {
    await header.openMenu();
    await header.visibleDropdown.getByText('Log Out', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
  });
});
