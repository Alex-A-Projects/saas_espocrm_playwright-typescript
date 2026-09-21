import { expect } from '@playwright/test';
import { RecordPage } from './RecordPage';
export class SalesPage extends RecordPage {
  async openForm(entity:string):Promise<void> { await this.navigate(`${entity}/create`); await expect(this.saveButton).toBeVisible(); }
  get items() { return this.content.locator('.field[data-name="itemList"]'); }
  itemInput(index:number,name:string) { return this.items.locator(`input[data-name="${name}"]`).nth(index); }
  async addItem(name:string,quantity:number,price:number,taxCode?:string):Promise<void> {
    const index=await this.items.locator('input[data-name="quantity"]').count();
    await this.content.locator('[data-action="addItem"]').click();
    await this.itemInput(index,'name').fill(name);
    if(taxCode) {
      const row=this.itemInput(index,'quantity').locator('xpath=ancestor::tr');
      await row.locator('[data-role="taxCodeField"] [data-action="selectLink"]').click();
      await this.searchDialog(taxCode);
      await this.dialog.getByRole('row').filter({hasText:taxCode}).getByRole('link').click();
      await expect(this.dialog).toBeHidden();
    }
    for(const [field,value] of [['quantity',quantity],['listPrice',price],['unitPrice',price]] as const) {
      const input=this.itemInput(index,field);
      if(field==='listPrice' && !await input.count()) continue;
      await input.fill(''); await input.pressSequentially(String(value)); await input.press('Tab');
    }
  }
  async tab(name:string):Promise<void> { await this.content.getByRole('button',{name,exact:true}).click(); }
  async itemNumber(index: number, field: string, value: number): Promise<void> {
    const input = this.itemInput(index, field);
    await input.fill('');
    await input.pressSequentially(String(value));
    await input.press('Tab');
  }
  async addProduct(name: string, includeEmptyStock = false): Promise<void> {
    await this.content.locator('[data-action="addItem"]').click();
    const search = this.dialog.locator('input[data-name="textFilter"]');
    await expect(search).toBeVisible();
    if (includeEmptyStock) {
      await this.dialog.locator('.filter[data-name="warehousesOnHand"]').hover();
      await this.dialog.locator('.remove-filter[data-name="warehousesOnHand"]').click();
    }
    await this.searchDialog(name);
    await this.dialog.getByRole('row').filter({ hasText: name }).getByRole('checkbox').check();
    await this.dialog.getByRole('button', { name: 'Select', exact: true }).click();
    await expect(this.dialog).toBeHidden();
  }
  async subscriptionPrice(product: string, value: number): Promise<void> {
    const input = this.content.getByRole('row').filter({ hasText: product }).getByRole('textbox').nth(1);
    await input.fill('');
    await input.pressSequentially(String(value));
    await input.press('Tab');
  }
}
