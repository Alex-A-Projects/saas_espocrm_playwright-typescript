import { expect } from '@playwright/test';
import { RecordPage } from './RecordPage';
import { specFor } from '../data/entities';
export class LeadPage extends RecordPage {
  async openConversion(id:string):Promise<void> {
    await this.openDetail(specFor('Lead'),id);
    await this.content.getByRole('button',{name:'Convert',exact:true}).click();
    await expect(this.content.getByRole('checkbox',{name:'Contact',exact:true})).toBeVisible();
  }
  conversionField(entity:string,name:string) { return this.content.locator(`.edit[data-scope="${entity}"] input[data-name="${name}"]`); }
  async choose(entity:'Account'|'Contact'|'Opportunity'):Promise<void> { await this.content.getByRole('checkbox',{name:entity,exact:true}).check(); }
  async convert():Promise<Record<string,{id:string}>> {
    const [response]=await Promise.all([
      this.page.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('Lead/action/convert')),
      this.content.getByRole('button',{name:'Convert',exact:true}).click(),
    ]);
    expect(response.status(),await response.text()).toBe(200);
    const lead=await response.json();
    const result:Record<string,{id:string}>={};
    for(const entity of ['Account','Contact','Opportunity']) {
      const id=lead[`created${entity}Id`];
      if(id) { result[entity]={id}; this.onCreate?.(entity,id); }
    }
    return result;
  }
}
