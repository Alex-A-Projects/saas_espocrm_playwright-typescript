import { test, expect } from '../../src/fixtures/sales-test';
import { unique } from '../../src/data/entities';

for (const entity of ['PaymentEntry', 'PaymentRequest']) {
  test(`${entity}: creates, edits and deletes a draft with an owned method`, async ({ sales, salesApi }) => {
    const method = await salesApi.create('PaymentMethod', { name: unique('method') });
    await sales.openForm(entity);
    await sales.selectLink('method', String(method.name));
    await sales.number('amount', 25.50);
    await sales.input('description').fill(unique('payment'));
    const id = await sales.save(entity);
    const saved = await salesApi.read(entity, id);
    expect(saved).toMatchObject({ status: 'Draft', methodId: method.id });
    expect(Number(saved.amount)).toBe(25.50);
    await sales.edit();
    await sales.number('amount', 42.75);
    await sales.save(entity, 'PUT');
    await sales.reload();
    expect(Number((await salesApi.read(entity, id)).amount)).toBe(42.75);
    await sales.requestDelete();
    await sales.confirmDelete(entity, id);
    expect(await salesApi.isListed(entity, id)).toBe(false);
  });
  for (const field of ['method', 'amount']) {
    test(`${entity}: validates required ${field}`, async ({ sales }) => {
      await sales.openForm(entity);
      await sales.saveButton.click();
      await expect(sales.fieldError(field)).toHaveClass(/has-error/);
    });
  }
}
