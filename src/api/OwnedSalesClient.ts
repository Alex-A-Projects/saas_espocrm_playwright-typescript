import { APIRequestContext } from '@playwright/test';
import { EspoRecord, RecordData } from './EspoClient';

/** Only records created by the current test can be updated or deleted. */
export class OwnedSalesClient {
  private owned: {entity:string;id:string}[]=[];
  constructor(readonly context:APIRequestContext) {}
  track(entity:string,id:string):void { if (!this.owned.some(r=>r.entity===entity&&r.id===id)) this.owned.push({entity,id}); }
  async create(entity:string,data:RecordData):Promise<EspoRecord> {
    const r=await this.context.post(entity,{data});
    if(!r.ok()) throw new Error(`${entity} setup: ${r.status()} ${await r.text()}`);
    const record=await r.json(); this.track(entity,record.id); return record;
  }
  async read(entity:string,id:string):Promise<EspoRecord> {
    const r=await this.context.get(`${entity}/${id}`);
    if(!r.ok()) throw new Error(`${entity} read: ${r.status()}`);
    return r.json();
  }
  async isListed(entity: string, id: string): Promise<boolean> {
    const response = await this.context.get(entity, { params: {
      'where[0][type]': 'equals', 'where[0][attribute]': 'id', 'where[0][value]': id,
    } });
    if (!response.ok()) throw new Error(`${entity} list: ${response.status()}`);
    return (await response.json()).list.some((record: EspoRecord) => record.id === id);
  }
  async cleanup():Promise<void> {
    const errors:string[]=[];
    for(const {entity,id} of [...this.owned].reverse()) {
      const r=await this.context.delete(`${entity}/${id}`);
      if(![200,404].includes(r.status())) errors.push(`${entity}/${id}: ${r.status()}`);
    }
    await this.context.dispose();
    if(errors.length) throw new Error(`Owned sales record cleanup failed: ${errors.join(', ')}`);
  }
}
