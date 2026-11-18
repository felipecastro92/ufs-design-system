"""Builds handover/v3/favourite-lists-spec.html (Favourite Lists → Order Lists).

Inputs (all re-read on every run, so the spec never drifts from the code):
  ../store.js ../catalog.js ../orderlists.html/.css/.js   the feature source
  ../out-catalog.html ../out-favourites.html              the built templates (panel markup/CSS
                                                          and DS rules are mirrored 1:1)
  handover/v2/ratings-spec.html                           spec-page chrome
  explorations/food-cost-calculator/src/v3/build_spec.py  code highlighting + section helpers
  ./snaps.json ./shots-spec/*.png                         previews, from `node snap.mjs`

Order: python3 ../build.py → node snap.mjs (server on :8765) → python3 build_spec.py
Also copies the screenshots to handover/images/favourite-lists/.
"""
import html, json, os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..')
REPO = os.path.expanduser('~/ufs-design-system')
H = os.path.join(REPO, 'handover')
OUT = os.path.join(H, 'v3', 'favourite-lists-spec.html')
IMG = os.path.join(H, 'images', 'favourite-lists')


def rd(p): return open(p, encoding='utf-8').read()


def between(s, a, b, incl_a=True):
    assert s.count(a) == 1, ('marker not unique', a[:60])
    i = s.index(a); j = s.index(b, i + len(a))
    return s[i if incl_a else i + len(a):j]


def block(s, start):
    """`start` + everything up to its matching closing brace (CSS rule or JS function)."""
    assert s.count(start) == 1, ('not unique', start[:60])
    i = s.index(start); j = s.index('{', i); depth = 0
    while True:
        if s[j] == '{': depth += 1
        elif s[j] == '}':
            depth -= 1
            if depth == 0: return s[i:j + 1]
        j += 1


# Highlighting + page helpers (code, table, card, static, section) from the FCC generator
fcc_gen = rd(os.path.join(REPO, 'explorations', 'food-cost-calculator', 'src', 'v3', 'build_spec.py'))
exec(between(fcc_gen, '# ── Syntax highlighting', '# ── Arabic'), globals())
HL.update({'Catalog (panel)': hl_js, 'Order Lists': hl_js})   # code() picks the highlighter by tab label

ratings = rd(os.path.join(H, 'v2', 'ratings-spec.html'))
cat = rd(os.path.join(SRC, 'out-catalog.html'))
fav = rd(os.path.join(SRC, 'out-favourites.html'))
store_js = rd(os.path.join(SRC, 'store.js')).strip('\n')
panel_js = rd(os.path.join(SRC, 'catalog.js')).strip('\n')
ol_html = rd(os.path.join(SRC, 'orderlists.html')).strip('\n')
ol_css = rd(os.path.join(SRC, 'orderlists.css')).strip('\n')
ol_js = rd(os.path.join(SRC, 'orderlists.js')).strip('\n')
snaps = json.load(open(os.path.join(HERE, 'snaps.json'), encoding='utf-8'))
assert not snaps['errors'], snaps['errors']
SZ = snaps['sizes']

# ── Chrome from the v2 spec pages ───────────────────────────────────────────
CHROME_CSS = between(ratings, '    /* ═══════════════════════════════════════\n       RESET & BASE', '    /* Doc-only stand-in for the header cart icon')
DRAWER_CSS = between(ratings, '    /* ═══════════════════════════════════════\n       DRAWER SHELL', '    /* ═══════════════════════════════════════\n       CHECKBOX')
MOBILE_CHROME = between(ratings, '    /* ═══════════════════════════════════════\n       DOC CHROME ≤768px', '  </style>')
DOC_JS = between(ratings, '    function openSidebar() {', '/* ── Ratings ──')

# ── From the catalog template ───────────────────────────────────────────────
PANEL_CSS = between(cat, '    /* ================================================================\n       FAVOURITE LISTS PANEL — opened from', '    /* ===================== end of copied DS header').rstrip() + '\n'
PANEL_HTML = between(cat, '  <!-- ================================================================\n       FAVOURITE LISTS PANEL — see FAVOURITE LISTS', '  <!-- ================================================================\n       TRADE PARTNER CONNECT PANEL').rstrip() + '\n'
FAV_CSS = '\n'.join(block(cat, '    ' + sel + ' {') for sel in [
    '.ufs-tile__fav', '.ufs-tile__fav svg', '.ufs-tile__fav svg path', '[dir="rtl"] .ufs-tile__fav', '.ufs-tile__fav.is-active svg path',
    '@keyframes ufs-tile-fav-pop', '@keyframes ufs-tile-fav-splash', '.ufs-tile__fav svg.fav-pop', '.ufs-tile__fav-splash'])
DS_CSS = '\n'.join([
    '    /* ═══════════════════════════════════════',
    '       DS RULES the feature uses — mirrored 1:1 from',
    '       handover/v3/template-products-catalog-webshop.html (v1 Form field,',
    '       Tile favourite button, TPS reveal). Not part of this spec.',
    '    ═══════════════════════════════════════ */',
    block(cat, '    .fi-field {'), block(cat, '    .fi-field:focus {'), block(cat, '    .fi-field:focus-visible {'), block(cat, '    .fi-field.is-invalid {'),
    block(cat, '    @keyframes tps-reveal {'), FAV_CSS,
    between(cat, '    /* ── Toast ──', '    .sr-only {').rstrip(),
])
TOGGLE_FAV_JS = block(cat, '    function toggleTileFav(btn, event) {')
FAV_PAGE_STATIC = between(fav, '          <div class="pg-fav-section" id="panel-products">', '          <!-- ===== MY TRAININGS')   # sanity: rendered container exists
assert 'id="ol-lists-grid"' in FAV_PAGE_STATIC

# The static panel copies have no ids: re-scope the panel's #fav-list-panel rules to them
PV_PANEL = '\n'.join(l.replace('#fav-list-panel', '.pv-drawer .signin-panel') for l in PANEL_CSS.split('\n') if l.startswith('    #fav-list-panel'))   # top level only, not the ≤768px ones
assert PV_PANEL.count('.pv-drawer .signin-panel') >= 4, PV_PANEL
PV_CSS = '''    /* ═══════════════════════════════════════
       PREVIEW WRAPPERS (spec-doc only — not production classes)
    ═══════════════════════════════════════ */
    .pv-drawer { background: var(--color-squid-900); border-radius: var(--radius-md); padding: 32px 24px; display: flex; justify-content: center; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
    .pv-drawer .signin-panel { position: relative; inset: auto; z-index: auto; transform: none; transition: none; width: 420px; max-width: 100%; height: auto; border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow-lg); }
    .pv-drawer .signin-panel-body { flex: none; }
    .pv-cap { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); margin: 0 0 6px; }
    .pv-rtl { font-family: var(--font-family); }   /* tokens.css swaps --font-family under [dir=rtl]; re-apply it here */
    .pv-heart { display: flex; gap: 12px; align-items: center; }
    .pv-heart .ufs-tile__fav { position: static; }
    .pv-heart .pv-cap { margin: 0 16px 0 0; }
    .pv-shot { display: block; max-width: 100%; height: auto; border: 1px solid var(--color-mushroom-300); border-radius: var(--radius-sm); background: var(--color-salt); }
    .pv-shots { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    .pv-shots figure { margin: 0; display: flex; flex-direction: column; gap: 8px; max-width: 100%; }
    .pv-shots figcaption { font-size: 12px; color: var(--color-mushroom-900); }
    .pv-phone { width: 300px; max-width: 100%; border-radius: 16px; border: 1px solid var(--color-mushroom-300); }
    /* Live demo: doc stand-ins for catalog tiles (the real ones are the v1 Product Tile) */
    .pv-shop { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 16px; }
    .pv-product { position: relative; border: 1px solid var(--color-mushroom-300); border-radius: var(--radius-md); background: var(--color-salt); overflow: hidden; }
    .pv-product__img { height: 150px; background: #fff center / contain no-repeat; }
    .pv-product__name { padding: 12px; font-size: 13px; font-weight: 600; line-height: 1.35; color: var(--color-brand-dark); }
    .pv-flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; counter-reset: step; }
    .pv-flow li { list-style: none; position: relative; padding: 16px; border: 1px solid var(--color-mushroom-300); border-radius: var(--radius-md); background: var(--color-salt); font-size: 13px; line-height: 1.5; color: var(--color-brand-dark); }
    .pv-flow li::before { counter-increment: step; content: counter(step); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; margin-bottom: 8px; border-radius: 50%; background: var(--color-accessible-orange); color: #fff; font-size: 12px; font-weight: 700; }
    .pv-flow strong { display: block; margin-bottom: 4px; }
    @media (max-width: 900px) { .pv-flow { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .pv-flow { grid-template-columns: 1fr; } }
'''


def shot(name, alt, cap=None, cls='pv-shot', w=None):
    size = SZ.get(name.replace('-', '_'))
    wh = ' width="%d" height="%d"' % tuple(size) if size and not w else (' width="%d"' % w if w else '')
    img = '<img class="%s" src="../images/favourite-lists/%s.png" alt="%s"%s />' % (cls, name, html.escape(alt), wh)
    return '<figure>%s%s</figure>' % (img, '<figcaption>%s</figcaption>' % cap if cap else '')


def shots(*figs): return '<div class="pv-shots">%s</div>' % ''.join(figs)


# ── Arabic ──────────────────────────────────────────────────────────────────
AR = [
    ('Product added to list!', 'تمت إضافة المنتج إلى القائمة!'),
    ('Default list', 'القائمة الافتراضية'),
    ('Create new list', 'إنشاء قائمة جديدة'),
    ('List name', 'اسم القائمة'),
    ('Create list (button label)', 'إنشاء القائمة'),
    ('Cancel', 'إلغاء'),
    ('You already have a list with this name', 'لديك بالفعل قائمة بهذا الاسم'),
    ('Continue Shopping', 'متابعة التسوق'),
    ('Go to Shopping List', 'الذهاب إلى قائمة التسوق'),
    ('Added to {list}', 'تمت الإضافة إلى {list}'),
    ('Removed from {list}', 'تمت الإزالة من {list}'),
    ('Created {list} and added the product to it', 'تم إنشاء {list} وإضافة المنتج إليها'),
    ('Removed from your lists', 'تمت الإزالة من قوائمك'),
    ('Undo', 'تراجع'),
    ('Add to favourites / Remove from favourites', 'إضافة إلى المفضلة / إزالة من المفضلة'),
    ('Sign up or Log in to save products to your lists.', 'سجّل حسابًا أو سجّل الدخول لحفظ المنتجات في قوائمك.'),
    ('Join over 1 million chefs already getting inspired.', 'انضم إلى أكثر من مليون طاهٍ يستلهمون أفكارهم بالفعل.'),
    ('Tap the heart to save products — your lists will be waiting in your profile.', 'اضغط على القلب لحفظ المنتجات، وستجد قوائمك في ملفك الشخصي.'),
    ('Order Lists', 'قوائم الطلب'),
    ('All / Lists', 'الكل / القوائم'),
    ('Sort · Most recent · A–Z', 'ترتيب · الأحدث · أ–ي'),
    ('{n} products · {n} lists', '{n} منتجات · {n} قوائم'),
    ('Created on {date}', 'أُنشئت في {date}'),
    ('View list', 'عرض القائمة'),
    ('My lists', 'قوائمي'),
    ('{n} products at qty 1 each · {total} total', '{n} منتجات بكمية 1 لكل منها · الإجمالي {total}'),
    ('Order all', 'اطلب الكل'),
    ('Buy it now', 'اشترِ الآن'),
    ('No products yet', 'لا توجد منتجات بعد'),
    ('This list is empty', 'هذه القائمة فارغة'),
    ('Products you save to {list} in the shop show up here.', 'تظهر هنا المنتجات التي تحفظها في {list} من المتجر.'),
    ('No products in your lists yet', 'لا توجد منتجات في قوائمك بعد'),
    ('Tap the heart on any product to save it to a list.', 'اضغط على القلب في أي منتج لحفظه في قائمة.'),
    ('Browse products', 'تصفّح المنتجات'),
    ('Remove {product} from {list} (heart label)', 'إزالة {product} من {list}'),
]
UI_AR = {e: a for e, a in AR if '{' not in e and '(' not in e and '/' not in e and '·' not in e}
UI_AR.update({'Create list': 'إنشاء القائمة', 'Weekly Essentials': 'المستلزمات الأسبوعية', 'Event Catering Kit': 'مستلزمات تموين الفعاليات',
              'Pizza Night': 'ليلة البيتزا', 'Created Pizza Night and added the product to it': 'تم إنشاء ليلة البيتزا وإضافة المنتج إليها'})


def to_ar(markup):
    def text(m):
        t = m.group(1); s = t.strip()
        if not s or s not in UI_AR: return m.group(0)
        return '>' + t.replace(s, UI_AR[s]) + '<'
    out = re.sub(r'>([^<]+)<', text, markup)
    for e, a in (('placeholder="List name"', 'placeholder="اسم القائمة"'), ('aria-label="New list name"', 'aria-label="اسم القائمة الجديدة"'),
                 ('aria-label="Create list"', 'aria-label="إنشاء القائمة"'), ('value="Weekly Essentials"', 'value="المستلزمات الأسبوعية"')):
        out = out.replace(e, a)
    return out


# ── Page parts ──────────────────────────────────────────────────────────────
FIGMA = 'Figma "Rosana 2.0" 4152:5454 · 4153:5523 · 4153:5634 (panel); Order Lists = v1 My Favourites'
DEMO = [('pesto', 'Knorr Primerba Pesto 340 g', 'product-detail/product-hero/product-4.png'),
        ('mash', 'Knorr Professional Mashed Potato 4 kg', 'tiles/product.jpg'),
        ('veg', 'Knorr Professional Vegetable Bouillon 1 kg', 'product-detail/product-hero/product-2.png'),
        ('curry', 'Knorr Professional Korma Sauce 2.4 kg', 'tiles/packshot.webp')]
LIVE = '<div class="pv-shop">' + ''.join(
    '<div class="pv-product"><button type="button" class="ufs-tile__fav" aria-pressed="false" aria-label="Add to favourites" data-fav-id="%s" onclick="favTileClick(this, event, \'%s\')">'
    '<svg width="20" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>'
    '<div class="pv-product__img" style="background-image:url(\'../images/%s\')"></div><div class="pv-product__name">%s</div></div>' % (pid, pid, img, name)
    for pid, name, img in DEMO) + '</div>'

overview = section('overview', 'Overview', 'Full Component Preview',
    'Favourite Lists lets a chef save webshop products into named lists and order from them later. The heart on a product tile in the webshop catalog saves the product to <strong>Default list</strong> and opens the <strong>Favourite Lists panel</strong>, where the chef moves it between lists or creates a new one. <strong>Go to Shopping List</strong> opens that list in <strong>My Favourites → Order Lists</strong>. Both pages read and write one shared store, so they always show the same lists.',
    '<div class="notice notice--tip"><span class="notice-icon">💡</span><div>Live: tap a heart. This demo uses the same store as the v3 templates in this browser, so <strong>Go to Shopping List</strong> opens your list in <a href="template-profile-favourites.html#order-lists">template-profile-favourites.html</a>. To try the full flow, including sign-in, start from <a href="template-products-catalog-webshop.html">template-products-catalog-webshop.html</a>.</div></div>'
    + card('Live', LIVE)
    + '<div class="notice notice--info"><span class="notice-icon">ℹ️</span><div><strong>Not in this release:</strong> renaming or deleting lists, and what <strong>Order all</strong> / <strong>Buy it now</strong> do in Order Lists (both are the unchanged v1 buttons). Production keeps the lists on the chef\'s account instead of in the browser.</div></div>'
    + card('The flow', '<ol class="pv-flow">'
        '<li><strong>Heart a product</strong>Catalog tile heart. Signed out, Sign in opens first (context <code>favourite</code>).</li>'
        '<li><strong>Saved to Default list</strong>The Favourite Lists panel opens with Default list ticked.</li>'
        '<li><strong>Pick or create lists</strong>Rows toggle the product in and out of each list; Create new list adds one and puts the product in it.</li>'
        '<li><strong>Go to Shopping List</strong>Opens <code>template-profile-favourites.html#order-lists/{listId}</code>: Order Lists, that list open.</li>'
        '</ol>'))

anatomy = section('anatomy', 'Structure', 'Anatomy',
    'Two surfaces on one store. The panel (<code>#fav-list-panel</code>, content <code>.ufs-favlist</code>) sits on the v1 <code>.signin-panel</code> drawer shell in the webshop catalog. Order Lists is the existing v1 "My Lists" design in My Favourites (<code>.pg-fav-sublist-*</code>), now rendered from the store, plus three new states (<code>.ufs-ol-*</code>).',
    card('Favourite Lists panel', table(['Part', 'Element', 'Spec'], [
        ['Shell', '<code>.signin-panel#fav-list-panel</code>', 'v1 drawer: 420px, full height, slides in from the inline-end edge; <code>role="dialog"</code>, <code>aria-modal="true"</code>, labelled by the title'],
        ['Title', '<code>.signin-panel-title</code>', '"Product added to list!" (H5, H5 mobile size ≤768px), 20px below'],
        ['List row', '<code>.ufs-favlist__row</code>', 'Toggle button (<code>aria-pressed</code>): list name (body, 500) + 24px heart, outline (not in list) or filled --color-accessible-orange (in list). 16px padding, 1px mushroom-300 border (mushroom-500 on hover), --radius-md, 12px gap between rows. A new row fades in (<code>.is-new</code>).'],
        ['Create new list', '<code>.ufs-favlist__create</code>', 'Same box, centred "+ Create new list" in body-sm, --color-accessible-orange'],
        ['Create form', '<code>.ufs-favlist__form</code>', 'v1 Form field (max 40 characters) + 48px square primary button with a plus icon (disabled until there\'s a name); error line below in body-xs --color-error'],
        ['Status', '<code>.ufs-favlist__status</code>', 'Visually hidden <code>role="status"</code>: "Added to …", "Removed from …", "Created … and added the product to it"'],
        ['Footer', '<code>#fav-list-ft</code>', 'Two equal buttons, 16px gap: Continue Shopping (primary, closes) + Go to Shopping List (secondary, a link). While the form is open: a single Cancel (<code>#fav-list-ft-create</code>).'],
    ]))
    + card('Order Lists (My Favourites)', table(['Part', 'Element', 'Spec'], [
        ['Tab', '<code>#panel-products</code>', 'The "Order Lists" sub-tab (desktop) / accordion section (mobile) of My Favourites (v1 Account layout)'],
        ['Meta row', '<code>.pg-fav-sec-meta</code>', 'Count ("10 products" / "4 lists") + All / Lists toggle + Sort (Most recent, A–Z). v1.'],
        ['All', '<code>#ol-all-grid</code>', 'v1 Product Tiles, every product in any list once, newest first; the heart is filled and removes'],
        ['List card', '<code>.pg-fav-sublist-card</code>', 'v1: name, "Created on {date}", "{n} products · {total}", up to 4 thumbnails (+n), View list. Whole card is a button.'],
        ['List detail', '<code>.pg-fav-sublist-detail</code>', 'v1: "My lists" back link, name (H5, an <code>h3</code>), count, Order all bar ("{n} products at qty 1 each · {total} total" + Order all), the list\'s tiles'],
        ['Empty card', '<code>.ufs-ol-card-empty</code>', '<span class="new-badge">New</span> "No products yet" in a dashed mushroom-100 box, in place of the thumbnails'],
        ['Empty view / list', '<code>.ufs-ol-empty</code>', '<span class="new-badge">New</span> Title (body, 600) + text (body-sm, mushroom-900) + Browse products (secondary small, to the catalog). Dashed mushroom-300 border, mushroom-100.'],
        ['Toast', '<code>.x-toast-stack</code>', '<span class="new-badge">New here</span> The webshop toast (see Pack Size Picker spec): "Removed from …" + Undo'],
    ]))
    + card('Reference markup', code(('HTML', PANEL_HTML + '\n' + ol_html), ('CSS', PANEL_CSS + '\n' + ol_css))))

panel_sec = section('panel', 'Structure', 'Favourite Lists Panel',
    'Opened by the heart on a catalog tile when the product isn\'t in any list yet. The product is already in Default list when the panel appears; every row tap saves straight away, so there is no Save button.',
    card('States', static(
        '<div><p class="pv-cap">Opened: added to Default list</p>' + snaps['added'] + '</div>'
        '<div><p class="pv-cap">Create new list</p>' + snaps['create'] + '</div>'
        '<div><p class="pv-cap">Name already used</p>' + snaps['error'] + '</div>'
        '<div><p class="pv-cap">New list created (fades in, product added)</p>' + snaps['created'] + '</div>', 'pv-drawer'),
        'Captured from the real panel. Shown at content height; in the page the panel is full height with the footer at the bottom.')
    + card('Tile heart', static('<div class="pv-heart">' + snaps['hearts'].split('</button>')[0] + '</button><span class="pv-cap">In a list</span>' + snaps['hearts'].split('</button>')[1] + '</button><span class="pv-cap">Not in any list</span></div>', 'pv-drawer'),
        'The v1 Tile favourite button (Tiles spec). Filled = the product is in at least one list.')
    + card('Sign-in copy (context "favourite")', table(['Field', 'Copy'], [
        ['Title', 'Sign up or Log in to save products to your lists.'],
        ['Description', 'Join over 1 million chefs already getting inspired.'],
        ['Success', 'Tap the heart to save products — your lists will be waiting in your profile.']])))

ol_sec = section('order-lists', 'Structure', 'Order Lists',
    'The v1 My Favourites → Order Lists design, now showing the chef\'s real lists. Cards, detail and tiles are unchanged from v1; the empty states and the toast are new. Prices use the webshop format (€, 2 decimals).',
    card('Lists and a list', shots(shot('ol-lists', 'Order Lists, Lists view: four list cards', 'Lists view (#order-lists)'),
                                   shot('ol-detail', 'Weekly Essentials list open', 'A list (#order-lists/weekly-essentials)')))
    + card('All', shots(shot('ol-all', 'All view: every saved product', 'All: each product once, newest first')))
    + card('New states', shots(shot('card-empty', 'List card without products', 'Card: no products yet'),
                               shot('ol-empty', 'Empty list with the Undo toast', 'Empty list (after removing its product) + toast'),
                               shot('ol-all-empty', 'All view with no products', 'All: nothing saved'),
                               shot('toast', 'Toast: Removed from Pizza Night, Undo', 'Toast'))))

data_sec = section('data', 'Structure', 'Shared Store &amp; Deep Link',
    'Both templates load the same <code>store.js</code>. In production the lists belong to the chef\'s account (API); the prototype keeps them in <code>localStorage</code> so the two pages share them.',
    card('Store', table(['Field', 'Spec'], [
        ['Key', '<code>localStorage["ufs-webshop-lists"]</code>, JSON, <code>v: 1</code> (the webshop cart uses <code>ufs-webshop-cart</code> the same way)'],
        ['<code>lists</code>', '<code>[{ id, name, created, items: [{ id, at }] }]</code>. Array order = panel order (Default list first, new lists at the end). <code>created</code> is ISO; <code>at</code> is when the product was added (ms).'],
        ['<code>products</code>', 'Snapshot per product id: name, category, image, price, rating, written when the product is saved, so Order Lists renders without the catalog. Unused snapshots are dropped on save.'],
        ['Default list', 'id <code>default</code>; always there. Lists can\'t be renamed or deleted yet (not designed).'],
        ['Names', 'Trimmed, max 40 characters, unique (case-insensitive): "You already have a list with this name"'],
        ['First visit', 'Seeded with Default list (2 products) + the v1 demo lists Weekly Essentials (3) and Event Catering Kit (5), so both pages start from the same data'],
        ['Storage blocked', 'Private mode / blocked storage: the store lives in memory for the page; nothing breaks'],
        ['Another tab', 'A <code>storage</code> event reloads the store: catalog hearts and the open panel, or Order Lists, update'],
    ]))
    + card('Go to Shopping List → Order Lists', table(['URL', 'Opens'], [
        ['<code>template-profile-favourites.html#order-lists/{listId}</code>', 'My Favourites, Order Lists tab (mobile: accordion section open, scrolled under the sticky header), Lists view, that list'],
        ['<code>…#order-lists</code>', 'Order Lists, Lists view (also when the list id no longer exists; the hash is corrected)'],
        ['Which list', 'The list the product was last added to in the panel: Default list on open, a row turned on, or a new list. Turning that list off falls back to the newest list the product is still in; no list → <code>#order-lists</code>.'],
        ['Staying in sync', 'Opening a list, going back to My lists, or switching to All updates the hash (<code>history.replaceState</code>), so reload and shared links land on the same view'],
    ]))
    + card('Store JS', code(('JS', store_js))))

behavior_rows = [
    ['Heart, signed out', 'Sign in opens with the "favourite" copy. After signing in, the product is added to Default list and the panel opens.'],
    ['Heart, not in a list', 'Added to Default list (heart pops, see Animation) and the panel opens.'],
    ['Heart, in a list', 'Removed from every list at once (no panel); toast "Removed from your lists" + Undo puts it back in the same lists and positions.'],
    ['Panel row', 'Toggles the product in / out of that list; the heart follows; the status line announces it. Go to Shopping List now points at that list.'],
    ['Create new list', 'The button turns into the form; focus moves to the field; the footer becomes Cancel. Add (or <kbd>Enter</kbd>) creates the list at the end of the panel, puts the product in it and closes the form.'],
    ['Continue Shopping / × / backdrop / <kbd>Esc</kbd>', 'Closes the panel. The product stays in its lists.'],
    ['Go to Shopping List', 'A link: opens Order Lists on that list (same tab).'],
    ['Order Lists: list card', 'Opens the list; focus moves to the list name. My lists goes back and focuses that card.'],
    ['Order Lists: heart', 'In a list: removes from that list. In All: removes from every list. Toast + Undo; focus moves to the next heart (or the list name when the list is now empty).'],
    ['Order Lists: Sort', 'Most recent (lists by created date, products by date added) or A–Z; kept when the view re-renders'],
    ['Order all / Buy it now', 'Unchanged v1 buttons, no action in the prototype (see Overview). An empty list shows its empty state instead of the Order all bar.'],
]
behavior = section('behavior', 'Behavior', 'Using the Lists',
    'What happens at each step, on both pages.',
    card('', table(['Moment', 'What happens'], behavior_rows))
    + card('Page hooks', table(['The feature uses', 'From the page'], [
        ['<code>byId(id)</code>, <code>PRODUCTS</code>', 'Catalog product data for the snapshot'],
        ['<code>favs</code>, <code>favBtn()</code>, <code>toggleTileFav()</code>', 'The catalog\'s tile heart (v1 Tile; <code>favs</code> is seeded from the store)'],
        ['<code>S.auth</code>, <code>openSignIn()</code>, <code>REG_CONTEXT_COPY</code>, <code>regCompletePendingFavourite()</code>', 'v1 Sign in flow'],
        ['<code>toastAction(msg, label, fn)</code>', 'Webshop toast in the catalog; Order Lists has its own copy (<code>olToast</code>)'],
        ['<code>setFavPanel</code>, <code>setFavView</code>, <code>openFavSublist</code>, <code>closeFavSublist</code>', 'v1 My Favourites tabs, toggle and drill-down (wrapped to keep the hash and focus)'],
    ]))
    + card('JS', code(('Catalog (panel)', panel_js), ('Order Lists', ol_js))))

animation = section('animation', 'Behavior', 'Animation',
    'Only existing DS motion is used.',
    card('', table(['Element', 'Trigger', 'Animation', 'Duration', 'Easing'], [
        ['Panel (v1 shell)', 'Open / close', 'translateX(100%) → 0 (−100% in RTL) + shadow', '350ms', 'cubic-bezier(0.4, 0, 0.2, 1)'],
        ['Backdrop (v1 shell)', 'Open / close', 'opacity 0 → 1', '300ms', 'ease'],
        ['Tile heart (v1)', 'Added to a list', 'Pop (scale 1 → 1.5 → 0.9 → 1) + 6-line splash', '320ms / 420ms', 'ease / cubic-bezier(0.2, 0, 0.5, 1)'],
        ['Row heart', 'Toggle', 'fill 0 ⇄ orange', '150ms', 'ease'],
        ['New list row', 'Created', 'Fade + rise 4px (<code>tps-reveal</code>)', '300ms', 'ease'],
        ['Toast', 'Shown / dismissed', 'Grows in from the bottom / collapses; auto-dismiss after 3.2s, max 2', '220ms / 200ms', 'cubic-bezier(0.2, 0.8, 0.2, 1) / ease-in'],
        ['Order Lists re-render', 'Remove, Undo, sort', 'None (instant)', '–', '–'],
        ['Reduced motion', '<code>prefers-reduced-motion</code>', 'Toasts appear and go without motion; the shell and heart are v1 behaviour', '–', '–'],
    ])))

mobile = section('mobile', 'Responsive', 'Mobile Examples',
    'At ≤768px the panel fills the screen minus 16px (v1 shell, from ≤1024px), the title and list names step down. Order Lists is an accordion section; the deep link opens it and scrolls it under the sticky header and search row. The toast spans the gutters above the bottom navigation.',
    card('', shots(shot('m-panel', 'Panel on mobile', 'Panel', 'pv-shot pv-phone', 300),
                   shot('m-ol-lists', 'Order Lists on mobile, Lists view', '#order-lists', 'pv-shot pv-phone', 300),
                   shot('m-ol-detail', 'A list on mobile', '#order-lists/weekly-essentials', 'pv-shot pv-phone', 300))))

rtl_rules = '''/* Panel: logical by construction (text-align: start, flex gaps); only the v1 drawer side flips */
[dir="rtl"] .signin-panel { right: auto; left: 0; transform: translateX(-100%); }
/* Tile heart sits at the inline-start corner of the image (v1) */
[dir="rtl"] .ufs-tile__fav { right: auto; left: var(--space-3); }
/* Order Lists: the "My lists" arrow points to the start side */
[dir="rtl"] .pg-fav-sublist-back-btn svg { transform: scaleX(-1); }'''
rtl = section('rtl', 'Internationalisation', 'i18n &amp; RTL',
    'Every string follows the page language; list names are the chef\'s own text and product names stay as on the pack. Arabic below; the panel preview is the real markup in <code>dir="rtl"</code>, Order Lists previews are the template switched to Arabic.',
    card('Strings', table(['English', 'Arabic'], [[esc(e), '<span dir="rtl">%s</span>' % a] for e, a in AR]))
    + card('Numbers, dates and plurals', table(['Rule', 'Detail'], [
        ['Money', '<code>Intl.NumberFormat(locale, { style: "currency", currency })</code>. The prototype is fixed to "€12.80" (the webshop format).'],
        ['Dates', '"Created on 10 Jun 2026": use <code>Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" })</code>'],
        ['Plurals', '"{n} products", "{n} lists": the locale\'s plural rules (<code>Intl.PluralRules</code>); Arabic has six forms. The prototype handles English one/other only.'],
        ['Sort A–Z', '<code>localeCompare</code> with the page locale'],
        ['Mixed text', 'List names can be any script: render them with <code>dir="auto"</code> in production so a Latin name reads correctly inside an Arabic page'],
    ]))
    + card('RTL previews', static('<div><p class="pv-cap">Panel</p>' + to_ar(snaps['created']).replace('class="signin-panel"', 'class="signin-panel pv-rtl" dir="rtl" lang="ar"', 1) + '</div>'
                                  '<div><p class="pv-cap">Name already used</p>' + to_ar(snaps['error']).replace('class="signin-panel"', 'class="signin-panel pv-rtl" dir="rtl" lang="ar"', 1) + '</div>', 'pv-drawer')
           + '<div style="height:16px"></div>'
           + shots(shot('ol-lists-rtl', 'Order Lists in Arabic', 'Order Lists'), shot('ol-detail-rtl', 'A list in Arabic', 'A list')))
    + card('RTL rules', code(('CSS', rtl_rules))))
assert 'class="signin-panel pv-rtl"' in rtl, 'RTL panel class swap failed'

# ── Assemble ────────────────────────────────────────────────────────────────
NAV = [('Overview', [('overview', 'Full Component Preview')]),
       ('Structure', [('anatomy', 'Anatomy'), ('panel', 'Favourite Lists Panel'), ('order-lists', 'Order Lists'), ('data', 'Shared Store &amp; Deep Link')]),
       ('Behavior', [('behavior', 'Using the Lists'), ('animation', 'Animation')]),
       ('Responsive', [('mobile', 'Mobile Examples')]),
       ('Internationalisation', [('rtl', 'i18n &amp; RTL')])]
nav = ''.join('      <div class="sidebar-group-label"%s>%s</div>\n' % ('' if i == 0 else ' style="margin-top:8px"', g)
              + ''.join('      <a href="#%s" class="sidebar-link" onclick="closeSidebar()"><span class="nav-dot"></span> %s</a>\n' % l for l in links)
              for i, (g, links) in enumerate(NAV))

page = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Favourite Lists — UFS Spec v3.0</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=IBM+Plex+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../tokens.css" />
  <!-- Generated by explorations/favourite-lists/src/v3/build_spec.py — edit the source, not this file -->
  <style>
''' + CHROME_CSS + '\n' + DRAWER_CSS + '\n' + DS_CSS + '\n\n' + PV_CSS + '\n' + PANEL_CSS + '\n    /* Static previews (no ids) */\n' + PV_PANEL + '\n' + MOBILE_CHROME + '''  </style>
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
    <span class="doc-topbar-current">Favourite Lists</span>
    <span class="doc-topbar-version">New in v3.0</span>
  </nav>

  <!-- Doc header -->
  <header class="doc-header">
    <div class="doc-header-inner">
      <img src="../images/ufs-logo.png" alt="UFS" class="doc-header-logo" />
      <div class="doc-header-vdiv"></div>
      <div class="doc-header-body">
        <div class="doc-header-eyebrow">Handover Spec · v3.0</div>
        <h1 class="doc-header-title"><span>Favourite Lists</span></h1>
        <p class="doc-header-desc">Save webshop products to named lists from the catalog heart, then find and order them in My Favourites → Order Lists. One shared store, one deep link.</p>
      </div>
      <div class="doc-header-meta">
        <div class="doc-header-meta-row"><span class="doc-header-meta-label">Source</span></div>
        <div class="doc-header-meta-row"><span class="doc-header-meta-val"><a href="template-products-catalog-webshop.html">handover/v3/<br/>template-products-catalog-webshop.html</a></span></div>
        <div class="doc-header-meta-row"><span class="doc-header-meta-val"><a href="template-profile-favourites.html#order-lists">handover/v3/<br/>template-profile-favourites.html</a></span></div>
        <div class="doc-header-meta-row"><span class="doc-header-meta-label">Format</span><span class="doc-header-meta-sep">·</span><span class="doc-header-meta-val">HTML + CSS + JS</span></div>
      </div>
    </div>
  </header>

  <main class="content" id="main">
''' + overview + anatomy + panel_sec + ol_sec + data_sec + behavior + animation + mobile + rtl + '''
  </main>

''' + PANEL_HTML + '''
  <div class="x-toast-stack" id="toast-stack" role="status" aria-live="polite"></div>

  <script>
''' + DOC_JS + '''
/* ── Doc stubs ──
   In the template these come from the page: the v1 Sign in flow, the catalog's
   product data and the webshop toast. This page is signed in, and it shares the
   lists with the v3 templates (same localStorage store). */
var S = { auth: true };
var REG_CONTEXT_COPY = {};
var regPendingFavBtn = null;
function openSignIn() {}
var PRODUCTS = ''' + json.dumps([dict(id=pid, name=n, img=img) for pid, n, img in DEMO]) + ''';
var DEMO_DATA = { pesto: ['Seasonings', 12.80, 22], mash: ['Sides', 27.90, 38], veg: ['Stocks', 14.20, 71], curry: ['Sauces', 29.50, 57] };
PRODUCTS.forEach(function (p) { p.cat = DEMO_DATA[p.id][0]; p.price = DEMO_DATA[p.id][1]; p.rating = DEMO_DATA[p.id][2]; });
function byId(id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; }
function toastAction(msg, label, fn) {
  var st = document.getElementById('toast-stack'), el = document.createElement('div');
  el.className = 'x-toast-item';
  el.innerHTML = '<span></span><button type="button"></button>';
  el.firstChild.textContent = msg; el.lastChild.textContent = label;
  el.lastChild.onclick = function () { fn(); el.remove(); };
  st.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
}
''' + TOGGLE_FAV_JS + '''
''' + store_js + '''
''' + panel_js + '''
var favs = {};
favStore.lists.forEach(function (l) { l.items.forEach(function (it) { favs[it.id] = true; }); });
PRODUCTS.forEach(function (p) { if (favs[p.id]) { var b = document.querySelector('.ufs-tile__fav[data-fav-id="' + p.id + '"]'); b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', 'Remove from favourites'); } });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeFavListPanel(); });

  </script>
  <script src="../ds-version.js"></script>
</body>
</html>
'''
open(OUT, 'w', encoding='utf-8').write(page)

# Screenshots
os.makedirs(IMG, exist_ok=True)
for f in sorted(os.listdir(os.path.join(HERE, 'shots-spec'))):
    if f.endswith('.png') and f != 'catalog-panel.png':
        shutil.copyfile(os.path.join(HERE, 'shots-spec', f), os.path.join(IMG, f))
print('spec ok', len(page))
