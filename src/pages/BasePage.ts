import { Page, Locator, expect } from '@playwright/test';
export class BasePage {
  constructor(readonly page: Page) {}
  get content(): Locator { return this.page.locator('#content'); }
  async navigate(route: string): Promise<void> { await this.page.goto(`/#${route}`); }
  async waitForContent(): Promise<void> { await expect(this.content).toBeVisible(); }
}
