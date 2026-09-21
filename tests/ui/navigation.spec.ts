import { test, expect } from '../../src/fixtures/ui-test';
import { entities } from '../../src/data/entities';

for (const spec of entities) {
  test(`sidebar opens ${spec.plural} and Home returns to dashboard`, async ({ navigation, listPage }) => {
    await navigation.home();
    await navigation.openModule(spec.entity);
    await expect(listPage.heading).toContainText(spec.plural);
    await expect(listPage.searchInput).toBeVisible();
    await navigation.goHome();
    await expect(navigation.dashboardActivities).toBeVisible();
  });
}

test('authenticated dashboard exposes stream, activities and global search @smoke', async ({ navigation }) => {
  await navigation.home();
  await expect(navigation.stream).toBeVisible();
  await expect(navigation.dashboardActivities).toBeVisible();
  await expect(navigation.globalSearch).toBeVisible();
});

for (const mode of ['Month', 'Week', 'Timeline'] as const) {
  test(`calendar switches to ${mode} view`, async ({ calendar }) => {
    await calendar.open();
    await calendar.mode(mode);
    if (mode === 'Timeline') {
      await expect(calendar.timeline).toBeVisible();
      await expect(calendar.timeline).toContainText('00:00');
    } else {
      await expect(calendar.title).not.toBeEmpty();
      await expect(calendar.grid).toBeVisible();
    }
  });
}

test('calendar moves between months and Today returns to current month', async ({ calendar }) => {
  await calendar.open();
  await calendar.mode('Month');
  await calendar.move('today');
  const current = await calendar.title.textContent();
  await calendar.move('next');
  await expect(calendar.title).not.toHaveText(current!);
  await calendar.move('prev');
  await expect(calendar.title).toHaveText(current!);
  await calendar.move('prev');
  await expect(calendar.title).not.toHaveText(current!);
  await calendar.move('today');
  await expect(calendar.title).toHaveText(current!);
});
