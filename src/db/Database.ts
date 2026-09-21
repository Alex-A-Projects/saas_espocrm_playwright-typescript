import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import { assertLocalDatabase, env } from '../config/env';
import { entities } from '../data/entities';

export class Database {
  private readonly pool: Pool;
  constructor() {
    assertLocalDatabase();
    this.pool = mysql.createPool({ ...env.db, connectionLimit: 2, timezone: 'Z', dateStrings: true });
  }
  async query<T extends RowDataPacket = RowDataPacket>(sql: string, values: (string | number | boolean | null)[] = []): Promise<T[]> {
    if (!/^\s*(SELECT|SHOW)\b/i.test(sql)) throw new Error('Database helper accepts read-only SQL.');
    const [rows] = await this.pool.execute<T[]>(sql, values);
    return rows;
  }
  async record(table: string, id: string): Promise<RowDataPacket | undefined> {
    if (!entities.some(s => s.table === table)) throw new Error(`Table is not allowlisted: ${table}`);
    return (await this.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]))[0];
  }
  async close(): Promise<void> { await this.pool.end(); }
}
