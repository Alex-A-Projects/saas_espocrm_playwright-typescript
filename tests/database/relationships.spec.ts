import { test, expect } from '../../src/fixtures/test';
import { payload, specFor, unique } from '../../src/data/entities';

for (const entity of ['Contact', 'Opportunity', 'Case']) {
  test(`${entity} account foreign key matches API relationship`, async ({ api, db }) => {
    const account = await api.create('Account', payload(specFor('Account')));
    const spec = specFor(entity);
    const record = await api.create(entity, payload(spec, { accountId: account.id }));
    expect((await db.record(spec.table, record.id))!.account_id).toBe(account.id);
  });
}
for (const entity of ['Task', 'Meeting', 'Call']) {
  test(`${entity} stores parent discriminator and ID`, async ({ api, db }) => {
    const account = await api.create('Account', payload(specFor('Account')));
    const spec = specFor(entity);
    const record = await api.create(entity, payload(spec, { parentType: 'Account', parentId: account.id }));
    expect(await db.record(spec.table, record.id)).toMatchObject({ parent_type: 'Account', parent_id: account.id, assigned_user_id: record.assignedUserId });
  });
}
for (const entity of ['Account', 'Contact', 'Lead']) {
  test(`${entity} email relation stores the primary address`, async ({ api, db }) => {
    const emailAddress = `${unique('db-email').toLowerCase()}@example.test`;
    const record = await api.create(entity, payload(specFor(entity), { emailAddress }));
    const rows = await db.query('SELECT ea.name, ee.primary FROM email_address ea JOIN entity_email_address ee ON ea.id = ee.email_address_id WHERE ee.entity_id = ? AND ee.entity_type = ? AND ee.deleted = 0', [record.id, entity]);
    expect(rows).toEqual([expect.objectContaining({ name: emailAddress, primary: 1 })]);
  });
}
test('Opportunity decimal amount and currency match API values', async ({ api, db }) => {
  const record = await api.create('Opportunity', payload(specFor('Opportunity'), { amount: 12345.67, amountCurrency: 'USD' }));
  const row = await db.record('opportunity', record.id);
  expect(Number(row!.amount)).toBe(12345.67);
  expect(row!.amount_currency).toBe('USD');
});
