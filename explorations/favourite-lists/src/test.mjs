// End-to-end check of the catalog → Order Lists flow on the exploration pages
// (or on handover/v3 with BASE=handover/v3/). Needs
// `python3 -m http.server 8765 --bind 127.0.0.1` running in ~/ufs-design-system.
// Screenshots go to ./shots/.
import { spawn } from 'node:child_process'; import { writeFileSync, mkdirSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, SHOTS = HERE + 'shots/'; mkdirSync(SHOTS, { recursive: true });
const BASE = 'http://localhost:8765/' + (process.env.BASE || 'explorations/favourite-lists/');
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9338','--user-data-dir='+HERE+'.profile','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let t; for(let i=0;i<50;i++){try{t=await (await fetch('http://127.0.0.1:9338/json')).json();break}catch{await sleep(200)}}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0;const p={};let errors=[];let onLoad=null;
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m);delete p[m.id]}
 if(m.method==='Page.domContentEventFired'&&onLoad){const f=onLoad;onLoad=null;f()}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
 if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&m.params.response.url.startsWith('http://localhost'))errors.push(m.params.response.status+' '+m.params.response.url)};
const send=(method,params={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(x.slice(0,80)+' → '+r.result.exceptionDetails.exception?.description);return r.result.result.value};
const vp=(w,h,m=false)=>send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:m});
const shot=async name=>{await sleep(400);const s=await send('Page.captureScreenshot',{format:'png'});writeFileSync(SHOTS+name+'.png',Buffer.from(s.result.data,'base64'))};
// Resolves on the next DOMContentLoaded + 1.5s to settle (external images can hold the load event back), whatever started the navigation
const loaded=()=>new Promise(r=>{let done=false;const fin=()=>{if(!done){done=true;r()}};onLoad=fin;setTimeout(()=>{if(!done){if(onLoad===fin)onLoad=null;console.log('  (no DOMContentLoaded in 10s)');fin()}},10000)}).then(()=>sleep(1500));
const go=async u=>{const l=loaded();await send('Page.navigate',{url:u});await l};
let fails=0; const ok=(name,got,want)=>{const pass=JSON.stringify(got)===JSON.stringify(want);if(!pass)fails++;console.log(pass?'  ok  ':'  FAIL',name,pass?'':'got '+JSON.stringify(got)+' want '+JSON.stringify(want))};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await vp(1440,900);

const CAT = BASE + 'template-products-catalog-webshop.html', FAV = BASE + 'template-profile-favourites.html';
// Fresh store
await go(CAT); await ev(`localStorage.removeItem('ufs-webshop-lists')`); await go(CAT);
console.log('catalog');
ok('seeded hearts', await ev(`['veg','granules','pesto'].map(id=>!!document.querySelector('.ufs-tile__fav[data-fav-id="'+id+'"].is-active'))`), [true,true,false]);
await ev(`setAuth(true)`);
await ev(`document.querySelector('.ufs-tile__fav[data-fav-id="pesto"]').click()`); await sleep(500);
ok('panel open', await ev(`document.getElementById('fav-list-panel').classList.contains('is-open')`), true);
ok('rows', await ev(`[...document.querySelectorAll('.ufs-favlist__row')].map(b=>b.textContent+':'+b.getAttribute('aria-pressed'))`), ['Default list:true','Weekly Essentials:false','Event Catering Kit:false']);
ok('go → default', await ev(`document.getElementById('fav-list-go').getAttribute('href')`), 'template-profile-favourites.html#order-lists/default');
await shot('catalog-panel');
await ev(`favShowCreate(true); document.getElementById('fav-list-name').value='weekly essentials'; favNameInput(); document.getElementById('fav-list-add').click()`);
ok('duplicate name', await ev(`document.getElementById('fav-list-error').textContent`), 'You already have a list with this name');
await ev(`document.getElementById('fav-list-name').value='Pizza Night'; favNameInput(); document.getElementById('fav-list-add').click()`); await sleep(200);
const pizza = await ev(`favStore.lists[3].id`);
ok('go → new list', await ev(`document.getElementById('fav-list-go').getAttribute('href')`), 'template-profile-favourites.html#order-lists/' + pizza);
await ev(`favToggleList('weekly-essentials')`);
ok('go → weekly', await ev(`document.getElementById('fav-list-go').getAttribute('href')`), 'template-profile-favourites.html#order-lists/weekly-essentials');
await ev(`favToggleList('weekly-essentials')`);
ok('go → falls back to newest', await ev(`document.getElementById('fav-list-go').getAttribute('href')`), 'template-profile-favourites.html#order-lists/' + pizza);
ok('stored', await ev(`JSON.parse(localStorage.getItem('ufs-webshop-lists')).lists.map(l=>l.name+':'+l.items.map(i=>i.id).join('+'))`),
   ['Default list:tomato+granules+pesto','Weekly Essentials:veg+chicken+roux','Event Catering Kit:granules+demiglace+mayo+garlic+curry','Pizza Night:pesto']);
await shot('catalog-panel-created');
console.log('  errors', errors); errors = [];

console.log('favourites (deep link)');
{ const l = loaded(); await ev(`document.getElementById('fav-list-go').click()`); await l; }
ok('url', await ev(`location.hash`), '#order-lists/' + pizza);
ok('Order Lists tab active', await ev(`document.getElementById('panel-products').classList.contains('pg-fav-active')`), true);
ok('Lists view, detail open', await ev(`[document.getElementById('products-view-lists').hidden, document.getElementById('products-sublists-grid').hidden, document.getElementById('products-list-${pizza}').hidden]`), [false,true,false]);
ok('detail', await ev(`[...document.querySelectorAll('#products-list-${pizza} .ufs-tile__title')].map(e=>e.textContent).concat(document.querySelector('#products-list-${pizza} .pg-fav-sublist-order-all-info').textContent)`),
   ['Knorr Primerba Pesto 340 g', '1 product at qty 1 each · €12.80 total']);
ok('counts', await ev(`[document.getElementById('ol-count-products').textContent, document.getElementById('ol-count-lists').textContent]`), ['10 products','4 lists']);
await shot('favourites-detail');
await ev(`document.querySelector('#products-list-${pizza} .ufs-tile__fav').click()`); await sleep(400);
ok('removed → empty list', await ev(`[!!document.querySelector('#products-list-${pizza} .ufs-ol-empty'), document.querySelector('#ol-toast-stack .x-toast-item span').textContent]`), [true, 'Removed from Pizza Night']);
await shot('favourites-empty-list');
await ev(`document.querySelector('#ol-toast-stack .x-toast-item button').click()`); await sleep(300);
ok('undo', await ev(`document.querySelectorAll('#products-list-${pizza} .ufs-tile').length`), 1);
await ev(`document.querySelector('#products-list-${pizza} .pg-fav-sublist-back-btn').click()`); await sleep(200);
ok('back → #order-lists, cards', await ev(`[location.hash, document.getElementById('products-sublists-grid').hidden, [...document.querySelectorAll('#ol-lists-grid .pg-fav-sublist-card-name')].map(e=>e.textContent)]`),
   ['#order-lists', false, ['Pizza Night','Default list','Weekly Essentials','Event Catering Kit']]);
ok('card meta + overflow', await ev(`[...document.querySelectorAll('#ol-lists-grid .pg-fav-sublist-card')].map(c=>c.querySelector('.pg-fav-sublist-card-meta').textContent+'|'+c.querySelectorAll('.pg-fav-sublist-thumb').length+'|'+(c.querySelector('.pg-fav-sublist-thumb-overflow')||{}).textContent)`),
   ['1 product · €12.80|1|undefined','3 products · €41.50|3|undefined','3 products · €52.40|3|undefined','5 products · €118.00|4|+1']);
await shot('favourites-lists');
// sort A–Z keeps working on rendered cards
await ev(`document.querySelector('#products-sublists-grid .pg-fav-sort-btn').click(); document.querySelector('#products-sublists-grid [data-sort="alpha"]').click()`);
ok('sort A–Z', await ev(`[...document.querySelectorAll('#ol-lists-grid .pg-fav-sublist-card-name')].map(e=>e.textContent)`), ['Default list','Event Catering Kit','Pizza Night','Weekly Essentials']);
await ev(`document.querySelector('#products-sublists-grid .pg-fav-sort-btn').click(); document.querySelector('#products-sublists-grid [data-sort="date"]').click()`);
ok('sort recent', await ev(`[...document.querySelectorAll('#ol-lists-grid .pg-fav-sublist-card-name')].map(e=>e.textContent)`), ['Pizza Night','Default list','Weekly Essentials','Event Catering Kit']);
// All view: remove from every list
await ev(`setFavView('products','all')`);
ok('All: hash cleared, 10 tiles', await ev(`[location.hash, document.querySelectorAll('#ol-all-grid .ufs-tile').length]`), ['', 10]);
await ev(`document.querySelector('#ol-all-grid .ufs-tile[data-pid="granules"] .ufs-tile__fav').click()`); await sleep(300);
ok('All: granules out of 2 lists', await ev(`[document.querySelectorAll('#ol-all-grid .ufs-tile').length, favListsOf('granules').length]`), [9, 0]);
await shot('favourites-all');
// unknown list → overview
await go(FAV + '?reload#order-lists/nope');   // a hash-only change wouldn't reload
ok('unknown id → Lists', await ev(`[location.hash, document.getElementById('products-view-lists').hidden, document.getElementById('products-sublists-grid').hidden]`), ['#order-lists', false, false]);
console.log('  errors', errors); errors = [];

console.log('back in the catalog');
await go(CAT);
ok('hearts follow Order Lists', await ev(`['pesto','granules'].map(id=>!!document.querySelector('.ufs-tile__fav[data-fav-id="'+id+'"].is-active'))`), [true, false]);

console.log('mobile');
await vp(390, 844, true);
await go(FAV + '#order-lists/weekly-essentials');
ok('accordion open + detail', await ev(`[document.getElementById('panel-products').classList.contains('pg-fav-open'), document.getElementById('products-list-weekly-essentials').hidden]`), [true, false]);
ok('section under the sticky header + search', await ev(`Math.round(document.getElementById('panel-products').getBoundingClientRect().top - olStickyTop())`), 16);
await shot('m-favourites-detail');
await ev(`closeFavSublist('products')`); await shot('m-favourites-lists');
await go(CAT); await ev(`setAuth(true)`); await ev(`document.querySelector('.ufs-tile__fav[data-fav-id="mash"]').click()`); await sleep(600); await shot('m-catalog-panel');
console.log('  errors', errors);
console.log(fails ? fails + ' FAILED' : 'all passed');
ws.close(); chrome.kill(); process.exit(fails ? 1 : 0);
