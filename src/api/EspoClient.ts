import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { assertWriteTarget, env } from '../config/env';

export type RecordData = Record<string, unknown>;
export type EspoRecord = RecordData & { id: string; name?: string };
export type ListResult = { total: number; list: EspoRecord[] };

export class EspoClient {
  private readonly created: { entity: string; id: string }[] = [];
  private userId?: string;
  constructor(readonly context: APIRequestContext) {}

  static async connect(): Promise<EspoClient> {
    return new EspoClient(await request.newContext({
      baseURL: `${env.baseURL.replace(/\/$/, '')}/api/v1/`,
      extraHTTPHeaders: {
        Accept: 'application/json',
        ...(env.apiKey ? { 'X-Api-Key': env.apiKey } : {
          Authorization: `Basic ${Buffer.from(`${env.username}:${env.password}`).toString('base64')}`,
        }),
      },
    }));
  }

  async json<T>(response: APIResponse, expected = 200): Promise<T> {
    if (response.status() !== expected) {
      throw new Error(`${response.url()}: expected ${expected}, got ${response.status()}: ${(await response.text()).slice(0,1000)}`);
    }
    return response.json() as Promise<T>;
  }
  async preparePayload(entity: string, data: RecordData): Promise<RecordData> {
    if (['Task', 'Meeting', 'Call'].includes(entity) && !('assignedUserId' in data)) {
      if (!this.userId) this.userId = (await this.json<{ user: { id: string } }>(await this.context.get('App/user'))).user.id;
      data = { ...data, assignedUserId: this.userId };
    }
    return data;
  }
  async create(entity: string, data: RecordData): Promise<EspoRecord> {
    assertWriteTarget();
    data = await this.preparePayload(entity, data);
    const record = await this.json<EspoRecord>(await this.context.post(entity, { data }));
    this.track(entity, record.id);
    return record;
  }
  track(entity: string, id: string): void {
    if (!id) throw new Error(`Cannot track ${entity} without an ID`);
    if (!this.created.some(r => r.entity === entity && r.id === id)) this.created.push({ entity, id });
  }
  async read(entity: string, id: string): Promise<EspoRecord> {
    return this.json(await this.context.get(`${entity}/${id}`));
  }
  async list(entity: string, params: Record<string, string | number | boolean> = {}): Promise<ListResult> {
    const encoded = { ...params };
    if (typeof encoded.where === 'string') {
      const where = JSON.parse(encoded.where) as RecordData[];
      delete encoded.where;
      where.forEach((item, index) => {
        for (const [key, value] of Object.entries(item)) {
          if (Array.isArray(value)) value.forEach((entry, i) => { encoded[`where[${index}][${key}][${i}]`] = String(entry); });
          else encoded[`where[${index}][${key}]`] = String(value);
        }
      });
    }
    return this.json(await this.context.get(entity, { params: encoded }));
  }
  async update(entity: string, id: string, data: RecordData): Promise<EspoRecord> {
    assertWriteTarget();
    return this.json(await this.context.patch(`${entity}/${id}`, { data }));
  }
  async remove(entity: string, id: string): Promise<void> {
    assertWriteTarget();
    const response = await this.context.delete(`${entity}/${id}`);
    if (![200, 404].includes(response.status())) throw new Error(`Delete ${entity}/${id}: ${response.status()}`);
  }
  async cleanup(): Promise<void> {
    const errors: string[] = [];
    for (const record of [...this.created].reverse()) {
      try { await this.remove(record.entity, record.id); }
      catch (error) { errors.push(String(error)); }
    }
    await this.context.dispose();
    if (errors.length) throw new Error(`Test data cleanup failed:\n${errors.join('\n')}`);
  }
  async dispose(): Promise<void> { await this.context.dispose(); }
}
