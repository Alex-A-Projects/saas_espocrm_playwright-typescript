import { test, expect } from '../../src/fixtures/ui-test';
import { entities, unique } from '../../src/data/entities';


for (const spec of entities.filter(s => ['Account', 'Contact', 'Lead', 'Case', 'Task', 'TargetList'].includes(s.entity))) {
  test(`${spec.entity}: UI → API → MariaDB retains the same record @smoke`, async ({ records, api, db }) => {
    const name = unique('ui-db');
    const id = await records.create(spec, { [spec.nameField]: name, description: 'Created in the UI, verified in MariaDB.' });
    api.track(spec.entity, id);
    expect((await api.read(spec.entity, id))[spec.nameField]).toBe(name);
    const row = await db.record(spec.table, id);
    expect(row![spec.nameField === 'lastName' ? 'last_name' : 'name']).toBe(name);
    expect(row!.description).toBe('Created in the UI, verified in MariaDB.');
    expect(row!.deleted).toBe(0);
  });
}
