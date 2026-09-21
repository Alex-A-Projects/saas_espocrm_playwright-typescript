import { test, expect } from '../../src/fixtures/sales-test';
import { unique } from '../../src/data/entities';
import { salesSpec } from '../../src/data/sales';

for (const entity of ['Product', 'Supplier', 'Warehouse']) {
  test(`${entity}: create, edit, cancel, search and delete`, async ({ sales, salesApi, listPage }) => {
    const name = unique(entity);
    const account = entity === 'Supplier' ? await salesApi.create('Account', { name: unique('account') }) : undefined;
    await sales.openForm(entity);
    await sales.input('name').fill(name);
    if (account) await sales.selectLink('account', String(account.name));
    const id = await sales.save(entity);
    expect((await salesApi.read(entity, id)).name).toBe(name);
    await sales.edit();
    const updated = `${name}-updated`;
    await sales.input('name').fill(updated);
    await sales.save(entity, 'PUT');
    await sales.reload();
    await expect(sales.heading).toContainText(updated);
    await sales.edit();
    await sales.input('name').fill('Unsaved edit');
    await sales.cancel();
    expect((await salesApi.read(entity, id)).name).toBe(updated);
    await sales.openList(salesSpec(entity));
    await listPage.search(updated);
    await expect(listPage.recordLink(entity, id)).toBeVisible();
    await sales.openDetail(salesSpec(entity), id);
    await sales.requestDelete();
    await sales.confirmDelete(entity, id);
    expect(await salesApi.isListed(entity, id)).toBe(false);
  });

  test(`${entity}: name is required`, async ({ sales }) => {
    await sales.openForm(entity);
    await sales.saveButton.click();
    await expect(sales.fieldError('name')).toHaveClass(/has-error/);
  });

  test(`${entity}: persists inactive status`, async ({ sales, salesApi }) => {
    const account = entity === 'Supplier' ? await salesApi.create('Account', { name: unique('account') }) : undefined;
    const record = await salesApi.create(entity, { name: unique(entity), ...(account ? { accountId: account.id } : {}) });
    await sales.openDetail(salesSpec(entity), record.id);
    await sales.edit();
    await sales.selectEnum('status', 'Inactive');
    await sales.save(entity, 'PUT');
    await sales.reload();
    await expect(sales.field('status')).toContainText('Inactive');
    expect((await salesApi.read(entity, record.id)).status).toBe(entity === 'Product' ? 'Unavailable' : 'Inactive');
  });
}

test('Supplier: account is required', async ({ sales }) => {
  await sales.openForm('Supplier');
  await sales.input('name').fill(unique('supplier'));
  await sales.saveButton.click();
  await expect(sales.fieldError('account')).toHaveClass(/has-error/);
});
