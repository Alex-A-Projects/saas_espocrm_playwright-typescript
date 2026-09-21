import { EntitySpec } from './entities';
export const salesSpec = (entity: string): EntitySpec => ({
  entity, plural: entity, table: '', nameField: 'name', defaults: {},
});
export const salesDocuments = ['Quote', 'SalesOrder', 'Invoice', 'CreditNote', 'ReturnOrder', 'PurchaseOrder', 'SupplierBill', 'SupplierCredit'];
