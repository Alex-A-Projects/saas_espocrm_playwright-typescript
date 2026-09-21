import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** The public demo authenticates a predefined user without local credentials. */
export class DemoLoginPage extends BasePage {
  async login(): Promise<void> {
    await this.page.goto('/?l=en_US');
    await this.page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(this.content).toBeVisible();
    await expect(this.page.getByRole('searchbox', { name: 'Search', exact: true })).toBeVisible();
  }
}
