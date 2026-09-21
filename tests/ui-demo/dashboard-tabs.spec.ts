import { test, expect } from '../../src/fixtures/demo-test';
import { dashboardWidgets, DashboardName } from '../../src/pages/DashboardPage';

for (const name of Object.keys(dashboardWidgets) as DashboardName[]) {
  test(`${name} dashboard activates and renders every configured widget @demo`, async ({ dashboard }) => {
    await dashboard.open();
    await dashboard.select(name);
    await dashboard.expectWidgets(name);
  });
}

test('dashboard tabs switch sequentially without leaving Home @demo', async ({ dashboard, page }) => {
  await dashboard.open();
  for (const name of Object.keys(dashboardWidgets) as DashboardName[]) {
    await dashboard.select(name);
    await expect(page).toHaveURL(/\/$|\/#$/);
  }
});

test('dashboard overflow menu opens from the ellipsis button @demo', async ({ dashboard }) => {
  await dashboard.open();
  await dashboard.openOverflow();
  await expect(dashboard.visibleMenu).toContainText('Edit Dashboard');
  await expect(dashboard.visibleMenu).toContainText('Add Dashlet');
});

test('sidebar Home returns from a module to the selected dashboard @demo', async ({ dashboard, navigation, listPage }) => {
  await dashboard.open();
  await dashboard.select('Call Center');
  await navigation.openModule('Account');
  await expect(listPage.heading).toContainText('Accounts');
  await navigation.goHome();
  await expect(dashboard.tab('Call Center')).toHaveClass(/\bactive\b/);
  await dashboard.expectWidgets('Call Center');
});
