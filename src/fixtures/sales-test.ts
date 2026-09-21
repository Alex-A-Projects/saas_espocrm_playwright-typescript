import { test as base, request, BrowserContext } from '@playwright/test';
import { DemoLoginPage } from '../pages/DemoLoginPage';
import { OwnedSalesClient } from '../api/OwnedSalesClient';
import { SalesPage } from '../pages/SalesPage';
import { ListPage } from '../pages/ListPage';
type Auth={state:Awaited<ReturnType<BrowserContext['storageState']>>;headers:Record<string,string>};
export const test=base.extend<{sales:SalesPage;salesApi:OwnedSalesClient;listPage:ListPage},{salesAuth:Auth}>({
  salesAuth:[async({browser},use)=>{
    const context=await browser.newContext({baseURL:'https://demo.us.espocrm.com'});
    const page=await context.newPage();
    let headers:Record<string,string>={};
    page.on('request',r=>{
      if(!r.url().startsWith('https://demo.us.espocrm.com/api/v1/'))return;
      const h=r.headers();
      if(h['espo-authorization']) headers=Object.fromEntries(Object.entries(h).filter(([k])=>['authorization','espo-authorization','espo-authorization-by-token'].includes(k)));
    });
    try {
      await new DemoLoginPage(page).login();
      if(!headers['espo-authorization'])throw new Error('Demo authentication headers were not observed.');
      await use({state:await context.storageState(),headers});
    }finally{await context.close();}
  },{scope:'worker'}],
  storageState:async({salesAuth},use)=>{await use(salesAuth.state);},
  salesApi:async({salesAuth},use)=>{
    const api=new OwnedSalesClient(await request.newContext({baseURL:'https://demo.us.espocrm.com/api/v1/',extraHTTPHeaders:salesAuth.headers}));
    try{await use(api);}finally{await api.cleanup();}
  },
  sales:async({page,salesApi},use)=>{await use(new SalesPage(page,(e,id)=>salesApi.track(e,id)));},
  listPage:async({page},use)=>{await use(new ListPage(page));},
});
export{expect}from'@playwright/test';
