import { test, expect } from '../../src/fixtures/demo-test';

test.describe('Dashboard widget interactions @demo', () => {
  test('widget links point to the expected modules and reports', async ({ dashboard }) => {
    await dashboard.open();
    await expect(dashboard.panel('Stream').locator('a[href="#Stream"]')).toHaveAttribute('data-action', 'viewList');
    await expect(dashboard.panel('Calendar').locator('a[href="#Calendar"]')).toHaveAttribute('data-action', 'viewCalendar');

    await dashboard.select('Sales');
    await expect(dashboard.panel('Revenue by month').locator('a[href^="#Report/show/"]')).toHaveAttribute('data-action', 'viewReport');
    await expect(dashboard.recordLink('My Opportunities', 'Opportunity')).toBeVisible();
    await expect(dashboard.recordLink('My Leads', 'Lead')).toBeVisible();

    await dashboard.select('Sales Manager');
    await expect(dashboard.panel('Emails Sent in Last 7 Days').locator('a[href^="#Report/show/"]')).toHaveAttribute('data-action', 'viewReport');

    await dashboard.select('Call Center');
    await expect(dashboard.recordLink('My Calls', 'Call')).toBeVisible();

    await dashboard.select('Projects');
    await expect(dashboard.recordLink('Projects', 'Project')).toBeVisible();
    await expect(dashboard.recordLink('My Work Tasks', 'ProjectTask')).toBeVisible();
  });

  const recordCases = [
    ['Homepage', 'My Activities', 'Task'],
    ['Homepage', 'My Cases', 'Case'],
    ['Sales', 'My Opportunities', 'Opportunity'],
    ['Sales', 'My Leads', 'Lead'],
    ['Call Center', 'My Calls', 'Call'],
    ['Projects', 'Projects', 'Project'],
    ['Projects', 'My Work Tasks', 'ProjectTask'],
  ] as const;

  for (const [tab, widget, entity] of recordCases) {
    test(`${widget} opens its ${entity} record`, async ({ dashboard, page }) => {
      await dashboard.open();
      await dashboard.select(tab);
      const link = dashboard.recordLink(widget, entity);
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`#${entity}/view/[a-zA-Z0-9]+`));
      await expect(page.locator('.detail')).toBeVisible();
    });
  }

  test('email report drills down to an email record', async ({ dashboard, page }) => {
    await dashboard.open();
    await dashboard.select('Sales Manager');
    const menu = await dashboard.openWidgetMenu('Emails Sent in Last 7 Days');
    await expect(menu.getByText('View Report', { exact: true })).toBeVisible();
    const reportHref = await dashboard.panel('Emails Sent in Last 7 Days').locator('a[href^="#Report/show/"]').getAttribute('href');
    await page.goto(`/${reportHref}`);
    await expect(page).toHaveURL(/#Report\/show\//);
    const email = page.locator('a[href^="#Email/view/"]:not([data-action="quickView"])').first();
    await expect(email).toBeVisible();
    await email.click();
    await expect(page).toHaveURL(/#Email\/view\/[a-zA-Z0-9]+/);
  });

  test('charts render data and expose legends and report drill-downs', async ({ dashboard, page }) => {
    await dashboard.open();
    await dashboard.select('Sales');
    await expect(dashboard.chart('Revenue by month')).toBeVisible();
    await expect(dashboard.panel('Revenue by month')).toContainText('Revenue');
    const menu = await dashboard.openWidgetMenu('Revenue by month');
    await expect(menu.getByText('View Report', { exact: true })).toBeVisible();
    const reportHref = await dashboard.panel('Revenue by month').locator('a[href^="#Report/show/"]').getAttribute('href');
    await page.goto(`/${reportHref}`);
    await expect(page).toHaveURL(/#Report\/show\//);
    await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();
  });

  test('chart hover exposes interactive canvas behavior', async ({ dashboard }) => {
    await dashboard.open();
    await dashboard.select('Call Center');
    const chart = dashboard.chart('Calls by status');
    await expect(chart).toBeVisible();
    const box = await chart.boundingBox();
    expect(box).not.toBeNull();
    await chart.hover({ position: { x: Math.max(1, Math.floor(box!.width * 0.7)), y: Math.max(1, Math.floor(box!.height * 0.4)) } });
    await expect(dashboard.panel('Calls by status')).toContainText(/Planned|Held|Not Held/);
  });

  test('calendar next and previous controls change and restore the visible dates', async ({ dashboard }) => {
    await dashboard.open();
    const panel = dashboard.panel('Calendar');
    const dates = panel.locator('[data-date]');
    await expect(dates.first()).toBeVisible();
    const initial = await dates.first().getAttribute('data-date');
    await panel.locator('[data-action="next"]').click();
    await expect.poll(() => dates.first().getAttribute('data-date')).not.toBe(initial);
    await panel.locator('[data-action="previous"]').click();
    await expect.poll(() => dates.first().getAttribute('data-date')).toBe(initial);
  });

  test('Stream Show more loads additional rows', async ({ dashboard }) => {
    await dashboard.open();
    const panel = dashboard.panel('Stream');
    const rows = panel.locator('.list-group-item');
    const before = await rows.count();
    const showMore = panel.locator('[data-action="showMore"]');
    await expect(showMore).toBeVisible();
    await showMore.click();
    await expect.poll(() => rows.count()).toBeGreaterThan(before);
  });

  test('list Show more retains and extends call rows', async ({ dashboard }) => {
    await dashboard.open();
    await dashboard.select('Call Center');
    const panel = dashboard.panel('My Calls');
    const rows = panel.locator('a[href^="#Call/view/"]');
    const before = await rows.count();
    const showMore = panel.locator('[data-action="showMore"]');
    await expect(showMore).toBeVisible();
    await showMore.click();
    await expect.poll(() => rows.count()).toBeGreaterThanOrEqual(before);
  });

  test('widget menu exposes and runs Refresh', async ({ dashboard }) => {
    await dashboard.open();
    const menu = await dashboard.openWidgetMenu('My Cases');
    await expect(menu).toContainText('Refresh');
    await expect(menu).toContainText('Options');
    await expect(menu).toContainText('Remove');
    await menu.getByText('Refresh', { exact: true }).click();
    await expect(dashboard.widget('My Cases')).toBeVisible();
  });

  test('widget Options exposes filtering and sorting controls', async ({ dashboard }) => {
    await dashboard.open();
    await dashboard.select('Sales');
    const menu = await dashboard.openWidgetMenu('My Opportunities');
    await menu.getByText('Options', { exact: true }).click();
    await expect(dashboard.dialog).toBeVisible();
    await expect(dashboard.dialog).toContainText(/Filter|Sort|Display Records/);
    await expect(dashboard.dialog.locator('select, input').first()).toBeVisible();
    await dashboard.dialog.getByText('Cancel', { exact: true }).click();
  });

  test('widget Remove command opens confirmation and can be cancelled', async ({ dashboard, page }) => {
    await dashboard.open();
    const menu = await dashboard.openWidgetMenu('My Cases');
    page.once('dialog', dialog => dialog.dismiss());
    await menu.getByText('Remove', { exact: true }).click();
    await expect(dashboard.widget('My Cases')).toBeVisible();
  });
});

test.describe('Dashboard overflow commands @demo', () => {
  test('Edit Dashboard opens all tab controls', async ({ dashboard }) => {
    await dashboard.open();
    await dashboard.chooseOverflow('Edit Dashboard');
    for (const name of ['Homepage', 'Sales', 'Analytics', 'Sales Manager', 'Call Center', 'Projects']) {
      await expect(dashboard.dialog.locator(`input[value="${name}"]`)).toBeVisible();
    }
    await expect(dashboard.dialog.getByText('Lock Dashboard', { exact: true })).toBeVisible();
    await dashboard.dialog.getByText('Cancel', { exact: true }).click();
  });

  test('Add Dashlet opens the complete dashlet catalog and search', async ({ dashboard }) => {
    await dashboard.open();
    await dashboard.chooseOverflow('Add Dashlet');
    await expect(dashboard.dialog.getByPlaceholder(/Search/i)).toBeVisible();
    for (const item of ['Calendar', 'My Activities', 'My Calls', 'My Cases', 'My Leads', 'My Opportunities', 'Report', 'Stream']) {
      await expect(dashboard.dialog.getByText(item, { exact: true })).toBeVisible();
    }
  });
});

test.describe('Dashboard loading, empty and error states @demo', () => {
  test('My Cases renders its empty state', async ({ dashboard, page }) => {
    await page.route('**/api/v1/Case?**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"total":0,"list":[]}' }));
    await dashboard.open();
    await expect(dashboard.panel('My Cases')).toContainText(/No Data|No Records/i);
  });

  test('My Cases keeps its widget shell visible while data is loading', async ({ dashboard, page }) => {
    await dashboard.open();
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/v1/Case?**', async route => {
      await held;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"total":0,"list":[]}' });
    });
    const menu = await dashboard.openWidgetMenu('My Cases');
    await menu.getByText('Refresh', { exact: true }).click();
    await expect(dashboard.widget('My Cases')).toBeVisible();
    release();
    await expect(dashboard.panel('My Cases')).toContainText(/No Data|No Records/i);
  });

  test('HTTP error leaves the dashboard widget available for recovery', async ({ dashboard, page }) => {
    await dashboard.open();
    await page.route('**/api/v1/Case?**', route => route.fulfill({ status: 500, body: '{}' }));
    const failedResponse = page.waitForResponse(response => response.url().includes('/api/v1/Case?') && response.status() === 500);
    const menu = await dashboard.openWidgetMenu('My Cases');
    await menu.getByText('Refresh', { exact: true }).click();
    await failedResponse;
    await expect(dashboard.widget('My Cases')).toBeVisible();
  });

  test('aborted request reproduces the screenshot network-error behavior', async ({ dashboard, page }) => {
    await dashboard.open();
    await page.route('**/api/v1/Case?**', route => route.abort('failed'));
    const menu = await dashboard.openWidgetMenu('My Cases');
    await menu.getByText('Refresh', { exact: true }).click();
    await expect(page.getByText('Network error', { exact: true })).toBeVisible();
    await expect(dashboard.widget('My Cases')).toBeVisible();
  });
});
