import { test, expect } from '../../src/fixtures/ui-test';
import { entities, payload, unique } from '../../src/data/entities';

for (const spec of entities.filter(s => s.entity !== 'KnowledgeBaseArticle')) {
  test.describe(`${spec.entity} record actions`, () => {
    test('duplicate copies fields and saves a separate record', async ({ records, api }) => {
      const original = await api.create(spec.entity, payload(spec));
      await records.openDetail(spec, original.id);
      await records.duplicate(spec);
      await expect(records.input('description')).toHaveValue(String(original.description));
      const name = unique('duplicate');
      await records.input(spec.nameField).fill(name);
      const id = await records.save(spec.entity);
      expect(id).not.toBe(original.id);
      expect(await api.read(spec.entity, id)).toMatchObject({ [spec.nameField]: name, description: original.description });
      expect((await api.read(spec.entity, original.id))[spec.nameField]).toBe(original[spec.nameField]);
    });

    test('cancel removal preserves the record', async ({ records, api }) => {
      const record = await api.create(spec.entity, payload(spec));
      await records.openDetail(spec, record.id);
      await records.requestDelete();
      await records.dismissDialog();
      await expect(records.editButton).toBeVisible();
      expect((await api.read(spec.entity, record.id)).deleted).toBe(false);
    });

    test('confirmed removal excludes the record from search', async ({ records, listPage, api }) => {
      const record = await api.create(spec.entity, payload(spec, { [spec.nameField]: unique('remove').replaceAll('-', '') }));
      await records.openDetail(spec, record.id);
      await records.requestDelete();
      await records.confirmDelete(spec.entity, record.id);
      await listPage.search(String(record[spec.nameField]));
      await expect(listPage.emptyMessage).toBeVisible();
      expect((await api.read(spec.entity, record.id)).deleted).toBe(true);
    });

    test('cancel create returns to list without creating the typed name', async ({ records, api }) => {
      const name = unique('cancel-create');
      await records.openList(spec);
      await records.startCreateFromList(spec);
      await records.input(spec.nameField).fill(name);
      await records.cancel();
      await expect(records.createButton).toBeVisible();
      expect((await api.list(spec.entity, { where: JSON.stringify([{ type: 'equals', attribute: spec.nameField, value: name }]) })).list).toHaveLength(0);
    });

    test('Save & New persists one record and opens a blank form', async ({ records, api }) => {
      const data = payload(spec);
      await records.openCreate(spec);
      await records.fill(spec, data);
      const id = await records.saveWithAction(spec.entity, 'saveAndNew');
      await expect(records.input(spec.nameField)).toHaveValue('');
      expect(await api.read(spec.entity, id)).toMatchObject({ [spec.nameField]: data[spec.nameField] });
    });

    test('Save & Continue Editing keeps the saved record editable', async ({ records, api }) => {
      const data = payload(spec);
      await records.openCreate(spec);
      await records.fill(spec, data);
      const id = await records.saveWithAction(spec.entity, 'saveAndContinueEditing');
      await expect(records.input(spec.nameField)).toHaveValue(String(data[spec.nameField]));
      const updated = unique('continued-edit');
      await records.input(spec.nameField).fill(updated);
      await records.save(spec.entity, 'PUT');
      expect((await api.read(spec.entity, id))[spec.nameField]).toBe(updated);
    });

    test('clearing an optional description persists after reload', async ({ records, api }) => {
      const record = await api.create(spec.entity, payload(spec));
      await records.openDetail(spec, record.id);
      await records.edit();
      await records.input('description').fill('');
      await records.save(spec.entity, 'PUT');
      await records.reload();
      await records.edit();
      await expect(records.input('description')).toHaveValue('');
      expect((await api.read(spec.entity, record.id)).description ?? '').toBe('');
    });

    test('multiline international text survives editing and reload', async ({ records, api }) => {
      const record = await api.create(spec.entity, payload(spec));
      const description = 'First line: café, 東京, مرحبا\nSecond line: QA & CRM <literal> 🚀';
      await records.openDetail(spec, record.id);
      await records.edit();
      await records.input('description').fill(description);
      await records.save(spec.entity, 'PUT');
      await records.reload();
      await records.edit();
      await expect(records.input('description')).toHaveValue(description);
      expect((await api.read(spec.entity, record.id)).description).toBe(description);
    });

    test('breadcrumb returns from detail to the entity list', async ({ records, listPage, api }) => {
      const record = await api.create(spec.entity, payload(spec));
      await records.openDetail(spec, record.id);
      await records.backToList();
      await expect(listPage.heading).toContainText(spec.plural);
      await expect(listPage.searchInput).toBeVisible();
    });

    if (spec.entity !== 'Lead') {
      test('edit rejects a blank required name without overwriting the original', async ({ records, api }) => {
        const record = await api.create(spec.entity, payload(spec));
        await records.openDetail(spec, record.id);
        await records.edit();
        await records.input(spec.nameField).fill('');
        await records.saveButton.click();
        await expect(records.errors.first()).toBeVisible();
        await expect(records.saveButton).toBeVisible();
        expect((await api.read(spec.entity, record.id))[spec.nameField]).toBe(record[spec.nameField]);
      });
    }
  });
}
