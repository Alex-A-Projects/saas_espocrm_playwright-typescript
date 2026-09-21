import { test, expect } from '../../src/fixtures/sales-test';
import { unique } from '../../src/data/entities';

for (const target of ['SalesOrder', 'Invoice']) {
  test(`Quote to ${target}: selecting the source copies its line items and totals`, async ({ sales, salesApi }) => {
    const tax = await salesApi.create('TaxCode', { name: unique('tax'), code: unique().slice(-5), rate: '0', type: 'Percentage' });
    await sales.openForm('Quote');
    await sales.addItem(unique('quoted-service'), 2, 35, String(tax.name));
    const quoteId = await sales.save('Quote');
    const quote = await salesApi.read('Quote', quoteId);
    await sales.openForm(target);
    await sales.selectLink('quote', String(quote.name));
    await expect(sales.itemInput(0, 'quantity')).toHaveValue('2');
    if (target === 'Invoice') await sales.date('dateDue', '2027-12-31', 'MM/DD/YYYY');
    const id = await sales.save(target);
    const saved = await salesApi.read(target, id);
    expect(saved.quoteId).toBe(quoteId);
    expect(Number(saved.amount)).toBe(70);
    expect(saved.itemList).toHaveLength(1);
    expect((saved.itemList as { name: string }[])[0].name).toBe((quote.itemList as { name: string }[])[0].name);
    await expect(sales.content).toContainText('$70.00');
  });
}
