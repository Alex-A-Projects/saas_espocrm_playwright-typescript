import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '../config/env';
export class LoginPage extends BasePage {
  get username() { return this.page.locator('input[name="username"]'); }
  get password() { return this.page.locator('input[name="password"]'); }
  get submit() { return this.page.getByRole('button', { name: /^Log in$/i }); }
  async open(): Promise<void> { await this.page.goto('/'); await expect(this.username).toBeVisible(); }
  async signIn(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }
  async login(): Promise<void> {
    await this.open();
    await this.signIn(env.username, env.password);
    await expect(this.username).toBeHidden();
    await this.waitForContent();
  }
}
