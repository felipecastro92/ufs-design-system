// Checks the v3 handover pages. Needs the :8765 server in ~/ufs-design-system.
// Screenshots go to ./shots/.
import { spawn } from 'node:child_process'; import { writeFileSync, mkdirSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, SHOTS = HERE + 'shots/'; mkdirSync(SHOTS, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9337','--user-data-dir='+HERE+'.profile','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let t; for(let i=0;i<50;i++){try{t=await (await fetch('http://127.0.0.1:9337/json')).json();break}catch{await sleep(200)}}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0;const p={};let errors=[];const failed=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m);delete p[m.id]}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
 if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry.text+' '+(m.params.entry.url||''));
 if(m.method==='Network.responseReceived'&&m.params.response.status>=400)failed.push(m.params.response.status+' '+m.params.response.url)};
const send=(method,params={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});return r.result.exceptionDetails?'ERR '+r.result.exceptionDetails.exception?.description:r.result.result.value};
const vp=(w,h,m=false)=>send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:m});
const shot=async(name,sel)=>{let clip;if(sel){clip=await ev(`(()=>{const el=document.querySelector('${sel}');const r=el.getBoundingClientRect();return {x:Math.max(0,r.left+scrollX),y:r.top+scrollY,width:Math.min(r.width,innerWidth),height:Math.min(r.height,6000),scale:1}})()`)}
 await sleep(300);const s=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:!!sel});writeFileSync(SHOTS+name+'.png',Buffer.from(s.result.data,'base64'))};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Log.enable');await send('Network.enable');
const B='http://localhost:8765/handover/';
const load=async u=>{errors=[];failed.length=0;await send('Page.navigate',{url:B+u});await sleep(2500)};
const log=(...a)=>console.log(...a);
// All local links/images on a page resolve
const links=async()=>ev(`(async()=>{const us=[...new Set([...document.querySelectorAll('a[href],img[src]')].map(e=>(e.href||e.src).split('#')[0]).filter(u=>u.startsWith(location.origin)))];const bad=[];for(const u of us){const r=await fetch(u,{method:'HEAD'});if(!r.ok)bad.push(r.status+' '+u)}return [us.length,bad]})()`);

// ── Spec ──
await vp(1440,900); await load('v3/food-cost-calculator-spec.html');
log('spec links', await links());
log('spec dup ids', await ev(`(()=>{const c={};document.querySelectorAll('[id]').forEach(e=>c[e.id]=(c[e.id]||0)+1);return Object.keys(c).filter(k=>c[k]>1)})()`));
log('pdf img', await ev(`(()=>{const i=document.querySelector('.pv-pdf');return [i.naturalWidth,i.naturalHeight]})()`));
for (const s of ['overview','anatomy','banner','panel','calculation','behavior','pdf','animation','mobile','rtl']) await shot('spec-'+s, '#'+s);
// live demo
await ev(`document.getElementById('fcc-open').click()`); await sleep(600);
log('live open', await ev(`[document.getElementById('fcc-panel').classList.contains('is-open'), document.activeElement.id, document.getElementById('fcc-priced').textContent, document.getElementById('fcc-recipe').textContent]`));
await ev(`(()=>{const i=document.querySelectorAll('#fcc-list input');i[0].value='1,20';i[0].dispatchEvent(new Event('input'));const m=document.getElementById('fcc-menu');m.value='2,00';m.dispatchEvent(new Event('input'))})()`);
await ev(`stepServings(2)`);
log('live calc', await ev(`[document.getElementById('fcc-total').textContent, document.getElementById('fcc-serv').textContent, document.getElementById('servings-value').textContent, document.querySelector('.ufs-ingredient-row__qty').textContent, document.getElementById('fcc-pct').textContent]`));
await shot('spec-live-panel');
log('live pdf', await ev(`fccLib().then(l=>{const o=fccPdfDoc(l);return [o.name, o.doc.getNumberOfPages(), !!l.fonts]})`));
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`);
log('live closed', await ev(`[document.getElementById('fcc-panel').inert, document.activeElement.id]`));
log('spec errors', JSON.stringify(errors), 'failed', JSON.stringify(failed));
await vp(390,844,true); await sleep(400);
log('spec mobile overflow', await ev(`[document.documentElement.scrollWidth, innerWidth]`));
await shot('spec-mobile-top');

// ── v3 index ──
await vp(1440,900); await load('v3/index.html');
log('index links', await links());
log('index version', await ev(`[...document.querySelectorAll('.sidebar-version-select option')].map(o=>o.value+(o.selected?'*':''))`));
await ev(`document.getElementById('whats-new').scrollIntoView()`); await shot('index-whats-new','#whats-new');
await shot('index-sidebar','#sidebar');
log('index errors', JSON.stringify(errors), 'failed', JSON.stringify(failed));

// ── v3 template ──
await load('v3/template-recipe-detail.html');
log('template errors', JSON.stringify(errors), 'failed', JSON.stringify(failed), await ev(`typeof fccPdf`));

// ── version selects in v1 / v2 ──
for (const u of ['index.html','v2/index.html']) { await load(u); log(u, await ev(`[...document.querySelectorAll('.sidebar-version-select option')].map(o=>o.value+(o.selected?'*':''))`), JSON.stringify(errors)); }
ws.close(); chrome.kill();
