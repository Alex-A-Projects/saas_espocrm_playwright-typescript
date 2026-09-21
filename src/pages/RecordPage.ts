import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { EntitySpec } from '../data/entities';
import { RecordData } from '../api/EspoClient';
import { env } from '../config/env';

export class RecordPage extends BasePage {
  constructor(page: Page, protected readonly onCreate?: (entity: string, id: string) => void) { super(page); }
  async number(name: string, value: number): Promise<void> {
    const input = this.input(name);
    await input.fill('');
    await input.pressSequentially(String(value));
    await input.press('Tab');
  }
  async date(name: string, iso: string, format = env.dateFormat): Promise<void> {
    const [year, month, day] = iso.split('-');
    await this.input(name).fill('');
    await this.input(name).pressSequentially(format.replace('YYYY',year).replace('MM',month).replace('DD',day));
    await this.input(name).press('Tab');
  }
  async dateTimeDate(name: string, iso: string): Promise<void> {
    const [year, month, day] = iso.split('-');
    const formatted = env.dateFormat.replace('YYYY', year).replace('MM', month).replace('DD', day);
    await this.field(name).locator('button.date-picker-btn').click();
    await this.page.locator(`.datepicker-dropdown:visible td.day[data-date="${Date.parse(`${iso}T00:00:00Z`)}"]`).click();
    await expect(this.input(name)).toHaveValue(formatted);
  }
  field(name: string) { return this.content.locator(`.field[data-name="${name}"]`); }
  input(name: string) { return this.content.locator(`input[data-name="${name}"], textarea[data-name="${name}"]`).first(); }
  get heading() { return this.content.getByRole('heading', { level: 3 }); }
  get dialog() { return this.page.getByRole('dialog'); }
  get errors() { return this.content.locator('.has-error'); }
  get bodyEditor() { return this.field('body').locator('[contenteditable="true"]'); }
  get emailInput() { return this.field('emailAddress').locator('input[type="email"]').first(); }
  enumControl(name: string) { return this.field(name).locator('.selectize-input'); }
  fieldError(name: string) { return this.content.locator(`.cell[data-name="${name}"]`); }
  async selectEnum(name: string, value: string): Promise<void> {
    await this.enumControl(name).click();
    await this.field(name).locator('.selectize-dropdown [data-selectable]').getByText(value, { exact: true }).click();
  }
  async action(name: string): Promise<void> {
    const action = this.content.locator(`a.detail-action-item[data-action="${name}"]`);
    if (!await action.isVisible()) await this.content.locator('.dropdown-item-list-button').first().click();
    await action.click();
  }
  async duplicate(spec: EntitySpec): Promise<void> {
    await this.action('duplicate');
    await expect(this.input(spec.nameField)).toBeVisible();
  }
  async requestDelete(): Promise<void> {
    await this.action('delete');
    await expect(this.dialog).toBeVisible();
  }
  async confirmDelete(entity: string, id: string): Promise<void> {
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.request().method() === 'DELETE' && new URL(r.url()).pathname.endsWith(`/api/v1/${entity}/${id}`)),
      this.dialog.getByRole('button', { name: 'Remove', exact: true }).click(),
    ]);
    expect(response.status()).toBe(200);
    await expect(this.dialog).toBeHidden();
    await expect(this.createButton).toBeVisible();
  }
  async dismissDialog(): Promise<void> { await this.dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); }
  async backToList(): Promise<void> { await this.content.locator('[data-action="navigateToRoot"]').click(); }
  async reload(): Promise<void> { await this.page.reload(); await expect(this.editButton).toBeVisible(); }
  async cancel(): Promise<void> { await this.cancelButton.click(); }
  async saveWithAction(entity: string, action: 'saveAndNew' | 'saveAndContinueEditing'): Promise<string> {
    const [result] = await Promise.all([
      this.page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith(`/api/v1/${entity}`)),
      this.action(action),
    ]);
    expect(result.status(), await result.text()).toBe(200);
    const { id } = await result.json();
    this.onCreate?.(entity, id);
    await expect(this.saveButton).toBeVisible();
    return id;
  }
  async selectLink(name: string, recordName: string): Promise<void> {
    await this.field(name).locator('[data-action="selectLink"]').click();
    await this.searchDialog(recordName);
    await this.dialog.getByRole('link', { name: recordName, exact: true }).click();
    await expect(this.dialog).toBeHidden();
  }
  async searchDialog(text: string): Promise<void> {
    const search = this.dialog.locator('input[data-name="textFilter"]');
    await search.fill(text);
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.request().method() === 'GET' &&
        [...new URL(r.url()).searchParams.entries()].some(([key, value]) => key.endsWith('[value]') && value === text)),
      search.press('Enter'),
    ]);
    expect(response.status()).toBe(200);
    const result = await response.json();
    await expect(this.dialog.locator('tr[data-id]')).toHaveCount(result.list.length);
  }
  async clearLink(name: string): Promise<void> { await this.field(name).locator('[data-action="clearLink"]').click(); }
  get saveButton() { return this.content.getByRole('button', { name: 'Save', exact: true }).first(); }
  get editButton() { return this.content.getByRole('button', { name: 'Edit', exact: true }).first(); }
  get cancelButton() { return this.content.getByRole('button', { name: 'Cancel', exact: true }).first(); }
  get createButton() {
    return this.content.getByRole('button', { name: /\bCreate\b/ })
      .or(this.content.getByRole('link', { name: /\bCreate\b/ })).first();
  }
  async openList(spec: EntitySpec): Promise<void> {
    await this.navigate(spec.entity);
    await expect(this.createButton).toBeVisible();
  }
  async openCreate(spec: EntitySpec): Promise<void> {
    await this.navigate(`${spec.entity}/create`);
    await expect(this.input(spec.nameField)).toBeVisible();
  }
  async startCreateFromList(spec: EntitySpec): Promise<void> {
    await this.createButton.click();
    // The category-based Target List view opens quick-create before the full form.
    if (spec.entity === 'TargetList') {
      await this.page.getByRole('dialog').getByRole('button', { name: 'Full Form', exact: true }).click();
    }
    await expect(this.input(spec.nameField)).toBeVisible();
  }
  async openDetail(spec: EntitySpec, id: string): Promise<void> {
    await this.navigate(`${spec.entity}/view/${id}`);
    await expect(this.editButton).toBeVisible();
  }
  async fill(spec: EntitySpec, data: RecordData): Promise<void> {
    for (const name of [spec.nameField, 'firstName', 'description', 'website']) {
      if (data[name] !== undefined) await this.input(name).fill(String(data[name]));
    }
    if (data.emailAddress !== undefined) await this.emailInput.fill(String(data.emailAddress));
    // EspoCRM's numeric mask handles keyboard events; fill() alone is cleared on blur.
    if (data.amount !== undefined) {
      await this.input('amount').pressSequentially(String(data.amount));
      await this.input('amount').press('Tab');
      await expect(this.input('amount')).not.toHaveValue('');
    }
    if (data.closeDate) {
      const [year, month, day] = String(data.closeDate).split('-');
      await this.input('closeDate').pressSequentially(env.dateFormat.replace('YYYY', year).replace('MM', month).replace('DD', day));
      await this.input('closeDate').press('Tab');
      await expect(this.input('closeDate')).not.toHaveValue('');
    }
  }
  async save(entity: string, method: 'POST' | 'PUT' = 'POST'): Promise<string> {
    const [response] = await Promise.all([this.page.waitForResponse(response =>
      response.request().method() === method && new URL(response.url()).pathname.match(new RegExp(`/api/v1/${entity}(?:/[^/]+)?$`)) !== null,
    ), this.saveButton.click()]);
    expect(response.status(), await response.text()).toBe(200);
    const { id } = await response.json();
    if (method === 'POST') this.onCreate?.(entity, id);
    await expect(this.editButton).toBeVisible();
    return id;
  }
  async create(spec: EntitySpec, data: RecordData): Promise<string> {
    await this.openCreate(spec);
    await this.fill(spec, data);
    return this.save(spec.entity);
  }
  async edit(): Promise<void> { await this.editButton.click(); await expect(this.saveButton).toBeVisible(); }
  async search(text: string): Promise<void> {
    const input = this.content.locator('input[data-name="textFilter"]');
    await input.fill(text);
    await input.press('Enter');
  }
}
