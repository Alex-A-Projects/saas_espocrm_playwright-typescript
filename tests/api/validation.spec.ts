import { test, expect } from '../../src/fixtures/test';
import { entities, payload, specFor } from '../../src/data/entities';

// Lead allows an organization-only record; lastName is not required there.
for (const spec of entities.filter(s => s.entity !== 'Lead')) {
  test(`${spec.entity} rejects an empty required name`, async ({ api }) => {
    const response = await api.context.post(spec.entity, { data: await api.preparePayload(spec.entity, payload(spec, { [spec.nameField]: '' })) });
    if (response.ok()) api.track(spec.entity, (await response.json()).id);
    expect(response.status()).toBe(400);
    expect((await response.json()).messageTranslation.data.field).toBe(spec.nameField);
  });
  test(`${spec.entity} rejects clearing the required name on update`, async ({ api }) => {
    const data = payload(spec);
    const record = await api.create(spec.entity, data);
    const response = await api.context.put(`${spec.entity}/${record.id}`, { data: { [spec.nameField]: '' } });
    expect(response.status()).toBe(400);
    expect((await api.read(spec.entity, record.id))[spec.nameField]).toBe(data[spec.nameField]);
  });
}
for (const entity of ['Account', 'Contact', 'Lead']) {
  test(`${entity} rejects malformed email addresses`, async ({ api }) => {
    const response = await api.context.post(entity, { data: payload(specFor(entity), { emailAddress: 'not-an-email' }) });
    if (response.ok()) api.track(entity, (await response.json()).id);
    expect(response.status()).toBe(400);
  });
}
for (const field of ['amount', 'closeDate']) {
  test(`Opportunity requires ${field}`, async ({ api }) => {
    const response = await api.context.post('Opportunity', { data: payload(specFor('Opportunity'), { [field]: null }) });
    if (response.ok()) api.track('Opportunity', (await response.json()).id);
    expect(response.status()).toBe(400);
  });
}
