import { test,expect } from '../../src/fixtures/ui-test';
import { unique } from '../../src/data/entities';

for(const folder of ['all','inbox','important','sent','archive','drafts','trash'] as const) {
  test(`Emails: opens ${folder} folder`,async({email})=>{
    await email.folder(folder);
    await expect(email.composeButton).toBeVisible();
  });
}
test('Emails: saves a draft with subject, body and recipient',async({email,api})=>{
  const name=unique('draft');
  await email.compose();
  await email.fill(name,'Draft body with café and 東京.');
  const id=await email.saveDraft();
  const saved=await api.read('Email',id);
  expect(saved).toMatchObject({name,status:'Draft'});
  expect(saved.body).toContain('Draft body with café and 東京.');
  await email.folder('drafts');
  await expect(email.link(id)).toBeVisible();
});
test('Emails: draft retains CC and BCC recipients',async({email,api})=>{
  await email.compose();
  await email.fill(unique('cc-bcc'),'Recipient coverage');
  await email.addRecipient('cc','copy@example.test');
  await email.addRecipient('bcc','private@example.test');
  const id=await email.saveDraft();
  expect(await api.read('Email',id)).toMatchObject({cc:'copy@example.test',bcc:'private@example.test'});
});
test('Emails: cancel compose does not create the typed subject',async({email,api})=>{
  const name=unique('cancel-email');
  await email.compose();
  await email.fill(name,'Discarded message');
  await email.cancel();
  expect((await api.list('Email',{where:JSON.stringify([{type:'equals',attribute:'name',value:name}])})).list).toHaveLength(0);
});
for(const missing of ['subject','recipient'] as const) {
  test(`Emails: Send validates missing ${missing}`,async({email})=>{
    await email.compose();
    if(missing==='subject') await email.addRecipient('to','recipient@example.test');
    else await email.subject.fill(unique('no-recipient'));
    await email.body.fill('Validation only');
    await email.sendButton.click();
    await expect(email.errors.first()).toBeVisible();
    await expect(email.dialog).toBeVisible();
  });
}
test('Emails: sends through the UI and delivers to the local test inbox @smoke',async({email,api,request})=>{
  const settings=await api.json<Record<string,unknown>>(await api.context.get('Settings'));
  expect(settings.smtpServer,'Email send tests require the local Mailpit sink').toBe('mailpit');
  expect(settings.smtpPort).toBe(1025);
  const name=unique('delivery');
  await email.compose();
  await email.fill(name,'Delivery verified by Playwright.');
  const id=await email.send();
  await expect.poll(async()=> (await api.read('Email',id)).status).toBe('Sent');
  await expect.poll(async()=>{
    const response=await request.get('http://localhost:8025/api/v1/search',{params:{query:`subject:${name}`}});
    const result=await response.json();
    return result.messages?.filter((m:{Subject:string})=>m.Subject===name).length;
  }).toBe(1);
  await email.folder('sent');
  await expect(email.link(id)).toBeVisible();
});

test('Emails: edits a draft subject and body and persists after reload', async ({ email, records, api }) => {
  await email.compose();
  await email.fill(unique('draft-edit'), 'Original body');
  const id = await email.saveDraft();
  await email.openMessage(id);
  await records.edit();
  const subject = unique('revised');
  await records.input('subject').fill(subject);
  await records.bodyEditor.fill('Revised draft body');
  await records.save('Email', 'PUT');
  await records.reload();
  await expect(records.heading).toContainText(subject);
  expect((await api.read('Email', id)).body).toContain('Revised draft body');
});

test('Emails: cancel edit preserves the draft subject', async ({ email, records, api }) => {
  const name = unique('preserve-draft');
  await email.compose();
  await email.fill(name, 'Original body');
  const id = await email.saveDraft();
  await email.openMessage(id);
  await records.edit();
  await records.input('subject').fill('Discard this edit');
  await records.cancel();
  expect((await api.read('Email', id)).name).toBe(name);
});

test('Emails: canceled deletion preserves a draft; confirmed deletion removes it', async ({ email, records, api }) => {
  const name = unique('delete-draft');
  await email.compose();
  await email.fill(name, 'Remove this draft');
  const id = await email.saveDraft();
  await email.openMessage(id);
  await records.requestDelete();
  await records.dismissDialog();
  expect((await api.read('Email', id)).name).toBe(name);
  await records.requestDelete();
  await email.confirmDelete(id);
  const active = await api.list('Email', { where: JSON.stringify([{ type: 'equals', attribute: 'id', value: id }]) });
  expect(active.list).toHaveLength(0);
});

test('Emails: saves a draft with an uploaded attachment', async ({ email, api }) => {
  await email.compose();
  await email.fill(unique('attachment'), 'See attached QA notes.');
  const attachment = await email.attach('qa-notes.txt', 'Attachment contents: café 東京');
  const id = await email.saveDraft();
  expect((await api.read('Email', id)).attachmentsIds).toContain(attachment);
});
