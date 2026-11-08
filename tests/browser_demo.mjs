// Opens the single self-contained file in Chrome. No server.
// Map tiles and any other remote request are aborted.
import { chromium } from 'playwright-core';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'docs/index.html');
const url = pathToFileURL(htmlPath).href;
const shots = path.join(root, 'shots');
const artifacts = '/opt/cursor/artifacts';
mkdirSync(shots, { recursive: true });
function writableDir(dir) {
  try { mkdirSync(dir, { recursive: true }); return true; }
  catch (e) { return false; }
}
const saveArtifacts = writableDir(artifacts);

function chromePath() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);
  candidates.push(
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/local/bin/google-chrome-stable',
    '/usr/local/bin/google-chrome'
  );
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  const which = spawnSync('which', ['google-chrome'], { encoding: 'utf8' });
  const found = (which.stdout || '').trim();
  if (which.status === 0 && found && existsSync(found)) return found;
  throw new Error('Chrome executable not found. Install google-chrome or set CHROME_PATH. This test does not skip the browser.');
}

const bytes = Buffer.from(readFileSync(htmlPath, 'utf8').match(/var WASM = "([A-Za-z0-9+/=]+)";/)[1], 'base64');
if (bytes.subarray(0, 4).toString('latin1') !== '\0asm') {
  console.error('docs/index.html has no embedded wasm');
  process.exit(1);
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ', m); } else { fail++; console.log('  FAIL', m); } };
const net = [];
const chrome = chromePath();
console.log('  chrome', chrome);
const browser = await chromium.launch({
  executablePath: chrome,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

async function buttonInView(page) {
  const box = await page.locator('#runSample').boundingBox();
  const vp = page.viewportSize();
  return !!box && box.y >= 0 && box.y + box.height <= vp.height + 1;
}

const context = await browser.newContext({ viewport: { width: 414, height: 736 }, deviceScaleFactor: 1 });
await context.route('**/*', route => {
  const req = route.request();
  const u = req.url();
  net.push(req.method() + ' ' + u);
  if (u.startsWith('file:') || u.startsWith('data:')) return route.continue();
  return route.abort();
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
await page.goto(url);
await page.waitForFunction(() => window.__wasmReady === true, null, { timeout: 10000 });

ok(await page.locator('button.go').count() === 1, 'one primary button');
ok((await page.locator('#runSample').innerText()) === 'Run sample trip', 'button says Run sample trip');
ok(await buttonInView(page), 'button is on screen at phone size');
const banner = await page.locator('#banner').innerText();
ok(/SYNTHETIC DEMO/.test(banner) && /not a real booking/.test(banner), 'demo banner from the module');
ok(/No map tiles/.test(await page.locator('#offlineNote').innerText()), 'offline map note');
const route = await page.locator('#routeLine').innerText();
ok(route.includes('Oba Market') && route.includes('National Museum') && route.includes("King's Square"), 'default route text ' + route);
ok((await page.locator('#sampleDriver').innerText()) === 'Osaro', 'sample driver Osaro');
ok(/simulated/.test(await page.locator('#sampleNote').innerText()), 'simulated label');
const live = await page.evaluate(() => ({
  fare: document.getElementById('fare').textContent,
  suggested: window.sd.sd_suggested(),
  metres: window.sd.sd_distance_m(),
  direct: window.sd.sd_direct_m(),
  driver: document.getElementById('sampleDriver').textContent
}));
ok(live.suggested === 1500 && live.fare.replace(/\D/g, '') === '1500', 'shown fare is the module fare');
ok(live.metres === 461 && live.direct === 451, 'module route 461, straight line 451');
ok(live.driver === 'Osaro', 'driver name is the export');

await page.setViewportSize({ width: 1280, height: 800 });
await page.waitForTimeout(100);
ok(await buttonInView(page), 'button is on screen at desktop size');
await page.setViewportSize({ width: 414, height: 736 });

await page.locator('#more > summary').click();
await page.fill('#offerIn', '100');
await page.click('#requestCustom');
ok(/70 percent/.test(await page.locator('#error').innerText()), 'low offer is refused by Ada');
ok((await page.locator('#status').innerText()).includes('Ready'), 'low offer does not start a trip');

await page.click('#runSample');
await page.waitForFunction(() => /Osaro/.test(document.getElementById('offers').innerText) && /1,500/.test(document.getElementById('offers').innerText), null, { timeout: 5000 });
ok(/simulated/.test(await page.locator('#offers').innerText()), 'offer is marked simulated');
await page.screenshot({ path: path.join(shots, 'wasm-sample-offers.png'), fullPage: true });
if (saveArtifacts) await page.screenshot({ path: path.join(artifacts, 'wasm-sample-offers.png'), fullPage: true });
await page.waitForFunction(() => /Done/.test(document.getElementById('status').innerText), null, { timeout: 20000 });
const done = await page.evaluate(() => ({
  status: window.sd.sd_status(),
  price: window.sd.sd_price(),
  nameLen: window.sd.sd_driver_name_len(),
  lat: window.sd.sd_driver_lat_u(),
  museum: window.sd.sd_place_lat_u(8)
}));
let name = '';
name = await page.evaluate(() => {
  let s = '';
  for (let i = 0; i < window.sd.sd_driver_name_len(); i++) s += String.fromCharCode(window.sd.sd_driver_name_char(i));
  return s;
});
ok(done.status === 6 && done.price === 1500 && name === 'Osaro' && done.lat === done.museum, 'trip ends with Osaro at the Museum for 1500');
ok(/Nothing was booked/.test(await page.locator('#status').innerText()), 'done state says nothing was booked');
await page.screenshot({ path: path.join(shots, 'wasm-sample-done.png'), fullPage: true });
if (saveArtifacts) await page.screenshot({ path: path.join(artifacts, 'wasm-sample-done.png'), fullPage: true });
ok(errors.length === 0, 'no page errors ' + errors.join('; '));
const posts = net.filter(x => /^(POST|PUT|PATCH|DELETE) /.test(x));
const remote = net.filter(x => /^[A-Z]+ https?:/i.test(x));
ok(posts.length === 0, 'no POST/PUT/PATCH/DELETE (' + posts.length + ')');
ok(remote.length === 0, 'no http(s) requests (' + remote.length + ')');
await browser.close();
console.log(`\nbrowser_demo: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
