import { EspoClient } from '../src/api/EspoClient';
import { env } from '../src/config/env';
import { execFileSync } from 'node:child_process';

async function main() {
  if (!['localhost', '127.0.0.1'].includes(new URL(env.baseURL).hostname)) throw new Error('Mailpit configuration requires local EspoCRM.');
  // EspoCRM 10 blocks internal mail servers unless this exact host:port is allowed.
  execFileSync('docker',['compose','exec','-T','espocrm','php','-r',
    "$p='data/config.php'; $c=include $p; $c['emailServerAllowedAddressList']=array_values(array_unique(array_merge($c['emailServerAllowedAddressList'] ?? [], ['mailpit:1025']))); file_put_contents($p, '<?php return '.var_export($c,true).';', LOCK_EX);"
  ],{stdio:'pipe'});
  const api = await EspoClient.connect();
  try {
    const account = {name:'Local Mailpit QA',emailAddress:'automation@example.test',status:'Active',useSmtp:true,smtpHost:'mailpit',smtpPort:1025,smtpAuth:false,smtpSecurity:'',smtpIsShared:true,useImap:false};
    const existing=await api.list('InboundEmail',{where:JSON.stringify([{type:'equals',attribute:'name',value:account.name}])});
    if(existing.list.length) await api.update('InboundEmail',existing.list[0].id,account);
    else await api.create('InboundEmail',account);
    await api.json(await api.context.put('Settings', { data: {
      smtpServer: 'mailpit', smtpPort: 1025, smtpAuth: false, smtpSecurity: '',
      outboundEmailFromAddress: 'automation@example.test', outboundEmailFromName: 'QA Automation',
      outboundEmailIsShared: true,
    } }));
    console.log('Local SMTP configured for Mailpit. Test inbox: http://localhost:8025');
  } finally { await api.dispose(); }
}
void main();
