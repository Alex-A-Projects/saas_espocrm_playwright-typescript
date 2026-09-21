import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class EmailPage extends BasePage {
  constructor(page:Page, private readonly track:(entity:string,id:string)=>void) { super(page); }
  get dialog() { return this.page.getByRole('dialog'); }
  get subject() { return this.dialog.locator('input[data-name="subject"]'); }
  get body() { return this.dialog.locator('.field[data-name="body"] [contenteditable="true"]'); }
  recipient(name: 'to'|'cc'|'bcc') { return this.dialog.locator(`.field[data-name="${name}"] input[type="email"]`); }
  get sendButton() { return this.dialog.getByRole('button',{name:'Send',exact:true}); }
  get errors() { return this.dialog.locator('.has-error'); }
  get composeButton() { return this.content.getByRole('button',{name:'Compose',exact:true}); }
  async open(): Promise<void> { await this.navigate('Email'); await expect(this.composeButton).toBeVisible(); }
  async compose(): Promise<void> { await this.open(); await this.composeButton.click(); await expect(this.subject).toBeVisible(); }
  async fill(subject:string, body:string, to = 'recipient@example.test'): Promise<void> {
    await this.subject.fill(subject);
    await this.body.fill(body);
    await this.addRecipient('to',to);
  }
  async addRecipient(field:'to'|'cc'|'bcc', address:string):Promise<void> {
    await this.recipient(field).fill(address);
    await this.recipient(field).press('Enter');
  }
  async cancel(): Promise<void> { await this.dialog.getByRole('button',{name:'Cancel',exact:true}).click(); }
  async saveDraft(): Promise<string> { return this.submit('Save Draft'); }
  async send(): Promise<string> { return this.submit('Send'); }
  private async submit(button:string): Promise<string> {
    const [response] = await Promise.all([
      this.page.waitForResponse(r => ['POST','PUT'].includes(r.request().method()) && /\/api\/v1\/Email(?:\/[^/]+)?$/.test(new URL(r.url()).pathname)),
      this.dialog.getByRole('button',{name:button,exact:true}).click(),
    ]);
    const {id} = await response.json();
    if(id) this.track('Email',id);
    expect(response.status(),await response.text()).toBe(200);
    if(button==='Save Draft') await this.dialog.locator('[data-dismiss="modal"]').first().click();
    await expect(this.dialog).toBeHidden();
    return id;
  }
  async folder(name:'all'|'inbox'|'important'|'sent'|'archive'|'drafts'|'trash'):Promise<void> {
    await this.open();
    await this.content.locator(`a[href="#Email/list/folder=${name}"]`).last().click();
    await expect(this.page).toHaveURL(name === 'inbox' ? /#Email$/ : new RegExp(`folder=${name}$`));
  }
  link(id:string) { return this.content.locator(`a[href="#Email/view/${id}"]`).first(); }
  async openMessage(id:string):Promise<void> {
    await this.navigate(`Email/view/${id}`);
    await expect(this.content.locator('.field[data-name="subject"]')).toBeVisible();
    await expect(this.content.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
  }
  async attach(name: string, contents: string): Promise<string> {
    const field = this.dialog.locator('.field[data-name="attachments"]');
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/api/v1/Attachment')),
      field.locator('input[type="file"]').setInputFiles({ name, mimeType: 'text/plain', buffer: Buffer.from(contents) }),
    ]);
    expect(response.status()).toBe(200);
    const { id } = await response.json();
    this.track('Attachment', id);
    await expect(field).toContainText(name);
    return id;
  }
  async confirmDelete(id: string): Promise<void> {
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.request().method() === 'DELETE' && r.url().endsWith(`/Email/${id}`)),
      this.dialog.getByRole('button', { name: 'Remove', exact: true }).click(),
    ]);
    expect(response.status()).toBe(200);
    await expect(this.composeButton).toBeVisible();
  }
}
