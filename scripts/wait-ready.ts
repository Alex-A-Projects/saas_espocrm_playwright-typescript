import { setTimeout } from 'node:timers/promises';
import { env } from '../src/config/env';
import { EspoClient } from '../src/api/EspoClient';
import { Database } from '../src/db/Database';

async function main() {
  const api = await EspoClient.connect();
  try {
    const deadline = Date.now() + 180_000;
    let lastError = '';
    while (Date.now() < deadline) {
      try {
        const response = await api.context.get('App/user', { timeout: 5000 });
        if (response.ok()) {
          const db = new Database();
          try { await db.query('SELECT 1'); } finally { await db.close(); }
          console.log(`EspoCRM is ready at ${env.baseURL}; API authentication and MariaDB access verified.`);
          return;
        }
        lastError = `API returned ${response.status()}`;
      } catch (error) { lastError = String(error); }
      await setTimeout(2000);
    }
    throw new Error(`Local stack did not become ready: ${lastError}`);
  } finally { await api.dispose(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
