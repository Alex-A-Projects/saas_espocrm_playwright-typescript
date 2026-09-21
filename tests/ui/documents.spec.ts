import { test,expect } from '../../src/fixtures/ui-test';
import { unique } from '../../src/data/entities';
import { documentSpec } from '../../src/pages/DocumentPage';

for (const [filename,mime,contents] of [['contract.txt','text/plain','Contract version 1.'],['data.csv','text/csv','name,value\nQA,42'],['unicode.txt','text/plain','Café 東京 مرحبا 🚀']]) {
  test(`Documents: upload and download ${filename} without corrupting contents`,async({documents,api})=>{
    await documents.openCreate(documentSpec);
    const fileId=await documents.upload(filename,contents,mime);
    const name=unique('document');
    await documents.input('name').fill(name);
    const id=await documents.save('Document');
    expect(await api.read('Document',id)).toMatchObject({name,fileId});
    expect((await documents.download()).toString()).toBe(contents);
  });
}
for(const field of ['name','file','publishDate']) {
  test(`Documents: ${field} is required`,async({documents})=>{
    await documents.openCreate(documentSpec);
    if(field!=='file') await documents.upload('required.txt','Required file');
    await documents.input('name').fill(field==='name'?'':unique('required'));
    if(field==='publishDate') await documents.input('publishDate').fill('');
    await documents.saveButton.click();
    await expect(documents.fieldError(field)).toHaveClass(/has-error/);
  });
}
for(const [field,values] of [['status',['Draft','Canceled','Expired']],['type',['Contract','NDA','EULA','License Agreement']]] as const) {
  for(const value of values) test(`Documents: ${field} ${value} persists`,async({documents,api})=>{
    const id=await documents.createDocument(unique('document'));
    await documents.edit();
    await documents.selectEnum(field,value);
    await documents.save('Document','PUT');
    await documents.reload();
    await expect(documents.field(field)).toContainText(value);
    expect((await api.read('Document',id))[field]).toBe(value);
  });
}
test('Documents: replacing a file persists the new attachment',async({documents,api})=>{
  const id=await documents.createDocument(unique('replace'));
  await documents.edit();
  const fileId=await documents.upload('replacement.txt','Version two');
  await documents.save('Document','PUT');
  await documents.reload();
  expect((await api.read('Document',id)).fileId).toBe(fileId);
  expect((await documents.download()).toString()).toBe('Version two');
});
test('Documents: rename and description persist after reload',async({documents,api})=>{
  const id=await documents.createDocument(unique('edit'));
  const name=unique('renamed');
  await documents.edit();
  await documents.input('name').fill(name);
  await documents.input('description').fill('Updated contract description');
  await documents.save('Document','PUT');
  await documents.reload();
  await expect(documents.heading).toContainText(name);
  expect(await api.read('Document',id)).toMatchObject({name,description:'Updated contract description'});
});
test('Documents: cancel edit retains the original file and name',async({documents,api})=>{
  const name=unique('cancel');
  const id=await documents.createDocument(name);
  const original=await api.read('Document',id);
  await documents.edit();
  await documents.input('name').fill('Discarded edit');
  await documents.cancel();
  expect(await api.read('Document',id)).toMatchObject({name,fileId:original.fileId});
});
test('Documents: search and remove an owned document',async({documents,listPage,api})=>{
  const name=unique('document').replaceAll('-','');
  const id=await documents.createDocument(name);
  await listPage.open(documentSpec);
  await listPage.search(name);
  await listPage.openRecord('Document',id);
  await documents.requestDelete();
  await documents.confirmDelete('Document',id);
  expect((await api.read('Document',id)).deleted).toBe(true);
});
