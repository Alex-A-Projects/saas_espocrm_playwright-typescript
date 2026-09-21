import {test,expect}from'../../src/fixtures/ui-test';
import {payload,specFor}from'../../src/data/entities';

for(const entity of ['Meeting','Call'])for(const mode of ['Month','Week'] as const) {
  test(`Calendar ${mode}: opens the scheduled ${entity} and returns to the calendar`,async({calendar,api})=>{
    const day=new Date().toISOString().slice(0,10);
    const record=await api.create(entity,payload(specFor(entity),{dateStart:`${day} 03:00:00`,dateEnd:`${day} 03:30:00`}));
    await calendar.open(); await calendar.mode(mode); await calendar.move('today');
    await calendar.openEvent(String(record.name));
    await expect(calendar.dialog).toContainText(String(record.name));
    await expect(calendar.dialog).toContainText('Planned');
    await calendar.closeEvent();
    await expect(calendar.event(String(record.name))).toBeVisible();
  });
}
for(const entity of ['Meeting','Call']) {
  test(`Calendar: reflects a ${entity} renamed and rescheduled through the UI`,async({calendar,records,api})=>{
    const day=new Date().toISOString().slice(0,10);
    const spec=specFor(entity); const record=await api.create(entity,payload(spec,{dateStart:`${day} 03:00:00`,dateEnd:`${day} 03:30:00`}));
    await records.openDetail(spec,record.id); await records.edit();
    const name=`${record.name}-updated`;
    await records.input('name').fill(name);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,10);
    await records.dateTimeDate('dateStart', tomorrow);
    await records.dateTimeDate('dateEnd', tomorrow);
    await records.save(entity,'PUT');
    expect(String((await api.read(entity,record.id)).dateStart)).toContain(tomorrow);
    await calendar.open(); await calendar.mode('Month'); await calendar.move('today');
    await expect(calendar.event(name)).toBeVisible();
  });
}
