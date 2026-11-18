"""Builds handover/v3/pwa-popup-spec.html (PWA Popup: iPhone "Add to Home Screen" prompt).

Inputs (re-read on every run, so the spec never drifts from the code):
  ../pwa-popup.html ../pwa-popup.css ../pwa-popup.js       the component
  handover/v2/ratings-spec.html                             spec-page chrome
  explorations/food-cost-calculator/src/v3/build_spec.py    code highlighting + section helpers
  handover/images/pwa-popup/                                Figma assets + demo backdrop

Run: python3 build_spec.py
"""
import html, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..')
REPO = os.path.expanduser('~/ufs-design-system')
H = os.path.join(REPO, 'handover')
OUT = os.path.join(H, 'v3', 'pwa-popup-spec.html')


def rd(p): return open(p, encoding='utf-8').read()


def between(s, a, b, incl_a=True):
    assert s.count(a) == 1, ('marker not unique', a[:60])
    i = s.index(a); j = s.index(b, i + len(a))
    return s[i if incl_a else i + len(a):j]


# Highlighting + page helpers (esc, code, table, card, static, section) from the FCC generator
fcc_gen = rd(os.path.join(REPO, 'explorations', 'food-cost-calculator', 'src', 'v3', 'build_spec.py'))
exec(between(fcc_gen, '# ── Syntax highlighting', '# ── Arabic'), globals())

ratings = rd(os.path.join(H, 'v2', 'ratings-spec.html'))
P_HTML = rd(os.path.join(SRC, 'pwa-popup.html')).strip('\n')
P_CSS = rd(os.path.join(SRC, 'pwa-popup.css')).rstrip() + '\n'
P_JS = rd(os.path.join(SRC, 'pwa-popup.js')).strip('\n')
for f in ('pwa-close.svg', 'pwa-pointer.svg', 'pwa-media-placeholder.png', 'demo-home-en.jpg', 'demo-home-ar.jpg', 'demo-safari-toolbar.png'):
    assert os.path.getsize(os.path.join(H, 'images', 'pwa-popup', f)) > 0, f

# ── Chrome from the v2 spec pages ───────────────────────────────────────────
CHROME_CSS = between(ratings, '    /* ═══════════════════════════════════════\n       RESET & BASE', '    /* Doc-only stand-in for the header cart icon')
MOBILE_CHROME = between(ratings, '    /* ═══════════════════════════════════════\n       DOC CHROME ≤768px', '  </style>')
DOC_JS = between(ratings, '    function openSidebar() {', '/* ── Ratings ──')

PV_CSS = '''    /* ═══════════════════════════════════════
       PREVIEW WRAPPERS (spec-doc only — not production classes)
       An iPhone screen: the page area ends where Safari's toolbar
       starts, and contains the popup's position: fixed (transform).
    ═══════════════════════════════════════ */
    .pv-phones { display: flex; flex-wrap: wrap; gap: 32px; align-items: flex-start; justify-content: center; padding: 32px 16px; background: var(--color-squid-900); border-radius: var(--radius-md); }
    .pv-phone-fig { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .pv-phone-fig figcaption { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); }
    .pv-iphone { --s: 0.72; padding: 8px; background: #111; border-radius: 44px; box-shadow: var(--shadow-lg); }
    .pv-iphone__screen { zoom: var(--s); position: relative; width: var(--w, 430px); height: var(--h, 932px); border-radius: 48px; overflow: hidden; background: #fff; }
    .pv-iphone__page { position: absolute; inset: 0 0 110px; overflow: hidden; transform: translateZ(0); background: #fff url('../images/pwa-popup/demo-home-en.jpg') top center / 100% auto no-repeat; font-family: var(--font-family); }
    .pv-iphone__page[lang="ar"] { background-image: url('../images/pwa-popup/demo-home-ar.jpg'); }
    .pv-iphone__toolbar { position: absolute; inset-inline: 0; bottom: 0; height: 110px; background: #fff url('../images/pwa-popup/demo-safari-toolbar.png') center / 430px 110px no-repeat; }
    .pv-iphone__hint { position: absolute; inset: auto 0 40%; text-align: center; font-size: 15px; font-weight: 600; color: var(--color-brand-dark); background: rgba(255,255,255,0.9); padding: 12px; }
    .pv-iphone__page:has(.ufs-pwa-popup:not([hidden])) .pv-iphone__hint { display: none; }
    .pv-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; }
    .pv-status { font-size: 13px; line-height: 1.5; color: var(--color-mushroom-900); margin: 12px 0 0; }
    .pv-status strong { color: var(--color-brand-dark); }
    .pv-seg { display: inline-flex; border: 1px solid var(--color-mushroom-300); border-radius: var(--radius-sm); overflow: hidden; }
    .pv-seg button { font: inherit; font-size: 13px; font-weight: 600; padding: 8px 14px; border: 0; background: var(--color-salt); color: var(--color-brand-dark); cursor: pointer; }
    .pv-seg button[aria-pressed="true"] { background: var(--color-brand-dark); color: var(--color-salt); }
    .pv-btn { font: inherit; font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--color-accessible-orange); background: var(--color-accessible-orange); color: #fff; cursor: pointer; }
    .pv-btn--ghost { background: transparent; color: var(--color-accessible-orange); }
    .pv-redline { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; font-size: 13px; line-height: 1.5; }
    .pv-redline dt { font-weight: 600; color: var(--color-brand-dark); }
    .pv-redline dd { margin: 0; color: var(--color-mushroom-900); }
    @media (max-width: 600px) { .pv-iphone { --s: 0.62; } .pv-phones { padding: 20px 8px; gap: 20px; } }
'''


def static_copy(markup, rtl=False):
    """The real markup, open, without ids (several copies on one page)."""
    m = re.sub(r' (id|aria-labelledby|aria-describedby)="[^"]*"', '', markup)
    m = m.replace('class="ufs-pwa-popup" hidden', 'class="ufs-pwa-popup is-open"', 1)
    assert 'is-open' in m
    return to_ar(m) if rtl else m


def phone(inner, w=430, h=932, cap=None, extra=''):
    ph = ('<div class="pv-iphone"><div class="pv-iphone__screen" style="--w:%dpx;--h:%dpx"><div class="pv-iphone__page"%s>%s</div>'
          '<div class="pv-iphone__toolbar"></div></div></div>') % (w, h, extra, inner)
    return '<figure class="pv-phone-fig">%s%s</figure>' % (ph, '<figcaption>%s</figcaption>' % cap if cap else '')


# ── Arabic ──────────────────────────────────────────────────────────────────
AR = [
    ('Download your personal hub', 'نزّل مركزك الشخصي'),
    ('Install for offline browsing, push notifications, and a native app feel—no App Store needed',
     'ثبّته لتتصفح دون اتصال وتتلقى الإشعارات وتحصل على تجربة تشبه التطبيقات، دون الحاجة إلى App Store'),
    ('Instant access:', 'وصول فوري:'),
    ('One-click launch without typing URLs or searching bookmarks', 'افتحه بنقرة واحدة دون كتابة عناوين URL أو البحث في الإشارات المرجعية'),
    ('Faster navigation:', 'تنقّل أسرع:'),
    ('Access content and features even without an internet connection.', 'استخدم المحتوى والميزات حتى دون اتصال بالإنترنت.'),
    ('Close (button label)', 'إغلاق'),
    ("How to install: tap the ⋯ button in Safari's toolbar, then Add to Home Screen (image alt)",
     'طريقة التثبيت: اضغط على زر ⋯ في شريط أدوات Safari، ثم «إضافة إلى الشاشة الرئيسية»'),
]


def to_ar(markup):
    out = markup
    for e, a in AR:
        e = re.sub(r' \((button label|image alt)\)$', '', e)
        if e in ('Close',):
            out = out.replace('aria-label="Close"', 'aria-label="%s"' % a)
        elif e.startswith('How to install'):
            out = out.replace('alt="%s"' % html.escape(e, quote=True).replace('&#x27;', "'"), 'alt="%s"' % a)
        else:
            assert e in out, ('AR: string not in markup', e)
            out = out.replace(e, a)
    assert 'إغلاق' in out and 'طريقة التثبيت' in out, 'AR attribute swap failed'
    return out


# ── Page parts ──────────────────────────────────────────────────────────────
FIGMA = 'Figma "Rosana 2.0" 4880:4807 (panel) · 4863:4680 (position on screen)'
LIVE_PHONE = phone(P_HTML.replace('<div class="ufs-pwa-popup" id="pwa-popup" hidden>', '<div class="pv-iphone__hint">Tap “Show popup”</div>\n<div class="ufs-pwa-popup" id="pwa-popup" hidden>', 1),
                   cap='Live · iPhone 430 × 932', extra=' id="pv-live-page"')

overview = section('overview', 'Overview', 'Full Component Preview',
    'A bottom sheet that asks iPhone users to add the site to their Home Screen, so they can get back to our offers in one tap. '
    'It only appears in <strong>Safari on an iPhone</strong>, when the site isn\'t installed yet, a few seconds after the page loads. Closing it hides it for 30 days. '
    'There is no install button: Safari doesn\'t let a web page start the install, so the GIF shows how to do it and the pointer marks Safari\'s <strong>⋯</strong> button, where <strong>Add to Home Screen</strong> is.',
    card('Live',
        '<div class="pv-controls">'
        '<button type="button" class="pv-btn" onclick="pwaPopup.open()">Show popup</button>'
        '<div class="pv-seg" role="group" aria-label="Popup language"><button type="button" aria-pressed="true" onclick="pvLang(\'en\', this)">English</button><button type="button" aria-pressed="false" onclick="pvLang(\'ar\', this)">العربية (RTL)</button></div>'
        '<button type="button" class="pv-btn pv-btn--ghost" onclick="pwaPopup.resetSnooze(); pvStatus()">Reset 30-day snooze</button>'
        '</div>'
        '<div class="pv-phones">' + LIVE_PHONE + '</div>'
        '<p class="pv-status" id="pv-status" aria-live="polite"></p>',
        'The real component inside a mock iPhone screen, over the <a href="../template-home-basic.html">Home (Basic) template</a> at 430px (a capture, as is Safari\'s toolbar). <strong>Show popup</strong> skips the show rules; × , the grey area or <kbd>Esc</kbd> close it.')
    + '<div class="notice notice--info"><span class="notice-icon">ℹ️</span><div><strong>Media:</strong> the image is the static Figma frame, standing in for the GIF until it\'s delivered. See <a href="#media">Media (GIF)</a> for the export spec.</div></div>')

rows = [
    ['Root', '<code>.ufs-pwa-popup#pwa-popup</code>', '<code>position: fixed; inset: 0; z-index: 10000</code> (the DS full-screen dialog layer, as the Teaser lightbox). <code>hidden</code> until opened; <code>.is-open</code> runs the animation.'],
    ['Backdrop', '<code>__backdrop</code>', 'Whole page: rgba(137,137,137,0.5), <code>mix-blend-mode: multiply</code> (Figma). Tap closes.'],
    ['Sheet', '<code>__sheet</code>', '<code>role="dialog"</code>, <code>aria-modal</code>, labelled by the title, described by the description. Full width on the bottom edge. --color-mushroom-100, 1px --color-salt border (no bottom), --radius-xl (24px) top corners, shadow <code>0 -4px 8px rgba(0,0,0,0.15)</code> (Figma, no token). Padding --space-12 top, --space-5 sides, --space-10 + safe area bottom. Content max 440px, centred (landscape). Scrolls if taller than the screen minus --space-6.'],
    ['Close', '<code>__close</code>', 'Figma asset: 27px white circle with a 16px ×, soft shadow. 44 × 44 tap area, 10px from the top, 6px from the end edge (the circle lands 19 / 15px in, as in Figma). <code>aria-label="Close"</code>.'],
    ['Title', '<code>__title</code> (h2)', '"Download your personal hub". H4 mobile: 20px / 1.3 / 600, centred, --space-10 inline padding (clears the close button).'],
    ['Description', '<code>__desc</code>', 'Body small 14px / 1.5, centred, --space-2 below the title'],
    ['Benefits', '<code>__benefits</code> (ul)', 'Body small, start-aligned, --space-3 between items, --space-5 below the description. Each item: a bold (600) lead-in + text.'],
    ['Media', '<code>__media</code> → <code>picture</code>', '388 × 243 at 430px wide (full content width inside the 1px border; Figma 392 × 245), ratio 8:5, --radius-lg (16px), --space-8 below the benefits. GIF; a still frame when the user reduces motion. See Media.'],
    ['Pointer', '<code>__pointer</code>', 'Figma asset: 22 × 11 Squid Ink arrow, hanging from the media\'s bottom edge (1px overlap), 31px from its right edge: centred 62px from the screen\'s right edge, over Safari\'s ⋯ button. Physical <code>right</code> on purpose (see RTL).'],
    ['Text colour', '—', '--color-brand-dark (Squid Ink). Figma uses #000; the DS text colour is used instead.'],
]
anatomy = section('anatomy', 'Structure', 'Anatomy',
    'One sheet on a backdrop. Figma measurements at 430px wide; all spacing is DS tokens.',
    card('Parts', table(['Part', 'Element', 'Spec'], rows))
    + card('Spacing (430px wide)', '<dl class="pv-redline">'
        '<dt>Sheet top → title</dt><dd>48px (--space-12; Figma 52, the lesser token)</dd>'
        '<dt>Title → description</dt><dd>8px (--space-2)</dd>'
        '<dt>Description → benefits</dt><dd>20px (--space-5)</dd>'
        '<dt>Between benefits</dt><dd>12px (--space-3)</dd>'
        '<dt>Benefits → media</dt><dd>32px (--space-8)</dd>'
        '<dt>Media → sheet bottom</dt><dd>40px (--space-10) + the iPhone\'s bottom safe area; the pointer sits in it</dd>'
        '<dt>Sides</dt><dd>20px (--space-5; Figma 19)</dd>'
        '</dl>')
    + card('Reference markup', code(('HTML', P_HTML), ('CSS', P_CSS), ('JS', P_JS))))

rules = section('show-rules', 'Behavior', 'When It Shows',
    'Call <code>pwaPopup.init()</code> on every page load. It decides; nothing else needs to.',
    card('', table(['Rule', 'Detail'], [
        ['Device', 'Safari on an iPhone only (<code>iPhone</code> in the user agent, Safari\'s <code>Version/…</code>). Not iPad (its ⋯ / Share button is at the top), not Chrome, Firefox or Edge on iOS, not in-app browsers (Instagram, Facebook, Google app…): the pointer and the GIF would be wrong there. Android and desktop never see it.'],
        ['Not installed', 'Never when the site was opened from the Home Screen (<code>navigator.standalone</code> or <code>display-mode: standalone</code>).'],
        ['Delay', '5 seconds after <code>init()</code>, so it doesn\'t cover the page the moment it loads (<code>init({ delay })</code> to change it).'],
        ['Snooze', 'Closing it (×, the grey area or <kbd>Esc</kbd>) stores the time in <code>localStorage["ufs-pwa-popup"]</code>; it doesn\'t show again for <strong>30 days</strong>. Storage blocked (private mode): no snooze, so it can come back on the next page load.'],
        ['Once per page', 'At most once per page load.'],
        ['Other overlays', '<strong>Production:</strong> don\'t open it over another dialog (cookie consent, sign-in, cart, newsletter popup). Wait until they close, or skip this page load.'],
        ['Debug', '<code>pwaPopup.reason()</code> returns why it wouldn\'t show here (empty = it would); <code>pwaPopup.resetSnooze()</code> clears the snooze.'],
    ])))

media = section('media', 'Structure', 'Media (GIF)',
    'The animation shows the install steps. Export it to fit the slot; the CSS rounds the corners.',
    card('', table(['Item', 'Spec'], [
        ['Format', 'GIF, looping forever. (A muted, looping MP4 would be about 10× lighter if the GIF gets heavy; same slot.)'],
        ['Size', '784 × 490 px (2× of 392 × 245, ratio 8:5). Square corners: the 16px radius is CSS. Shown with <code>object-fit: cover</code>, so a slightly different ratio is cropped, not stretched.'],
        ['Weight', 'Aim for under 1 MB: many users will be on mobile data. <code>width</code>/<code>height</code> are set, so nothing jumps while it loads.'],
        ['Reduced motion', 'A still PNG (the clearest frame, same size) in the <code>&lt;source media="(prefers-reduced-motion: reduce)"&gt;</code>. GIFs can\'t be paused, so this is the only way to stop the motion.'],
        ['Alt text', 'Describes the steps, in the page language: "How to install: tap the ⋯ button in Safari\'s toolbar, then Add to Home Screen". Update it if the GIF shows different steps.'],
        ['Now', '<code>handover/images/pwa-popup/pwa-media-placeholder.png</code>: the static Figma frame (392 × 245), used for both until the GIF arrives.'],
    ])))

behavior = section('behavior', 'Behavior', 'Interaction',
    'What happens at each step.',
    card('', table(['Moment', 'What happens'], [
        ['Shows', 'Slides up from the bottom; the page behind is dimmed and stops scrolling. Focus moves to the sheet, so screen readers read the title and description.'],
        ['× / grey area / <kbd>Esc</kbd>', 'Slides down, starts the 30-day snooze, focus goes back where it was.'],
        ['<kbd>Tab</kbd>', 'Stays on the close button (the sheet\'s only control).'],
        ['The user installs', 'They tap ⋯ → Add to Home Screen in Safari. Safari doesn\'t tell the page, so the popup stays until it\'s closed. From then on, opening the site from the Home Screen never shows it.'],
        ['Taller than the screen', 'Small iPhones or landscape: the sheet stops 24px below the top and scrolls inside.'],
    ])))

animation = section('animation', 'Behavior', 'Animation',
    'The DS drawer curve, vertical.',
    card('', table(['Element', 'Trigger', 'Animation', 'Duration', 'Easing'], [
        ['Sheet', 'Show / close', 'translateY(100%) → 0 / back', '350ms', 'cubic-bezier(0.4, 0, 0.2, 1)'],
        ['Backdrop', 'Show / close', 'opacity 0 → 1 / back', '300ms', 'ease'],
        ['Reduced motion', '<code>prefers-reduced-motion</code>', 'Sheet fades in and out instead of sliding; the GIF is replaced by its still frame', '200ms', 'ease'],
    ])))

a11y = section('accessibility', 'Behavior', 'Accessibility',
    'A modal dialog with one control.',
    card('', table(['Item', 'Detail'], [
        ['Role', '<code>role="dialog"</code> + <code>aria-modal="true"</code>, <code>aria-labelledby</code> the title, <code>aria-describedby</code> the description'],
        ['Focus', 'The sheet (<code>tabindex="-1"</code>) on open; Tab kept on Close; restored on close'],
        ['Close', '44 × 44 tap area around the 27px circle; visible focus ring (2px --color-accessible-orange)'],
        ['Contrast', 'Squid Ink on mushroom-100: 14.6:1 (AAA)'],
        ['Decorative', 'The pointer and the close icon have empty <code>alt</code>; the GIF has a real description'],
    ])))

STATIC_EN = static_copy(P_HTML)
mobile = section('mobile', 'Responsive', 'iPhone Sizes',
    'iPhone only, so there\'s no desktop layout. The sheet is always full width; the pointer stays 62px from the right edge, where the ⋯ button is on every iPhone size.',
    card('', static('<div class="pv-phones">'
        + phone(STATIC_EN, 430, 932, 'iPhone Pro Max · 430 wide')
        + phone(STATIC_EN, 375, 812, 'iPhone mini / SE width · 375 wide')
        + '</div>', 'pv-static'),
        'The real markup, open. At 375px the media scales down with the width (8:5); the sheet still fits below the page header.'))

rtl_rules = '''/* The sheet is built with logical properties: in RTL the close button
   moves to the top-left and the benefits align right, with no extra rules. */

/* The pointer does NOT flip: it points at Safari's ⋯ button, which is
   on the right whatever the page language (it follows the iPhone's
   language, not the page's). */
.ufs-pwa-popup__pointer { right: 31px; }'''
rtl = section('rtl', 'Internationalisation', 'i18n &amp; RTL',
    'All strings follow the page language. Arabic below; the preview is the real markup in <code>dir="rtl"</code>.',
    card('Strings', table(['English', 'Arabic'], [[esc(e), '<span dir="rtl">%s</span>' % a] for e, a in AR]))
    + card('RTL preview', static('<div class="pv-phones">' + phone(static_copy(P_HTML, rtl=True), 430, 932, 'Arabic · dir="rtl"', ' dir="rtl" lang="ar"') + '</div>', 'pv-static'))
    + card('RTL rules', code(('CSS', rtl_rules)))
    + '<div class="notice notice--warn"><span class="notice-icon">⚠️</span><div><strong>Open point:</strong> on an iPhone set to Arabic, Safari mirrors its toolbar and ⋯ may sit on the left. Confirm on a device; if so, flip the pointer with the device language (<code>navigator.language</code>), not the page direction.</div></div>')

prod = section('production', 'Behavior', 'Production Notes',
    'What the site needs so that Add to Home Screen gives an app, not just a bookmark.',
    card('', table(['Item', 'Detail'], [
        ['Web app manifest', '<code>&lt;link rel="manifest" href="/manifest.webmanifest"&gt;</code> with <code>name</code>, <code>short_name</code>, <code>start_url</code>, <code>display: "standalone"</code>, <code>theme_color</code>, icons. Without it, iOS adds a plain Safari bookmark.'],
        ['Home Screen icon', '<code>&lt;link rel="apple-touch-icon" href="/apple-touch-icon.png"&gt;</code>, 180 × 180, no transparency. Title: <code>&lt;meta name="apple-mobile-web-app-title" content="UFS"&gt;</code>.'],
        ['Copy promises', 'The description and benefits promise offline browsing and push notifications. Ship that copy only if the app does both: offline needs a service worker; push works on iOS 16.4+ only for Home Screen apps, after the user allows it.'],
        ['No install button', 'iOS has no <code>beforeinstallprompt</code>: a page can\'t start the install. That\'s why the popup explains instead.'],
    ])))

# ── Assemble ────────────────────────────────────────────────────────────────
NAV = [('Overview', [('overview', 'Full Component Preview')]),
       ('Structure', [('anatomy', 'Anatomy'), ('media', 'Media (GIF)')]),
       ('Behavior', [('show-rules', 'When It Shows'), ('behavior', 'Interaction'), ('animation', 'Animation'), ('accessibility', 'Accessibility'), ('production', 'Production Notes')]),
       ('Responsive', [('mobile', 'iPhone Sizes')]),
       ('Internationalisation', [('rtl', 'i18n &amp; RTL')])]
nav = ''.join('      <div class="sidebar-group-label"%s>%s</div>\n' % ('' if i == 0 else ' style="margin-top:8px"', g)
              + ''.join('      <a href="#%s" class="sidebar-link" onclick="closeSidebar()"><span class="nav-dot"></span> %s</a>\n' % l for l in links)
              for i, (g, links) in enumerate(NAV))

AR_JS = [(e, a) for e, a in AR if '(' not in e]
page = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PWA Popup — UFS Spec v3.0</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=IBM+Plex+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../tokens.css" />
  <!-- Generated by explorations/pwa-popup/src/v3/build_spec.py — edit the source, not this file -->
  <style>
''' + CHROME_CSS + '\n' + PV_CSS + '\n' + P_CSS + '\n' + MOBILE_CHROME + '''  </style>
</head>
<body>

  <!-- Sidebar backdrop -->
  <div class="sidebar-backdrop" id="sidebar-backdrop" onclick="closeSidebar()"></div>

  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <img src="../images/ufs-logo.png" alt="UFS" class="sidebar-logo" />
      <button class="sidebar-close" onclick="closeSidebar()" aria-label="Close menu">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="width:14px;height:14px"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
      </button>
    </div>
    <nav class="sidebar-nav">
      <a href="index.html" class="sidebar-back">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="10 4 6 8 10 12"/></svg>
        Design System v3.0
      </a>
''' + nav + '''    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-footer-text">New in v3.0.<br/>''' + FIGMA + '''.</div>
    </div>
  </aside>

  <button class="sidebar-toggle" onclick="openSidebar()" aria-label="Open menu">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></svg>
  </button>

  <!-- Doc topbar -->
  <nav class="doc-topbar" aria-label="Breadcrumb">
    <a href="index.html" class="doc-topbar-back">
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="10 4 6 8 10 12"/></svg>
      Design System v3.0
    </a>
    <span class="doc-topbar-sep">/</span>
    <span class="doc-topbar-current">PWA Popup</span>
    <span class="doc-topbar-version">New in v3.0</span>
  </nav>

  <!-- Doc header -->
  <header class="doc-header">
    <div class="doc-header-inner">
      <img src="../images/ufs-logo.png" alt="UFS" class="doc-header-logo" />
      <div class="doc-header-vdiv"></div>
      <div class="doc-header-body">
        <div class="doc-header-eyebrow">Handover Spec · v3.0</div>
        <h1 class="doc-header-title"><span>PWA Popup</span></h1>
        <p class="doc-header-desc">A bottom sheet that shows iPhone Safari users how to add the site to their Home Screen, for one-tap access to our offers.</p>
      </div>
      <div class="doc-header-meta">
        <div class="doc-header-meta-row"><span class="doc-header-meta-label">Platform</span><span class="doc-header-meta-sep">·</span><span class="doc-header-meta-val">iPhone Safari only</span></div>
        <div class="doc-header-meta-row"><span class="doc-header-meta-label">Format</span><span class="doc-header-meta-sep">·</span><span class="doc-header-meta-val">HTML + CSS + JS</span></div>
      </div>
    </div>
  </header>

  <main class="content" id="main">
''' + overview + anatomy + media + rules + behavior + animation + a11y + prod + mobile + rtl + '''
  </main>

  <script>
''' + DOC_JS + '''
''' + P_JS + '''

/* ── Doc-only: live demo controls ── */
var PV_AR = ''' + json.dumps(AR_JS, ensure_ascii=False) + ''';
var PV_ALT = { en: ''' + '"%s"' % "How to install: tap the ⋯ button in Safari's toolbar, then Add to Home Screen" + ''', ar: "''' + dict(AR)["How to install: tap the ⋯ button in Safari's toolbar, then Add to Home Screen (image alt)"] + '''" };
function pvLang(lang, btn) {
  var page = document.getElementById('pv-live-page'), sheet = page.querySelector('.ufs-pwa-popup__sheet');
  btn.parentNode.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
  if ((page.getAttribute('lang') || 'en') === lang) return;
  var walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT), n;
  while ((n = walker.nextNode())) {
    PV_AR.forEach(function (p) {
      var from = lang === 'ar' ? p[0] : p[1], to = lang === 'ar' ? p[1] : p[0];
      if (n.nodeValue.indexOf(from) > -1) n.nodeValue = n.nodeValue.replace(from, to);
    });
  }
  sheet.querySelector('.ufs-pwa-popup__close').setAttribute('aria-label', lang === 'ar' ? 'إغلاق' : 'Close');
  sheet.querySelector('.ufs-pwa-popup__media-img').alt = PV_ALT[lang];
  page.setAttribute('lang', lang); page.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
}
function pvStatus() {
  var r = pwaPopup.reason();
  document.getElementById('pv-status').innerHTML = '<strong>On this device, <code>pwaPopup.init()</code> would ' +
    (r ? 'not show it:</strong> ' + r + '.' : 'show it after 5 seconds.</strong>');
}
document.getElementById('pwa-popup').addEventListener('click', function () { setTimeout(pvStatus, 0); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setTimeout(pvStatus, 0); });
pvStatus();
  </script>
  <script src="../ds-version.js"></script>
</body>
</html>
'''
open(OUT, 'w', encoding='utf-8').write(page)
print('spec ok', len(page))
