var V='sd-v0.2.0',SHELL=['./','index.html','app.css','app.js','sync.js','report.js','manifest.webmanifest','vendor/leaflet.js','vendor/leaflet.css','icons/icon-192.png','icons/icon-180.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V&&k!=='sd-tiles'}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(e.request.method!=='GET')return;
 if(u.pathname.indexOf('/api/')>=0||u.pathname.indexOf('/ws')>=0)return;
 if(/tile\.openstreetmap\.org$/.test(u.hostname)){e.respondWith(caches.open('sd-tiles').then(function(c){return c.match(e.request).then(function(hit){return hit||fetch(e.request).then(function(r){if(r.ok||r.type==='opaque'){c.put(e.request,r.clone());c.keys().then(function(ks){if(ks.length>400)c.delete(ks[0])})}return r})})}));return}
 if(u.origin!==location.origin)return;
 // network first (so updates arrive), cache fallback when offline
 e.respondWith(fetch(e.request).then(function(r){var cl=r.clone();caches.open(V).then(function(c){c.put(e.request,cl)});return r}).catch(function(){return caches.match(e.request,{ignoreSearch:true})}))});
