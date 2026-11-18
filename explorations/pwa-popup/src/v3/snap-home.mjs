// Captures handover/template-home-basic.html at iPhone size (430 × 822: the page
// area above Safari's toolbar) in English and Arabic, as the backdrop of the
// spec's mock iPhones → handover/images/pwa-popup/demo-home-{en,ar}.jpg.
// Needs `python3 -m http.server 8765 --bind 127.0.0.1` running in ~/ufs-design-system.
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, OUT = HERE + '../../../../handover/images/pwa-popup/';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9342', '--user-data-dir=' + HERE + '.profile-snap', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let t;
for (let i = 0; i < 50; i++) { try { t = await (await fetch('http://127.0.0.1:9342/json')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; const errors = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(x.slice(0, 80) + ' → ' + r.result.exceptionDetails.exception?.description); return r.result.result.value; };
await send('Page.enable'); await send('Runtime.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Network.setUserAgentOverride', { userAgent: UA });
await send('Emulation.setDeviceMetricsOverride', { width: 430, height: 822, deviceScaleFactor: 2, mobile: true });

for (const lang of ['en', 'ar']) {
  await send('Page.navigate', { url: 'http://127.0.0.1:8765/handover/template-home-basic.html' }); await sleep(3000);
  if (lang === 'ar') { await ev('setLang("ar")'); await sleep(800); }
  // Doc-only control bar out; scroll to the top; let images settle
  await ev(`(() => { const b = document.getElementById('ctrl-bar'); if (b) b.style.display = 'none'; scrollTo(0, 0);
    return Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }))); })()`);
  await sleep(1200);
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  writeFileSync(OUT + `demo-home-${lang}.jpg`, Buffer.from(r.result.data, 'base64'));
  console.log(lang, 'dir=' + await ev('document.documentElement.dir || "ltr"'));
}
chrome.kill(); rmSync(HERE + '.profile-snap', { recursive: true, force: true });
console.log(errors.length ? 'errors: ' + errors.join(' | ') : 'no errors');
