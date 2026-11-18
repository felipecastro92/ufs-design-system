// Checks the v3 handover pages for Favourite Lists: spec (links, images, ids, live demo)
// and the index. Needs the :8765 server in ~/ufs-design-system. Screenshots → ./shots/.
import { spawn } from 'node:child_process'; import { writeFileSync, mkdirSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, SHOTS = HERE + 'shots/'; mkdirSync(SHOTS, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9341','--user-data-dir='+HERE+'.profile','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let t; for(let i=0;i<50;i++){try{t=await (await fetch('http://127.0.0.1:9341/json')).json();break}catch{await sleep(200)}}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0;const p={};let errors=[];let onLoad=null;
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m);delete p[m.id]}
 if(m.method==='Page.domContentEventFired'&&onLoad){const f=onLoad;onLoad=null;f()}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
 if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&m.params.response.url.startsWith('http://localhost')&&!m.params.response.url.endsWith('favicon.ico'))errors.push(m.params.response.status+' '+m.params.response.url)};
const send=(method,params={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});return r.result.exceptionDetails?'ERR '+r.result.exceptionDetails.exception?.description:r.result.result.value};
const vp=(w,h,m=false)=>send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:m});
const shot=async(name,sel)=>{let clip;if(sel){clip=await ev(`(()=>{const el=document.querySelector('${sel}');const r=el.getBoundingClientRect();return {x:Math.max(0,r.left+scrollX),y:r.top+scrollY,width:Math.min(r.width,innerWidth),height:Math.min(r.height,7000),scale:1}})()`)}
 await sleep(300);const s=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:!!sel});writeFileSync(SHOTS+name+'.png',Buffer.from(s.result.data,'base64'))};
const load=async u=>{errors=[];const l=new Promise(r=>{let d=false;const f=()=>{if(!d){d=true;r()}};onLoad=f;setTimeout(f,10000)});await send('Page.navigate',{url:'http://localhost:8765/handover/'+u});await l;await sleep(2000)};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
const links=async()=>ev(`(async()=>{const us=[...new Set([...document.querySelectorAll('a[href],img[src]')].map(e=>(e.href||e.src).split('#')[0]).filter(u=>u.startsWith(location.origin)))];const bad=[];for(const u of us){const r=await fetch(u,{method:'HEAD'});if(!r.ok)bad.push(r.status+' '+u)}return [us.length,bad]})()`);
const log=(...a)=>console.log(...a);

await vp(1440,900); await load('v3/favourite-lists-spec.html');
await ev(`localStorage.removeItem('ufs-webshop-lists')`); await load('v3/favourite-lists-spec.html');
log('spec links', JSON.stringify(await links()));
log('spec dup ids', await ev(`(()=>{const c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);return Object.keys(c).filter(k=>c[k]>1)})()`));
log('broken imgs', await ev(`[...document.images].filter(i=>i.complete&&!i.naturalWidth&&!i.loading).map(i=>i.src)`));
for (const s of ['overview','anatomy','panel','order-lists','data','behavior','animation','mobile','rtl']) await shot('spec-'+s, '#'+s);
log('live: seeded hearts', await ev(`[...document.querySelectorAll('.pv-product .ufs-tile__fav')].map(b=>b.dataset.favId+':'+b.classList.contains('is-active'))`));
await ev(`document.querySelector('.pv-product .ufs-tile__fav[data-fav-id="pesto"]').click()`); await sleep(600);
log('live: panel', await ev(`[document.getElementById('fav-list-panel').classList.contains('is-open'), document.getElementById('fav-list-go').getAttribute('href'), document.querySelectorAll('#fav-list-rows .ufs-favlist__row').length]`));
await shot('spec-live-panel');
await ev(`favToggleList('weekly-essentials')`);
log('live: go', await ev(`document.getElementById('fav-list-go').getAttribute('href')`));
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
await ev(`document.querySelector('.pv-product .ufs-tile__fav[data-fav-id="pesto"]').click()`); await sleep(300);
log('live: remove all → toast', await ev(`[document.querySelector('#toast-stack .x-toast-item span')?.textContent, favListsOf('pesto').length]`));
log('spec errors', errors);
await vp(390,844,true); await load('v3/favourite-lists-spec.html'); await shot('spec-m-top'); await shot('spec-m-panel','#panel');
log('mobile errors', errors, 'overflow', await ev(`document.documentElement.scrollWidth > innerWidth`));

await vp(1440,900); await load('v3/index.html');
log('index links', JSON.stringify(await links()));
log('index entries', await ev(`[...document.querySelectorAll('.sidebar-link')].filter(a=>/Favourite|Webshop\\)|Profile/.test(a.textContent)).map(a=>a.textContent.replace(/\\s+/g,' ').trim()+' → '+a.getAttribute('href'))`));
log('index errors', errors);
await ev(`localStorage.removeItem('ufs-webshop-lists')`);
ws.close(); chrome.kill();
