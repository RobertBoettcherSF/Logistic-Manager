/* Swift Drive debug + feedback reports. Loaded first so it catches early errors. */
(function(){
  var VERSION='0.2.0';
  var actions=[],errors=[],QKEY='sd_reportq';
  function now(){return new Date().toISOString()}
  function log(a,d){actions.push({t:now(),a:a,d:d===undefined?null:d});if(actions.length>50)actions.shift()}
  function err(kind,msg,extra){errors.push({t:now(),kind:kind,msg:String(msg).slice(0,500),extra:extra||null});if(errors.length>30)errors.shift();log('error',kind+': '+String(msg).slice(0,120))}
  window.addEventListener('error',function(e){err('error',e.message,{src:e.filename,line:e.lineno,col:e.colno,stack:e.error&&e.error.stack?String(e.error.stack).slice(0,800):null})});
  window.addEventListener('unhandledrejection',function(e){var r=e.reason;err('unhandledrejection',r&&r.message?r.message:r,{stack:r&&r.stack?String(r.stack).slice(0,800):null})});
  function conn(){var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection;if(!c)return 'n/a';return {type:c.type||null,effectiveType:c.effectiveType||null,downlink:c.downlink||null,rtt:c.rtt||null,saveData:!!c.saveData}}
  function build(note,state){return {kind:'swiftdrive-report',version:VERSION,time:now(),note:note||'',
    userAgent:navigator.userAgent,screen:{w:screen.width,h:screen.height,vw:innerWidth,vh:innerHeight,dpr:window.devicePixelRatio||1},
    standalone:!!(navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)),
    online:navigator.onLine,connection:conn(),url:location.href,state:state||null,actions:actions.slice(),errors:errors.slice()}}
  function queue(){try{return JSON.parse(localStorage.getItem(QKEY)||'[]')}catch(e){return []}}
  function saveQ(q){try{localStorage.setItem(QKEY,JSON.stringify(q.slice(-20)))}catch(e){}}
  function post(r){return fetch('api/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r)}).then(function(x){if(!x.ok)throw new Error('HTTP '+x.status);return x.json()})}
  function send(r,hasServer){if(!hasServer){var q=queue();q.push(r);saveQ(q);return Promise.resolve({queued:true,count:q.length})}
    return post(r).then(function(j){return {sent:true,id:j.id}}).catch(function(){var q=queue();q.push(r);saveQ(q);return {queued:true,count:q.length}})}
  function flush(){var q=queue();if(!q.length)return Promise.resolve(0);var r=q[0];return post(r).then(function(){var q2=queue();q2.shift();saveQ(q2);return flush().then(function(n){return n+1})}).catch(function(){return 0})}
  function text(r){var s='Swift Drive report v'+r.version+' '+r.time+'\nNote: '+r.note+'\nPhone: '+r.userAgent+'\nScreen: '+r.screen.vw+'x'+r.screen.vh+' dpr '+r.screen.dpr+'\nOnline: '+r.online+' '+JSON.stringify(r.connection)+'\nState: '+JSON.stringify(r.state)+'\nErrors: '+JSON.stringify(r.errors)+'\nLast actions: '+r.actions.map(function(a){return a.t.slice(11,19)+' '+a.a+(a.d?' '+JSON.stringify(a.d):'')}).join(' | ');return s}
  function copy(s){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(s);var ta=document.createElement('textarea');ta.value=s;document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta);return Promise.resolve()}
  function waLink(r){var s=text(r);if(s.length>1800)s=s.slice(0,1800)+' …(cut, use Copy for full)';return 'https://wa.me/?text='+encodeURIComponent(s)}
  window.addEventListener('online',function(){flush()});
  window.SDReport={VERSION:VERSION,log:log,err:err,build:build,send:send,flush:flush,queue:queue,text:text,copy:copy,waLink:waLink};
})();
