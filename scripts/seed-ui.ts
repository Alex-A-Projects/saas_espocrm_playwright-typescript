import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { env, assertWriteTarget } from '../src/config/env';
import { LoginPage } from '../src/pages/LoginPage';
import { RecordPage } from '../src/pages/RecordPage';
import { specFor, unique } from '../src/data/entities';
import { EspoClient, RecordData } from '../src/api/EspoClient';
import { Database } from '../src/db/Database';

async function main() {
  assertWriteTarget();
  const browser = await chromium.launch({ headless: process.env.HEADED !== 'true' });
  const context = await browser.newContext({ baseURL: env.baseURL, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const api = await EspoClient.connect();
  const db = new Database();
  const created: { entity: string; id: string; name: string; url: string }[] = existsSync('artifacts/seed/records.json')
    ? JSON.parse(await readFile('artifacts/seed/records.json', 'utf8')) : [];
  await mkdir('artifacts/seed', { recursive: true });
  try {
    await new LoginPage(page).login();
    const records = new RecordPage(page);
    for (const entity of ['Account', 'Contact', 'Lead', 'Opportunity', 'Case', 'Task', 'Meeting', 'Call', 'Campaign', 'TargetList']) {
      const existing = created.find(r => r.entity === entity && r.url.startsWith(`${env.baseURL}/`));
      if (existing) {
        const response = await api.context.get(`${entity}/${existing.id}`);
        if (response.ok() && !(await response.json()).deleted) {
          console.log(`Kept existing sample ${entity}: ${existing.name}`);
          continue;
        }
        created.splice(created.indexOf(existing), 1);
      }
      const spec = specFor(entity);
      const name = unique(`Sample-${entity}`);
      const data: RecordData = { [spec.nameField]: name, description: 'Sample record created through the EspoCRM UI by Playwright.' };
      if (spec.nameField === 'lastName') data.firstName = 'Taylor';
      if (entity === 'Opportunity') Object.assign(data, { amount: 25000, closeDate: '2027-12-31' });
      const id = await records.create(spec, data);
      // Persist the manifest immediately: these sample records deliberately survive this script.
      created.push({ entity, id, name, url: `${env.baseURL}/#${entity}/view/${id}` });
      await writeFile('artifacts/seed/records.json', JSON.stringify(created, null, 2));
      expect((await api.read(entity, id))[spec.nameField]).toBe(name);
      expect((await db.record(spec.table, id))!.deleted).toBe(0);
      await page.screenshot({ path: `artifacts/seed/${entity}.png`, fullPage: true });
      console.log(`Created and verified ${entity}: ${name}`);
    }
    console.log('Saved UI screenshots and record links in artifacts/seed/. Sample records remain available in EspoCRM.');
  } finally {
    await api.dispose();
    await db.close();
    await context.close();
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
