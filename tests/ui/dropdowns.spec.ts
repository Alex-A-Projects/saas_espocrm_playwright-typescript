import { test, expect } from '../../src/fixtures/ui-test';
import { payload, specFor } from '../../src/data/entities';
import { statusCases } from '../../src/data/statuses';

const fields = [
  ...statusCases,
  { entity: 'Account', field: 'type', values: ['Customer', 'Investor', 'Partner', 'Reseller'] },
  { entity: 'Case', field: 'priority', values: ['Low', 'Normal', 'High', 'Urgent'] },
  { entity: 'Task', field: 'priority', values: ['Low', 'Normal', 'High', 'Urgent'] },
  { entity: 'Call', field: 'direction', values: ['Inbound', 'Outbound'] },
  { entity: 'Campaign', field: 'type', values: ['Email', 'Newsletter', 'Web', 'Television', 'Radio', 'Mail'] },
];

for (const { entity, field, values } of fields) {
  for (const value of values) {
    test(`${entity} ${field}: selecting ${value} persists after reload`, async ({ api, records }) => {
      const spec = specFor(entity);
      const record = await api.create(entity, payload(spec, { [field]: values.find(option => option !== value)! }));
      await records.openDetail(spec, record.id);
      await records.edit();
      await records.selectEnum(field, value);
      await records.save(entity, 'PUT');
      expect((await api.read(entity, record.id))[field]).toBe(value);
      await records.reload();
      await expect(records.field(field)).toContainText(value);
    });
  }
}
