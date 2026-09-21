import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NavigationPage extends BasePage {
  get navbar() { return this.page.locator('#navbar'); }
  get globalSearch() { return this.page.getByRole('searchbox', { name: 'Search', exact: true }); }
  get dashboardActivities() { return this.content.getByRole('heading', { name: 'My Activities', exact: true }); }
  get stream() { return this.content.getByRole('heading', { name: 'Stream', exact: true }); }
  async home(): Promise<void> { await this.navigate(''); await expect(this.stream).toBeVisible(); }
  async openModule(entity: string): Promise<void> {
    const link = this.navbar.locator(`a[href="#${entity}"]`);
    if (!await link.isVisible()) await this.navbar.locator('li.more > a, li.more > button').click();
    await link.click();
    await expect(this.page).toHaveURL(new RegExp(`#${entity}$`));
    await this.waitForContent();
  }
  async goHome(): Promise<void> { await this.navbar.locator('li[data-name="Home"] a').click(); await expect(this.stream).toBeVisible(); }
}
