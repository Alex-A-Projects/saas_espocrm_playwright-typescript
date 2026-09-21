import { test, expect } from '../../src/fixtures/test';
import { payload, specFor } from '../../src/data/entities';

for (const entity of ['Contact', 'Opportunity', 'Case']) {
  test(`${entity} links to an account and resolves its display name`, async ({ api }) => {
    const account = await api.create('Account', payload(specFor('Account')));
    const child = await api.create(entity, payload(specFor(entity), { accountId: account.id }));
    expect(await api.read(entity, child.id)).toMatchObject({ accountId: account.id, accountName: account.name });
  });
  test(`${entity} can unlink an account without deleting either record`, async ({ api }) => {
    const account = await api.create('Account', payload(specFor('Account')));
    const child = await api.create(entity, payload(specFor(entity), { accountId: account.id }));
    if (entity === 'Contact') {
      // Contacts have a many-to-many accounts link with a primary-account display field.
      const response = await api.context.delete(`Account/${account.id}/contacts`, { data: { id: child.id } });
      expect(response.status()).toBe(200);
    } else {
      await api.update(entity, child.id, { accountId: null });
    }
    expect((await api.read(entity, child.id)).accountId).toBeNull();
    expect((await api.read('Account', account.id)).deleted).toBe(false);
  });
}
for (const entity of ['Task', 'Meeting', 'Call']) {
  test(`${entity} supports a polymorphic Account parent`, async ({ api }) => {
    const account = await api.create('Account', payload(specFor('Account')));
    const activity = await api.create(entity, payload(specFor(entity), { parentType: 'Account', parentId: account.id }));
    expect(await api.read(entity, activity.id)).toMatchObject({ parentType: 'Account', parentId: account.id, parentName: account.name });
  });
}
test('Account contacts relationship lists its linked contact', async ({ api }) => {
  const account = await api.create('Account', payload(specFor('Account')));
  const contact = await api.create('Contact', payload(specFor('Contact'), { accountId: account.id }));
  const linked = await api.list(`Account/${account.id}/contacts`);
  expect(linked.list.map(r => r.id)).toContain(contact.id);
});
