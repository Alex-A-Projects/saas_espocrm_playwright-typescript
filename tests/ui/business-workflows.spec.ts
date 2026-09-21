import { test,expect } from '../../src/fixtures/ui-test';
import { payload,specFor,unique } from '../../src/data/entities';

for(const scopes of [['Contact'],['Account'],['Account','Contact']] as const) {
  test(`Lead conversion creates ${scopes.join(' and ')} and marks the lead Converted`,async({leads,api})=>{
    const lead=await api.create('Lead',payload(specFor('Lead'),{accountName:unique('convert-account'),emailAddress:`${unique('lead')}@example.test`}));
    await leads.openConversion(lead.id);
    for(const scope of scopes) await leads.choose(scope);
    const result=await leads.convert();
    for(const scope of scopes) {
      expect(result[scope]?.id).toBeTruthy();
      const saved=await api.read(scope,result[scope].id);
      if(scope==='Contact')expect(saved.lastName).toBe(lead.lastName);
      if(scope==='Account')expect(saved.name).toBe(lead.accountName);
    }
    expect((await api.read('Lead',lead.id)).status).toBe('Converted');
  });
}
test('Lead conversion cancel preserves the original lead',async({leads,api})=>{
  const lead=await api.create('Lead',payload(specFor('Lead')));
  await leads.openConversion(lead.id);
  await leads.choose('Contact');
  await leads.cancel();
  await expect(leads.editButton).toBeVisible();
  expect((await api.read('Lead',lead.id)).status).toBe('New');
});
for(const amount of [0,12.5,999999.99]) {
  test(`Opportunity amount ${amount} survives UI editing`,async({records,api})=>{
    const spec=specFor('Opportunity');
    const record=await api.create(spec.entity,payload(spec));
    await records.openDetail(spec,record.id); await records.edit();
    await records.number('amount',amount); await records.save(spec.entity,'PUT');
    await records.reload();
    expect((await api.read(spec.entity,record.id)).amount).toBe(amount);
  });
}
for(const [stage,probability] of [['Closed Won',100],['Closed Lost',0]] as const) {
  test(`Opportunity ${stage} updates probability to ${probability}`,async({records,api})=>{
    const spec=specFor('Opportunity'); const record=await api.create(spec.entity,payload(spec));
    await records.openDetail(spec,record.id); await records.edit();
    await records.selectEnum('stage',stage); await records.save(spec.entity,'PUT');
    expect((await api.read(spec.entity,record.id)).probability).toBe(probability);
  });
}
for(const entity of ['Task','Meeting','Call']) {
  test(`${entity}: select an Account parent through the UI`,async({records,api})=>{
    const account=await api.create('Account',payload(specFor('Account')));
    const spec=specFor(entity); const record=await api.create(entity,payload(spec));
    await records.openDetail(spec,record.id); await records.edit();
    await records.selectLink('parent',String(account.name));
    await records.save(entity,'PUT');
    expect(await api.read(entity,record.id)).toMatchObject({parentId:account.id,parentType:'Account'});
    await expect(records.field('parent')).toContainText(String(account.name));
  });
  test(`${entity}: required assigned user cannot be cleared`,async({records,api})=>{
    const spec=specFor(entity); const record=await api.create(entity,payload(spec));
    await records.openDetail(spec,record.id); await records.edit();
    await records.clearLink('assignedUser'); await records.saveButton.click();
    await expect(records.fieldError('assignedUser')).toHaveClass(/has-error/);
    expect((await api.read(entity,record.id)).assignedUserId).toBe(record.assignedUserId);
  });
}
for(const entity of ['Contact','Lead']) {
  test(`${entity}: first name and surname persist independently`,async({records,api})=>{
    const spec=specFor(entity); const record=await api.create(entity,payload(spec));
    await records.openDetail(spec,record.id); await records.edit();
    await records.input('firstName').fill('Renée');
    await records.input('lastName').fill(unique('surname'));
    await records.save(entity,'PUT');
    await records.reload(); await expect(records.heading).toContainText('Renée');
    expect((await api.read(entity,record.id)).firstName).toBe('Renée');
  });
}
for(const entity of ['Account','Contact','Lead','Opportunity','Case','KnowledgeBaseArticle']) {
  test(`${entity}: assignment picker persists the current user`,async({records,api})=>{
    const me=await api.json<{user:{id:string;name:string}}>(await api.context.get('App/user'));
    const spec=specFor(entity); const record=await api.create(entity,payload(spec));
    await records.openDetail(spec,record.id); await records.edit();
    await records.selectLink('assignedUser',me.user.name); await records.save(entity,'PUT');
    expect((await api.read(entity,record.id)).assignedUserId).toBe(me.user.id);
  });
}
