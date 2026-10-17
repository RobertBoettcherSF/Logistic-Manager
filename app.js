(function(){var n=document.getElementById('nojs');if(n)n.parentNode.removeChild(n)})();
/* Swift Drive v0.1 prototype – customer + driver in one app. Plain ES2017, Safari 15 safe. */
(function(){
'use strict';
var CENTER=[6.3350,5.6037];// Benin City (Ring Road)
var SERVICES={
 ride:{label:'Ride',icon:'🚗',base:600,km:250,min:1500,veh:['car'],cap:'up to 4 people'},
 bus:{label:'Group bus',icon:'🚌',base:300,km:80,min:400,veh:['bus'],cap:'per seat, up to 18'},
 dispatch:{label:'Dispatch rider',icon:'🏍️',base:400,km:110,min:600,veh:['bike'],cap:'motorbike parcel delivery'},
 truck:{label:'Truck',icon:'🚚',base:5000,km:800,min:15000,veh:['truck'],cap:'goods / moving'},
 jet:{label:'Private jet',icon:'✈️',charter:true,veh:['jet'],cap:'charter request · Swift Drive passes it to charter operators'}};
// Private jet = charter REQUEST only (we are not an airline): no fixed fare, an operator answers with a quote.
var AIRPORTS=['Benin Airport (BNI), Benin City','Lagos – Murtala Muhammed (LOS)','Abuja – Nnamdi Azikiwe (ABV)','Accra – Kotoka (ACC), Ghana','Port Harcourt (PHC)','Asaba (ABB)'];
var VEH={car:'🚗 Car',bike:'🏍️ Motorbike',bus:'🚌 Bus',truck:'🚚 Truck',jet:'✈️ Charter operator'};
var SIZE={small:1,medium:1.4,large:2};
var STEPS=['requested','offers','accepted','arriving','moving','done'];
var R=SDReport;
function $(id){return document.getElementById(id)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function naira(n){return '₦'+Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',')}
function r50(n){return Math.round(n/50)*50}
function km(a,b){var R6=6371,dl=(b.lat-a.lat)*Math.PI/180,dg=(b.lng-a.lng)*Math.PI/180,x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dg/2)*Math.sin(dg/2);return 2*R6*Math.asin(Math.sqrt(x))*1.3}// x1.3 road factor
function fare(svc,d,f){var s=SERVICES[svc],v=Math.max(s.min,s.base+s.km*d);if(svc==='bus')v=Math.max(s.min,s.base+s.km*d)*(f.seats||1);if(svc==='dispatch')v=v*(SIZE[f.size]||1);return r50(v)}
function statusText(r){if(r.service==='jet')return {requested:'Request sent – waiting for charter operators…',offers:'Operator quote received',accepted:'Quote accepted – the operator will call you to confirm',done:'Booked – pay the operator directly',cancelled:'Cancelled'}[r.status]||r.status;var mv=(r.service==='dispatch'||r.service==='truck')?'In delivery':'On trip';return {requested:'Looking for drivers…',offers:'Drivers are offering',accepted:'Driver accepted',arriving:'Driver arriving',moving:mv,done:'Done – pay cash',cancelled:'Cancelled'}[r.status]||r.status}

// ---------- identity ----------
var tab=sessionStorage.getItem('sd_tab');if(!tab){tab='u'+Math.random().toString(36).slice(2,8);sessionStorage.setItem('sd_tab',tab)}
var prof={};try{prof=JSON.parse(localStorage.getItem('sd_prof')||'{}')}catch(e){}
function saveProf(){localStorage.setItem('sd_prof',JSON.stringify(prof))}
var q=location.search;
var ui={role:/role=driver/.test(q)?'driver':(sessionStorage.getItem('sd_role')||'customer'),svc:'ride',pick:null,dest:null,f:{seats:2,size:'small'},offer:null,myReq:null,j:{from:'',to:'',date:new Date(Date.now()+864e5).toISOString().slice(0,10),time:'10:00',pax:2,notes:'',contact:''},
  veh:sessionStorage.getItem('sd_veh')||'car',online:false,declined:{},sim:!/sim=0/.test(q),dname:sessionStorage.getItem('sd_dname')||''};
// Public landmarks (coordinates from OpenStreetMap, see README "Landmarks")
var PLACES=[['Ikpoba (area, Ikpoba Hill)',6.35001,5.65000],['Oregbeni (area)',6.34920,5.65667],['Ramat Park Flyover',6.34978,5.66060],['Edo College',6.33233,5.64695],['Akwa Ibom Motor Park',6.34574,5.63510],['Vegetable Market (Akpakpava area)',6.34620,5.63287],['Central Hospital',6.33058,5.62283],['Oba Market',6.33487,5.61968],['National Museum, King\'s Square',6.33291,5.62212]];
var reqs={};

// ---------- map ----------
var map=L.map('map',{zoomControl:false,attributionControl:true}).setView(CENTER,13);
var tl=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(map);
(function(){var ok=0,bad=0;function show(){var e=document.getElementById('maperr');if(e)e.style.display='block'}tl.on('tileload',function(){ok++});tl.on('tileerror',function(){bad++;if(!ok)show()});setTimeout(function(){if(!ok)show()},8000)})();
function icon(t,cls){return L.divIcon({className:'mk '+(cls||''),html:t,iconSize:[24,24],iconAnchor:[12,12]})}
var mPick=null,mDest=null,line=null,reqLayer=L.layerGroup().addTo(map),simLayer=L.layerGroup().addTo(map);
function drawRoute(){if(mPick){map.removeLayer(mPick);mPick=null}if(mDest){map.removeLayer(mDest);mDest=null}if(line){map.removeLayer(line);line=null}
 var r=ui.myReq&&reqs[ui.myReq],p=r?r.pick:ui.pick,d=r?r.dest:ui.dest;if(!r&&ui.svc==='jet')p=d=null;if(ui.role==='driver'){var j=myJob();if(j){p=j.pick;d=j.dest}else{p=d=null}}
 if(p)mPick=L.marker([p.lat,p.lng],{icon:icon('🟢')}).addTo(map);if(d)mDest=L.marker([d.lat,d.lng],{icon:icon('🏁')}).addTo(map);
 if(p&&d)line=L.polyline([[p.lat,p.lng],[d.lat,d.lng]],{color:'#0a7a3e',dashArray:'6 6'}).addTo(map)}
map.on('click',function(e){if(ui.role!=='customer'||ui.myReq||ui.svc==='jet')return;var pt={lat:+e.latlng.lat.toFixed(5),lng:+e.latlng.lng.toFixed(5)};
 if(!ui.pick)ui.pick=pt;else if(!ui.dest)ui.dest=pt;else{ui.pick=pt;ui.dest=null}ui.offer=null;R.log('map-tap',pt);drawRoute();render()});

// ---------- simulated drivers (demo) ----------
var NAMES=['Osaro','Efosa','Ehi','Nosa','Ivie','Osas','Uyi','Eki','Ada','Femi','Tunde','Bisi'];
var sims=[];['car','car','bike','bike','bike','bus','bus','truck','car','bike','car','truck'].forEach(function(v,i){sims.push({id:'sim'+i,name:NAMES[i],veh:v,lat:CENTER[0]+(Math.random()-.5)*.05,lng:CENTER[1]+(Math.random()-.5)*.06,busy:null,tLat:null,tLng:null})});
function drawSims(){simLayer.clearLayers();if(!ui.sim)return;sims.forEach(function(s){L.marker([s.lat,s.lng],{icon:icon(VEH[s.veh].split(' ')[0],'sim'),interactive:false}).addTo(simLayer)})}
setInterval(function(){if(!ui.sim)return;sims.forEach(function(s){if(s.tLat!=null){s.lat+=(s.tLat-s.lat)*.3;s.lng+=(s.tLng-s.lng)*.3}else{s.lat+=(Math.random()-.5)*.002;s.lng+=(Math.random()-.5)*.002}});drawSims()},2000);
function simReact(r){if(!ui.sim||r.customer!==tab||r.status!=='requested'||r._simDone)return;r._simDone=1;
 if(r.service==='jet'){if(SDSync.mode!=='local')return;setTimeout(function(){var cur=reqs[r.id];if(!cur||(cur.status!=='requested'&&cur.status!=='offers'))return;
  var intl=/ACC|Accra|Ghana/i.test(r.f.from+' '+r.f.to);SDSync.send({t:'offer',rid:r.id,o:{driver:'simjet',name:'Demo charter operator',veh:'jet',price:intl?32000000:18500000,note:'Light jet, up to 7 seats. Example only.',example:true,verified:false,sim:true}})},1500);return}
 var ok=sims.filter(function(s){return SERVICES[r.service].veh.indexOf(s.veh)>=0&&!s.busy}).slice(0,3);
 ok.forEach(function(s,i){setTimeout(function(){var cur=reqs[r.id];if(!cur||(cur.status!=='requested'&&cur.status!=='offers'))return;
  var p=i===0?r.price:r50(r.price*(1+.05+Math.random()*.2));SDSync.send({t:'offer',rid:r.id,o:{driver:s.id,name:s.name,veh:s.veh,price:p,verified:i!==2,sim:true}})},1200+i*900)})}
function simDrive(r){var s=sims.filter(function(x){return x.id===r.driver.driver})[0];if(!s||s.busy)return;s.busy=r.id;s.tLat=r.pick.lat;s.tLng=r.pick.lng;
 var seq=[['arriving',2500],['moving',6000],['done',10000]];seq.forEach(function(x){setTimeout(function(){var c=reqs[r.id];if(!c||c.status==='cancelled'||c.status==='done')return;
  if(x[0]==='moving'){s.tLat=r.dest.lat;s.tLng=r.dest.lng}if(x[0]==='done'){s.busy=null;s.tLat=null}SDSync.send({t:'status',rid:r.id,s:x[0]})},x[1])})}

// ---------- reducer ----------
function apply(ev){var r=ev.rid&&reqs[ev.rid];
 if(ev.t==='req'){reqs[ev.r.id]=ev.r;if(ev.r.customer===tab)ui.myReq=ev.r.id;simReact(reqs[ev.r.id])}
 else if(!r)return;
 else if(ev.t==='offer'){r.offers=r.offers.filter(function(o){return o.driver!==ev.o.driver});r.offers.push(ev.o);if(r.status==='requested')r.status='offers'}
 else if(ev.t==='accept'){if(r.driver)return;r.driver=ev.o;r.price=ev.o.price;r.status='accepted';if(ev.o.sim&&r.customer===tab&&r.service!=='jet')simDrive(r)}
 else if(ev.t==='status'){r.status=ev.s}
 else if(ev.t==='cancel'){r.status='cancelled'}}
function onEvent(ev,remote){apply(ev);R.log('ev:'+ev.t+(remote?' (in)':' (out)'),{rid:ev.rid||(ev.r&&ev.r.id),s:ev.s});drawReqs();drawRoute();render()}

// ---------- rendering ----------
var JSTEPS=['requested','offers','accepted','done'];
function steps(r){var S=r.service==='jet'?JSTEPS:STEPS,i=S.indexOf(r.status);return '<div class="st">'+S.map(function(s,k){return '<div class="'+(k<=i?'on':'')+'"></div>'}).join('')+'</div>'}
function vbadge(v){return v?'<span class="badge">✔ verified (demo)</span>':''}
function reqLine(r){if(r.service==='jet'){var f=r.f;return '✈️ <b>Private jet</b> · '+esc(f.from)+' → '+esc(f.to)+'<div class="muted">'+esc(f.date)+' '+esc(f.time)+' · '+f.pax+' pax'+(f.notes?' · '+esc(f.notes):'')+' · ☎ '+esc(f.contact)+'</div>'}var s=SERVICES[r.service],x=s.icon+' <b>'+s.label+'</b> · '+r.dist.toFixed(1)+' km';
 if(r.service==='bus')x+=' · '+r.f.seats+' seats';if(r.service==='dispatch')x+=' · '+esc(r.f.size)+' parcel → '+esc(r.f.rphone);if(r.service==='truck')x+=' · '+esc(r.f.load);return x}
function myJob(){for(var k in reqs){var r=reqs[k];if(r.driver&&r.driver.driver===tab&&r.status!=='done'&&r.status!=='cancelled')return r}return null}
function render(){var h='',el=$('sheet');$('roleC').className=ui.role==='customer'?'on':'';$('roleD').className=ui.role==='driver'?'on':'';
 $('verifyBtn').textContent=prof.verified?'✔ Verified':'Verify';$('verifyBtn').className='chip'+(prof.verified?' ok':'');
 if(ui.role==='customer')h=renderCustomer();else h=renderDriver();el.innerHTML=h;el.setAttribute('data-screen',ui.screen||'')}
function renderCustomer(){var r=ui.myReq&&reqs[ui.myReq];
 if(r&&r.status!=='cancelled'&&!r._closed){ui.screen='c-'+r.status;var h='<h3>'+reqLine(r)+'</h3>'+steps(r)+'<div class="hint" id="cstatus">'+statusText(r)+'</div>';
  if(r.service==='jet'){h+=jetCustomer(r);return h}
  if(r.status==='requested'||r.status==='offers'){h+='<div class="muted">Your offer: <b>'+naira(r.price)+'</b> (cash). Drivers can accept or counter.</div>';
   r.offers.forEach(function(o,i){h+='<div class="card offer">'+VEH[o.veh]+' · <b>'+esc(o.name)+'</b>'+vbadge(o.verified)+(o.sim?' <span class="muted">(simulated)</span>':'')+'<div class="row"><span class="price">'+naira(o.price)+'</span><button class="btn sm" data-act="acceptOffer" data-i="'+i+'">Accept</button></div></div>'});
   h+='<button class="btn warn" data-act="cancel">Cancel request</button>'}
  else{h+='<div class="card">'+VEH[r.driver.veh]+' · <b>'+esc(r.driver.name)+'</b>'+vbadge(r.driver.verified)+'<div class="price">'+naira(r.price)+' cash</div></div>';
   if(r.status==='done')h+='<div class="hint">Please pay <b>'+naira(r.price)+'</b> in cash to the driver.</div><button class="btn" data-act="newReq">New request</button>';
   else h+='<button class="btn warn" data-act="cancel">Cancel</button>'}
  return h}
 ui.screen='c-pick';var h='<div class="grid">';Object.keys(SERVICES).forEach(function(k){var s=SERVICES[k];h+='<button class="svc'+(ui.svc===k?' on':'')+(s.charter?' wide':'')+'" data-act="svc" data-k="'+k+'" id="svc-'+k+'"><span>'+s.icon+'</span>'+s.label+'</button>'});h+='</div>';
 if(ui.svc==='jet')return h+jetForm();
 h+='<div class="hint" id="hint">'+(!ui.pick?'① Tap the map to set the <b>pickup</b> point':!ui.dest?'② Tap the map to set the <b>destination</b>':'✔ Route set ('+km(ui.pick,ui.dest).toFixed(1)+' km). Tap the map again to change.')+'</div>';
 h+='<button class="btn" data-act="geo" id="geoBtn">📍 Use my location</button>'+(ui.geoMsg?'<div class="hint" id="geoMsg" style="color:'+(ui.geoErr?'#900':'#0a7a3e')+'">'+esc(ui.geoMsg)+'</div>':'');
 var po=function(id,lab,cur){return '<div><label>'+lab+'</label><select id="'+id+'"><option value="">Choose a landmark…</option>'+PLACES.map(function(p,i){return '<option value="'+i+'"'+(cur&&cur.lat===p[1]&&cur.lng===p[2]?' selected':'')+'>'+esc(p[0])+'</option>'}).join('')+'</select></div>'};
 h+='<div class="row">'+po('pickSel','Pickup',ui.pick)+po('destSel','Destination',ui.dest)+'</div>';
 var f=ui.f;if(ui.svc==='bus')h+='<label>Seats</label><input type="number" min="1" max="18" id="seats" value="'+f.seats+'">';
 if(ui.svc==='dispatch')h+='<div class="row"><div><label>Parcel size</label><select id="size">'+['small','medium','large'].map(function(s){return '<option'+(f.size===s?' selected':'')+'>'+s+'</option>'}).join('')+'</select></div><div><label>Recipient phone</label><input id="rphone" type="tel" placeholder="080…" value="'+esc(f.rphone||'')+'"></div></div>';
 if(ui.svc==='truck')h+='<label>What are you moving?</label><input id="load" placeholder="e.g. 20 bags of cement" value="'+esc(f.load||'')+'">';
 if(ui.pick&&ui.dest){var sug=fare(ui.svc,km(ui.pick,ui.dest),f);if(!ui.offer)ui.offer=sug;
  h+='<div class="row"><div><label>Suggested fare</label><div class="price" id="sugg">'+naira(sug)+'</div></div><div><label>Your offer (₦, cash)</label><input type="number" id="offer" step="50" value="'+ui.offer+'"></div></div>';
  h+='<button class="btn" id="reqBtn" data-act="request">Request '+SERVICES[ui.svc].label+'</button>'}
 h+='<div class="muted" style="margin-top:6px">'+SERVICES[ui.svc].cap+' · Cash only'+(ui.sim?' · Demo drivers on map':'')+'</div>';return h}
function jetForm(){var j=ui.j;ui.screen='c-jet';
 var inp=function(id,lab,type,val,extra){return '<div><label for="'+id+'">'+lab+'</label><input id="'+id+'" type="'+type+'" value="'+esc(val)+'"'+(extra||'')+'></div>'};
 var h='<div class="hint" id="jetPrice">✈️ <b>Price on request; a charter operator confirms.</b> Swift Drive is not an airline – we pass your request to charter operators.</div>';
 h+='<datalist id="jetPlaces">'+AIRPORTS.map(function(a){return '<option value="'+esc(a)+'">'}).join('')+'</datalist>';
 h+=inp('jfrom','From (city or airport)','text',j.from,' list="jetPlaces" placeholder="e.g. Benin Airport (BNI)"')+inp('jto','To (city or airport)','text',j.to,' list="jetPlaces" placeholder="e.g. Lagos (LOS)"');
 h+='<div class="chips">'+[['BNI',0],['LOS',1],['ABV',2],['ACC',3]].map(function(c){return '<button class="chip2" data-act="jetPick" data-i="'+c[1]+'">'+c[0]+'</button>'}).join('')+'<span class="muted"> tap: fills From, then To</span></div>';
 h+='<div class="row">'+inp('jdate','Date','date',j.date)+inp('jtime','Time','time',j.time)+'</div>';
 h+='<div class="row">'+inp('jpax','Passengers (1–12)','number',j.pax,' min="1" max="12" inputmode="numeric"')+inp('jcontact','Your phone','tel',j.contact||prof.phone||'',' placeholder="+234…"')+'</div>';
 h+='<label for="jnotes">Notes (optional)</label><input id="jnotes" value="'+esc(j.notes)+'" placeholder="luggage, pets, return flight…">';
 h+='<button class="btn" id="reqBtn" data-act="jetRequest">Send charter request</button><div class="muted" style="margin-top:6px">No payment in the app. The operator calls you with the final price and flight details.</div>';return h}
function jetCustomer(r){var h='';
 if(r.status==='requested'||r.status==='offers'){h+='<div class="muted">Price on request; a charter operator confirms.</div>';
  r.offers.forEach(function(o,i){h+='<div class="card offer">'+(o.example?'<div class="demo">EXAMPLE QUOTE – not a real price (simulated operator, demo mode)</div>':'')+'✈️ <b>'+esc(o.name)+'</b>'+vbadge(o.verified)+(o.sim?' <span class="muted">(simulated)</span>':'')+(o.note?'<div class="muted">'+esc(o.note)+'</div>':'')+'<div class="row"><span class="price">'+naira(o.price)+(o.example?' <small>(example)</small>':'')+'</span><button class="btn sm" data-act="acceptOffer" data-i="'+i+'">Accept quote</button></div></div>'});
  return h+'<button class="btn warn" data-act="cancel">Cancel request</button>'}
 h+='<div class="card">✈️ <b>'+esc(r.driver.name)+'</b>'+vbadge(r.driver.verified)+'<div class="price">'+naira(r.price)+(r.driver.example?' <small>(example)</small>':'')+'</div><div class="muted">Final price, payment and flight details are agreed directly with the operator.</div></div>';
 if(r.status==='done'||r.driver.sim)h+='<button class="btn" data-act="newReq">New request</button>';else h+='<button class="btn warn" data-act="cancel">Cancel</button>';return h}
function renderDriver(){if(!ui.online){ui.screen='d-setup';return '<h3>Drive with Swift Drive</h3><label>Your name</label><input id="dname" value="'+esc(ui.dname||prof.name||'')+'" placeholder="Name"><label>Vehicle</label><select id="veh">'+Object.keys(VEH).map(function(k){return '<option value="'+k+'"'+(ui.veh===k?' selected':'')+'>'+VEH[k]+'</option>'}).join('')+'</select><button class="btn" id="goOnline" data-act="online">Go online</button><p class="muted">Dispatch rider jobs (parcels) go to Motorbike drivers. Private jet requests go to Charter operators (they answer with a quote).</p>'}
 var j=myJob();if(j){ui.screen='d-'+j.status;var next=(j.service==='jet'?{accepted:['done','Flight booked with customer']}:{accepted:['arriving','I\'m on my way'],arriving:['moving',(j.service==='dispatch'||j.service==='truck')?'Picked up – start delivery':'Passenger in – start trip'],moving:['done','Complete – cash received']})[j.status];
  return '<h3>'+reqLine(j)+'</h3>'+steps(j)+'<div class="hint" id="dstatus">'+statusText(j)+'</div><div class="card">'+(j.service==='jet'?'Your quote':'Fare')+': <span class="price">'+naira(j.price)+'</span> '+(j.service==='jet'?'– call the customer to confirm':'cash')+'</div>'+(next?'<button class="btn" id="nextBtn" data-act="next" data-s="'+next[0]+'">'+next[1]+'</button>':'')}
 ui.screen='d-list';var h='<h3>'+VEH[ui.veh]+' · online <button class="btn sec sm" data-act="offline">Go offline</button></h3>',n=0;
 Object.keys(reqs).forEach(function(k){var r=reqs[k];if((r.status!=='requested'&&r.status!=='offers')||ui.declined[k]||SERVICES[r.service].veh.indexOf(ui.veh)<0)return;n++;
  var mine=r.offers.filter(function(o){return o.driver===tab})[0];
  if(r.service==='jet'){h+='<div class="card job" data-rid="'+k+'">'+reqLine(r)+(r.cverified?' '+vbadge(1):'')+'<div class="muted">Price on request – send your quote (₦).</div>'+(mine?'<div class="hint">Your quote '+naira(mine.price)+' sent – waiting for customer</div>':'<input type="number" step="50000" style="width:130px;display:inline-block" id="ctr-'+k+'" placeholder="Quote ₦"><button class="btn sm" data-act="dQuote" data-rid="'+k+'">Send quote</button><button class="btn sec sm" data-act="dDecline" data-rid="'+k+'">Decline</button>')+'</div>';return}
  h+='<div class="card job" data-rid="'+k+'">'+reqLine(r)+(r.cverified?' '+vbadge(1):'')+'<div>Customer offers <span class="price">'+naira(r.price)+'</span> <span class="muted">(suggested '+naira(r.sugg)+')</span></div>';
  if(mine)h+='<div class="hint">Your offer '+naira(mine.price)+' sent – waiting for customer</div>';
  else h+='<button class="btn sm" data-act="dAccept" data-rid="'+k+'">Accept '+naira(r.price)+'</button><input type="number" step="50" style="width:90px;display:inline-block" id="ctr-'+k+'" value="'+r50(r.price*1.15)+'"><button class="btn sec sm" data-act="dCounter" data-rid="'+k+'">Counter</button><button class="btn sec sm" data-act="dDecline" data-rid="'+k+'">Decline</button>';
  h+='</div>'});
 if(!n)h+='<div class="hint" id="noreq">No requests for '+VEH[ui.veh]+' yet. Keep the app open.</div>';return h}
function drawReqs(){reqLayer.clearLayers();if(ui.role!=='driver'||!ui.online)return;Object.keys(reqs).forEach(function(k){var r=reqs[k];if((r.status==='requested'||r.status==='offers')&&r.pick&&SERVICES[r.service].veh.indexOf(ui.veh)>=0)L.marker([r.pick.lat,r.pick.lng],{icon:icon(SERVICES[r.service].icon)}).addTo(reqLayer)})}

// ---------- actions ----------
function readForm(){var e;if((e=$('seats')))ui.f.seats=Math.max(1,Math.min(18,parseInt(e.value,10)||1));if((e=$('size')))ui.f.size=e.value;if((e=$('rphone')))ui.f.rphone=e.value;if((e=$('load')))ui.f.load=e.value;if((e=$('offer')))ui.offer=parseInt(e.value,10)||0;
 ['from','to','date','time','notes','contact'].forEach(function(k){var x=$('j'+k);if(x)ui.j[k]=x.value.trim()});if((e=$('jpax')))ui.j.pax=e.value}
var A={
 svc:function(b){readForm();ui.svc=b.getAttribute('data-k');ui.offer=null},
 request:function(){readForm();var d=km(ui.pick,ui.dest),sug=fare(ui.svc,d,ui.f);
  if(ui.offer<sug*.7){alert('Offer too low. Minimum is '+naira(r50(sug*.7)));return}
  if(ui.svc==='dispatch'&&!/^\+?\d{7,15}$/.test((ui.f.rphone||'').replace(/\s/g,''))){alert('Please enter the recipient phone number');return}
  if(ui.svc==='truck'&&!(ui.f.load||'').trim()){alert('Please describe the load');return}
  SDSync.send({t:'req',r:{id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),customer:tab,cverified:!!prof.verified,service:ui.svc,pick:ui.pick,dest:ui.dest,dist:d,sugg:sug,price:ui.offer,f:JSON.parse(JSON.stringify(ui.f)),status:'requested',offers:[],driver:null,ts:Date.now()}})},
 jetPick:function(b){readForm();var a=AIRPORTS[+b.getAttribute('data-i')];if(!ui.j.from)ui.j.from=a;else ui.j.to=a},
 jetRequest:function(){readForm();var j=ui.j,n=parseInt(j.pax,10);
  if(!j.from||!j.to){alert('Please enter From and To (city or airport)');return}
  if(!j.date||!j.time){alert('Please choose date and time');return}
  if(!(n>=1&&n<=12)||String(n)!==String(j.pax).trim()){alert('Passengers: 1 to 12');return}
  if(!/^\+?\d{7,15}$/.test(j.contact.replace(/\s/g,''))){alert('Please enter your phone number so the operator can call you');return}
  SDSync.send({t:'req',r:{id:'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),customer:tab,cverified:!!prof.verified,service:'jet',pick:null,dest:null,dist:0,sugg:null,price:null,f:{from:j.from,to:j.to,date:j.date,time:j.time,pax:n,notes:j.notes,contact:j.contact},status:'requested',offers:[],driver:null,ts:Date.now()}})},
 dQuote:function(b){var k=b.getAttribute('data-rid'),p=parseInt($('ctr-'+k).value,10)||0;if(p<=0){alert('Enter your quote in ₦');return}SDSync.send({t:'offer',rid:k,o:{driver:tab,name:ui.dname,veh:'jet',price:p,verified:!!prof.verified}})},
 acceptOffer:function(b){var r=reqs[ui.myReq];SDSync.send({t:'accept',rid:r.id,o:r.offers[+b.getAttribute('data-i')]})},
 cancel:function(){SDSync.send({t:'cancel',rid:ui.myReq});ui.myReq=null;ui.pick=ui.dest=null;ui.offer=null},
 newReq:function(){reqs[ui.myReq]._closed=1;ui.myReq=null;ui.pick=ui.dest=null;ui.offer=null},
 online:function(){ui.veh=$('veh').value;ui.dname=$('dname').value.trim()||'Driver';sessionStorage.setItem('sd_veh',ui.veh);sessionStorage.setItem('sd_dname',ui.dname);ui.online=true},
 offline:function(){ui.online=false},
 dAccept:function(b){var r=reqs[b.getAttribute('data-rid')];SDSync.send({t:'offer',rid:r.id,o:{driver:tab,name:ui.dname,veh:ui.veh,price:r.price,verified:!!prof.verified}})},
 dCounter:function(b){var k=b.getAttribute('data-rid'),p=parseInt($('ctr-'+k).value,10)||0;SDSync.send({t:'offer',rid:k,o:{driver:tab,name:ui.dname,veh:ui.veh,price:p,verified:!!prof.verified}})},
 dDecline:function(b){ui.declined[b.getAttribute('data-rid')]=1},
 geo:function(){if(!navigator.geolocation){ui.geoErr=1;ui.geoMsg='Location is not available on this browser. Tap the map or choose a landmark.';return}
  if(!window.isSecureContext){ui.geoErr=1;ui.geoMsg='Location needs the https:// link. Tap the map or choose a landmark.';return}
  ui.geoErr=0;ui.geoMsg='Finding your location…';
  navigator.geolocation.getCurrentPosition(function(pos){ui.pick={lat:+pos.coords.latitude.toFixed(5),lng:+pos.coords.longitude.toFixed(5)};ui.offer=null;ui.geoErr=0;ui.geoMsg='Pickup set to your location (±'+Math.round(pos.coords.accuracy||0)+' m). Not saved or sent anywhere.';map.setView([ui.pick.lat,ui.pick.lng],16);drawRoute();render()},
   function(err){ui.geoErr=1;ui.geoMsg=err.code===1?'Location permission denied. Allow it in Settings › Safari › Location, or tap the map.':err.code===3?'Finding your location took too long. Try again outdoors, or tap the map.':'Your location is unavailable right now. Tap the map or choose a landmark.';render()},
   {enableHighAccuracy:true,timeout:15000,maximumAge:60000})},
 next:function(b){SDSync.send({t:'status',rid:myJob().id,s:b.getAttribute('data-s')})}};
document.addEventListener('click',function(e){var b=e.target.closest?e.target.closest('[data-act]'):null;if(!b||!A[b.getAttribute('data-act')])return;var a=b.getAttribute('data-act');R.log('tap:'+a,b.getAttribute('data-k')||b.getAttribute('data-rid')||null);
 try{A[a](b)}catch(x){R.err('action',x.message,{a:a,stack:x.stack})}drawReqs();drawRoute();render()});
document.addEventListener('change',function(e){var id=e.target.id;if(id==='pickSel'||id==='destSel'){var P=PLACES[e.target.value];if(P){var pt={lat:P[1],lng:P[2]};if(id==='pickSel')ui.pick=pt;else ui.dest=pt;ui.offer=null;map.setView([pt.lat,pt.lng],15);R.log('landmark',P[0])}drawRoute();render();return}if(id!=='offer'&&id!=='seats'&&id!=='size')return;readForm();
 if(id!=='offer'&&ui.pick&&ui.dest){var sug=fare(ui.svc,km(ui.pick,ui.dest),ui.f);ui.offer=sug;if($('sugg'))$('sugg').textContent=naira(sug);if($('offer'))$('offer').value=sug}R.log('form:'+id,e.target.value)});
function setRole(r){ui.role=r;sessionStorage.setItem('sd_role',r);R.log('role',r);drawReqs();drawRoute();render()}
$('roleC').onclick=function(){setRole('customer')};$('roleD').onclick=function(){setRole('driver')};

// ---------- modal: verify + report ----------
function modal(h){$('modalBox').innerHTML=h;$('modal').className=''}function closeModal(){$('modal').className='hidden'}
$('modal').addEventListener('click',function(e){if(e.target.id==='modal'||e.target.getAttribute('data-close')!==null)closeModal()});
$('verifyBtn').onclick=function(){R.log('open:verify');modal('<h3>Verify your account</h3><p class="demo">DEMO ONLY – nothing is checked or uploaded. Real verification comes later.</p><label>Full name</label><input id="vname" value="'+esc(prof.name||'')+'"><label>Phone number</label><input id="vphone" type="tel" placeholder="+234…" value="'+esc(prof.phone||'')+'"><label>ID photo (NIN slip / driver\'s licence) – stays on this phone</label><input id="vid" type="file" accept="image/*"><button class="btn" id="vgo">Verify (demo)</button>'+(prof.verified?'<button class="btn sec" id="vreset">Remove verification</button>':'')+'<button class="btn sec" data-close>Close</button>');
 $('vgo').onclick=function(){var ph=$('vphone').value.replace(/\s/g,'');if(!/^\+?\d{10,14}$/.test(ph)){alert('Enter a valid phone number');return}prof.name=$('vname').value;prof.phone=ph;prof.idPhoto=!!($('vid').files&&$('vid').files.length);prof.verified=true;saveProf();R.log('verified(demo)',{id:prof.idPhoto});closeModal();render()};
 if($('vreset'))$('vreset').onclick=function(){prof.verified=false;saveProf();closeModal();render()}};
function stateSnap(){var r=ui.myReq&&reqs[ui.myReq];return {role:ui.role,screen:ui.screen,svc:ui.svc,sync:SDSync.mode,syncStatus:SDSync.status,veh:ui.veh,online:ui.online,verified:!!prof.verified,req:r?{id:r.id,service:r.service,status:r.status,price:r.price,offers:r.offers.length}:null,job:myJob()?myJob().id:null,nReqs:Object.keys(reqs).length,queued:R.queue().length,zoom:map.getZoom(),center:map.getCenter()}}
window.SDState=stateSnap;
$('reportBtn').onclick=function(){R.log('open:report');var q=R.queue().length;modal('<h3>Report a problem / feedback</h3><p class="muted">Write what you tried and what went wrong. Phone details and the last steps are added automatically.</p><textarea id="rnote" rows="4" placeholder="e.g. I tapped Request and nothing happened"></textarea><button class="btn" id="rsend">Send report</button><button class="btn sec" id="rwa">Share via WhatsApp</button><button class="btn sec" id="rcopy">Copy report text</button><div class="hint" id="rmsg">'+(q?q+' report(s) waiting to be sent':'')+'</div><button class="btn sec" data-close>Close</button>');
 function rep(){return R.build($('rnote').value,stateSnap())}
 $('rsend').onclick=function(){R.send(rep(),SDSync.mode==='server').then(function(x){$('rmsg').textContent=x.sent?'Sent ✔ (id '+x.id+'). Thank you!':(SDSync.mode==='server'?'No connection – saved, will send automatically ('+x.count+' waiting).':'Demo mode has no server – saved on phone. Please use WhatsApp or Copy.')})};
 $('rwa').onclick=function(){var u=R.waLink(rep());R.log('report:wa');window.open(u,'_blank')||(location.href=u)};
 $('rcopy').onclick=function(){R.copy(R.text(rep())).then(function(){$('rmsg').textContent='Copied – paste it into WhatsApp.'})}};

// ---------- boot ----------
$('ver').textContent='v'+R.VERSION+' demo';
SDSync.onStatus(function(s){$('syncBar').textContent=s+(ui.sim?' · simulated drivers ON':'');$('syncBar').className=/Live/.test(s)?'':'off'});
render();drawSims();
SDSync.start(onEvent).then(function(m){R.log('sync',m);if(m==='server')R.flush();render()});
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(function(e){R.err('sw',e.message)});
R.log('boot',{role:ui.role});
})();
