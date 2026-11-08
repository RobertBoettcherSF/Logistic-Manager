# Logistic Manager (Swift Drive)

Customer demo for a Benin City ride. The trip logic is Ada, compiled to WebAssembly. The page only draws the map and reads the button. One file, no server, no account, no payment.

## Open the demo

**Visitor page, once the Pages workflow has deployed `main`:**

https://robertboettchersf.github.io/Logistic-Manager/

Pages is not switched on in the repository settings by a hand edit. `.github/workflows/pages.yml` publishes **only** `docs/` the first time it runs on `main`. Until that deploy exists, open the built file directly:

`docs/index.html`

Double-click it, or host that one file anywhere static. It does not need a network. Map tiles are not requested. The drawing is a schematic of the demo roads, so the page still shows the trip when pictures cannot load.

### What the one button does

The page opens on a synthetic sample:

- Pickup: **Oba Market**
- Destination: **National Museum**
- Service: ride
- The module routes the trip via King's Square (461 m on the schematic roads; the straight road-factor line is 451 m)
- Simulated driver **Osaro** offers **₦1,500**, the demo minimum for this short trip

**Run sample trip** asks the module to price the ride, collect offers, accept Osaro, and move him along the route. Cash is simulated. Nothing is booked, paid, or sent.

"Try another synthetic route" uses the same module for a group bus, a dispatch rider, a truck, or a private-jet charter request. The jet figure is an example quote, not a real price. The phone shipped with the form is the synthetic `08000000000`.

## Build and test

GNAT and gprbuild for the native checks. AdaWebPack 24 (GNAT-LLVM) and `wasm-ld` for the browser, the same pair [spectrum-analyzer](https://github.com/RobertBoettcherSF/spectrum-analyzer) uses. `alr` is needed only when `libgnat-14.so` is not already installed.

```sh
sudo apt install gnat gprbuild rpm2cpio cpio lld libedit2
# alr on PATH if libgnat-14.so is missing
tools/get-toolchain.sh
gprbuild -p -P swift_drive.gpr
obj/native/smoke
./build.sh
npm ci
node tests/logic_wasm.mjs
node tests/browser_demo.mjs
```

Artifact: `docs/index.html` (the WebAssembly module is inside that file).

`obj/native/smoke` and `node tests/logic_wasm.mjs` check the same integers: the sample route, Osaro at ₦1,500, the 70 percent offer floor, bus, dispatch, truck, and the example jet quotes. `node tests/browser_demo.mjs` opens `docs/index.html` from disk in Chrome, with remote requests aborted, clicks **Run sample trip**, and checks the labels.

## Pages

Do not point GitHub Pages at the repository root. That would publish `server/server.js` and the two-phone prototype. The workflow uploads `docs/` and nothing else: `index.html` and `.nojekyll`.

## Do not deploy the local relay

`server/server.js` has no authentication. It exposes `/api/state`, `/api/reports`, and `/api/reset`. Run it only on your own machine. Do not put it on a public host.

## Full prototype (local)

The two-phone prototype is unchanged. It is still plain HTML, CSS, and JavaScript, with its own fare formula in `app.js`, for a local demo. The public page does not use that copy of the rules. The Ada module is the customer demo.

Demo ride and transport app for Benin City, in the style of Bolt and inDrive.
Plain HTML/CSS/JS, no build step, no accounts. Works in Safari 15 (iPhone 7 Plus) and Chrome on old Android (Infinix).

### What it does
- **Customer / Driver** switch at the top. Both roles live in one app.
- Services: 🚗 Ride (car), 🚌 Group bus (seat count), 🏍️ Dispatch rider (motorbike parcels: size + recipient phone), 🚚 Truck (load description), ✈️ Private jet (charter request, full-width tile under the 2×2 grid).
- **Private jet (v0.2)**: Swift Drive is *not* an airline. The customer sends a charter **request** – From/To (city or airport, free text with suggestions: Benin Airport BNI, Lagos LOS, Abuja ABV, Accra ACC, Port Harcourt PHC, Asaba ABB; quick chips BNI/LOS/ABV/ACC), date, time, passengers 1–12, optional notes, phone. No fixed fare: *"Price on request; a charter operator confirms."* Charter operators (Driver role → vehicle **✈️ Charter operator**) see the request and send a quote in ₦; the customer accepts a quote; the operator marks it booked. Payment and flight details are arranged directly with the operator (commission model later). In demo mode a **simulated operator** answers with a quote marked **EXAMPLE QUOTE – not a real price**.
- Tap the map: first tap = pickup, second = destination. A suggested fare in ₦ is calculated from distance; the customer can offer their own price (min 70 % of the suggestion), inDrive style.
- Drivers see only requests for their vehicle (Dispatch rider goes to motorbike drivers), and can **Accept**, **Counter** or **Decline**.
- Status: requested → offers → accepted → arriving → on trip / in delivery → done. **Cash only.**
- **Verify** button: DEMO ONLY. Phone number + ID photo field; nothing is checked or uploaded; gives a "verified (demo)" badge.
- **Simulated drivers** of each type move on the map and send offers, so the demo works with only one phone. (`?sim=0` turns them off.)
- **Report** button on every screen (see below).

### How to try the two-phone prototype
1. Open the link we send on WhatsApp (iPhone: Safari, Android: Chrome).
2. iPhone: Share → **Add to Home Screen**. Android: menu ⋮ → **Add to Home screen / Install app**. It now opens like an app.
3. Two-phone demo: one phone as **Customer**, the other as **Driver** (pick the vehicle, Go online). With the server link both phones see each other live. Without the server, one phone alone works with the simulated drivers.

Offline-file version: `dist/swift-drive.html` is one self-contained file of that prototype (demo mode, simulated drivers). It still needs internet for the map pictures. The visitor demo in `docs/index.html` does not.
On Android, save it from WhatsApp to Downloads and open it with Chrome. On iPhone, WhatsApp/Files only show a *preview* of .html files and do not run the app inside them, so the iPhone needs the link.

### How reports reach us
Tap **Report** in the local prototype, write what happened, then:
- **Send report** → goes to the Swift Drive server (`server/reports/*.json`). With no connection it is saved on the phone and sent automatically later.
- **Share via WhatsApp** → opens WhatsApp with the report text; send it to the developer.
- **Copy report text** → paste anywhere.
Each report has: app version, phone/browser, screen size, network type (Android), online state, the last 50 taps/events, any JS errors (captured automatically) and the current screen/request.

The public demo does not send reports.

### Running the prototype (developer)
```
node server/server.js            # http://localhost:8787  (PORT=… to change)
node tools/build-single.mjs      # rebuild dist/swift-drive.html
node server/server.js & node tests/flow.mjs   # Playwright tests, WebKit + Chromium
```
API: `GET /api/ping`, `GET /api/state`, `POST /api/event`, `POST /api/report`, `GET /api/reports`, `POST /api/reset`, WebSocket `/ws`.
`?mode=local` forces demo mode on a hosted copy.

Map: Leaflet 1.9.4 (BSD-2) + OpenStreetMap tiles (© OpenStreetMap contributors). Fine for a local demo; heavy use needs our own tile provider. The public page does not load those tiles.

### Landmarks (demo pickup/destination list)
Public places only; coordinates from OpenStreetMap (© OSM contributors, ODbL), looked up 2026-10-16 via Nominatim / Overpass:
- Ikpoba (place) node 501450864 · Oregbeni (place) node 501455400 · Ramat Park Flyover way 1486537391
- Edo College node 979962730 · Akwa Ibom Motor Park node 2349475706 · Vegetable Market node 2349475773
- Central Hospital way 499729830 · Oba Market way 759470271 · Benin City National Museum relation 7326215
"Use my location" runs only on tap in the local prototype; the GPS point is kept in memory for the current trip and never stored or sent.

The public page uses those landmark coordinates. The roads between them, and the junctions (Ring Road, King's Square, Akpakpava, Airport Road), are a schematic graph for the demo, not a survey.

## Limitations

- The public map is schematic. It is not a turn-by-turn road network and it does not load map tiles.
- Fares in the public page are the Ada integer form of the v0.2 rules: minimum applied before the seat or parcel multiplier, then half-up to ₦50. The sample ride still lands on ₦1,500.
- Drivers, phones, loads, and the jet quote are synthetic. There is no booking and no message.
- The WebAssembly link does not run Ada elaboration by itself. The page calls `sd_load_sample` when the module starts, which builds the road graph and loads the sample.
- This core is tested by the native binary and the embedded module returning the same integers. It is not a SPARK proof.
- `dist/swift-drive.html` remains the offline copy of the older JavaScript prototype. It is not the Pages artifact.
