import { test, expect } from '../../src/fixtures/demo-test';
import { entities, unique, EntitySpec } from '../../src/data/entities';

// These extra modules are installed on the public demo, not in the core Docker image.
const extensionModules = [
  ['Document', 'Documents'], ['Product', 'Products'], ['Quote', 'Quotes'],
  ['SalesOrder', 'Sales Orders'], ['Invoice', 'Invoices'], ['DeliveryOrder', 'Delivery Orders'],
  ['ReturnOrder', 'Return Orders'], ['CreditNote', 'Credit Notes'], ['Supplier', 'Suppliers'],
  ['PurchaseOrder', 'Purchase Orders'], ['ReceiptOrder', 'Receipt Orders'],
  ['SupplierBill', 'Bills'], ['PaymentEntry', 'Payments'],
  ['Project', 'Projects'], ['ProjectTask', 'Project Tasks'], ['Report', 'Reports'],
].map(([entity, plural]): EntitySpec => ({ entity, plural, nameField: 'name', table: '', defaults: {} }));

test('demo login opens the dashboard and global search @smoke', async ({ navigation }) => {
  await navigation.home();
  await expect(navigation.stream).toBeVisible();
  await expect(navigation.globalSearch).toBeVisible();
});

for (const spec of [...entities, ...extensionModules]) {
  test.describe(`${spec.plural} public demo @demo`, () => {
    test('opens the module with its heading and search control', async ({ listPage }) => {
      await listPage.open(spec);
      await expect(listPage.heading).toContainText(spec.plural);
      await expect(listPage.searchInput).toBeEnabled();
    });
    test('unknown search shows no results and can be cleared', async ({ listPage }) => {
      await listPage.open(spec);
      await listPage.search(unique('demo-no-match'));
      await expect(listPage.emptyMessage).toBeVisible();
      await listPage.clearSearch();
      await expect(listPage.searchInput).toHaveValue('');
    });
  });
}

for (const spec of entities) {
  test(`${spec.plural} demo create form exposes required controls without submitting @demo`, async ({ records }) => {
    await records.openCreate(spec);
    await expect(records.input(spec.nameField)).toBeVisible();
    await expect(records.saveButton).toBeVisible();
    await expect(records.cancelButton).toBeVisible();
    await records.cancel();
    await expect(records.createButton).toBeVisible();
  });
}
