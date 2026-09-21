import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';

if (existsSync('.env')) {
  console.log('.env already exists; existing credentials preserved.');
} else {
  const secret = () => randomBytes(18).toString('hex');
  writeFileSync('.env', [
    'BASE_URL=http://localhost:8080',
    'ESPOCRM_ADMIN_USERNAME=admin',
    `ESPOCRM_ADMIN_PASSWORD=${secret()}`,
    'ESPOCRM_DATE_FORMAT=DD.MM.YYYY',
    'DB_HOST=127.0.0.1', 'DB_PORT=3307', 'DB_NAME=espocrm', 'DB_USER=espocrm',
    `DB_PASSWORD=${secret()}`, `DB_ROOT_PASSWORD=${secret()}`,
    'DB_READ_USER=espocrm_test', `DB_READ_PASSWORD=${secret()}`,
    'HTTP_PORT=8080', 'WORKERS=2', '',
  ].join('\n'), { mode: 0o600, flag: 'wx' });
  console.log('Created .env with random local credentials.');
}
