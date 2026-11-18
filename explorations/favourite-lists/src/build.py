"""Favourite Lists → Order Lists (v3). Builds the two connected templates:

  out-catalog.html     = handover/v2/template-products-catalog-webshop.html with the
                         Favourite Lists panel on the shared store (store.js + catalog.js)
                         and "Go to Shopping List" linking to the list in Order Lists
  out-favourites.html  = handover/template-profile-favourites.html (v1) with Order Lists
                         rendered from the same store (orderlists.html/.css/.js) + deep link

Both use v3-relative paths (../ = handover/). Also writes the exploration copies
(../template-*.html, paths → ../../handover/). handover/v3/ gets them from
v3/build_v3.py. v1 and v2 are frozen: this script only reads them.
Every replace asserts an exact match count, so a changed source fails loudly.
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
H = os.path.expanduser('~/ufs-design-system/handover')


def rd(p): return open(p, encoding='utf-8').read()
def src(n): return rd(os.path.join(HERE, n))
def wr(p, s): open(p, 'w', encoding='utf-8').write(s)


def rep(s, a, b, n=1):
    assert s.count(a) == n, ('expected', n, 'got', s.count(a), a[:80])
    return s.replace(a, b)


def cut(s, start, end):
    """(before, after) around [start marker, end marker) — both markers unique."""
    assert s.count(start) == 1 and s.count(end) == 1, (start[:60], end[:60])
    i = s.index(start); j = s.index(end, i)
    return s[:i], s[j:]


store, panel_js = src('store.js'), src('catalog.js')

# ── Catalog (v2 webshop catalog → v3) ───────────────────────────────────────
c = rd(os.path.join(H, 'v2', 'template-products-catalog-webshop.html'))
c = rep(c, "'template-checkout-webshop.html'", "'../v2/template-checkout-webshop.html'")
c = rep(c, "'template-product-webshop.html'", "'../v2/template-product-webshop.html'")
a, b = cut(c, '    /* ================================================================\n       FAVOURITE LISTS — product tile hearts on this page.',
           '    /* ================================================================\n       KEYBOARD — Esc closes any open menu, panel or overlay')
c = a + store + '\n' + panel_js + '\n\n\n' + b
c = rep(c, '    var favs = {};   // product id → true; kept across concept switches',
           '    var favs = {};   // product id → true (in any list); from the shared lists store, kept across concept switches\n'
           '    favStore.lists.forEach(function (l) { l.items.forEach(function (it) { favs[it.id] = true; }); });')
c = rep(c, '<button type="button" class="btn btn-secondary">Go to Shopping List</button>',
           '<a class="btn btn-secondary" id="fav-list-go" href="template-profile-favourites.html#order-lists">Go to Shopping List</a>')
c = rep(c, '''       Continue shopping / Go to Shopping List and a single Cancel while
       the create-list form is open.''', '''       Continue shopping / Go to Shopping List and a single Cancel while
       the create-list form is open. Go to Shopping List is a link to
       My Favourites → Order Lists → the list (favLink(), set on render).''')
wr(os.path.join(HERE, 'out-catalog.html'), c)

# ── Favourites (v1 → v3) ────────────────────────────────────────────────────
f = rd(os.path.join(H, 'template-profile-favourites.html'))
f = re.sub(r'(["\'(])(icons|images|fonts)/', r'\1../\2/', f)
f = rep(f, '"tokens.css"', '"../tokens.css"')
for p in ('template-profile-overview.html', 'template-profile-orders.html', 'template-profile-details.html'):
    f = rep(f, '"%s"' % p, '"../%s"' % p)
sec = f.index('          <div class="pg-fav-section" id="panel-products">')
body = f.index('            <div class="pg-fav-sec-body">', sec)
end = f.index('          </div>\n\n          <!-- ===== MY TRAININGS ===== -->', body)
f = f[:body] + src('orderlists.html') + f[end:]
f = rep(f, '  </style>\n</head>', src('orderlists.css') + '  </style>\n</head>')
f = rep(f, '    // ---- sidebar "My Interests" tag autocomplete', store + '\n' + src('orderlists.js') + '\n    // ---- sidebar "My Interests" tag autocomplete')
f = rep(f, '</body>', '  <div class="x-toast-stack" id="ol-toast-stack" role="status" aria-live="polite"></div>\n</body>')
assert 'webstaurantstore.com/images/products/medium/551252' not in f[sec:f.index('<!-- ===== MY TRAININGS')], 'static Order Lists left'
wr(os.path.join(HERE, 'out-favourites.html'), f)

# ── Exploration copies (same build, paths → ../../handover/) ───────────────
for n, s in (('template-products-catalog-webshop.html', c), ('template-profile-favourites.html', f)):
    wr(os.path.join(HERE, '..', n), re.sub(r'(["\'(])\.\./', r'\1../../handover/', s))
print('ok catalog', len(c), 'favourites', len(f))
