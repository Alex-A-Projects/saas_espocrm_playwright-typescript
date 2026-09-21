import { test, expect } from '../../src/fixtures/demo-test';
import { unique } from '../../src/data/entities';

const sidebarModules = [
  ['Account', 'Accounts'],
  ['Contact', 'Contacts'],
  ['Lead', 'Leads'],
  ['Opportunity', 'Opportunities'],
  ['Email', 'Emails'],
  ['Meeting', 'Meetings'],
  ['Call', 'Calls'],
  ['Task', 'Tasks'],
  ['Case', 'Cases'],
  ['KnowledgeBaseArticle', 'Knowledge Base'],
  ['Document', 'Documents'],
] as const;

for (const [entity, plural] of sidebarModules) {
  test.describe(`${plural} sidebar tab @demo`, () => {
    test('opens through the visible sidebar and loads its content', async ({ navigation, listPage }) => {
      await navigation.home();
      await navigation.openModule(entity);
      await expect(listPage.heading).toContainText(plural);
      await expect(listPage.searchInput).toBeEnabled();
      if (entity === 'KnowledgeBaseArticle') {
        await expect(listPage.content.locator('a[href^="#KnowledgeBaseArticle/list/categoryId="]').first()).toBeVisible();
      } else {
        await expect(listPage.content.locator('table:visible, .list-container:visible, .kanban:visible, .record-list:visible').first()).toBeVisible();
      }
    });

    test('filters to no results and restores records', async ({ navigation, listPage }) => {
      await navigation.home();
      await navigation.openModule(entity);
      await listPage.search(unique(`sidebar-${entity}`));
      await expect(listPage.emptyMessage).toBeVisible();
      await listPage.clearSearch();
      await expect(listPage.searchInput).toHaveValue('');
    });
  });
}

for (const [entity, plural] of sidebarModules.filter(([name]) => !['Opportunity', 'Email', 'KnowledgeBaseArticle'].includes(name))) {
  test.describe(`${plural} record table @demo`, () => {
    test('opens the first listed record and returns to the list', async ({ navigation, listPage, page }) => {
      await navigation.home();
      await navigation.openModule(entity);
      await listPage.openFirstRecord(entity);
      await expect(page.locator('.detail')).toBeVisible();
      await page.goBack();
      await expect(listPage.heading).toContainText(plural);
    });

    test('supports selecting and clearing the visible result set', async ({ navigation, listPage }) => {
      await navigation.home();
      await navigation.openModule(entity);
      await expect(listPage.selectAllCheckbox).toBeVisible();
      await listPage.selectAllCheckbox.check();
      await expect(listPage.selectAllCheckbox).toBeChecked();
      await expect(listPage.actionsButton).toBeEnabled();
      await listPage.selectAllCheckbox.uncheck();
      await expect(listPage.selectAllCheckbox).not.toBeChecked();
    });
  });
}

test.describe('Knowledge Base categories @demo', () => {
  test.beforeEach(async ({ navigation }) => {
    await navigation.home();
    await navigation.openModule('KnowledgeBaseArticle');
  });

  test('shows every configured category', async ({ page }) => {
    for (const category of ['User Guide', 'Administration', 'Extensions']) {
      await expect(page.locator('#content').getByRole('link', { name: new RegExp(category) }).first()).toBeVisible();
    }
  });

  test('opens a category and displays its article results', async ({ page }) => {
    await page.locator('#content a[href^="#KnowledgeBaseArticle/list/categoryId="]').first().click();
    await expect(page).toHaveURL(/#KnowledgeBaseArticle\/list\/categoryId=/);
    await expect(page.locator('#content table:visible, #content .list-container:visible').first()).toBeVisible();
  });
});

test.describe('Opportunities board @demo', () => {
  test.beforeEach(async ({ navigation }) => {
    await navigation.home();
    await navigation.openModule('Opportunity');
  });

  test('renders every sales-stage column', async ({ page }) => {
    for (const stage of ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won']) {
      await expect(page.getByRole('columnheader', { name: stage, exact: true })).toBeVisible();
    }
  });

  test('opens an opportunity from its board card', async ({ page }) => {
    const link = page.locator('#content a[href^="#Opportunity/view/"]:not([data-action="quickView"])').first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/#Opportunity\/view\/[a-zA-Z0-9]+/);
    await expect(page.locator('.detail')).toBeVisible();
  });
});

test.describe('Email folders @demo', () => {
  test.beforeEach(async ({ navigation }) => {
    await navigation.home();
    await navigation.openModule('Email');
  });

  for (const folder of ['All', 'Inbox', 'Important', 'Sent', 'Archive', 'Drafts', 'Trash']) {
    test(`${folder} folder opens`, async ({ page }) => {
      await page.locator('#content').getByRole('link', { name: new RegExp(`${folder}$`) }).last().click();
      await expect(page).toHaveURL(folder === 'Inbox' ? /#Email$/ : /#Email\/list\/folder=/);
      await expect(page.getByRole('heading', { name: 'Emails', exact: true })).toBeVisible();
    });
  }
});

test.describe('Calendar sidebar tab @demo', () => {
  test.beforeEach(async ({ navigation }) => {
    await navigation.home();
    await navigation.openModule('Calendar');
  });

  test('opens the full Calendar from the sidebar', async ({ page }) => {
    await expect(page).toHaveURL(/#Calendar$/);
    await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible();
    await expect(page.locator('[data-date]').first()).toBeVisible();
  });

  test('moves to the next and previous date ranges', async ({ page }) => {
    const dates = page.locator('#content [data-date]');
    const initial = await dates.first().getAttribute('data-date');
    await page.locator('#content [data-action="next"]').click();
    await expect.poll(() => dates.first().getAttribute('data-date')).not.toBe(initial);
    await page.locator('#content [data-action="prev"]').click();
    await expect.poll(() => dates.first().getAttribute('data-date')).toBe(initial);
  });

  test('switches among month, week, day, and agenda views', async ({ page }) => {
    for (const action of ['month', 'agendaWeek', 'agendaDay', 'list']) {
      const control = page.locator(`#content [data-action="${action}"]`);
      if (await control.count()) {
        await control.click();
        await expect(control).toHaveClass(/active/);
      }
    }
  });

  test('Today control remains available after paging', async ({ page }) => {
    await page.locator('#content [data-action="next"]').click();
    const today = page.locator('#content [data-action="today"]');
    await expect(today).toBeVisible();
    await today.click();
    await expect(today).toHaveClass(/active/);
  });
});

test.describe('Sidebar creation entry points @demo', () => {
  for (const [entity, plural] of sidebarModules.filter(([name]) => name !== 'Email')) {
    test(`${plural} Create opens a form and Cancel returns to its list`, async ({ navigation, records, page }) => {
      await navigation.home();
      await navigation.openModule(entity);
      await records.createButton.click();
      const quickCreate = page.getByRole('dialog');
      await expect(quickCreate.or(records.saveButton)).toBeVisible();
      if (await quickCreate.isVisible()) {
        await expect(quickCreate.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
        await quickCreate.getByRole('button', { name: 'Cancel', exact: true }).click();
      } else {
        await expect(records.saveButton).toBeVisible();
        await records.cancel();
      }
      await expect(records.createButton).toBeVisible();
    });
  }

  test('Emails Compose opens and closes without sending', async ({ navigation, page }) => {
    await navigation.home();
    await navigation.openModule('Email');
    await page.getByRole('button', { name: 'Compose', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Send/i).first()).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).toBeHidden();
  });
});

test('Sales & Purchases expands and exposes every configured child link @demo', async ({ navigation, page }) => {
  await navigation.home();
  const group = navigation.navbar.getByRole('button', { name: /^S\s/ });
  await group.click();
  for (const entity of ['Product', 'Quote', 'SalesOrder', 'Invoice', 'DeliveryOrder', 'ReturnOrder', 'CreditNote', 'Supplier', 'PurchaseOrder', 'ReceiptOrder', 'SupplierBill', 'PaymentEntry']) {
    await expect(navigation.navbar.locator(`a[href="#${entity}"]`)).toBeVisible();
  }
  await expect(page).toHaveURL(/\/#$/);
});
