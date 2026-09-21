import { expect } from '@playwright/test';
import { RecordPage } from './RecordPage';
import { EntitySpec } from '../data/entities';
export const documentSpec: EntitySpec = { entity:'Document', plural:'Documents', table:'document', nameField:'name', defaults:{} };

export class DocumentPage extends RecordPage {
  async upload(name: string, contents: string, mimeType = 'text/plain'): Promise<string> {
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.request().method() === 'POST' && new URL(r.url()).pathname.endsWith('/api/v1/Attachment')),
      this.field('file').locator('input[type="file"]').setInputFiles({ name, mimeType, buffer:Buffer.from(contents) }),
    ]);
    expect(response.status()).toBe(200);
    const {id} = await response.json();
    this.onCreate?.('Attachment',id);
    await expect(this.field('file')).toContainText(name);
    return id;
  }
  async createDocument(name: string, filename = 'qa-document.txt', contents = 'Document contents for QA verification.'): Promise<string> {
    await this.openCreate(documentSpec);
    await this.upload(filename,contents);
    await this.input('name').fill(name);
    return this.save('Document');
  }
  async download(): Promise<Buffer> {
    const link = this.field('file').getByRole('link').first();
    if (!(await link.innerText()).endsWith('.csv')) {
      const [preview] = await Promise.all([this.page.waitForEvent('popup'), link.click()]);
      await preview.waitForLoadState();
      const contents = await preview.locator('body').innerText();
      await preview.close();
      return Buffer.from(contents);
    }
    const [download] = await Promise.all([this.page.waitForEvent('download'), link.click()]);
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }
}
