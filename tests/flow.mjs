// Full customer->driver flow for every service, in WebKit (iPhone-like) and Chromium (Android-like).
// Usage: node tests/flow.mjs [baseURL]   default: starts nothing, uses http://localhost:8787 for server tests
import { createRequire } from 'module';
const require=createRequire('/workspace/pw/');const { webkit, chromium }=require('playwright');
import fs from 'fs';
const ROOT=new URL('..',import.meta.url).pathname, SHOTS=ROOT+'shots/';
const BASE=process.argv[2]||'http://localhost:8787/';
const FILE='file://'+ROOT+'dist/swift-drive.html';
const VEH={ride:'car',bus:'bus',dispatch:'bike',truck:'truck'};
let pass=0,fail=0;const ok=(c,m)=>{if(c){pass++;console.log('  ok  ',m)}else{fail++;console.log('  FAIL',m)}};
const browsers=[['webkit',webkit,{viewport:{width:414,height:736},deviceScaleFactor:2,isMobile:false,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1'}],
 ['chromium',chromium,{viewport:{width:414,height:736},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 9; Infinix X650) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0 Mobile Safari/537.36'}]];
async function tap(page,x,y){await page.mouse.click(x,y)}
async function setRoute(c){const m=await c.locator('#map').boundingBox();await tap(c,m.x+m.width*.3,m.y+m.height*.3);await tap(c,m.x+m.width*.7,m.y+m.height*.6)}
async function flow(ctxC,ctxD,url,svc,name,shots){
  const errs=[];const c=await ctxC.newPage(),d=await ctxD.newPage();[c,d].forEach(p=>p.on('pageerror',e=>errs.push(e.message)));
  await c.goto(url+(url.includes('?')?'&':'?')+'sim=0');await d.goto(url+(url.includes('?')?'&':'?')+'sim=0&role=driver');
  await d.selectOption('#veh',VEH[svc]);await d.fill('#dname','Test Driver');await d.click('#goOnline');
  await c.click('#svc-'+svc);await setRoute(c);
  if(svc==='bus')await c.fill('#seats','6');
  if(svc==='dispatch'){await c.selectOption('#size','medium');await c.fill('#rphone','08031234567')}
  if(svc==='truck')await c.fill('#load','20 bags of cement');
  await c.locator('#reqBtn').waitFor();if(shots)await c.screenshot({path:SHOTS+name+'-1-customer-'+svc+'.png'});
  await c.click('#reqBtn');
  await d.locator('.job').first().waitFor({timeout:8000});if(shots)await d.screenshot({path:SHOTS+name+'-2-driver-requests-'+svc+'.png'});
  if(svc==='truck'){await d.fill('.job input',String(30000));await d.click('[data-act=dCounter]')}else await d.click('[data-act=dAccept]');
  await c.locator('.offer').first().waitFor({timeout:8000});if(shots)await c.screenshot({path:SHOTS+name+'-3-offers-'+svc+'.png'});
  await c.click('[data-act=acceptOffer]');
  for(let i=0;i<3;i++){await d.locator('#nextBtn').waitFor({timeout:8000});if(shots&&i===1)await d.screenshot({path:SHOTS+name+'-4-driver-job-'+svc+'.png'});await d.click('#nextBtn')}
  await c.waitForFunction(()=>/Done/.test((document.getElementById('cstatus')||{}).textContent||''),null,{timeout:8000});
  if(shots)await c.screenshot({path:SHOTS+name+'-5-done-'+svc+'.png'});
  const st=await c.evaluate(()=>SDState());ok(st.req.status==='done'&&errs.length===0,`${name} ${svc}: done, price ${st.req.price}, sync ${st.sync}, errors ${errs.length}`);
  await c.close();await d.close();
}
// Private jet = charter request: no fixed fare, operator (driver role, vehicle "jet") answers with a quote.
async function fillJet(c){await c.click('#svc-jet');await c.locator('#jfrom').waitFor();
  ok(/Price on request; a charter operator confirms/.test(await c.textContent('#jetPrice')),'jet form shows "Price on request; a charter operator confirms"');
  ok((await c.$$eval('#jetPlaces option',a=>a.map(o=>o.value).join('|'))).match(/BNI.*LOS.*ABV.*ACC/)!==null,'jet suggestions BNI, LOS, ABV, ACC');
  ok(await c.$('#offer')===null&&await c.$('#sugg')===null,'jet form has no fixed fare / offer field');
  await c.fill('#jfrom','Benin Airport (BNI), Benin City');await c.fill('#jto','Lagos – Murtala Muhammed (LOS)');
  await c.fill('#jdate','2026-11-02');await c.fill('#jtime','09:30');await c.fill('#jpax','4');await c.fill('#jnotes','2 suitcases');await c.fill('#jcontact','+2348031234567')}
async function jetFlow(ctxC,ctxD,url,name){
  const errs=[];const c=await ctxC.newPage(),d=await ctxD.newPage();[c,d].forEach(p=>p.on('pageerror',e=>errs.push(e.message)));
  await c.goto(url+(url.includes('?')?'&':'?')+'sim=0');await d.goto(url+(url.includes('?')?'&':'?')+'sim=0&role=driver');
  await d.selectOption('#veh','jet');await d.fill('#dname','Demo Air Charter');await d.click('#goOnline');
  await fillJet(c);await c.fill('#jpax','13');await c.click('#reqBtn');ok(await c.$('#jfrom')!==null,name+' jet: 13 passengers rejected (max 12)');
  await c.fill('#jpax','4');await c.click('#reqBtn');
  await d.locator('.job').first().waitFor({timeout:8000});const job=await d.textContent('.job');
  ok(/BNI/.test(job)&&/LOS/.test(job)&&/4 pax/.test(job)&&/2026-11-02/.test(job)&&/\+2348031234567/.test(job),name+' jet: operator sees route, date, pax, contact');
  await d.fill('.job input','18500000');await d.click('[data-act=dQuote]');
  await c.locator('.offer').first().waitFor({timeout:8000});ok(/18,500,000/.test(await c.textContent('.offer'))&&!/example/i.test(await c.textContent('.offer')),name+' jet: customer gets operator quote');
  await c.click('[data-act=acceptOffer]');await d.locator('#nextBtn').waitFor({timeout:8000});await d.click('#nextBtn');
  await c.waitForFunction(()=>/Booked/.test((document.getElementById('cstatus')||{}).textContent||''),null,{timeout:8000});
  const st=await c.evaluate(()=>SDState());ok(st.req.service==='jet'&&st.req.status==='done'&&errs.length===0,`${name} jet: charter request → quote → accepted → booked, sync ${st.sync}, errors ${errs.length} ${errs.join(';')}`);
  await c.close();await d.close()}
for(const [bn,bt,opt] of browsers){
  const b=await bt.launch(bn==='chromium'?{executablePath:'/usr/bin/google-chrome'}:{});console.log('== '+bn);
  // 1) local demo mode (same phone, two tabs) via server-hosted ?mode=local
  for(const svc of Object.keys(VEH)){const ctx=await b.newContext(opt);await flow(ctx,ctx,BASE+'index.html?mode=local',svc,bn+'-local',bn==='webkit'||svc==='ride');await ctx.close()}
  // 2) server mode: two separate "phones" (contexts)
  for(const svc of ['ride','dispatch']){const c1=await b.newContext(opt),c2=await b.newContext(opt);await flow(c1,c2,BASE+'index.html',svc,bn+'-server',false);await c1.close();await c2.close()}
  {const ctx=await b.newContext(opt);await jetFlow(ctx,ctx,BASE+'index.html?mode=local',bn+'-local');await ctx.close()}
  {const c1=await b.newContext(opt),c2=await b.newContext(opt);await jetFlow(c1,c2,BASE+'index.html',bn+'-server');await c1.close();await c2.close()}
  // 2b) demo mode: simulated charter operator answers with a clearly labelled EXAMPLE quote
  {const ctx=await b.newContext(opt);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(FILE);
   await fillJet(p);if(bn==='webkit')await p.screenshot({path:SHOTS+'jet-1-request.png'});await p.click('#reqBtn');
   await p.locator('.offer').first().waitFor({timeout:8000});const o=await p.textContent('.offer');
   ok(/Example quote/i.test(o)&&/not a real price/i.test(o)&&/simulated/i.test(o),bn+' jet demo: simulated operator sends quote labelled as example');
   if(bn==='webkit')await p.screenshot({path:SHOTS+'jet-2-quote.png'});
   ok(errs.length===0&&(await p.evaluate(()=>SDState().req.status))==='offers',bn+' jet demo: no errors');await ctx.close()}
  // 3) single file from file:// (Downloads / Files)
  {const ctx=await b.newContext(opt);const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(FILE);
   await p.click('#svc-ride');await setRoute(p);await p.click('#reqBtn');await p.locator('.offer').first().waitFor({timeout:8000});
   await p.screenshot({path:SHOTS+bn+'-file-offers.png'});await p.click('[data-act=acceptOffer]');
   await p.waitForFunction(()=>/Done/.test((document.getElementById('cstatus')||{}).textContent||''),null,{timeout:20000});
   await p.screenshot({path:SHOTS+bn+'-file-done.png'});const st=await p.evaluate(()=>SDState());
   ok(st.sync==='local'&&st.req.status==='done'&&errs.length===0,bn+' single file via file:// (sim drivers) ride done, errors '+errs.length);
   await p.click('#roleD');await p.selectOption('#veh','car');await p.click('#goOnline');ok(await p.isVisible('#noreq')||await p.isVisible('.job'),bn+' single file driver screen');
   await ctx.close()}
  // 4) simulated drivers demo + report + verify
  {const ctx=await b.newContext(opt);const p=await ctx.newPage();await p.goto(BASE+'index.html?mode=local');
   await p.click('#verifyBtn');await p.fill('#vname','Test User');await p.fill('#vphone','+2348031234567');await p.click('#vgo');
   ok(/Verified/.test(await p.textContent('#verifyBtn')),bn+' verify (demo) badge');
   await p.click('#svc-ride');await setRoute(p);await p.click('#reqBtn');await p.locator('.offer').first().waitFor({timeout:8000});
   if(bn==='webkit')await p.screenshot({path:SHOTS+'webkit-sim-offers.png'});
   await p.click('[data-act=acceptOffer]');await p.waitForFunction(()=>/Done/.test((document.getElementById('cstatus')||{}).textContent||''),null,{timeout:20000});
   ok(true,bn+' simulated driver completes trip');
   await p.evaluate(()=>{setTimeout(()=>{throw new Error('test-error')},0);Promise.reject(new Error('test-reject'))});await p.waitForTimeout(200);
   await p.click('#reportBtn');await p.fill('#rnote','test note');if(bn==='webkit')await p.screenshot({path:SHOTS+'webkit-report.png'});
   const rep=await p.evaluate(()=>SDReport.build('x',SDState()));ok(rep.errors.length>=2&&rep.actions.length>5&&rep.state.role==='customer',bn+' report has errors+actions+state');
   ok((await p.evaluate(()=>SDReport.waLink(SDReport.build('x',SDState())))).startsWith('https://wa.me/?text='),bn+' whatsapp link');
   await ctx.close()}
  // 5) server report delivery
  {const ctx=await b.newContext(opt);const p=await ctx.newPage();await p.goto(BASE+'index.html');await p.waitForFunction(()=>SDSync.mode==='server');
   await p.click('#reportBtn');await p.fill('#rnote',bn+' server report test');await p.click('#rsend');await p.waitForFunction(()=>/Sent/.test(document.getElementById('rmsg').textContent),null,{timeout:8000});
   ok(true,bn+' report sent to server');await ctx.close()}
  await b.close();
}
console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
