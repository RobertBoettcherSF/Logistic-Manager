/* Sync layer. Interface:
   SDSync.start(onEvent) -> Promise<mode>  ('server' | 'local')
   SDSync.send(ev)        apply locally + transmit
   SDSync.mode, SDSync.status (text), SDSync.onStatus(fn)
   Events: {id,t:'req'|'offer'|'accept'|'status'|'cancel',...}. Same reducer runs on every client. */
(function(){
  var S={mode:'local',status:'starting',seen:{},handler:null,statusFns:[]};
  var OUT='sd_outbox',LOG='sd_events',ws=null,retry=1000;
  function setStatus(s){S.status=s;S.statusFns.forEach(function(f){f(s)})}
  function deliver(ev,fromRemote){if(S.seen[ev.id])return;S.seen[ev.id]=1;if(S.mode==='local')persist(ev);S.handler(ev,fromRemote)}
  function persist(ev){try{var l=JSON.parse(localStorage.getItem(LOG)||'[]');l.push(ev);if(l.length>500)l=l.slice(-500);localStorage.setItem(LOG,JSON.stringify(l))}catch(e){}}
  var bc=null;
  function startLocal(){S.mode='local';
    try{JSON.parse(localStorage.getItem(LOG)||'[]').forEach(function(e){S.seen[e.id]=1;S.handler(e,true)})}catch(e){}
    if(window.BroadcastChannel){bc=new BroadcastChannel('swiftdrive');bc.onmessage=function(m){deliver(m.data,true)}}
    else window.addEventListener('storage',function(e){if(e.key==='sd_ping'&&e.newValue){try{deliver(JSON.parse(e.newValue).ev,true)}catch(x){}}});
    setStatus('Demo mode (this phone only, no server)');return 'local'}
  function outbox(){try{return JSON.parse(localStorage.getItem(OUT)||'[]')}catch(e){return []}}
  function flushOut(){var o=outbox();if(!o.length||!ws||ws.readyState!==1)return;o.forEach(function(ev){ws.send(JSON.stringify({type:'ev',ev:ev}))});localStorage.setItem(OUT,'[]')}
  function connect(){var u=(location.protocol==='https:'?'wss://':'ws://')+location.host+location.pathname.replace(/[^\/]*$/,'')+'ws';
    try{ws=new WebSocket(u)}catch(e){setStatus('Offline – will retry');setTimeout(connect,retry);return}
    ws.onopen=function(){retry=1000;setStatus('Live: connected to Swift Drive server');flushOut();SDReport.flush()};
    ws.onmessage=function(m){var d;try{d=JSON.parse(m.data)}catch(e){return}
      if(d.type==='snapshot')d.events.forEach(function(ev){deliver(ev,true)});else if(d.type==='ev')deliver(d.ev,true)};
    ws.onclose=function(){setStatus('Offline – reconnecting… (actions are saved)');retry=Math.min(retry*2,15000);setTimeout(connect,retry)}}
  S.start=function(onEvent){S.handler=onEvent;var q=location.search;
    if(/mode=local/.test(q)||location.protocol==='file:'||window.SD_SINGLE_FILE)return Promise.resolve(startLocal());
    var ctl=window.AbortController?new AbortController():null;var to=setTimeout(function(){if(ctl)ctl.abort()},4000);
    return fetch('api/ping',ctl?{signal:ctl.signal}:{}).then(function(r){clearTimeout(to);if(!r.ok)throw 0;S.mode='server';connect();return 'server'})
      .catch(function(){clearTimeout(to);return startLocal()})};
  S.send=function(ev){ev.id=ev.id||(Date.now().toString(36)+Math.random().toString(36).slice(2,7));ev.ts=ev.ts||Date.now();deliver(ev,false);
    if(S.mode==='local'){if(bc)bc.postMessage(ev);else localStorage.setItem('sd_ping',JSON.stringify({ev:ev,r:Math.random()}))}
    else if(ws&&ws.readyState===1)ws.send(JSON.stringify({type:'ev',ev:ev}));
    else{var o=outbox();o.push(ev);localStorage.setItem(OUT,JSON.stringify(o))}};
  S.onStatus=function(f){S.statusFns.push(f);f(S.status)};
  S.resetLocal=function(){localStorage.removeItem(LOG)};
  window.SDSync=S;
})();
