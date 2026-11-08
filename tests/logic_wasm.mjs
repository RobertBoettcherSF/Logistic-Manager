// Deterministic checks of the Ada core inside docs/index.html.
// The numbers are the same ones src/smoke.adb checks natively.
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'docs/index.html');
const templatePath = path.join(root, 'web/template.html');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ', m); } else { fail++; console.log('  FAIL', m); } };

const html = readFileSync(htmlPath, 'utf8');
const template = readFileSync(templatePath, 'utf8');
const forbidden = ['api/report', 'openstreetmap', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'fetch('];
for (const word of forbidden) {
  ok(!html.includes(word), `built page has no ${word}`);
  ok(!template.includes(word), `template has no ${word}`);
}
for (const word of ['Osaro', '1500', "King's Square", '461']) {
  ok(!template.includes(word), `template does not hardcode ${word}`);
}
ok(html.includes('WebAssembly.instantiate'), 'page instantiates WebAssembly');
ok(html.includes('Run sample trip'), 'one-button label is in the page');
ok(html.includes('id="runSample"'), 'sample button id');
const docs = readdirSync(path.join(root, 'docs')).sort();
ok(JSON.stringify(docs) === JSON.stringify(['.nojekyll', 'index.html']), 'docs/ is only the demo (' + docs.join(', ') + ')');

const match = html.match(/var WASM = "([A-Za-z0-9+/=]+)";/);
ok(!!match, 'embedded wasm base64');
const bytes = Buffer.from(match ? match[1] : '', 'base64');
ok(bytes.length > 1000 && bytes.subarray(0, 4).toString('latin1') === '\0asm', 'embedded bytes are WebAssembly (' + bytes.length + ')');

function str0(e, len, ch) {
  let s = '';
  const n = len();
  for (let k = 0; k < n; k++) s += String.fromCharCode(ch(k));
  return s;
}
function stri(e, len, ch, i) {
  let s = '';
  const n = len(i);
  for (let k = 0; k < n; k++) s += String.fromCharCode(ch(i, k));
  return s;
}
function setLoad(e, text) {
  for (let i = 0; i < text.length; i++) e.sd_set_load_char(i, text.charCodeAt(i));
  e.sd_set_load_len(text.length);
}
async function drive(e) {
  let n = 0, st = 0;
  do { st = e.sd_tick(); n++; } while (st !== 6 && st !== 7 && n < 1000);
  return [st, n];
}

const mod = await WebAssembly.instantiate(bytes);
const e = mod.instance.exports;
ok(e.sd_ready() === 1, 'ready');
e.sd_load_sample();
ok(e.sd_logic_version() === 1, 'logic version');
ok(str0(e, e.sd_banner_len, e.sd_banner_char) === 'SYNTHETIC DEMO - not a real booking or payment', 'banner');
ok(str0(e, e.sd_sample_driver_len, e.sd_sample_driver_char) === 'Osaro', 'sample driver');
ok(str0(e, e.sd_sample_note_len, e.sd_sample_note_char) === 'simulated driver', 'sample note');
ok(stri(e, e.sd_place_name_len, e.sd_place_name_char, 7) === 'Oba Market', 'Oba Market');
ok(stri(e, e.sd_place_name_len, e.sd_place_name_char, 8) === 'National Museum', 'National Museum');
ok(stri(e, e.sd_place_name_len, e.sd_place_name_char, 10) === "King's Square", "King's Square");
ok(e.sd_direct_m() === 451, 'direct 451 m');
ok(e.sd_distance_m() === 461, 'routed 461 m');
ok(e.sd_direct_m() !== e.sd_distance_m(), 'route is not the straight line');
ok(e.sd_route_len() === 3 && e.sd_route_place(0) === 7 && e.sd_route_place(1) === 10 && e.sd_route_place(2) === 8, 'Oba, King\'s Square, Museum');
ok(e.sd_suggested() === 1500 && e.sd_min_offer() === 1050 && e.sd_offer() === 1500, 'fare 1500, minimum 1050');
ok(e.sd_quote(0, 20000, 1, 0) === 5600, '20 km ride 5600');
ok(e.sd_quote(3, 20000, 1, 0) === 21000, '20 km truck 21000');
ok(e.sd_quote(1, 7350, 6, 0) === 5350, 'bus quote');
ok(e.sd_quote(2, 7350, 1, 1) === 1700, 'dispatch quote');
ok(e.sd_quote(0, 7350, 1, 0) === 2450, 'long ride quote');
ok(e.sd_quote(4, 1000, 1, 0) === 0, 'jet quote function is 0');
ok(e.sd_jet_quote(0, 1) === 18500000 && e.sd_jet_quote(0, 3) === 32000000, 'example charter quotes');

e.sd_load_sample();
e.sd_set_offer(1000);
ok(e.sd_request() === 2 && e.sd_status() === 0 && e.sd_offer_count() === 0, 'low offer rejected');
ok(str0(e, e.sd_error_len, e.sd_error_char).includes('70 percent'), 'low-offer text');
e.sd_set_offer(1050);
ok(e.sd_request() === 0 && e.sd_offer_count() === 3, 'minimum offer accepted');

e.sd_load_sample();
e.sd_set_dest(7);
ok(e.sd_request() === 1, 'same place rejected');

e.sd_load_sample();
e.sd_set_pick(0);
e.sd_set_dest(8);
ok(e.sd_distance_m() === 5347 && e.sd_suggested() === 1950, 'Ikpoba to Museum 5347 m, 1950');
ok([0, 12, 4, 5, 11, 10, 8].every((n, i) => e.sd_route_place(i) === n), 'long route nodes');

let bad = 0;
for (let a = 0; a <= 8; a++) {
  for (let b = 0; b <= 8; b++) {
    if (a !== b) {
      if (e.sd_set_pick(a) !== 0 || e.sd_set_dest(b) !== 0 || e.sd_distance_m() < 1 || e.sd_distance_m() > 100000) bad++;
    }
  }
}
ok(bad === 0, 'landmark pairs connect');

e.sd_load_sample();
ok(e.sd_start_sample() === 0 && e.sd_status() === 2 && e.sd_auto() === 1, 'sample starts in offers');
ok(stri(e, e.sd_offer_name_len, e.sd_offer_name_char, 0) === 'Osaro' && e.sd_offer_price(0) === 1500 && e.sd_offer_sim(0) === 1, 'Osaro offers 1500');
ok(stri(e, e.sd_offer_name_len, e.sd_offer_name_char, 1) === 'Efosa' && e.sd_offer_price(1) === 1650, 'Efosa 1650');
ok(stri(e, e.sd_offer_name_len, e.sd_offer_name_char, 2) === 'Ada' && e.sd_offer_price(2) === 1800, 'third counter 1800');
let [st, n] = await drive(e);
ok(st === 6 && n < 1000 && e.sd_price() === 1500, 'sample finishes at 1500');
ok(str0(e, e.sd_driver_name_len, e.sd_driver_name_char) === 'Osaro', 'accepted Osaro');
ok(e.sd_driver_lat_u() === e.sd_place_lat_u(8) && e.sd_driver_lng_u() === e.sd_place_lng_u(8), 'finishes at the Museum');
ok(e.sd_tick() === 6, 'done stays done');

e.sd_load_sample();
e.sd_set_service(1);
e.sd_set_seats(6);
ok(e.sd_suggested() === 2400 && e.sd_request() === 0, 'bus 2400');
ok(stri(e, e.sd_offer_name_len, e.sd_offer_name_char, 0) === 'Osas' && e.sd_offer_price(0) === 2400, 'Osas');
ok(stri(e, e.sd_offer_name_len, e.sd_offer_name_char, 1) === 'Uyi' && e.sd_offer_price(1) === 2650, 'Uyi');

e.sd_load_sample();
e.sd_set_service(2);
e.sd_set_contact_len(0);
ok(e.sd_request() === 4, 'dispatch needs a phone');
e.sd_load_sample();
e.sd_set_service(2);
e.sd_set_size(1);
ok(e.sd_suggested() === 850 && e.sd_request() === 0, 'medium dispatch 850');
ok(stri(e, e.sd_offer_name_len, e.sd_offer_name_char, 0) === 'Ehi', 'Ehi');
ok(e.sd_accept(0) === 0, 'accept Ehi');
[st, n] = await drive(e);
ok(st === 6 && e.sd_price() === 850, 'Ehi completes at 850');

e.sd_load_sample();
e.sd_set_service(3);
e.sd_set_load_len(0);
ok(e.sd_request() === 5, 'truck needs a load');
setLoad(e, 'boxes');
ok(e.sd_request() === 0 && e.sd_suggested() === 15000, 'truck minimum 15000');
ok(stri(e, e.sd_offer_name_len, e.sd_offer_name_char, 0) === 'Eki', 'Eki');

e.sd_load_sample();
e.sd_set_service(4);
e.sd_set_pax(13);
ok(e.sd_request() === 6, '13 passengers rejected');
e.sd_set_pax(4);
ok(e.sd_request() === 0 && e.sd_offer_example(0) === 1 && e.sd_offer_price(0) === 18500000, 'domestic example quote');
ok(str0(e, e.sd_quote_note_len, e.sd_quote_note_char).includes('EXAMPLE QUOTE'), 'example label');
ok(str0(e, e.sd_quote_note_len, e.sd_quote_note_char).includes('not a real price'), 'not a real price');
e.sd_set_to_airport(3);
ok(e.sd_request() === 0 && e.sd_offer_price(0) === 32000000, 'Accra example quote');
ok(e.sd_accept(0) === 0, 'accept example');
[st, n] = await drive(e);
ok(st === 6 && e.sd_price() === 32000000, 'jet example completes');

const again = await WebAssembly.instantiate(bytes);
const e2 = again.instance.exports;
e2.sd_load_sample();
ok(e2.sd_distance_m() === 461 && e2.sd_suggested() === 1500 && e2.sd_direct_m() === 451, 'second module is the same');

console.log(`\nlogic_wasm: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
