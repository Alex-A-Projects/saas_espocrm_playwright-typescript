import dotenv from 'dotenv';
dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Run npm run local:init or configure .env.`);
  return value;
}
export const env = {
  baseURL: process.env.BASE_URL || 'http://localhost:8080',
  get username() { return required('ESPOCRM_ADMIN_USERNAME'); },
  get password() { return required('ESPOCRM_ADMIN_PASSWORD'); },
  apiKey: process.env.ESPOCRM_API_KEY,
  dateFormat: process.env.ESPOCRM_DATE_FORMAT || 'DD.MM.YYYY',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    database: process.env.DB_NAME || 'espocrm',
    user: process.env.DB_READ_USER || 'espocrm_test',
    get password() { return required('DB_READ_PASSWORD'); },
  },
};
export function assertLocalDatabase(): void {
  if (!['localhost', '127.0.0.1', '::1'].includes(env.db.host)) {
    throw new Error('Database tests are restricted to the local Docker database.');
  }
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(env.baseURL).hostname)) {
    throw new Error('Database tests require a local EspoCRM BASE_URL.');
  }
}
export function assertWriteTarget(): void {
  const host = new URL(env.baseURL).hostname;
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host) && process.env.ALLOW_REMOTE_WRITES !== 'true') {
    throw new Error('Mutation suites require localhost. Set ALLOW_REMOTE_WRITES=true only for an authorized test server.');
  }
}
