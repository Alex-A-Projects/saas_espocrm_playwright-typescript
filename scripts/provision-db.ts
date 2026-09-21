import { spawnSync } from 'node:child_process';
import { env, assertLocalDatabase } from '../src/config/env';

assertLocalDatabase();
const { user, database, password } = env.db;
if (![user, database].every(v => /^[a-zA-Z0-9_]+$/.test(v)) || !/^[a-zA-Z0-9_-]+$/.test(password)) {
  throw new Error('Use alphanumeric database identifiers and a hex/alphanumeric read-only password.');
}
const sql = `CREATE USER IF NOT EXISTS '${user}'@'%' IDENTIFIED BY '${password}';
ALTER USER '${user}'@'%' IDENTIFIED BY '${password}';
GRANT SELECT ON \`${database}\`.* TO '${user}'@'%';\n`;
const result = spawnSync('docker', ['compose', 'exec', '-T', 'mariadb', 'sh', '-c',
  'MYSQL_PWD="$MARIADB_ROOT_PASSWORD" exec mariadb -uroot'], { input: sql, encoding: 'utf8' });
if (result.status !== 0) throw new Error(result.stderr || String(result.error));
console.log('Provisioned dedicated SELECT-only test user.');
