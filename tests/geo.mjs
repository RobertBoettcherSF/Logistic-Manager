// Geolocation + landmarks in WebKit, iPhone 7 Plus. Usage: node tests/geo.mjs [url]
import { createRequire } from 'module';const require=createRequire('/workspace/pw/');const {webkit,devices}=require('playwright');
const URL=process.argv[2]||'file://'+new globalThis.URL('../dist/swift-drive.html',import.meta.url).pathname;
const SHOT=process.argv[3];let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log(c?'  ok  ':'  FAIL',m)};
const b=await webkit.launch();
async function page(mode){const c=await b.newContext({...devices['iPhone 7 Plus']});
 await c.addInitScript(m=>{Object.defineProperty(window,'isSecureContext',{get:()=>true});const g={getCurrentPosition(s,e){window.__geoCalls=(window.__geoCalls||0)+1;setTimeout(()=>m==='ok'?s({coords:{latitude:6.34995,longitude:5.65480,accuracy:12}}):e({code:m==='denied'?1:3,message:m}),50)}};Object.defineProperty(navigator,'geolocation',{get:()=>g})},mode);
 const p=await c.newPage();p.errs=[];p.on('pageerror',x=>p.errs.push(x.message));await p.goto(URL+(URL.includes('?')?'&':'?')+'sim=0');await p.waitForTimeout(800);return [c,p]}
let [c,p]=await page('ok');
ok(await p.evaluate(()=>!window.__geoCalls),'no automatic location request on load');
await p.click('#geoBtn');await p.waitForSelector('#geoMsg:has-text("Pickup set")');
const pk=await p.evaluate(()=>SDState().ui?SDState().ui.pick:null);
ok(/Not saved/.test(await p.innerText('#geoMsg')),'success: pickup set message');
ok(await p.evaluate(()=>!JSON.stringify(localStorage).includes('6.34995')&&!JSON.stringify(sessionStorage).includes('6.34995')),'success: GPS not in storage');
await p.selectOption('#destSel','6');await p.waitForSelector('#hint:has-text("Route set")');ok(true,'landmark destination makes a route');
ok(p.errs.length===0,'no page errors (success) '+p.errs.join(';'));if(SHOT)await p.screenshot({path:SHOT});await c.close();
[c,p]=await page('denied');await p.click('#geoBtn');await p.waitForSelector('#geoMsg:has-text("denied")');
ok(/permission denied/i.test(await p.innerText('#geoMsg')),'denied: visible message');ok(p.errs.length===0,'no page errors (denied)');await c.close();
[c,p]=await page('timeout');await p.click('#geoBtn');await p.waitForSelector('#geoMsg:has-text("too long")');ok(true,'timeout: visible message');await c.close();
await b.close();console.log(`geo: ${pass} passed, ${fail} failed`);process.exit(fail?1:0);
