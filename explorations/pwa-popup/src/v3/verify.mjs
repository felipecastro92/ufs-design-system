// Checks the PWA popup against Figma (430px iPhone) and its show rules, then
// screenshots the spec page. Needs `python3 -m http.server 8765 --bind 127.0.0.1`
// running in ~/ufs-design-system. Writes a temporary handover/v3/_pwa-verify.html.
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
const HERE = new URL('./', import.meta.url).pathname, SRC = HERE + '../', SHOTS = HERE + 'shots/';
const REPO = HERE + '../../../../', TMP = REPO + 'handover/v3/_pwa-verify.html';
mkdirSync(SHOTS, { recursive: true });
const css = readFileSync(SRC + 'pwa-popup.css', 'utf8'), js = readFileSync(SRC + 'pwa-popup.js', 'utf8'), markup = readFileSync(SRC + 'pwa-popup.html', 'utf8');
writeFileSync(TMP, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="../tokens.css"><style>body{margin:0;font-family:var(--font-family);height:2000px;background:#fff url('../images/pwa-popup/demo-home-en.jpg') top/100% auto no-repeat}${css}</style></head>
<body>${markup}<script>${js}\npwaPopup.init({ delay: 300 });</script></body></html>`);

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const CRIOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9341', '--user-data-dir=' + HERE + '.profile', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms)); let t;
for (let i = 0; i < 50; i++) { try { t = await (await fetch('http://127.0.0.1:9341/json')).json(); break; } catch { await sleep(200); } }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = {}; const errors = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(x.slice(0, 80) + ' → ' + r.result.exceptionDetails.exception?.description); return r.result.result.value; };
const go = async (u, ua, w = 430, h = 822, mobile = true) => {
  await send('Network.setUserAgentOverride', { userAgent: ua });
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile });
  await send('Page.navigate', { url: u }); await sleep(1800);
};
const shot = async (name, clip) => { const r = await send('Page.captureScreenshot', clip ? { format: 'png', captureBeyondViewport: true, clip: { ...clip, scale: 1 } } : { format: 'png' }); writeFileSync(SHOTS + name + '.png', Buffer.from(r.result.data, 'base64')); };
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });

const results = []; const ok = (name, cond, info = '') => results.push([cond ? 'PASS' : 'FAIL', name, info]);
const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
const BASE = 'http://127.0.0.1:8765/handover/v3/';
const U = BASE + '_pwa-verify.html';

// 1. iPhone Safari, 430 × 822 (the page area above Safari's toolbar in Figma)
await go(BASE + 'index.html', IPHONE); await ev('localStorage.removeItem("ufs-pwa-popup")');
await go(U, IPHONE);
const g = await ev(`(() => { const R = s => document.querySelector(s).getBoundingClientRect(); const root = document.getElementById('pwa-popup');
  const sh = R('.ufs-pwa-popup__sheet'), ti = R('.ufs-pwa-popup__title'), de = R('.ufs-pwa-popup__desc'), be = R('.ufs-pwa-popup__benefits'), me = R('.ufs-pwa-popup__media-img'), po = R('.ufs-pwa-popup__pointer'), cl = R('.ufs-pwa-popup__close img');
  return { open: !root.hidden && root.classList.contains('is-open'), focus: document.activeElement.classList.contains('ufs-pwa-popup__sheet'),
    sheetTop: sh.top, sheetH: sh.height, vh: innerHeight, titleY: ti.top - sh.top, descGap: de.top - ti.bottom, benGap: be.top - de.bottom, mediaGap: me.top - be.bottom,
    mediaW: me.width, mediaH: me.height, mediaX: me.left, bottomPad: sh.bottom - me.bottom, pointerCx: innerWidth - (po.left + po.width / 2), pointerTop: po.top - me.bottom,
    closeCx: innerWidth - (cl.left + cl.width / 2), closeCy: cl.top + 17.5 - sh.top + 1 - 1, overflow: document.documentElement.style.overflow,
    titleFs: getComputedStyle(document.querySelector('.ufs-pwa-popup__title')).fontSize, color: getComputedStyle(document.querySelector('.ufs-pwa-popup__sheet')).color }; })()`);
ok('iPhone Safari: opens after the delay', g.open, '');
ok('focus moves to the sheet', g.focus);
ok('page scroll locked', g.overflow === 'hidden');
ok('sheet sits on the bottom edge', near(g.sheetTop + g.sheetH, g.vh), `${g.sheetTop}+${g.sheetH} vs ${g.vh}`);
ok('sheet height ≈ Figma 562', near(g.sheetH, 562, 8), g.sheetH.toFixed(1));
ok('title top 48 (Figma 52 → --space-12)', near(g.titleY, 48, 1.5), g.titleY.toFixed(1));
ok('media 388 × 243 (Figma 392 × 245; 20px sides + 1px border)', near(g.mediaW, 388, 1) && near(g.mediaH, 242.5, 1), `${g.mediaW} × ${g.mediaH.toFixed(1)}`);
ok('media → bottom 40', near(g.bottomPad, 40, 1), g.bottomPad.toFixed(1));
ok('pointer centred 62px from the right (Safari ⋯)', near(g.pointerCx, 62, 1.5), g.pointerCx.toFixed(1));
ok('pointer hangs from the media (−1px)', near(g.pointerTop, -1, 0.5), g.pointerTop.toFixed(2));
ok('close circle centred 28.5px from the right (Figma)', near(g.closeCx, 28.5, 1.5), g.closeCx.toFixed(1));
ok('title 20px, Squid Ink text', g.titleFs === '20px' && g.color === 'rgb(34, 29, 55)', g.titleFs + ' ' + g.color);
await sleep(400); await shot('iphone-430');

// Tab stays on close; Esc closes, snoozes, restores scroll
await ev('document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }))');
ok('Tab → close button', await ev('document.activeElement.classList.contains("ufs-pwa-popup__close")'));
await ev('document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))'); await sleep(500);
ok('Esc closes (hidden after the slide)', await ev('document.getElementById("pwa-popup").hidden'));
ok('closing stores the snooze', await ev('+localStorage.getItem("ufs-pwa-popup") > Date.now() - 5000'));
ok('scroll unlocked', await ev('document.documentElement.style.overflow === ""'));
await go(U, IPHONE);
ok('snoozed: not shown on reload', await ev('document.getElementById("pwa-popup").hidden'), await ev('pwaPopup.reason()'));
await ev('localStorage.setItem("ufs-pwa-popup", String(Date.now() - 31 * 864e5))'); await go(U, IPHONE);
ok('after 30 days: shown again', await ev('!document.getElementById("pwa-popup").hidden'));
await ev('document.querySelector(".ufs-pwa-popup__backdrop").click()'); await sleep(500);
ok('backdrop tap closes', await ev('document.getElementById("pwa-popup").hidden'));
await ev('localStorage.removeItem("ufs-pwa-popup")'); await go(U, IPHONE);
await ev('document.querySelector(".ufs-pwa-popup__close").click()'); await sleep(500);
ok('× closes', await ev('document.getElementById("pwa-popup").hidden'));

// Other browsers / devices never see it
for (const [name, ua, w, h, m] of [['Chrome on iPhone', CRIOS, 430, 822, true], ['iPad Safari', IPAD, 820, 1180, true], ['Desktop Chrome', '', 1280, 800, false]]) {
  await ev('localStorage.removeItem("ufs-pwa-popup")');
  await go(U, ua || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', w, h, m);
  ok(name + ': not shown', await ev('document.getElementById("pwa-popup").hidden'), await ev('pwaPopup.reason()'));
}

// Small iPhone + RTL
await ev('localStorage.removeItem("ufs-pwa-popup")'); await go(U, IPHONE, 375, 667);
const s = await ev(`(() => { const sh = document.querySelector('.ufs-pwa-popup__sheet').getBoundingClientRect(); return { top: sh.top, h: sh.height, scroll: document.querySelector('.ufs-pwa-popup__sheet').scrollHeight }; })()`);
ok('375 × 667: sheet fits (scrolls inside if needed)', s.top >= 23.5, JSON.stringify(s));
await sleep(300); await shot('iphone-375');
await ev('localStorage.removeItem("ufs-pwa-popup")'); await go(U, IPHONE);
await ev('document.documentElement.dir = "rtl"; document.documentElement.lang = "ar"'); await sleep(200);
const r = await ev(`(() => { const cl = document.querySelector('.ufs-pwa-popup__close').getBoundingClientRect(), po = document.querySelector('.ufs-pwa-popup__pointer').getBoundingClientRect();
  return { closeLeft: cl.left, pointerCx: innerWidth - (po.left + po.width / 2), align: getComputedStyle(document.querySelector('.ufs-pwa-popup__benefits')).textAlign }; })()`);
ok('RTL: close moves to the top-left', r.closeLeft < 20, r.closeLeft.toFixed(1));
ok('RTL: pointer stays on the right (Safari ⋯)', near(r.pointerCx, 62, 1.5), r.pointerCx.toFixed(1));
ok('RTL: benefits start-aligned', r.align === 'start', r.align);

// Spec page: no errors, live demo opens inside the phone, previews render
errors.length = 0;
await go(BASE + 'pwa-popup-spec.html', '', 1280, 900, false);
ok('spec: no JS errors on load', errors.length === 0, errors.join(' | '));
await ev('document.getElementById("overview").scrollIntoView()'); await sleep(200);
await ev('pwaPopup.open()'); await sleep(600);
const live = await ev(`(() => { const ph = document.querySelector('#pv-live-page').getBoundingClientRect(), sh = document.querySelector('#pwa-popup .ufs-pwa-popup__sheet').getBoundingClientRect();
  return { inside: sh.left >= ph.left - 1 && sh.right <= ph.right + 1 && sh.bottom <= ph.bottom + 1 && sh.top >= ph.top - 1, ph: [ph.left, ph.top, ph.width, ph.height] }; })()`);
ok('spec: live popup stays inside the mock phone', live.inside, JSON.stringify(live.ph));
const ph = await ev('(() => { const r = document.querySelector(".pv-phones").getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height }; })()');
await shot('spec-live', ph);
await ev('pvLang("ar", document.querySelectorAll(".pv-seg button")[1])'); await sleep(200);
ok('spec: Arabic toggle', await ev('document.getElementById("pwa-popup-title").textContent === "نزّل مركزك الشخصي" && document.getElementById("pv-live-page").dir === "rtl"'));
await shot('spec-live-ar', ph);
await ev('pvLang("en", document.querySelectorAll(".pv-seg button")[0]); pwaPopup.close()'); await sleep(500);
ok('spec: English restored', await ev('document.getElementById("pwa-popup-title").textContent === "Download your personal hub"'));
for (const sec of ['mobile', 'rtl']) {
  await ev(`document.getElementById("${sec}").scrollIntoView()`); await sleep(300);
  const c = await ev(`(() => { const r = document.querySelector("#${sec} .pv-phones").getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, width: r.width, height: r.height }; })()`);
  await shot('spec-' + sec, c);
}
// Spec on a phone: no horizontal scroll
await go(BASE + 'pwa-popup-spec.html', IPHONE, 390, 844, true);
ok('spec at 390px: no horizontal scroll', await ev('document.documentElement.scrollWidth <= innerWidth + 1'), await ev('document.documentElement.scrollWidth'));
ok('spec at 390px: no JS errors', errors.length === 0, errors.join(' | '));

rmSync(TMP); chrome.kill();
for (const [s, n, i] of results) console.log(s, n, i ? '— ' + i : '');
const fails = results.filter(r => r[0] === 'FAIL').length;
console.log(`\n${results.length - fails}/${results.length} passed`); process.exit(fails ? 1 : 0);
