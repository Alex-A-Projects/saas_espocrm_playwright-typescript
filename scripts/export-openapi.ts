import { mkdir, writeFile } from 'node:fs/promises';
import { EspoClient } from '../src/api/EspoClient';

async function main() {
  const api = await EspoClient.connect();
  try {
    const document = await api.json(await api.context.get('OpenApi'));
    await mkdir('artifacts', { recursive: true });
    await writeFile('artifacts/openapi.json', JSON.stringify(document, null, 2));
    console.log('Exported artifacts/openapi.json');
  } finally { await api.dispose(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
