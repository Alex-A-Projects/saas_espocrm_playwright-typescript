import { test, expect } from '../../src/fixtures/test';
import { payload, specFor, unique } from '../../src/data/entities';
import { statusCases } from '../../src/data/statuses';

for (const { entity, field, values } of statusCases) {
  for (const value of values) {
    test(`${entity} accepts ${field} ${value}`, async ({ api }) => {
      const record = await api.create(entity, payload(specFor(entity)));
      await api.update(entity, record.id, { [field]: value });
      expect((await api.read(entity, record.id))[field]).toBe(value);
    });
  }
}
for (const entity of ['Case', 'Task']) {
  for (const priority of ['Low', 'Normal', 'High', 'Urgent']) {
    test(`${entity} retains ${priority} priority`, async ({ api }) => {
      const record = await api.create(entity, payload(specFor(entity), { priority }));
      expect((await api.read(entity, record.id)).priority).toBe(priority);
    });
  }
}
for (const amount of [0, 0.01, 1250.75, 999999.99]) {
  test(`Opportunity preserves monetary amount ${amount}`, async ({ api }) => {
    const record = await api.create('Opportunity', payload(specFor('Opportunity'), { amount, amountCurrency: 'USD' }));
    expect((await api.read('Opportunity', record.id)).amount).toBe(amount);
    expect(record.amountCurrency).toBe('USD');
  });
}
for (const entity of ['Contact', 'Lead']) {
  test(`${entity} builds full name from first and last name`, async ({ api }) => {
    const lastName = unique('surname');
    const record = await api.create(entity, payload(specFor(entity), { firstName: 'Taylor', lastName }));
    expect(record.name).toBe(`Taylor ${lastName}`);
  });
}
for (const entity of ['Account', 'Contact', 'Lead']) {
  test(`${entity} preserves primary email and email metadata`, async ({ api }) => {
    const emailAddress = `${unique('mail').toLowerCase()}@example.test`;
    const record = await api.create(entity, payload(specFor(entity), { emailAddress }));
    const saved = await api.read(entity, record.id);
    expect(saved.emailAddress).toBe(emailAddress);
    expect(saved.emailAddressData).toEqual(expect.arrayContaining([expect.objectContaining({ emailAddress, primary: true })]));
  });
}
