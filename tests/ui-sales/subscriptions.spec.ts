import { test, expect } from '../../src/fixtures/sales-test';
import { unique } from '../../src/data/entities';

for (const field of ['billingPlan', 'tax']) {
  test(`Subscription: ${field} is required`, async ({ sales }) => {
    await sales.openForm('Subscription');
    await sales.saveButton.click();
    await expect(sales.fieldError(field)).toHaveClass(/has-error/);
  });
}

test('Subscription: creates, edits and deletes a draft with a recurring product', async ({ sales, salesApi }) => {
  const plan = await salesApi.create('SubscriptionBillingPlan', {
    name: unique('plan'), interval: '1M', createPaymentRequests: false, sendPaymentRequests: false, sendInvoices: false,
  });
  const code = await salesApi.create('TaxCode', { name: unique('tax'), code: unique().slice(-5), rate: '0', type: 'Percentage' });
  const tax = await salesApi.create('Tax', { name: unique('tax-profile'), basis: 'Tax Code', taxCodeId: code.id });
  const product = await salesApi.create('Product', { name: unique('recurring'), isSubscribable: true, isInventory: false, listPrice: 25 });
  await sales.openForm('Subscription');
  await sales.selectLink('billingPlan', String(plan.name));
  await sales.selectLink('tax', String(tax.name));
  await sales.addProduct(String(product.name));
  await sales.subscriptionPrice(String(product.name), 25);
  const id = await sales.save('Subscription');
  const saved = await salesApi.read('Subscription', id);
  expect(saved).toMatchObject({ status: 'Draft', billingPlanId: plan.id, taxId: tax.id });
  expect(saved.itemList).toHaveLength(1);
  await sales.edit();
  await sales.input('description').fill('Updated subscription draft');
  await sales.save('Subscription', 'PUT');
  await sales.reload();
  await expect(sales.field('description')).toContainText('Updated subscription draft');
  await sales.requestDelete();
  await sales.confirmDelete('Subscription', id);
  expect(await salesApi.isListed('Subscription', id)).toBe(false);
});
