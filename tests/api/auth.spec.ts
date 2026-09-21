import { test, expect } from '../../src/fixtures/test';
import { env } from '../../src/config/env';

for (const endpoint of ['Account', 'Contact', 'Opportunity', 'Task', 'OpenApi', 'Metadata']) {
  test(`${endpoint} rejects anonymous requests`, async ({ request }) => {
    const response = await request.get(`${env.baseURL}/api/v1/${endpoint}`);
    expect(response.status()).toBe(401);
  });
}
test('invalid Basic credentials are rejected', async ({ request }) => {
  const response = await request.get(`${env.baseURL}/api/v1/Account`, {
    headers: { Authorization: `Basic ${Buffer.from('nonexistent-pw-user:invalid').toString('base64')}` },
  });
  expect(response.status()).toBe(401);
});
test('invalid API key is rejected', async ({ request }) => {
  expect((await request.get(`${env.baseURL}/api/v1/Account`, { headers: { 'X-Api-Key': 'invalid-playwright-key' } })).status()).toBe(401);
});
test('authenticated user matches configured account @smoke', async ({ api }) => {
  const result = await api.json<any>(await api.context.get('App/user'));
  expect(result.user.userName).toBe(env.username);
});
