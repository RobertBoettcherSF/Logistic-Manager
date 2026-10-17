// Service list after client feedback: no keke/okada, Dispatch rider = motorbike parcels, even 2x2 grid + full-width Private jet (charter request). WebKit iPhone 7 Plus.
import { createRequire } from 'module';const require=createRequire('/workspace/pw/');const {webkit,devices}=require('playwright');import fs from 'fs';
const URL=process.argv[2]||'file://'+new globalThis.URL('../dist/swift-drive.html',import.meta.url).pathname;
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log(c?'  ok  ':'  FAIL',m)};
const b=await webkit.launch();const c=await b.newContext({...devices['iPhone 7 Plus']});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL+(URL.includes('?')?'&':'?')+'sim=1');await p.waitForTimeout(800);
const ids=await p.$$eval('.grid .svc',a=>a.map(x=>x.id));console.log('  services:',ids.join(','));
ok(JSON.stringify(ids)===JSON.stringify(['svc-ride','svc-bus','svc-dispatch','svc-truck','svc-jet']),'service list is ride,bus,dispatch,truck,jet');
const html=fs.existsSync(URL.replace('file://',''))?fs.readFileSync(URL.replace('file://',''),'utf8'):await p.content();
ok(!/keke|okada|🛺/i.test(html),'no keke/okada text anywhere in the page');
ok(/Dispatch rider/.test(await p.innerText('.grid')),'Dispatch rider tile label');
const boxes=await p.$$eval('.grid .svc:not(#svc-jet)',a=>a.map(x=>{const r=x.getBoundingClientRect();return [Math.round(r.top),Math.round(r.width)]}));
const rows={};boxes.forEach(([t])=>rows[t]=(rows[t]||0)+1);const counts=Object.values(rows);
ok(counts.every(n=>n===counts[0])&&new Set(boxes.map(x=>x[1])).size===1,'grid even: rows '+counts.join('/'));
await p.click('#roleD');const veh=await p.$$eval('#veh option',a=>a.map(o=>o.value));ok(!veh.includes('keke')&&!veh.includes('okada')&&veh.includes('bike'),'driver vehicles '+veh.join(','));
await p.click('#roleC');const jw=await p.$eval('#svc-jet',x=>[x.getBoundingClientRect().width,x.parentNode.getBoundingClientRect().width]);ok(jw[0]>=jw[1]-2,'Private jet tile is a full-width row under the 2x2 grid');
ok(/Private jet/.test(await p.innerText('#svc-jet')),'Private jet tile label');
ok(veh.includes('jet'),'charter operator can go online (vehicle jet)');
ok(errs.length===0,'no page errors '+errs.join(';'));await b.close();console.log(`services: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
