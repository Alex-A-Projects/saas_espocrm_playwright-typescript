import { test, expect } from '../../src/fixtures/ui-test';
import { entities, payload, unique } from '../../src/data/entities';

for (const spec of entities) {
  test.describe(`${spec.entity} list interactions`, () => {
    test('opens a search result in the full detail page', async ({ api, listPage, records }) => {
      const record = await api.create(spec.entity, payload(spec));
      await listPage.open(spec);
      await listPage.search(String(record[spec.nameField]));
      await listPage.openRecord(spec.entity, record.id);
      await expect(records.heading).toContainText(String(record[spec.nameField]));
      await expect(records.editButton).toBeVisible();
    });

    test('clearing a search restores records after no results', async ({ api, listPage }) => {
      const record = await api.create(spec.entity, payload(spec));
      await listPage.open(spec);
      await listPage.search(unique('missing'));
      await expect(listPage.emptyMessage).toBeVisible();
      await listPage.clearSearch();
      await expect(listPage.recordLink(spec.entity, record.id)).toBeVisible();
    });

    test('search isolates matching records from unrelated data', async ({ api, listPage }) => {
      // Case and Knowledge Base use full-text search: hyphenated names tokenize
      // into shared words. One unique token tests isolation across both search modes.
      const term = unique('search').replaceAll('-', '');
      const included = await api.create(spec.entity, payload(spec, { [spec.nameField]: term }));
      const excluded = await api.create(spec.entity, payload(spec));
      await listPage.open(spec);
      await listPage.search(String(included[spec.nameField]));
      await expect(listPage.recordLink(spec.entity, included.id)).toBeVisible();
      await expect(listPage.recordLink(spec.entity, excluded.id)).toHaveCount(0);
    });

    test('selecting and deselecting a row toggles bulk actions', async ({ api, listPage }) => {
      const record = await api.create(spec.entity, payload(spec));
      await listPage.open(spec);
      await listPage.search(String(record[spec.nameField]));
      await listPage.select(record.id);
      await expect(listPage.actionsButton).toBeVisible();
      await listPage.select(record.id, false);
      await expect(listPage.actionsButton).toBeHidden();
    });

    test('quick view displays the selected record in a dialog', async ({ api, listPage }) => {
      const record = await api.create(spec.entity, payload(spec));
      await listPage.open(spec);
      await listPage.search(String(record[spec.nameField]));
      await listPage.quickAction(record.id, 'quickView');
      await expect(listPage.dialog).toContainText(String(record[spec.nameField]));
      await listPage.closeDialog();
      await expect(listPage.recordLink(spec.entity, record.id)).toBeVisible();
    });

    test('cancel quick removal leaves the row visible', async ({ api, listPage, records }) => {
      const record = await api.create(spec.entity, payload(spec));
      await listPage.open(spec);
      await listPage.search(String(record[spec.nameField]));
      await listPage.quickAction(record.id, 'quickRemove');
      await records.dismissDialog();
      await expect(listPage.recordLink(spec.entity, record.id)).toBeVisible();
      expect((await api.read(spec.entity, record.id)).deleted).toBe(false);
    });
  });
}
