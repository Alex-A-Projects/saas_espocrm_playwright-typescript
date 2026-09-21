import { test, expect } from '../../src/fixtures/ui-test';
import { payload, specFor, unique } from '../../src/data/entities';

for (const entity of ['Account', 'Contact', 'Lead']) {
  const spec = specFor(entity);
  test.describe(`${entity} contact fields`, () => {
    test('email entered in the UI persists and renders on detail', async ({ records, api }) => {
      const email = `${unique('email').toLowerCase()}@example.test`;
      const id = await records.create(spec, payload(spec, { emailAddress: email }));
      await expect(records.field('emailAddress')).toContainText(email);
      expect((await api.read(entity, id)).emailAddress).toBe(email);
    });
    for (const invalid of ['not-an-email', 'missing-domain@', '@example.test']) {
      test(`rejects invalid email ${invalid}`, async ({ records, api }) => {
        const record = await api.create(entity, payload(spec));
        await records.openDetail(spec, record.id);
        await records.edit();
        await records.emailInput.fill(invalid);
        await records.saveButton.click();
        await expect(records.fieldError('emailAddress')).toHaveClass(/has-error/);
        await expect(records.saveButton).toBeVisible();
        expect((await api.read(entity, record.id)).emailAddress).toBeFalsy();
      });
    }
    test('cancel email edit preserves the existing address', async ({ records, api }) => {
      const email = `${unique('original')}@example.test`;
      const record = await api.create(entity, payload(spec, { emailAddress: email }));
      await records.openDetail(spec, record.id);
      await records.edit();
      await records.emailInput.fill('changed@example.test');
      await records.cancel();
      await expect(records.field('emailAddress')).toContainText(email);
      expect((await api.read(entity, record.id)).emailAddress).toBe(email);
    });
  });
}

for (const prefix of ['billingAddress', 'shippingAddress']) {
  test(`Account ${prefix} persists all address components`, async ({ records, api }) => {
    const spec = specFor('Account');
    const record = await api.create('Account', payload(spec));
    const address = { Street: '123 QA Street\nSuite 200', City: 'New York', State: 'NY', PostalCode: '10001', Country: 'United States' };
    await records.openDetail(spec, record.id);
    await records.edit();
    for (const [key, value] of Object.entries(address)) await records.input(`${prefix}${key}`).fill(value);
    await records.save('Account', 'PUT');
    await records.reload();
    await expect(records.field(prefix)).toContainText('New York');
    const saved = await api.read('Account', record.id);
    for (const [key, value] of Object.entries(address)) expect(saved[`${prefix}${key}`]).toBe(value);
  });
}

for (const entity of ['Contact', 'Opportunity', 'Case']) {
  const spec = specFor(entity);
  const accountField = entity === 'Contact' ? 'accounts' : 'account';
  test(`${entity} selects an Account through the relationship picker`, async ({ records, api }) => {
    const account = await api.create('Account', payload(specFor('Account')));
    const record = await api.create(entity, payload(spec));
    await records.openDetail(spec, record.id);
    await records.edit();
    await records.selectLink(accountField, String(account.name));
    await records.save(entity, 'PUT');
    await records.reload();
    await expect(records.field(accountField)).toContainText(String(account.name));
    const saved = await api.read(entity, record.id);
    if (entity === 'Contact') expect(saved.accountsIds).toContain(account.id);
    else expect(saved.accountId).toBe(account.id);
  });
  test(`${entity} clears an optional Account relationship`, async ({ records, api }) => {
    const account = await api.create('Account', payload(specFor('Account')));
    const record = await api.create(entity, payload(spec, entity === 'Contact' ? { accountsIds: [account.id] } : { accountId: account.id }));
    await records.openDetail(spec, record.id);
    await records.edit();
    await records.clearLink(accountField);
    await records.save(entity, 'PUT');
    await expect(records.field(accountField)).not.toContainText(String(account.name));
    const saved = await api.read(entity, record.id);
    if (entity === 'Contact') expect(saved.accountsIds).not.toContain(account.id);
    else expect(saved.accountId).toBeNull();
  });
}

const article = specFor('KnowledgeBaseArticle');
test.describe('Knowledge Base rich text', () => {
  test('creates an article through the rich text editor', async ({ records, api }) => {
    const name = unique('article');
    await records.openCreate(article);
    await records.input('name').fill(name);
    await records.bodyEditor.fill('A knowledge article created through the browser.');
    const id = await records.save(article.entity);
    await expect(records.field('body')).toContainText('A knowledge article created through the browser.');
    expect((await api.read(article.entity, id)).body).toContain('A knowledge article created through the browser.');
  });
  test('edits article body and persists after reload', async ({ records, api }) => {
    const record = await api.create(article.entity, payload(article));
    await records.openDetail(article, record.id);
    await records.edit();
    await records.bodyEditor.fill('Updated troubleshooting instructions.');
    await records.save(article.entity, 'PUT');
    await records.reload();
    await expect(records.field('body')).toContainText('Updated troubleshooting instructions.');
  });
  test('cancel preserves the article body', async ({ records, api }) => {
    const record = await api.create(article.entity, payload(article));
    await records.openDetail(article, record.id);
    await records.edit();
    await records.bodyEditor.fill('Discard this draft.');
    await records.cancel();
    await expect(records.field('body')).toContainText('Automation knowledge article.');
    expect((await api.read(article.entity, record.id)).body).toBe(record.body);
  });
  test('empty article title is rejected', async ({ records }) => {
    await records.openCreate(article);
    await records.bodyEditor.fill('Body without a title.');
    await records.saveButton.click();
    await expect(records.fieldError('name')).toHaveClass(/has-error/);
    await expect(records.saveButton).toBeVisible();
  });
});
