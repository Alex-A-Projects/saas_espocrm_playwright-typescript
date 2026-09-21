import { test, expect } from '../../src/fixtures/test';
import { entities, payload } from '../../src/data/entities';

test('OpenAPI publishes the local REST contract @smoke', async ({ api }) => {
  const response = await api.context.get('OpenApi');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const document = await response.json();
  expect(document.openapi).toMatch(/^3\./);
  expect(document.info.title).toBeTruthy();
  expect(Object.keys(document.paths).length).toBeGreaterThan(10);
});
for (const spec of entities) {
  test(`${spec.entity} OpenAPI defines CRUD operations and record schema`, async ({ api }) => {
    const document = await api.json<any>(await api.context.get('OpenApi'));
    expect(document.paths[`/${spec.entity}`]).toHaveProperty('get');
    expect(document.paths[`/${spec.entity}`]).toHaveProperty('post');
    for (const method of ['get', 'patch', 'delete']) expect(document.paths[`/${spec.entity}/{id}`]).toHaveProperty(method);
    const schema = document.components.schemas[spec.entity];
    expect(schema.properties).toHaveProperty('id');
    const record = await api.create(spec.entity, payload(spec));
    for (const [field, value] of Object.entries(record)) {
      const definition = schema.properties[field];
      if (!definition || value === null || !definition.type) continue;
      const allowed = Array.isArray(definition.type) ? definition.type : [definition.type];
      const actual = Array.isArray(value) ? 'array' : typeof value;
      expect(allowed.map((t: string) => t === 'integer' ? 'number' : t), `${spec.entity}.${field}`).toContain(actual);
    }
  });
}
