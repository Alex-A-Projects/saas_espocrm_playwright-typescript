import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HeaderPage extends BasePage {
  get navbar(): Locator { return this.page.locator('#navbar'); }
  get searchInput(): Locator { return this.navbar.getByRole('searchbox', { name: 'Search', exact: true }); }
  get searchButton(): Locator { return this.navbar.locator('[title="Search"]'); }
  get lastViewedButton(): Locator { return this.navbar.locator('[title="Last Viewed"]'); }
  get createButton(): Locator { return this.navbar.locator('[title="Create"]'); }
  get notificationsButton(): Locator { return this.navbar.locator('[title="Notifications"]'); }
  get menuButton(): Locator { return this.navbar.locator('[title="Menu"]'); }
  get lastViewedPanel(): Locator { return this.page.locator('#last-viewed-panel:visible'); }
  get notificationsPanel(): Locator { return this.page.locator('#notifications-panel:visible'); }
  get visibleDropdown(): Locator { return this.navbar.locator('.dropdown-menu:visible'); }
  get dialog(): Locator { return this.page.getByRole('dialog'); }

  async openLastViewed(): Promise<void> {
    await this.lastViewedButton.click();
    await expect(this.lastViewedPanel).toBeVisible();
  }

  async openCreate(): Promise<void> {
    await this.createButton.click();
    await expect(this.visibleDropdown).toBeVisible();
  }

  async openNotifications(): Promise<void> {
    await this.notificationsButton.click();
    await expect(this.notificationsPanel).toBeVisible();
  }

  async openMenu(): Promise<void> {
    await this.menuButton.click();
    await expect(this.visibleDropdown).toBeVisible();
  }
}
