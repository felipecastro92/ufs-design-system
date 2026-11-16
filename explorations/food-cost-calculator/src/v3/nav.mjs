// Cross-version navigation checks (ds-version.js). Needs the :8765 server in ~/ufs-design-system.
import { spawn } from 'node:child_process'; import { readdirSync, readFileSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, H = HERE + '../../../../handover/';
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9338','--user-data-dir='+HERE+'.profile','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let t; for(let i=0;i<50;i++){try{t=await (await fetch('http://127.0.0.1:9338/json')).json();break}catch{await sleep(200)}}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0;const p={};let errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m);delete p[m.id]}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)};
const send=(method,params={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true});return r.result.exceptionDetails?'ERR '+r.result.exceptionDetails.exception?.description:r.result.result.value};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
const B='http://localhost:8765/handover/';
const go=async u=>{await send('Page.navigate',{url:B+u});await sleep(900)};
let fails=0; const ok=(name,cond,info='')=>{if(!cond)fails++;console.log((cond?'PASS ':'FAIL ')+name+(cond?'':'  → '+JSON.stringify(info)))};
const back=()=>ev(`[...document.querySelectorAll('.doc-topbar-back,.sidebar-back')].map(a=>[a.className,a.getAttribute('href').replace(location.origin,''),a.textContent.trim()])`);
const href=sel=>ev(`(document.querySelector('${sel}')||{}).href||null`);
const P='/handover/';

// 1. Indexes tag links to older pages only
await go('v3/index.html');
ok('v3 index → v1 spec tagged', (await href('a[href*="nav-header-spec.html"]'))?.endsWith('nav-header-spec.html?ds=v3'), await href('a[href*="nav-header-spec.html"]'));
ok('v3 index → v2 spec tagged', (await href('a[href*="v2/ratings-spec.html"]'))?.endsWith('v2/ratings-spec.html?ds=v3'));
ok('v3 index → own spec untagged', (await href('a[href="food-cost-calculator-spec.html"]'))?.endsWith('v3/food-cost-calculator-spec.html'));
ok('v3 index → other indexes untouched', (await ev(`[...document.querySelectorAll('option')].map(o=>o.value).join()`)) === '../index.html,../v2/index.html,index.html');
await go('v2/index.html');
ok('v2 index → v1 spec tagged v2', (await href('a[href*="nav-header-spec.html"]'))?.endsWith('handover/nav-header-spec.html?ds=v2'));
ok('v2 index → own spec untagged', (await href('a[href*="ratings-spec.html"]'))?.endsWith('v2/ratings-spec.html'));
await go('index.html');
ok('v1 index untouched', (await href('a[href*="nav-header-spec.html"]'))?.endsWith('handover/nav-header-spec.html'));

// 2. Real click-through: v3 → v1 spec → back
await go('v3/index.html');
await ev(`location.href = document.querySelector('a[href*="nav-header-spec.html"]').href`); await sleep(900);
let b = await back();
ok('v1 spec from v3: back links → v3', b.every(x=>x[1].endsWith(P+'v3/index.html')) && b.filter(x=>x[0]!=='demo-fab').every(x=>x[2]==='Design System v3.0'), b);
ok('v1 spec from v3: spec links carry ds', (await href('a[href*="-spec.html"]:not(.sidebar-link)')) === null || (await ev(`[...document.querySelectorAll('a[href*="-spec.html"]')].every(a=>a.href.includes('ds=v3'))`)));
await ev(`document.querySelector('.doc-topbar-back').click()`); await sleep(900);
ok('click back lands on v3 index', (await ev('location.pathname')) === P+'v3/index.html');

// 3. v3 → v2 spec → spec-to-spec link → back
await ev(`location.href = document.querySelector('a[href*="v2/cart-side-panel-spec.html"]').href`); await sleep(900);
b = await back(); ok('v2 spec from v3: back → v3', b.every(x=>x[1].endsWith(P+'v3/index.html')) && b.every(x=>x[2]==='Design System v3.0'), b);
await ev(`location.href = document.querySelector('a[href*="pack-size-picker-spec.html"]').href`); await sleep(900);
ok('v2 spec → v2 spec keeps ds', (await ev('location.search')) === '?ds=v3' && (await ev('location.hash')) !== undefined);
b = await back(); ok('…and its back still → v3', b.every(x=>x[1].endsWith(P+'v3/index.html')), b);

// 4. v2 → v1 spec → back
await go('v2/index.html');
await ev(`location.href = document.querySelector('a[href*="teaser-spec.html"]').href`); await sleep(900);
b = await back(); ok('v1 spec from v2: back → v2', b.every(x=>x[1].endsWith(P+'v2/index.html')) && b.filter(x=>x[0]!=='demo-fab').every(x=>x[2]==='Design System v2.0'), b);

// 4b. The one demo button that links to the index follows the context too
await go('tiles-spec.html?ds=v3'); ok('demo-fab → index follows ds', (await href('.demo-fab')).endsWith(P+'v3/index.html'));
await go('tiles-spec.html'); ok('demo-fab → index unchanged without ds', (await ev(`document.querySelector('.demo-fab').getAttribute('href')`)) === 'index.html');
// 5. No / own / older / bogus context: page as it was
for (const [u, home, label] of [['nav-header-spec.html', 'index.html', 'Design System'], ['nav-header-spec.html?ds=v1', 'index.html', 'Design System'],
  ['nav-header-spec.html?ds=foo', 'index.html', 'Design System'], ['v2/ratings-spec.html', 'index.html', 'Design System v2.0'], ['v2/ratings-spec.html?ds=v1', 'index.html', 'Design System v2.0']]) {
  await go(u); b = await back();
  ok('unchanged: ' + u, b.every(x=>x[1]===home) && b.filter(x=>x[0]!=='demo-fab').every(x=>x[2]===label), b);
}

// 6. Version switch keeps the section
await go('index.html#colors');
await ev(`(()=>{const s=document.querySelector('.sidebar-version-select');s.value='v3/index.html';s.dispatchEvent(new Event('change'))})()`); await sleep(1200);
ok('switch v1#colors → v3#colors', (await ev('location.pathname+location.hash')) === P+'v3/index.html#colors');
await ev(`(()=>{const s=document.querySelector('.sidebar-version-select');s.value='../v2/index.html';s.dispatchEvent(new Event('change'))})()`); await sleep(1200);
ok('switch v3 → v2 keeps #colors', (await ev('location.pathname+location.hash')) === P+'v2/index.html#colors');

// 7. Every page with the script: loads without errors, in and out of a newer context
const pages = [...readdirSync(H).filter(f=>f.endsWith('.html')).map(f=>f), ...readdirSync(H+'v2').map(f=>'v2/'+f), ...readdirSync(H+'v3').map(f=>'v3/'+f)]
  .filter(f=>f.endsWith('.html') && readFileSync(H+f,'utf8').includes('ds-version.js'));
errors = []; const bad = [];
for (const f of pages) { for (const q of ['', '?ds=v3']) { const n = errors.length; await go(f + q); if (errors.length > n) bad.push(f + q + ': ' + errors.slice(n).join(' | ')); } }
ok(pages.length + ' pages load without script errors (with and without ?ds=v3)', bad.length === 0, bad);
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
ws.close(); chrome.kill();
