# Logistic Manager (Swift Drive) – prototype v0.2 (demo)

Demo ride and transport app for Benin City, in the style of Bolt and inDrive.
Plain HTML/CSS/JS, no build step, no accounts. Works in Safari 15 (iPhone 7 Plus) and Chrome on old Android (Infinix).

## What it does
- **Customer / Driver** switch at the top. Both roles live in one app.
- Services: 🚗 Ride (car), 🚌 Group bus (seat count), 🏍️ Dispatch rider (motorbike parcels: size + recipient phone), 🚚 Truck (load description), ✈️ Private jet (charter request, full-width tile under the 2×2 grid).
- **Private jet (v0.2)**: Swift Drive is *not* an airline. The customer sends a charter **request** – From/To (city or airport, free text with suggestions: Benin Airport BNI, Lagos LOS, Abuja ABV, Accra ACC, Port Harcourt PHC, Asaba ABB; quick chips BNI/LOS/ABV/ACC), date, time, passengers 1–12, optional notes, phone. No fixed fare: *"Price on request; a charter operator confirms."* Charter operators (Driver role → vehicle **✈️ Charter operator**) see the request and send a quote in ₦; the customer accepts a quote; the operator marks it booked. Payment and flight details are arranged directly with the operator (commission model later). In demo mode a **simulated operator** answers with a quote marked **EXAMPLE QUOTE – not a real price**.
- Tap the map: first tap = pickup, second = destination. A suggested fare in ₦ is calculated from distance; the customer can offer their own price (min 70 % of the suggestion), inDrive style.
- Drivers see only requests for their vehicle (Dispatch rider goes to motorbike drivers), and can **Accept**, **Counter** or **Decline**.
- Status: requested → offers → accepted → arriving → on trip / in delivery → done. **Cash only.**
- **Verify** button: DEMO ONLY. Phone number + ID photo field; nothing is checked or uploaded; gives a "verified (demo)" badge.
- **Simulated drivers** of each type move on the map and send offers, so the demo works with only one phone. (`?sim=0` turns them off.)
- **Report** button on every screen (see below).

## How to try it
1. Open the link we send on WhatsApp (iPhone: Safari, Android: Chrome).
2. iPhone: Share → **Add to Home Screen**. Android: menu ⋮ → **Add to Home screen / Install app**. It now opens like an app.
3. Two-phone demo: one phone as **Customer**, the other as **Driver** (pick the vehicle, Go online). With the server link both phones see each other live. Without the server, one phone alone works with the simulated drivers.

Offline-file version: `dist/swift-drive.html` is one self-contained file (demo mode, simulated drivers). It still needs internet for the map pictures.
On Android, save it from WhatsApp to Downloads and open it with Chrome. On iPhone, WhatsApp/Files only show a *preview* of .html files and do not run the app inside them, so the iPhone needs the link.

## How reports reach us
Tap **Report**, write what happened, then:
- **Send report** → goes to the Swift Drive server (`server/reports/*.json`). With no connection it is saved on the phone and sent automatically later.
- **Share via WhatsApp** → opens WhatsApp with the report text; send it to the developer.
- **Copy report text** → paste anywhere.
Each report has: app version, phone/browser, screen size, network type (Android), online state, the last 50 taps/events, any JS errors (captured automatically) and the current screen/request.

## Running it (developer)
```
node server/server.js            # http://localhost:8787  (PORT=… to change)
node tools/build-single.mjs      # rebuild dist/swift-drive.html
node server/server.js & node tests/flow.mjs   # Playwright tests, WebKit + Chromium
```
API: `GET /api/ping`, `GET /api/state`, `POST /api/event`, `POST /api/report`, `GET /api/reports`, `POST /api/reset`, WebSocket `/ws`.
`?mode=local` forces demo mode on a hosted copy.

Map: Leaflet 1.9.4 (BSD-2) + OpenStreetMap tiles (© OpenStreetMap contributors). Fine for a demo; heavy use needs our own tile provider.

## Landmarks (demo pickup/destination list)
Public places only; coordinates from OpenStreetMap (© OSM contributors, ODbL), looked up 2026-10-16 via Nominatim / Overpass:
- Ikpoba (place) node 501450864 · Oregbeni (place) node 501455400 · Ramat Park Flyover way 1486537391
- Edo College node 979962730 · Akwa Ibom Motor Park node 2349475706 · Vegetable Market node 2349475773
- Central Hospital way 499729830 · Oba Market way 759470271 · Benin City National Museum relation 7326215
"Use my location" runs only on tap; the GPS point is kept in memory for the current trip and never stored or sent.
