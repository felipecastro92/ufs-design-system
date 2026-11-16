import { spawn } from 'node:child_process'; import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = new URL('./shots/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9335','--user-data-dir='+OUT+'../profile','--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let t; for(let i=0;i<50;i++){try{t=await (await fetch('http://127.0.0.1:9335/json')).json();break}catch{await sleep(200)}}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0;const p={};const errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m);delete p[m.id]}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)};
const send=(method,params={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true});return r.result.exceptionDetails?'ERR '+r.result.exceptionDetails.exception?.description:r.result.result.value};
const vp=(w,h,m=false)=>send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:m});
const shot=async(name,sel)=>{let clip;if(sel){clip=await ev(`(()=>{const el=document.querySelector('${sel}');el.scrollIntoView({block:'start'});const r=el.getBoundingClientRect();return {x:Math.max(0,r.left+scrollX-24),y:r.top+scrollY-24,width:r.width+48,height:r.height+48,scale:1}})()`)}
 await sleep(400);const s=await send('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:!!sel});writeFileSync(OUT+name+'.png',Buffer.from(s.result.data,'base64'))};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
const URL_='http://localhost:8765/explorations/food-cost-calculator/template-recipe-detail.html';
const load=async()=>{await send('Page.navigate',{url:URL_});await sleep(2500)};
const log=(...a)=>console.log(...a);
await vp(1440,900); await load();
await send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:OUT});
await shot('1-banner-desktop','.ufs-recipe-ingredients');
// signed out → sign in
await ev(`document.getElementById('fcc-open').click()`);
log('signin', await ev(`[document.getElementById('signin-panel').classList.contains('is-open'), document.getElementById('reg-step-email-title').textContent, fcc.pending]`));
await ev(`regFinish()`); await sleep(700);
log('fcc open after sign-in', await ev(`[S.auth, document.getElementById('fcc-panel').classList.contains('is-open'), document.activeElement.id]`));
log('initial', await ev(`JSON.stringify({items: fcc.items.length, priced: document.getElementById('fcc-priced').textContent, total: document.getElementById('fcc-total').textContent, per: document.getElementById('fcc-per').textContent, pct: document.getElementById('fcc-pct').textContent, note: document.getElementById('fcc-note').textContent})`));
await shot('2-panel-initial');
// set prices + menu
await ev(`(()=>{const set=(i,v)=>{const el=document.querySelectorAll('#fcc-list input')[i];el.value=v;el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('blur'))};set(0,'1,20');set(1,'0');set(2,'0,50');set(4,'1,10');set(6,'40');set(7,'25');set(8,'60');const m=document.getElementById('fcc-menu');m.value='2,50';m.dispatchEvent(new Event('input'));m.dispatchEvent(new Event('blur'))})()`);
log('priced', await ev(`JSON.stringify({priced: document.getElementById('fcc-priced').textContent, total: document.getElementById('fcc-total').textContent, per: document.getElementById('fcc-per').textContent, pct: document.getElementById('fcc-pct').textContent, status: document.getElementById('fcc-status').textContent, note: document.getElementById('fcc-note').hidden, savedGone: !document.getElementById('fcc-saved'), meta0: document.getElementById('fcc-meta-r0').textContent, val0: document.getElementById('fcc-val-r0').textContent, menu: document.getElementById('fcc-menu').value})`));
// expected: potatoes 2kg*1.2=2.4; water 0; salt .01*.5=.005; meadow .2*4.2=.84; milk .3*1.1=.33; knorr .04*18.9=.756; pepper .004*40=.16; nutmeg .002*25=.05; chives .015*60=.9 => 5.441
// servings sync
await ev(`stepServings(10)`); 
log('servings 20', await ev(`[document.getElementById('fcc-serv').textContent, document.getElementById('servings-value').textContent, document.getElementById('fcc-total').textContent, document.getElementById('fcc-per').textContent]`));
await ev(`stepServings(-10)`);
// remove + undo + add custom
await ev(`fccRemove('r1', true)`); log('removed water', await ev(`document.getElementById('fcc-priced').textContent + ' focus=' + document.activeElement.className`));
await ev(`fccShowAdd(true); document.getElementById('fcc-add-name').value='Butter'; document.getElementById('fcc-add-qty').value='250'; document.getElementById('fcc-add-price').value='9,80'; document.getElementById('fcc-add').requestSubmit()`);
log('added', await ev(`[document.getElementById('fcc-priced').textContent, document.getElementById('fcc-total').textContent, document.querySelectorAll('#fcc-list li').length]`));
await shot('3-panel-filled');
await ev(`document.getElementById('fcc-body').scrollTop = 99999`); await shot('3b-panel-scrolled');
log('footer visible', await ev(`(()=>{const f=document.querySelector('.ufs-fcc__ft').getBoundingClientRect();return [Math.round(f.top), Math.round(f.bottom), innerHeight]})()`));
// Save as PDF: one line with Reset, right-aligned; downloads a file
log('actions row', await ev(`(()=>{const r=document.querySelector('.ufs-fcc__reset').getBoundingClientRect(),b=document.getElementById('fcc-pdf').getBoundingClientRect(),body=document.getElementById('fcc-body'),cs=getComputedStyle(body),inner=body.getBoundingClientRect().right-parseFloat(cs.paddingRight);return {sameLine:Math.abs((r.top+r.bottom)/2-(b.top+b.bottom)/2)<1,rightEdge:Math.round(b.right)===Math.round(inner)}})()`));
await shot('3c-actions','.ufs-fcc__actions');
await ev(`document.getElementById('fcc-pdf').click()`); await sleep(5000);
await ev(`fcc.lib.then(l=>window.__font=l.fonts?'jakarta':'helvetica')`); await sleep(200);
log('pdf', await ev(`[typeof window.jspdf, window.__font, document.getElementById('fcc-pdf').getAttribute('aria-disabled'), document.getElementById('fcc-pdf-error').textContent]`));
// close → focus return; reopen keeps values (memory); reload starts fresh
await ev(`closeFcc()`); log('focus after close', await ev(`document.activeElement.id`));
await ev(`document.getElementById('fcc-open').click()`); await sleep(500);
log('kept in memory', await ev(`[document.getElementById('fcc-total').textContent, document.getElementById('fcc-menu').value, document.querySelectorAll('#fcc-list li').length]`));
await ev(`closeFcc()`);
await load(); await ev(`setAuth(true)`); await ev(`document.getElementById('fcc-open').click()`); await sleep(500);
log('fresh after reload', await ev(`[document.getElementById('fcc-total').textContent, document.getElementById('fcc-menu').value, document.querySelectorAll('#fcc-list li').length, localStorage.length]`));
// a11y: closed panel is inert; open panel traps Tab
await ev(`closeFcc()`);
log('inert when closed', await ev(`[document.getElementById('fcc-panel').inert, document.getElementById('fcc-panel').getAttribute('aria-hidden')]`));
await ev(`document.getElementById('fcc-open').click()`); await sleep(500);
log('trap', await ev(`(()=>{const p=document.getElementById('fcc-panel');const pdf=document.getElementById('fcc-pdf');pdf.focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));const a=document.activeElement.className;document.getElementById('fcc-title').focus();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));return [p.inert, a, document.activeElement.id]})()`));
// escape
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))`); log('esc closed', await ev(`!document.getElementById('fcc-panel').classList.contains('is-open')`));
// mobile
await vp(390,844,true); await sleep(300); await shot('4-banner-mobile','.ufs-fcc-banner');
await ev(`document.getElementById('fcc-open').click()`); await sleep(600); await shot('5-panel-mobile');
log('mobile overflow', await ev(`[document.getElementById('fcc-panel').scrollWidth, document.getElementById('fcc-panel').clientWidth]`));
await ev(`fccReset()`); log('reset', await ev(`document.getElementById('fcc-total').textContent`));
await shot('6-panel-mobile-actions','.ufs-fcc__actions');
await shot('6-panel-mobile-reset');
log('ERRORS', JSON.stringify(errors));
ws.close(); chrome.kill();
