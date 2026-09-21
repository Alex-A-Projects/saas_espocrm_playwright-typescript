import { test, expect } from '../../src/fixtures/test';
import { entities, payload, unique } from '../../src/data/entities';

for (const spec of entities) {
  test.describe(spec.entity, () => {
    test('creates and reads a record @smoke', async ({ api }) => {
      const data = payload(spec);
      const record = await api.create(spec.entity, data);
      expect(record.id).toMatch(/^[a-zA-Z0-9]+$/);
      expect(await api.read(spec.entity, record.id)).toMatchObject(data);
    });
    test('updates a name without changing the ID', async ({ api }) => {
      const record = await api.create(spec.entity, payload(spec));
      const data = { [spec.nameField]: unique('updated') };
      expect(await api.update(spec.entity, record.id, data)).toMatchObject({ id: record.id, ...data });
      expect(await api.read(spec.entity, record.id)).toMatchObject(data);
    });
    test('partial updates preserve unrelated fields', async ({ api }) => {
      const data = payload(spec);
      const record = await api.create(spec.entity, data);
      await api.update(spec.entity, record.id, { description: 'Updated description' });
      expect(await api.read(spec.entity, record.id)).toMatchObject({ ...data, description: 'Updated description' });
    });
    test('clears an optional description', async ({ api }) => {
      const record = await api.create(spec.entity, payload(spec));
      await api.update(spec.entity, record.id, { description: null });
      expect((await api.read(spec.entity, record.id)).description).toBeNull();
    });
    test('round-trips Unicode and punctuation', async ({ api }) => {
      const data = payload(spec, { [spec.nameField]: unique('東京-Café'), description: "O'Brien & <test> — Ελληνικά 🚀\nSecond line" });
      const record = await api.create(spec.entity, data);
      expect(await api.read(spec.entity, record.id)).toMatchObject(data);
    });
    test('filters by exact ID', async ({ api }) => {
      const record = await api.create(spec.entity, payload(spec));
      const result = await api.list(spec.entity, { where: JSON.stringify([{ type: 'equals', attribute: 'id', value: record.id }]) });
      expect(result.total).toBe(1);
      expect(result.list.map(r => r.id)).toEqual([record.id]);
    });
    test('filters by name and excludes unrelated records', async ({ api }) => {
      const data = payload(spec);
      const record = await api.create(spec.entity, data);
      await api.create(spec.entity, payload(spec));
      const result = await api.list(spec.entity, { where: JSON.stringify([{ type: 'equals', attribute: spec.nameField, value: data[spec.nameField] }]) });
      expect(result.list.map(r => r.id)).toEqual([record.id]);
    });
    test('paginates without overlap in deterministic order', async ({ api }) => {
      const prefix = unique('page');
      const records = [];
      for (const suffix of ['A', 'B', 'C']) records.push(await api.create(spec.entity, payload(spec, { [spec.nameField]: `${prefix}-${suffix}` })));
      const params = { where: JSON.stringify([{ type: 'startsWith', attribute: spec.nameField, value: prefix }]), orderBy: spec.nameField, order: 'asc', maxSize: 2 };
      const first = await api.list(spec.entity, { ...params, offset: 0 });
      const second = await api.list(spec.entity, { ...params, offset: 2 });
      expect(first.total).toBe(3);
      expect(first.list.map(r => r.id)).toEqual(records.slice(0, 2).map(r => r.id));
      expect(second.list.map(r => r.id)).toEqual([records[2].id]);
    });
    test('returns an empty list for an unknown ID', async ({ api }) => {
      const result = await api.list(spec.entity, { where: JSON.stringify([{ type: 'equals', attribute: 'id', value: '00000000000000000' }]) });
      expect(result).toMatchObject({ total: 0, list: [] });
    });
    test('returns 404 for a missing record', async ({ api }) => {
      expect((await api.context.get(`${spec.entity}/00000000000000000`)).status()).toBe(404);
    });
    test('returns 404 when updating a missing record', async ({ api }) => {
      expect((await api.context.put(`${spec.entity}/00000000000000000`, { data: { description: 'missing' } })).status()).toBe(404);
    });
    test('deletes the record and excludes it from searches', async ({ api }) => {
      const record = await api.create(spec.entity, payload(spec));
      const response = await api.context.delete(`${spec.entity}/${record.id}`);
      expect(response.status()).toBe(200);
      expect(await api.read(spec.entity, record.id)).toMatchObject({ id: record.id, deleted: true });
      const result = await api.list(spec.entity, { where: JSON.stringify([{ type: 'equals', attribute: 'id', value: record.id }]) });
      expect(result.list).toEqual([]);
    });
  });
}
