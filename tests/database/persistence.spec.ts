import { test, expect } from '../../src/fixtures/test';
import { entities, payload, unique } from '../../src/data/entities';

for (const spec of entities) {
  test.describe(`${spec.entity} persistence`, () => {
    test('API create persists matching fields in MariaDB @smoke', async ({ api, db }) => {
      const data = payload(spec);
      const record = await api.create(spec.entity, data);
      const row = await db.record(spec.table, record.id);
      expect(row).toMatchObject({ id: record.id, deleted: 0, description: data.description });
      expect(row![spec.nameField === 'lastName' ? 'last_name' : 'name']).toBe(data[spec.nameField]);
    });
    test('creates audit timestamps and creator ID', async ({ api, db }) => {
      const start = Date.now() - 5000;
      const record = await api.create(spec.entity, payload(spec));
      const row = await db.record(spec.table, record.id);
      expect(row!.created_by_id).toBeTruthy();
      const created = Date.parse(`${row!.created_at}Z`);
      expect(created).toBeGreaterThanOrEqual(start);
      expect(created).toBeLessThanOrEqual(Date.now() + 5000);
      expect(row!.modified_at).toBeTruthy();
    });
    test('API updates change the persisted fields', async ({ api, db }) => {
      const record = await api.create(spec.entity, payload(spec));
      const name = unique('db-update');
      await api.update(spec.entity, record.id, { [spec.nameField]: name, description: 'Persisted update' });
      const row = await db.record(spec.table, record.id);
      expect(row![spec.nameField === 'lastName' ? 'last_name' : 'name']).toBe(name);
      expect(row!.description).toBe('Persisted update');
    });
    test('updates preserve creation audit fields', async ({ api, db }) => {
      const record = await api.create(spec.entity, payload(spec));
      const before = await db.record(spec.table, record.id);
      await api.update(spec.entity, record.id, { description: 'Audit update' });
      const after = await db.record(spec.table, record.id);
      expect(after!.created_at).toBe(before!.created_at);
      expect(after!.created_by_id).toBe(before!.created_by_id);
      expect(after!.modified_by_id).toBeTruthy();
      expect(after!.modified_at >= before!.modified_at).toBe(true);
    });
    test('Unicode text is stored without corruption', async ({ api, db }) => {
      const description = "東京 🚀 Café O'Brien\nLine two";
      const record = await api.create(spec.entity, payload(spec, { description }));
      expect((await db.record(spec.table, record.id))!.description).toBe(description);
    });
    test('optional description can be persisted as SQL NULL', async ({ api, db }) => {
      const record = await api.create(spec.entity, payload(spec));
      await api.update(spec.entity, record.id, { description: null });
      expect((await db.record(spec.table, record.id))!.description).toBeNull();
    });
    test('deletion is a soft delete and API marks the row deleted', async ({ api, db }) => {
      const record = await api.create(spec.entity, payload(spec));
      await api.remove(spec.entity, record.id);
      expect((await db.record(spec.table, record.id))!.deleted).toBe(1);
      expect(await api.read(spec.entity, record.id)).toMatchObject({ deleted: true });
    });
    test('identical display names retain independent primary keys', async ({ api, db }) => {
      const data = payload(spec);
      const first = await api.create(spec.entity, data);
      const response = await api.context.post(spec.entity, { data: { ...data, assignedUserId: first.assignedUserId }, headers: { 'X-Skip-Duplicate-Check': 'true' } });
      const second = await api.json<{ id: string }>(response);
      api.track(spec.entity, second.id);
      expect(first.id).not.toBe(second.id);
      expect((await db.record(spec.table, first.id))!.deleted).toBe(0);
      expect((await db.record(spec.table, second.id))!.deleted).toBe(0);
    });
  });
}
