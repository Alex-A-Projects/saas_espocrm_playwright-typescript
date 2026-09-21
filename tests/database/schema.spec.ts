import { test, expect } from '../../src/fixtures/test';
import { entities } from '../../src/data/entities';
import { env } from '../../src/config/env';

test('connects to MariaDB with a dedicated SELECT-only account @smoke', async ({ db }) => {
  const [server] = await db.query('SELECT VERSION() AS version, CURRENT_USER() AS user');
  expect(server.version).toContain('MariaDB');
  expect(server.user).toBe(`${env.db.user}@%`);
  const grants = (await db.query('SHOW GRANTS')).map(row => Object.values(row).join(' ')).join('\n');
  expect(grants).toContain('GRANT SELECT ON');
  expect(grants).not.toMatch(/ALL PRIVILEGES|\bINSERT\b|\bUPDATE\b|\bDELETE\b|GRANT OPTION/);
});
for (const spec of entities) {
  test(`${spec.table} uses InnoDB and utf8mb4 text columns`, async ({ db }) => {
    const [table] = await db.query('SELECT ENGINE, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [env.db.database, spec.table]);
    expect(table.ENGINE).toBe('InnoDB');
    // EspoCRM keeps utf8mb3 as some table defaults but uses utf8mb4 for user text.
    const columns = await db.query('SELECT COLUMN_NAME, COLLATION_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?, ?)', [env.db.database, spec.table, spec.nameField === 'lastName' ? 'last_name' : 'name', 'description']);
    expect(columns).toHaveLength(2);
    for (const column of columns) expect(column.COLLATION_NAME).toMatch(/^utf8mb4_/);
  });
  test(`${spec.table} has a unique primary ID and soft-delete column`, async ({ db }) => {
    const columns = await db.query('SELECT COLUMN_NAME, COLUMN_KEY, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [env.db.database, spec.table]);
    expect(columns).toEqual(expect.arrayContaining([
      expect.objectContaining({ COLUMN_NAME: 'id', COLUMN_KEY: 'PRI', IS_NULLABLE: 'NO' }),
      expect.objectContaining({ COLUMN_NAME: 'deleted' }),
      expect.objectContaining({ COLUMN_NAME: 'created_at' }),
      expect.objectContaining({ COLUMN_NAME: 'modified_at' }),
    ]));
  });
}
