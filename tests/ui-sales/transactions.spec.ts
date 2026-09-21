import { test, expect } from '../../src/fixtures/sales-test';
import { unique } from '../../src/data/entities';
import { salesDocuments } from '../../src/data/sales';

for (const entity of salesDocuments) {
  test(`${entity}: create, recalculate, cancel edit, reload and delete a draft`, async ({ sales, salesApi }) => {
    const tax = await salesApi.create('TaxCode', { name: unique('tax'), code: unique().slice(-5), rate: '0', type: 'Percentage' });
    await sales.openForm(entity);
    const description = unique('sales');
    await sales.input('description').fill(description);
    if (entity === 'Invoice') await sales.date('dateDue', '2027-12-31', 'MM/DD/YYYY');
    await sales.addItem(unique('service'), 2, 25, String(tax.name));
    await sales.addItem(unique('service'), 3, 10, String(tax.name));
    const id = await sales.save(entity);
    const saved = await salesApi.read(entity, id);
    expect(saved.status).toBe('Draft');
    expect(Number(saved.amount)).toBe(80);
    expect(saved.itemList).toHaveLength(2);
    await sales.reload();
    await expect(sales.content).toContainText('$80.00');
    await sales.edit();
    await sales.itemNumber(0, 'quantity', 4);
    await sales.save(entity, 'PUT');
    expect(Number((await salesApi.read(entity, id)).amount)).toBe(130);
    await sales.edit();
    await sales.input('description').fill('Discard this change');
    await sales.cancel();
    expect((await salesApi.read(entity, id)).description).toBe(description);
    await sales.requestDelete();
    await sales.confirmDelete(entity, id);
    expect(await salesApi.isListed(entity, id)).toBe(false);
  });

  test(`${entity}: calculates ten percent tax on a line item`, async ({ sales, salesApi }) => {
    const tax = await salesApi.create('TaxCode', { name: unique('tax'), code: unique().slice(-5), rate: '10', type: 'Percentage' });
    await sales.openForm(entity);
    if (entity === 'Invoice') await sales.date('dateDue', '2027-12-31', 'MM/DD/YYYY');
    await sales.addItem(unique('taxed'), 2, 50, String(tax.name));
    const id = await sales.save(entity);
    const saved = await salesApi.read(entity, id);
    expect(Number(saved.amount)).toBe(100);
    expect(Number(saved.taxAmount)).toBe(10);
    expect(Number(saved.grandTotalAmount)).toBe(110);
    await expect(sales.content).toContainText('$110.00');
  });

  test(`${entity}: refuses an item without a name`, async ({ sales }) => {
    await sales.openForm(entity);
    if (entity === 'Invoice') await sales.date('dateDue', '2027-12-31', 'MM/DD/YYYY');
    await sales.addItem('', 1, 10);
    await sales.saveButton.click();
    await expect(sales.errors.first()).toBeVisible();
    await expect(sales.saveButton).toBeVisible();
  });
}
