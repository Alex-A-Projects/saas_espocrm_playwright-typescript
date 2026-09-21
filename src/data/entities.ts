import { randomUUID } from 'node:crypto';
import { RecordData } from '../api/EspoClient';

export const unique = (label = 'record') => `PW-${label}-${randomUUID().slice(0, 12)}`;
export type EntitySpec = {
  entity: string;
  plural: string;
  table: string;
  nameField: 'name' | 'lastName';
  defaults: RecordData;
};
export const entities: EntitySpec[] = [
  { entity: 'Account', plural: 'Accounts', table: 'account', nameField: 'name', defaults: { type: 'Customer' } },
  { entity: 'Contact', plural: 'Contacts', table: 'contact', nameField: 'lastName', defaults: { firstName: 'Automation' } },
  { entity: 'Lead', plural: 'Leads', table: 'lead', nameField: 'lastName', defaults: { firstName: 'Automation', status: 'New' } },
  { entity: 'Opportunity', plural: 'Opportunities', table: 'opportunity', nameField: 'name', defaults: { stage: 'Prospecting', amount: 1250, closeDate: '2027-12-31' } },
  { entity: 'Case', plural: 'Cases', table: 'case', nameField: 'name', defaults: { status: 'New', priority: 'Normal' } },
  { entity: 'Task', plural: 'Tasks', table: 'task', nameField: 'name', defaults: { status: 'Not Started', priority: 'Normal' } },
  { entity: 'Meeting', plural: 'Meetings', table: 'meeting', nameField: 'name', defaults: { status: 'Planned', dateStart: '2027-06-15 14:00:00', dateEnd: '2027-06-15 15:00:00' } },
  { entity: 'Call', plural: 'Calls', table: 'call', nameField: 'name', defaults: { status: 'Planned', direction: 'Outbound', dateStart: '2027-06-15 14:00:00', dateEnd: '2027-06-15 14:30:00' } },
  { entity: 'Campaign', plural: 'Campaigns', table: 'campaign', nameField: 'name', defaults: { status: 'Planning', type: 'Email' } },
  { entity: 'TargetList', plural: 'Target Lists', table: 'target_list', nameField: 'name', defaults: {} },
  { entity: 'KnowledgeBaseArticle', plural: 'Knowledge Base', table: 'knowledge_base_article', nameField: 'name', defaults: { status: 'Draft', body: 'Automation knowledge article.' } },
];
export const payload = (spec: EntitySpec, overrides: RecordData = {}): RecordData => ({
  ...spec.defaults, [spec.nameField]: unique(spec.entity), description: 'Created by the Playwright test suite.', ...overrides,
});
export const specFor = (entity: string) => {
  const spec = entities.find(s => s.entity === entity);
  if (!spec) throw new Error(`Unknown entity ${entity}`);
  return spec;
};
