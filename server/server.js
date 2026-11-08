// Swift Drive v0.1 tiny backend: static files + REST + WebSocket relay. No dependencies.
// Local use only. There is no authentication. Do not deploy this process on a
// public host: /api/state, /api/reports and /api/reset are open.
// Run: node server/server.js   (PORT env, default 8787)
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.join(__dirname,'..'),REP=path.join(__dirname,'reports'),PORT=+process.env.PORT||8787;
fs.mkdirSync(REP,{recursive:true});
const events=[],clients=new Set(),MAX=3000;
const TYPES={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json','.svg':'image/svg+xml'};
function json(res,code,o){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(o))}
function body(req,lim){return new Promise((ok,no)=>{let b='';req.on('data',c=>{b+=c;if(b.length>lim){no(new Error('too big'));req.destroy()}});req.on('end',()=>{try{ok(JSON.parse(b||'{}'))}catch(e){no(e)}})})}
function addEvent(ev,from){if(!ev||typeof ev!=='object'||!ev.id||!ev.t)return;if(events.some(e=>e.id===ev.id))return;events.push(ev);if(events.length>MAX)events.shift();
  const msg=frame(JSON.stringify({type:'ev',ev}));for(const c of clients)if(c!==from)c.write(msg)}
const srv=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://x');const p=u.pathname;
  try{
  if(p==='/api/ping')return json(res,200,{ok:true,version:'0.1.0',events:events.length,clients:clients.size});
  if(p==='/api/state')return json(res,200,{events});
  if(p==='/api/event'&&req.method==='POST'){addEvent((await body(req,1e5)).ev,null);return json(res,200,{ok:true})}
  if(p==='/api/report'&&req.method==='POST'){const r=await body(req,5e5);const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(2).toString('hex');
    fs.writeFileSync(path.join(REP,id+'.json'),JSON.stringify(r,null,1));console.log('REPORT',id,(r.note||'').slice(0,80));return json(res,200,{ok:true,id})}
  if(p==='/api/reports')return json(res,200,fs.readdirSync(REP).filter(f=>f.endsWith('.json')).sort().reverse().slice(0,50));
  if(p==='/api/reset'&&req.method==='POST'){events.length=0;return json(res,200,{ok:true})}
  let f=path.normalize(path.join(ROOT,decodeURIComponent(p==='/'?'/index.html':p)));
  if(!f.startsWith(ROOT+path.sep)||/[\\\/](server|\.git|node_modules|tests)[\\\/]/.test(f.slice(ROOT.length)))return json(res,404,{error:'not found'});
  fs.readFile(f,(e,d)=>{if(e)return json(res,404,{error:'not found'});res.writeHead(200,{'Content-Type':TYPES[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(d)});
  }catch(e){json(res,400,{error:e.message})}});
// --- minimal RFC6455 (text frames, server->client unmasked) ---
function frame(s){const b=Buffer.from(s);let h;if(b.length<126)h=Buffer.from([0x81,b.length]);else if(b.length<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(b.length,2)}else{h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(b.length),2)}return Buffer.concat([h,b])}
srv.on('upgrade',(req,sock)=>{if(!req.url.endsWith('/ws')){sock.destroy();return}
  const acc=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');
  clients.add(sock);sock.write(frame(JSON.stringify({type:'snapshot',events})));let buf=Buffer.alloc(0),parts=[];
  sock.on('data',d=>{buf=Buffer.concat([buf,d]);for(;;){if(buf.length<2)return;const fin=buf[0]&0x80,op=buf[0]&15,masked=buf[1]&0x80;let len=buf[1]&127,o=2;
    if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);o=4}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));o=10}
    if(len>1e6){sock.destroy();return}const need=o+(masked?4:0)+len;if(buf.length<need)return;let pl=buf.slice(o+(masked?4:0),need);
    if(masked){const m=buf.slice(o,o+4);pl=Buffer.from(pl.map((x,i)=>x^m[i&3]))}buf=buf.slice(need);
    if(op===8){sock.end();return}if(op===9){sock.write(Buffer.concat([Buffer.from([0x8a,pl.length]),pl]));continue}
    if(op===1||op===0){parts.push(pl);if(fin){const t=Buffer.concat(parts).toString();parts=[];try{const m=JSON.parse(t);if(m.type==='ev')addEvent(m.ev,sock)}catch(e){}}}}});
  const bye=()=>clients.delete(sock);sock.on('close',bye);sock.on('error',bye)});
srv.listen(PORT,()=>console.log('Swift Drive server on http://localhost:'+PORT));
