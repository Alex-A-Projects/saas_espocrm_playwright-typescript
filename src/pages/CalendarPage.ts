import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CalendarPage extends BasePage {
  get title() { return this.content.getByRole('heading', { level: 4 }); }
  get grid() { return this.content.getByRole('grid'); }
  get timeline() { return this.content.locator('.vis-timeline'); }
  get dialog() { return this.page.getByRole('dialog'); }
  event(name:string) { return this.content.locator('.fc-event').filter({hasText:name}).first(); }
  async openEvent(name:string):Promise<void> { await this.event(name).click(); await expect(this.dialog).toBeVisible(); }
  async closeEvent():Promise<void> { await this.dialog.locator('[data-dismiss="modal"]').first().click(); }
  modeButton(mode: 'Month' | 'Week' | 'Timeline') { return this.content.getByRole('button', { name: mode, exact: true }); }
  async open(): Promise<void> { await this.navigate('Calendar'); await expect(this.modeButton('Month')).toBeVisible(); await expect(this.title).toBeVisible(); }
  async mode(mode: 'Month' | 'Week' | 'Timeline'): Promise<void> { await this.modeButton(mode).click(); await expect(this.modeButton(mode)).toHaveClass(/active/); }
  async move(direction: 'prev' | 'next' | 'today'): Promise<void> { await this.content.locator(`button[data-action="${direction}"]`).click(); }
}
