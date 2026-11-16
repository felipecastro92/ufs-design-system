// Captures the static previews for food-cost-calculator-spec.html from the real
// calculator (exploration page), so the spec's state previews always match the code.
// Needs `python3 -m http.server 8765 --bind 127.0.0.1` running in ~/ufs-design-system.
// Writes ./snaps.json (markup) and ./food-cost-sample.pdf.
import { spawn } from 'node:child_process'; import { writeFileSync, mkdirSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, PROFILE = HERE + '.profile';
mkdirSync(PROFILE, { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9336','--user-data-dir='+PROFILE,'--hide-scrollbars','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)); let t; for(let i=0;i<50;i++){try{t=await (await fetch('http://127.0.0.1:9336/json')).json();break}catch{await sleep(200)}}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0;const p={};const errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p[m.id]){p[m.id](m);delete p[m.id]}
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)};
const send=(method,params={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method,params}))});
const ev=async(x,awaitPromise=false)=>{const r=await send('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise});if(r.result.exceptionDetails)throw new Error(r.result.exceptionDetails.exception?.description);return r.result.result.value};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'http://localhost:8765/explorations/food-cost-calculator/template-recipe-detail.html'});await sleep(2500);

// Serialise with live input values; drop ids / handlers / ARIA id refs (static copies must not clash with the live demo)
await ev(`window.snap = function (el) {
  el.querySelectorAll('input').forEach(function (i) { i.setAttribute('value', i.value); });
  el.querySelectorAll('select').forEach(function (s) { [].forEach.call(s.options, function (o) { o.toggleAttribute('selected', o.selected); }); });
  var c = el.cloneNode(true);
  [c].concat([].slice.call(c.querySelectorAll('*'))).forEach(function (n) {
    ['id','onclick','oninput','onblur','onchange','onsubmit','aria-labelledby','aria-describedby','aria-controls','aria-live','aria-hidden','inert','data-id'].forEach(function (a) { n.removeAttribute(a); });
    if (/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(n.tagName)) n.setAttribute('tabindex', '-1');
  });
  c.classList.remove('is-open');
  return c.outerHTML;
};
window.setVal = function (el, v) { el.value = v; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('blur')); };
window.prices = function () { var ins = document.querySelectorAll('#fcc-list input'); [['0','1,20'],['1','0'],['2','0,50'],['4','1,10'],['6','40'],['7','25'],['8','60']].forEach(function (x) { setVal(ins[+x[0]], x[1]); }); };`);
await ev(`setAuth(true)`);
const out = {};
out.banner = await ev(`snap(document.querySelector('.ufs-fcc-banner'))`);
await ev(`openFcc()`); await sleep(400);
out.initial = await ev(`snap(document.getElementById('fcc-panel'))`);
out.ft_incomplete = await ev(`snap(document.querySelector('.ufs-fcc__ft'))`);
await ev(`prices(); setVal(document.getElementById('fcc-menu'), '2,00')`);
out.filled = await ev(`snap(document.getElementById('fcc-panel'))`);
for (const [k, v] of [['low','2,50'],['ok','2,00'],['high','1,50']]) {
  await ev(`setVal(document.getElementById('fcc-menu'), '${v}')`);
  out['ft_' + k] = await ev(`snap(document.querySelector('.ufs-fcc__ft'))`);
}
await ev(`setVal(document.getElementById('fcc-menu'), '2,00')`);
await ev(`document.getElementById('fcc-pdf-error').textContent = 'The PDF couldn’t be created. Check your connection and try again.'`);
out.actions_error = await ev(`snap(document.querySelector('.ufs-fcc__actions')) + snap(document.getElementById('fcc-pdf-error'))`);
await ev(`document.getElementById('fcc-pdf-error').textContent = ''; document.getElementById('fcc-pdf').setAttribute('aria-disabled','true')`);
out.actions_busy = await ev(`snap(document.querySelector('.ufs-fcc__actions'))`);
await ev(`document.getElementById('fcc-pdf').removeAttribute('aria-disabled')`);
out.actions = await ev(`snap(document.querySelector('.ufs-fcc__actions'))`);
// Sample PDF (state "filled")
const pdf = await ev(`fccLib().then(function (l) { return fccPdfDoc(l).doc.output('datauristring'); })`, true);
writeFileSync(HERE + 'food-cost-sample.pdf', Buffer.from(pdf.split(',')[1], 'base64'));
// Editing: Water removed, an ingredient being added
await ev(`fccRemove('r1', true); fccShowAdd(true); document.getElementById('fcc-add-name').value='Butter'; document.getElementById('fcc-add-qty').value='250'; document.getElementById('fcc-add-price').value='9,80'`);
out.editing = await ev(`snap(document.getElementById('fcc-panel'))`);
out.errors = errors;
writeFileSync(HERE + 'snaps.json', JSON.stringify(out, null, 1));
console.log(Object.keys(out).map(k => k + ':' + (typeof out[k] === 'string' ? out[k].length : JSON.stringify(out[k]))).join('  '));
ws.close(); chrome.kill();
