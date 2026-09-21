import { test, expect } from '../../src/fixtures/sales-test';
import { unique } from '../../src/data/entities';

for (const entity of ['DeliveryOrder', 'ReceiptOrder', 'TransferOrder', 'InventoryAdjustment']) {
  test(`${entity}: creates, edits and deletes a draft for owned stock`, async ({ sales, salesApi }) => {
    const warehouse = await salesApi.create('Warehouse', { name: unique('warehouse') });
    const product = await salesApi.create('Product', { name: unique('stock'), isInventory: true, listPrice: 25, costPrice: 10 });
    await sales.openForm(entity);
    if (entity === 'TransferOrder') {
      const destination = await salesApi.create('Warehouse', { name: unique('destination') });
      await sales.selectLink('fromWarehouse', String(warehouse.name));
      await sales.selectLink('toWarehouse', String(destination.name));
    } else {
      await sales.selectLink('warehouse', String(warehouse.name));
    }
    await sales.addProduct(String(product.name), ['DeliveryOrder', 'TransferOrder'].includes(entity));
    await sales.itemNumber(0, entity === 'InventoryAdjustment' ? 'newQuantityOnHand' : 'quantity', 2);
    const id = await sales.save(entity);
    const saved = await salesApi.read(entity, id);
    expect(saved.status).toBe('Draft');
    expect(saved.itemList).toHaveLength(1);
    expect((saved.itemList as { productId: string }[])[0].productId).toBe(product.id);
    await sales.edit();
    await sales.input('description').fill('Updated warehouse draft');
    await sales.save(entity, 'PUT');
    await sales.reload();
    await expect(sales.field('description')).toContainText('Updated warehouse draft');
    await sales.requestDelete();
    await sales.confirmDelete(entity, id);
    expect(await salesApi.isListed(entity, id)).toBe(false);
  });

  test(`${entity}: requires warehouse selection`, async ({ sales }) => {
    await sales.openForm(entity);
    await sales.saveButton.click();
    await expect(sales.fieldError(entity === 'TransferOrder' ? 'fromWarehouse' : 'warehouse')).toHaveClass(/has-error/);
  });
}

test('Inventory Number: create a batch, edit expiration and delete', async ({ sales, salesApi }) => {
  const product = await salesApi.create('Product', { name: unique('batch-product'), isInventory: true, inventoryNumberType: 'Batch' });
  await sales.openForm('InventoryNumber');
  await sales.input('name').fill(unique('batch'));
  await sales.selectLink('product', String(product.name));
  const id = await sales.save('InventoryNumber');
  expect(await salesApi.read('InventoryNumber', id)).toMatchObject({ productId: product.id, type: 'Batch' });
  await sales.edit();
  await sales.date('expirationDate', '2027-12-31', 'MM/DD/YYYY');
  await sales.save('InventoryNumber', 'PUT');
  expect((await salesApi.read('InventoryNumber', id)).expirationDate).toBe('2027-12-31');
  await sales.requestDelete();
  await sales.confirmDelete('InventoryNumber', id);
  expect(await salesApi.isListed('InventoryNumber', id)).toBe(false);
});
for (const field of ['name', 'product']) {
  test(`Inventory Number: ${field} is required`, async ({ sales }) => {
    await sales.openForm('InventoryNumber');
    await sales.saveButton.click();
    await expect(sales.fieldError(field)).toHaveClass(/has-error/);
  });
}
