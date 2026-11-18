// Captures the previews for favourite-lists-spec.html from the real exploration
// pages: the panel's markup in each state (snaps.json) and screenshots of
// Order Lists (shots-spec/*.png → copied to handover/images/favourite-lists/
// by build_spec.py). Run after `python3 ../build.py`, with
// `python3 -m http.server 8765 --bind 127.0.0.1` running in ~/ufs-design-system.
import { spawn } from 'node:child_process'; import { writeFileSync, mkdirSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, OUT = HERE + 'shots-spec/'; mkdirSync(OUT, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9340','--user-data-dir='+HERE+'.profile','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let t; for(let i=0;i<50;i++){try{t=await (await fetch('http://127.0.0.1:9340/json')).json();break}catch{await sleep(200)}}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0;const p={};const errors=[];let onLoad=null;
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m);delete p[m.id]}
 if(m.method==='Page.domContentEventFired'&&onLoad){const f=onLoad;onLoad=null;f()}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)};
const send=(method,params={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(x.slice(0,80)+' → '+r.result.exceptionDetails.exception?.description);return r.result.result.value};
const vp=(w,h,m=false)=>send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:2,mobile:m});
const loaded=()=>new Promise(r=>{let done=false;const fin=()=>{if(!done){done=true;r()}};onLoad=fin;setTimeout(fin,10000)}).then(()=>sleep(2000));
const go=async u=>{const l=loaded();await send('Page.navigate',{url:u});await l};
// Element screenshot (page coordinates), or the viewport
const shot=async(name,sel,pad=0)=>{await sleep(500);let clip;
 if(sel)clip=await ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:Math.max(0,r.left+scrollX-${pad}),y:Math.max(0,r.top+scrollY-${pad}),width:r.width+${2*pad},height:r.height+${2*pad},scale:1}})()`);
 const s=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:!!sel});writeFileSync(OUT+name+'.png',Buffer.from(s.result.data,'base64'));
 return clip?[Math.round(clip.width),Math.round(clip.height)]:null};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
const B='http://localhost:8765/explorations/favourite-lists/', CAT=B+'template-products-catalog-webshop.html', FAV=B+'template-profile-favourites.html';
const out={sizes:{}};

// ── Panel markup (desktop) ──
await vp(1440,900);
await go(CAT); await ev(`localStorage.removeItem('ufs-webshop-lists')`); await go(CAT);
await ev(`window.snap = function (el) {
  el.querySelectorAll('input').forEach(function (i) { i.setAttribute('value', i.value); });
  var c = el.cloneNode(true);
  [c].concat([].slice.call(c.querySelectorAll('*'))).forEach(function (n) {
    ['id','onclick','oninput','onsubmit','aria-labelledby','aria-describedby','aria-live','href'].forEach(function (a) { n.removeAttribute(a); });
    if (/^(BUTTON|INPUT|A)$/.test(n.tagName)) n.setAttribute('tabindex', '-1');
    if (n.tagName === 'IMG') n.setAttribute('src', n.getAttribute('src').replace('../../handover/', '../'));
  });
  c.classList.remove('is-open', 'is-new');
  c.querySelectorAll('.is-new').forEach(function (n) { n.classList.remove('is-new'); });
  return c.outerHTML;
};`);
await ev(`setAuth(true)`);
await ev(`document.querySelector('.ufs-tile__fav[data-fav-id="pesto"]').click()`); await sleep(600);
out.added = await ev(`snap(document.getElementById('fav-list-panel'))`);
out.sizes.catalog_panel = await shot('catalog-panel');
await ev(`favShowCreate(true); document.getElementById('fav-list-name').value='Weekly Essentials'; favNameInput()`);
out.create = await ev(`snap(document.getElementById('fav-list-panel'))`);
await ev(`document.getElementById('fav-list-add').click()`);
out.error = await ev(`snap(document.getElementById('fav-list-panel'))`);
await ev(`document.getElementById('fav-list-name').value='Pizza Night'; favNameInput(); document.getElementById('fav-list-add').click()`); await sleep(400);
out.created = await ev(`snap(document.getElementById('fav-list-panel'))`);
out.created_href = await ev(`document.getElementById('fav-list-go').getAttribute('href')`);
await ev(`closeFavListPanel()`);
// Tile heart: one active (in a list), one not
out.hearts = await ev(`snap(document.querySelector('.ufs-tile__fav[data-fav-id="pesto"]')) + snap(document.querySelector('.ufs-tile__fav[data-fav-id="mash"]'))`);
const pizza = await ev(`favStore.lists[3].id`);

// ── Order Lists screenshots (desktop) ──
await go(FAV + '#order-lists');
out.sizes.ol_lists = await shot('ol-lists', '#panel-products');
await ev(`openFavSublist('products-list-weekly-essentials')`);
out.sizes.ol_detail = await shot('ol-detail', '#panel-products');
await ev(`setFavView('products','all')`); await ev(`scrollTo(0,0)`);
out.sizes.ol_all = await shot('ol-all', '#panel-products');
await go(FAV + '#order-lists/' + pizza);
await ev(`document.querySelector('#products-list-${pizza} .ufs-tile__fav').click()`); await sleep(500);
out.sizes.ol_empty = await shot('ol-empty', '#panel-products');
out.sizes.toast = await shot('toast', '#ol-toast-stack .x-toast-item', 8);
await ev(`closeFavSublist('products')`); await sleep(300);
out.sizes.card_empty = await shot('card-empty', `#ol-lists-grid [data-list="products-list-${pizza}"]`, 4);
// The All view with no products at all
await ev(`favStore.lists.forEach(l => l.items = []); favStoreSave(); olRender(); setFavView('products','all')`);
out.sizes.ol_all_empty = await shot('ol-all-empty', '#panel-products');

// ── RTL (Arabic preview: the page's own ar switch + this feature's strings) ──
const AR = {"Order Lists":"قوائم الطلب","All":"الكل","Lists":"القوائم","Sort":"ترتيب","View list":"عرض القائمة","My lists":"قوائمي","Order all":"اطلب الكل","Buy it now":"اشترِ الآن",
  "Default list":"القائمة الافتراضية","Weekly Essentials":"المستلزمات الأسبوعية","Event Catering Kit":"مستلزمات تموين الفعاليات","Pizza Night":"ليلة البيتزا"};
await go(CAT); await ev(`localStorage.removeItem('ufs-webshop-lists')`);
await go(FAV + '#order-lists');
const toAr = `(function(){ setDir('rtl'); var AR=${JSON.stringify(AR)};
  var w=document.createTreeWalker(document.getElementById('panel-products'),NodeFilter.SHOW_TEXT),n;
  while((n=w.nextNode())){ var s=n.nodeValue.trim(); if(!s) continue; var r=AR[s];
    if(!r){ r=s.replace(/^(\\d+) products?$/,'$1 منتجات').replace(/^(\\d+) lists?$/,'$1 قوائم').replace(/^Created on (.+)$/,'أُنشئت في $1')
      .replace(/^(\\d+) products? · (.+)$/,'$1 منتجات · $2').replace(/^at qty 1 each · (.+) total$/,'بكمية 1 لكل منها · الإجمالي $1'); }
    if(r!==s) n.nodeValue=n.nodeValue.replace(s,r); } })()`;
await ev(toAr); await sleep(300);
out.sizes.ol_lists_rtl = await shot('ol-lists-rtl', '#panel-products');
await ev(`openFavSublist('products-list-weekly-essentials')`); await ev(toAr);
out.sizes.ol_detail_rtl = await shot('ol-detail-rtl', '#panel-products');

// ── Mobile ──
await vp(390,844,true);
await go(FAV + '#order-lists/weekly-essentials');
out.sizes.m_ol_detail = await shot('m-ol-detail');
await go(FAV + '#order-lists');
out.sizes.m_ol_lists = await shot('m-ol-lists');
await go(CAT); await ev(`setAuth(true)`); await ev(`document.querySelector('.ufs-tile__fav[data-fav-id="mash"]').click()`); await sleep(700);
out.sizes.m_panel = await shot('m-panel');
await ev(`localStorage.removeItem('ufs-webshop-lists')`);

out.errors = errors;
writeFileSync(HERE + 'snaps.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.sizes), 'errors', errors);
ws.close(); chrome.kill();
