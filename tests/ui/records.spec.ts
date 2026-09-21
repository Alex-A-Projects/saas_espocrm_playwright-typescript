import { test, expect } from '../../src/fixtures/ui-test';
import { entities, payload, unique } from '../../src/data/entities';
import { RecordData } from '../../src/api/EspoClient';


// These entities expose standard name/description controls in the core layout.
const uiEntities = entities.filter(s => s.entity !== 'KnowledgeBaseArticle');
for (const spec of uiEntities) {
  test.describe(`${spec.entity} UI`, () => {
    test('opens the list and create form', async ({ records }) => {
      await records.openList(spec);
      await records.startCreateFromList(spec);
      await expect(records.input(spec.nameField)).toBeVisible();
      await expect(records.saveButton).toBeVisible();
    });
    test('creates a record through the UI @smoke', async ({ records, api }) => {
      const data: RecordData = { [spec.nameField]: unique('ui-create'), description: 'Created through browser fields and Save.', ...(spec.entity === 'Opportunity' ? { amount: 1250, closeDate: '2027-12-31' } : {}) };
      const id = await records.create(spec, data);
      api.track(spec.entity, id);
      expect(await api.read(spec.entity, id)).toMatchObject(data);
      await expect(records.content).toContainText(String(data[spec.nameField]));
    });
    test('renders persisted API records in the detail page', async ({ records, api }) => {
      const data = payload(spec);
      const record = await api.create(spec.entity, data);
      await records.openDetail(spec, record.id);
      await expect(records.content).toContainText(String(data[spec.nameField]));
      await expect(records.field('description')).toContainText(String(data.description));
    });
    test('edits the record and persists changes after reload', async ({ records, api, page }) => {
      const record = await api.create(spec.entity, payload(spec));
      await records.openDetail(spec, record.id);
      await records.edit();
      const updated = unique('ui-edit');
      await records.input(spec.nameField).fill(updated);
      await records.input('description').fill('Edited in browser');
      await records.save(spec.entity, 'PUT');
      await page.reload();
      await expect(records.content).toContainText(updated);
      expect(await api.read(spec.entity, record.id)).toMatchObject({ [spec.nameField]: updated, description: 'Edited in browser' });
    });
    test('cancel edit leaves stored values unchanged', async ({ records, api }) => {
      const data = payload(spec);
      const record = await api.create(spec.entity, data);
      await records.openDetail(spec, record.id);
      await records.edit();
      await records.input(spec.nameField).fill(unique('cancelled'));
      await records.cancelButton.click();
      await expect(records.editButton).toBeVisible();
      expect((await api.read(spec.entity, record.id))[spec.nameField]).toBe(data[spec.nameField]);
    });
    test('search finds a uniquely named record', async ({ records, api, listPage }) => {
      const data = payload(spec);
      const record = await api.create(spec.entity, data);
      await records.openList(spec);
      await records.search(String(data[spec.nameField]));
      await expect(listPage.recordLink(spec.entity, record.id)).toBeVisible();
    });
    test('search reports no matches for an unknown name', async ({ records }) => {
      await records.openList(spec);
      await records.search(unique('no-match'));
      await expect(records.content).toContainText('No Data');
    });
    if (spec.entity !== 'Lead') {
      test('required name prevents empty form submission', async ({ records, page }) => {
        await records.openCreate(spec);
        await records.saveButton.click();
        await expect(records.saveButton).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`#${spec.entity}/create$`));
        await expect(records.errors.first()).toBeVisible();
      });
    }
  });
}
