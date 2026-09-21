import { expect, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export const dashboardWidgets = {
  Homepage: ['Stream', 'Calendar', 'My Activities', 'My Cases'],
  Sales: ['Revenue by month', 'Opportunities by Lead Source', 'My Opportunities', 'My Leads'],
  Analytics: ['Opportunities by user', 'Sales Pipeline', 'Opportunities by Stage', 'Opportunities by Lead Source'],
  'Sales Manager': [
    "Calls today's", 'Leads converted', 'Revenue by month and user', 'My Opportunities',
    'Emails Sent in Last 7 Days', 'Calendar', 'Opportunities by Stage', 'My Leads',
  ],
  'Call Center': ['My Calls', "Calls today's", 'Calls by status', 'Calls by month', 'Stream', 'Calls by account and user'],
  Projects: ['Projects', 'My Work Tasks', 'My Triage Tasks'],
} as const;

export type DashboardName = keyof typeof dashboardWidgets;

export class DashboardPage extends BasePage {
  get tabBar(): Locator { return this.content.locator('button[data-action="selectTab"]').first().locator('xpath=..'); }
  tab(name: DashboardName): Locator {
    return this.tabBar.getByRole('button', { name, exact: true });
  }
  widget(name: string): Locator {
    // Some Sales Pack dashlets expose an incomplete accessibility name because
    // their title includes a colored legend marker. The h4 text is stable.
    return this.content.locator('h4:visible').filter({ hasText: name }).first();
  }
  get menuButton(): Locator { return this.content.locator('.dashboard-buttons button.dropdown-toggle'); }
  get visibleMenu(): Locator { return this.content.locator('.dropdown-menu:visible').first(); }
  get dialog(): Locator { return this.page.locator('.modal-dialog:visible'); }

  panel(name: string): Locator {
    return this.widget(name).locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " panel ")][1]');
  }

  recordLink(widget: string, entity: string): Locator {
    return this.panel(widget).locator(`a[href^="#${entity}/view/"]:not([data-action="quickView"])`).first();
  }

  chart(widget: string): Locator {
    return this.panel(widget).locator('canvas.flotr-overlay, svg').first();
  }

  async openOverflow(): Promise<void> {
    await this.menuButton.click();
    await expect(this.visibleMenu).toBeVisible();
  }

  async chooseOverflow(command: 'Edit Dashboard' | 'Add Dashlet'): Promise<void> {
    await this.openOverflow();
    await this.visibleMenu.getByText(command, { exact: true }).click();
    await expect(this.dialog).toBeVisible();
  }

  async openWidgetMenu(widget: string): Promise<Locator> {
    const panel = this.panel(widget);
    await panel.locator('button.menu-button').click();
    const menu = panel.locator('.dropdown-menu:visible');
    await expect(menu).toBeVisible();
    return menu;
  }

  async open(): Promise<void> {
    await this.navigate('');
    await expect(this.tab('Homepage')).toBeVisible();
  }

  async select(name: DashboardName): Promise<void> {
    await this.tab(name).click();
    await expect(this.tab(name)).toHaveClass(/\bactive\b/);
    await expect(this.widget(dashboardWidgets[name][0])).toBeVisible();
  }

  async expectWidgets(name: DashboardName): Promise<void> {
    for (const widget of dashboardWidgets[name]) await expect(this.widget(widget)).toBeVisible();
  }
}
