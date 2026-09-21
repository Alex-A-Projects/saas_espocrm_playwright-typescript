import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { EntitySpec } from '../data/entities';

export class ListPage extends BasePage {
  get heading() { return this.content.getByRole('heading', { level: 3 }); }
  get searchInput() { return this.content.locator('input[data-name="textFilter"]'); }
  get emptyMessage() { return this.content.getByText('No Data', { exact: true }).first(); }
  get actionsButton() { return this.content.getByRole('button', { name: 'Actions', exact: true }); }
  get dialog() { return this.page.getByRole('dialog'); }
  get dataRows() { return this.content.locator('tr[data-id]'); }
  get firstDataRow() { return this.dataRows.first(); }
  get sortableHeaders() { return this.content.locator('th[data-name] a'); }
  get selectAllCheckbox() { return this.content.locator('thead input[type="checkbox"]').first(); }
  row(id: string) { return this.content.locator(`tr[data-id="${id}"]`); }
  recordLink(entity: string, id: string) { return this.content.locator(`a[href="#${entity}/view/${id}"]`).first(); }
  async open(spec: EntitySpec): Promise<void> {
    await this.navigate(spec.entity);
    await expect(this.heading).toContainText(spec.plural);
    await expect(this.searchInput).toBeVisible();
  }
  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.request().method() === 'GET' &&
        [...new URL(r.url()).searchParams.entries()].some(([key, value]) => key.startsWith('whereGroup[') && key.endsWith('[value]') && value === text)),
      this.searchInput.press('Enter'),
    ]);
    expect(response.status()).toBe(200);
  }
  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.searchInput.press('Enter');
  }
  async openFirstRecord(entity: string): Promise<void> {
    const link = this.firstDataRow.locator(`a[href^="#${entity}/view/"]:not([data-action="quickView"])`).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(this.page).toHaveURL(new RegExp(`#${entity}/view/[a-zA-Z0-9]+`));
  }
  async openRecord(entity: string, id: string): Promise<void> { await this.recordLink(entity, id).click(); }
  async select(id: string, checked = true): Promise<void> { await this.row(id).getByRole('checkbox').setChecked(checked); }
  async quickAction(id: string, action: 'quickView' | 'quickEdit' | 'quickRemove'): Promise<void> {
    await this.row(id).locator('button.dropdown-toggle').click();
    await this.row(id).locator(`[data-action="${action}"]`).click();
    await expect(this.dialog).toBeVisible();
  }
  async closeDialog(): Promise<void> { await this.dialog.locator('[data-dismiss="modal"]').first().click(); }
}
