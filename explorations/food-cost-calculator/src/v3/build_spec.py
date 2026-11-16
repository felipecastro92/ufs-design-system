"""Builds handover/v3/food-cost-calculator-spec.html.

Inputs (all re-read on every run, so the spec never drifts from the code):
  ../fcc.css, ../fcc.js, ../banner.html, ../panel.html   the calculator source
  ../out.html            the built template: DS rules the calculator depends on are mirrored 1:1
  handover/v2/ratings-spec.html   spec-page chrome (doc CSS, sidebar, header, doc scripts)
  ./snaps.json, ./food-cost-sample.pdf   static previews + sample PDF, from `node snap.mjs`

Order: python3 ../build.py → node snap.mjs (server on :8765) → python3 build_spec.py
Also writes handover/images/food-cost/ (sample PDF + its PNG render, via macOS sips).
"""
import html, json, os, re, shutil, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..')
H = os.path.expanduser('~/ufs-design-system/handover')
OUT = os.path.join(H, 'v3', 'food-cost-calculator-spec.html')
IMG = os.path.join(H, 'images', 'food-cost')


def rd(p): return open(p, encoding='utf-8').read()


def between(s, a, b, incl_a=True):
    i = s.index(a); j = s.index(b, i + len(a))
    assert s.count(a) == 1, ('marker not unique', a[:60])
    return s[i if incl_a else i + len(a):j]


ratings = rd(os.path.join(H, 'v2', 'ratings-spec.html'))
tpl = rd(os.path.join(SRC, 'out.html'))
fcc_css = rd(os.path.join(SRC, 'fcc.css')).strip('\n')
fcc_js = rd(os.path.join(SRC, 'fcc.js')).strip('\n')
banner = rd(os.path.join(SRC, 'banner.html')).strip('\n')
panel = rd(os.path.join(SRC, 'panel.html')).strip('\n')
snaps = json.load(open(os.path.join(HERE, 'snaps.json'), encoding='utf-8'))
assert not snaps['errors'], snaps['errors']

# ── Chrome from the v2 spec pages ───────────────────────────────────────────
CHROME_CSS = between(ratings, '    /* ═══════════════════════════════════════\n       RESET & BASE', '    /* Doc-only stand-in for the header cart icon')
DRAWER_CSS = between(ratings, '    /* ═══════════════════════════════════════\n       DRAWER SHELL', '    /* ═══════════════════════════════════════\n       CHECKBOX')
MOBILE_CHROME = between(ratings, '    /* ═══════════════════════════════════════\n       DOC CHROME ≤768px', '  </style>')
DOC_JS = between(ratings, '    function openSidebar() {', '/* ── Ratings ──')


# ── DS rules mirrored from the template ─────────────────────────────────────
def rule(sel):
    """The template rule that starts with `    sel {` (single- or multi-line)."""
    m = re.search(r'^    ' + re.escape(sel) + r' \{', tpl, re.M)
    assert m, sel
    i, depth, j = m.start(), 0, m.end() - 1
    while True:
        if tpl[j] == '{': depth += 1
        elif tpl[j] == '}':
            depth -= 1
            if depth == 0: break
        j += 1
    assert len(re.findall(r'^    ' + re.escape(sel) + r' \{', tpl, re.M)) == 1, ('rule not unique', sel)
    return tpl[i:j + 1]


DS_CSS = '\n'.join([
    '    /* ═══════════════════════════════════════',
    '       DS RULES the calculator uses — mirrored 1:1 from',
    '       handover/v3/template-recipe-detail.html (v1 Button sizes, Quantity',
    '       stepper, Form field + Select, Recipe Ingredients). Not part of this spec.',
    '    ═══════════════════════════════════════ */',
    rule('.btn-sm'), rule('.btn-icon-left'), rule('.btn-sm.btn-icon-left'), rule('.btn-sm.btn-icon-left img'),
    rule('.btn-ghost'), rule('.btn-ghost:hover:not(:disabled):not(.btn-loading)'), rule('.btn:disabled'),
    rule('.fi-qty'), rule('.fi-qty-btn'), rule('.fi-qty-btn:hover:not(:disabled)'), rule('.fi-qty-btn:disabled'),
    rule('.fi-qty-btn svg'), rule('.fi-qty-pill'),
    rule('.fi-field'), rule('.fi-field:focus'), rule('.fi-field:focus-visible'), rule('.fi-select'), rule('[dir="rtl"] .fi-select'),
    rule('.ufs-recipe-ingredients'), rule('.ufs-recipe-ingredients__servings'), rule('.ufs-recipe-ingredients__servings-label'),
    rule('.ufs-recipe-ingredients__title'), rule('.ufs-recipe-ingredients__group'), rule('.ufs-recipe-ingredients__group-title'),
    rule('.ufs-ingredient-row'), rule('.ufs-ingredient-row__main'), rule('.ufs-ingredient-row__name'), rule('.ufs-ingredient-row__qty'),
])
DS_CSS = DS_CSS.replace("url('../icons/", "url('../icons/")   # same depth as the template: paths unchanged

# .pv-mob restates the calculator's ≤768px rules, so mobile previews render at any window width
media = between(fcc_css, '@media (max-width: 768px) {', '\n    }', incl_a=False)
def pv_mob(line):
    m = re.match(r'(\s*)([^{]+)\{(.*)$', line)
    if not m: return line
    sels = ', '.join('.pv-mob ' + x.strip() for x in m.group(2).split(','))
    return '%s%s {%s' % (m.group(1).replace('  ', '', 1), sels, m.group(3))
PV_MOB = '\n'.join(pv_mob(l) for l in media.strip('\n').split('\n'))

PV_CSS = '''    /* ═══════════════════════════════════════
       PREVIEW WRAPPERS (spec-doc only — not production classes)
    ═══════════════════════════════════════ */
    .pv-recipe { background: var(--color-salt); border: 1px solid var(--color-mushroom-300); border-radius: var(--radius-md); padding: 32px; }
    .pv-recipe .ufs-recipe-ingredients { max-width: 440px; }
    .pv-recipe--narrow { max-width: 390px; margin: 0 auto; padding: 16px; }
    .pv-drawer { background: var(--color-squid-900); border-radius: var(--radius-md); padding: 32px 24px; display: flex; justify-content: center; align-items: flex-start; gap: 24px; flex-wrap: wrap; }
    .pv-drawer .signin-panel { position: relative; inset: auto; z-index: auto; transform: none; transition: none; width: 420px; max-width: 100%; height: auto; border-radius: var(--radius-sm); overflow: hidden; box-shadow: var(--shadow-lg); }
    .pv-drawer.pv-m .signin-panel { width: 374px; }
    .pv-stack { display: flex; flex-direction: column; gap: 16px; width: 420px; max-width: 100%; }
    .pv-strip { background: var(--color-salt); border-radius: var(--radius-sm); overflow: hidden; }
    .pv-strip .ufs-fcc__ft { box-shadow: none; }
    .pv-strip--body { padding: var(--space-4) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .pv-cap { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.7); margin: 0 0 6px; }
    .pv-rtl { font-family: var(--font-family); }   /* tokens.css swaps --font-family under [dir=rtl]; re-apply it here */
    .pv-pdf { display: block; width: 100%; max-width: 620px; height: auto; border: 1px solid var(--color-mushroom-300); border-radius: var(--radius-sm); box-shadow: var(--shadow-sm); }
    .pv-mob .fi-qty-btn { width: var(--space-10); height: var(--space-10); }
''' + PV_MOB + '\n'


# ── Syntax highlighting (same classes as the v1/v2 spec pages) ──────────────
def esc(s): return html.escape(s, quote=False)
def sp(cls, s): return '<span class="%s">%s</span>' % (cls, esc(s))


def hl_html(src):
    out, i, n = [], 0, len(src)
    while i < n:
        if src.startswith('<!--', i):
            j = src.index('-->', i) + 3; out.append(sp('t-cm', src[i:j])); i = j
        elif re.match(r'</?[a-zA-Z]', src[i:i + 2]):
            m = re.match(r'</?[\w-]+', src[i:]); out.append(sp('t-tag', m.group(0))); i += m.end()
            while i < n:
                m = re.match(r'\s+|([\w:@.-]+)(?:(=)("[^"]*"|\'[^\']*\'))?|(/?>)', src[i:])
                if not m or not m.group(0): out.append(esc(src[i])); i += 1; continue
                if m.group(4): out.append(sp('t-tag', m.group(4))); i += m.end(); break
                if m.group(1):
                    out.append(sp('t-at', m.group(1)))
                    if m.group(2): out.append('=' + sp('t-str', m.group(3)))
                else: out.append(m.group(0))
                i += m.end()
        else:
            j = src.find('<', i + 1); j = n if j < 0 else j
            out.append(esc(src[i:j])); i = j
    return ''.join(out)


def hl_css_value(v):
    parts = re.split(r'(var\(--[\w-]+(?:,[^()]*)?\))', v)
    return ''.join(sp('t-va', p) if p.startswith('var(') else (sp('t-vl', p) if p.strip() else p) for p in parts)


def hl_css(src):
    out, i, n = [], 0, len(src)
    while i < n:
        if src.startswith('/*', i):
            j = src.index('*/', i) + 2; out.append(sp('t-cm', src[i:j])); i = j; continue
        if src[i] in ' \n\t}{':
            out.append(src[i]); i += 1; continue
        nxt = {c: src.find(c, i) for c in '{};'}
        nxt = {c: p for c, p in nxt.items() if p >= 0}
        cm = src.find('/*', i)
        c = min(nxt, key=nxt.get)
        end = nxt[c]
        if 0 <= cm < end:   # a comment inside the chunk: emit text before it
            out.append(esc(src[i:cm])); i = cm; continue
        chunk = src[i:end]
        if c == '{':
            out.append(sp('t-kw' if chunk.lstrip().startswith('@') else 't-pr', chunk.rstrip()) + chunk[len(chunk.rstrip()):])
        else:
            m = re.match(r'([\w-]+)(\s*:\s*)([\s\S]*)$', chunk)
            out.append(sp('t-pr', m.group(1)) + m.group(2) + hl_css_value(m.group(3)) if m else esc(chunk))
        out.append(src[end] if c == ';' else ''); i = end + (1 if c == ';' else 0)
    return ''.join(out)


JS_TOK = re.compile(r'(//[^\n]*|/\*[\s\S]*?\*/)'
                    r'|((?<=[(,=:!&|?;\s])/(?![/*\s])(?:\\.|\[[^\]\n]*\]|[^/\\\n\[])+/[gimsuy]*)'
                    r"|('(?:\\.|[^'\\\n])*'|\"(?:\\.|[^\"\\\n])*\"|`(?:\\.|[^`\\])*`)"
                    r'|\b(var|function|return|if|else|for|while|new|this|true|false|null|typeof|throw|try|catch|in)\b')


def hl_js(src):
    out, last = [], 0
    for m in JS_TOK.finditer(src):
        out.append(esc(src[last:m.start()]))
        out.append(sp('t-cm' if m.group(1) else 't-str' if (m.group(2) or m.group(3)) else 't-kw', m.group(0)))
        last = m.end()
    return ''.join(out) + esc(src[last:])


HL = {'HTML': hl_html, 'CSS': hl_css, 'JS': hl_js}
_cb = [0]


def code(*tabs):
    """tabs = (lang, source) pairs → the spec pages' tabbed code block."""
    if len(tabs) == 1:
        lang, s = tabs[0]
        return ('<div class="code-block-wrap"><div class="code-header"><span class="code-lang">%s</span>'
                '<button class="copy-btn" onclick="copyCode(this)">Copy</button></div><pre class="code-body" tabindex="0">%s</pre></div>') % (lang, HL[lang](s))
    _cb[0] += 1; k = 'cb%d' % _cb[0]
    head = ''.join('<div class="code-tab%s" onclick="switchTab(this,\'%s-%d\')">%s</div>' % (' active' if i == 0 else '', k, i, l) for i, (l, _) in enumerate(tabs))
    body = ''.join(('<div class="code-panel%s" data-tab="%s-%d"><div class="code-header"><span class="code-lang">%s</span>'
                    '<button class="copy-btn" onclick="copyCode(this)">Copy</button></div><pre class="code-body" tabindex="0">%s</pre></div>')
                   % (' active' if i == 0 else '', k, i, l, HL[l](s)) for i, (l, s) in enumerate(tabs))
    return '<div class="code-block-wrap"><div class="code-tabs">%s</div>%s</div>' % (head, body)


def table(head, rows):
    th = ''.join('<th>%s</th>' % h for h in head)
    tr = ''.join('<tr>%s</tr>' % ''.join('<td>%s</td>' % c for c in r) for r in rows)
    return '<div class="spec-table-wrap"><table class="spec-table"><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (th, tr)


def card(title, inner, desc=None):
    return '<div class="ds-card">%s%s%s</div>' % ('<div class="card-title">%s</div>' % title if title else '',
                                                 '<div class="card-desc">%s</div>' % desc if desc else '', inner)


def static(inner, cls):
    return '<div aria-hidden="true" inert class="%s">%s</div>' % (cls, inner)


def section(sid, crumb, title, desc, body):
    return '''
    <!-- ═══════════════════════════════════════ %s ═══════════════════════════════════════ -->
    <section class="doc-section" id="%s">
      <div class="section-breadcrumb">%s</div>
      <h2 class="section-title">%s</h2>
      <p class="section-desc">%s</p>
      %s
    </section>
''' % (title.upper(), sid, crumb, title, desc, body)


# ── Arabic (RTL previews + strings table) ───────────────────────────────────
RECIPE_AR = 'كنور بروفيشنال بطاطس مهروسة للطهي بكميات كبيرة'
AR = [  # (English, Arabic) — UI strings; also drives the RTL preview translation
    ('Calculate your food cost easily', 'احسب تكلفة الطعام بسهولة'),
    ('Save your recipe calculations as a PDF and use them on the go', 'احفظ حسابات وصفاتك كملف PDF واستخدمها أينما كنت'),
    ('Calculate the cost of this recipe', 'احسب تكلفة هذه الوصفة'),
    ('Sign up or Log in to calculate your food cost', 'أنشئ حسابًا أو سجّل الدخول لحساب تكلفة الطعام'),
    ('You’re in! Close this panel to open the Food cost calculator.', 'تم تسجيل دخولك! أغلق هذه اللوحة لفتح حاسبة تكلفة الطعام.'),
    ('Food cost calculator', 'حاسبة تكلفة الطعام'),
    ('Close food cost calculator', 'إغلاق حاسبة تكلفة الطعام'),
    ('Servings', 'الحصص'),
    ('Decrease servings / Increase servings', 'تقليل الحصص / زيادة الحصص'),
    ('Menu price per serving', 'سعر الحصة في القائمة'),
    ('€ excl. VAT', '€ قبل الضريبة'),
    ('Ingredients', 'المكونات'),
    ('{p} of {n} priced', 'تم تسعير {p} من {n}'),
    ('Price', 'السعر'),
    ('Price of {name} per {unit}', 'سعر {name} لكل {unit}'),
    ('Remove {name} from the calculation', 'إزالة {name} من الحساب'),
    ('Undo', 'تراجع'),
    ('Add {name} back to the calculation', 'إعادة {name} إلى الحساب'),
    ('Add an ingredient', 'إضافة مكوّن'),
    ('Ingredient name', 'اسم المكوّن'),
    ('Quantity', 'الكمية'),
    ('Quantity for the current servings', 'الكمية لعدد الحصص الحالي'),
    ('Unit', 'الوحدة'),
    ('Cancel', 'إلغاء'),
    ('Add', 'إضافة'),
    ('Prices for UFS products are indicative, based on wholesaler prices, and may change with the season or supply. UFS can\'t be held responsible for any deviations.',
     'أسعار منتجات UFS استرشادية وتستند إلى أسعار تجار الجملة، وقد تتغير بحسب الموسم أو توفر الإمدادات. لا تتحمل UFS مسؤولية أي فروقات.'),
    ('Reset calculation', 'إعادة ضبط الحساب'),
    ('Save as PDF', 'حفظ كملف PDF'),
    ('The PDF couldn’t be created. Check your connection and try again.', 'تعذّر إنشاء ملف PDF. تحقّق من اتصالك وحاول مرة أخرى.'),
    ('Total cost', 'التكلفة الإجمالية'),
    ('Per serving', 'لكل حصة'),
    ('Food cost', 'تكلفة الطعام'),
    ('High / On target / Low', 'مرتفعة / ضمن الهدف / منخفضة'),
    ('Add prices for {n} more ingredient(s) for a complete total.', 'أضف أسعار {n} مكونات أخرى للحصول على إجمالي كامل.'),
    ('Add your menu price to see the food cost %. Target: 25–35 %.', 'أضف سعر القائمة لمعرفة نسبة تكلفة الطعام. الهدف: 25–35 %.'),
    ('g / kg / ml / L / pc', 'غ / كغ / مل / ل / قطعة'),
]
AR_PDF = [
    ('FOOD COST CALCULATION', 'حساب تكلفة الطعام'),
    ('{n} servings', '{n} حصص'),
    ('Menu price {price} per serving excl. VAT', 'سعر القائمة {price} للحصة قبل الضريبة'),
    ('No menu price set', 'لم يُحدَّد سعر القائمة'),
    ('INGREDIENT · QUANTITY · PRICE · COST · SHARE', 'المكوّن · الكمية · السعر · التكلفة · النسبة'),
    ('Total ({p} of {n} priced)', 'الإجمالي (تم تسعير {p} من {n})'),
    ('{status} (target 25–35 %)', '{status} (الهدف 25–35 %)'),
    ('{recipe} · Food cost calculation · {date}', '{recipe} · حساب تكلفة الطعام · {date}'),
]
NAMES_AR = {  # recipe content, preview only (UFS product names stay as on the pack)
    'Potatoes, peeled &amp; diced': 'بطاطس مقشّرة ومقطّعة مكعبات', 'Water': 'ماء', 'Salt': 'ملح',
    'Whole milk, warmed': 'حليب كامل الدسم، دافئ', 'White pepper, ground': 'فلفل أبيض مطحون',
    'Nutmeg, ground': 'جوزة الطيب المطحونة', 'Chives, finely chopped': 'ثوم معمّر مفروم ناعمًا', 'Butter': 'زبدة',
    'Knorr Professional Mashed Potato for Bulk Cooking': RECIPE_AR,
}
UI_AR = {e: a for e, a in AR if '{' not in e and '/' not in e}
UI_AR.update({'On target': 'ضمن الهدف', 'High': 'مرتفعة', 'Low': 'منخفضة', "Prices for UFS products are indicative, based on wholesaler prices, and may change with the season or supply. UFS can't be held responsible for any deviations.": UI_AR[AR[25][0]]})


def to_ar(markup):
    def text(m):
        t = m.group(1); s = t.strip()
        if not s: return m.group(0)
        r = UI_AR.get(s) or NAMES_AR.get(s)
        if r is None:
            r = re.sub(r'^(\d+) of (\d+) priced$', r'تم تسعير \1 من \2', s)
            r = re.sub(r'^Add prices for (\d+) more ingredients? for a complete total\.$', r'أضف أسعار \1 مكونات أخرى للحصول على إجمالي كامل.', r)
            r = re.sub(r'(\d) g\b', r'\1 غ', r); r = re.sub(r'(\d) ml\b', r'\1 مل', r)
            r = {'€/kg': '\u200f€/كغ', '€/L': '\u200f€/ل', '€/pc': '\u200f€/قطعة'}.get(r, r)   # RLM: reads € / كغ, not كغ / €
        return '>' + t.replace(s, r) + '<'
    out = re.sub(r'>([^<]+)<', text, markup)
    out = out.replace('placeholder="Price"', 'placeholder="السعر"').replace('placeholder="Ingredient name"', 'placeholder="اسم المكوّن"').replace('placeholder="Quantity"', 'placeholder="الكمية"')
    return out


# ── Page parts ──────────────────────────────────────────────────────────────
RECIPE = [('For the mash:', [('Potatoes, peeled &amp; diced', 2000, 'g'), ('Water', 1500, 'ml'), ('Salt', 10, 'g'),
                             ('MEADOWLAND Professional', 200, 'g'), ('Whole milk, warmed', 300, 'ml')]),
          ('For the seasoning:', [('Knorr Professional Chicken Stock Granules', 40, 'g'), ('White pepper, ground', 4, 'g'),
                                  ('Nutmeg, ground', 2, 'g'), ('Chives, finely chopped', 15, 'g')])]
servings = between(tpl, '        <div class="ufs-recipe-ingredients__servings">', '        <div class="ufs-recipe-ingredients__group">')
rows = ''.join('''
        <div class="ufs-recipe-ingredients__group">
          <h3 class="ufs-recipe-ingredients__group-title">%s</h3>%s
        </div>''' % (g, ''.join('''
          <div class="ufs-ingredient-row"><div class="ufs-ingredient-row__main"><span class="ufs-ingredient-row__name">%s</span><span class="ufs-ingredient-row__qty" data-base-qty="%d" data-unit="%s">%d %s</span></div></div>''' % (n, q, u, q, u) for n, q, u in items)) for g, items in RECIPE)
LIVE = '''<div class="pv-recipe">
      <!-- Doc stub: in the template the recipe name comes from the hero title -->
      <p class="ufs-recipe-hero__title" hidden>Knorr Professional Mashed Potato for Bulk Cooking</p>
      <div class="ufs-recipe-ingredients">
        <h2 class="ufs-recipe-ingredients__title">Ingredients</h2>
''' + banner + '\n' + servings + rows + '''
      </div>
    </div>'''

step_servings = between(tpl, '    function stepServings(delta) {', '    function toggleIngredientRow')

TODAY = 'November 2026'
FIGMA = 'Figma 4764:4648 (banner) · 4764:4566 (panel, redesigned)'

overview = section('overview', 'Overview', 'Full Component Preview',
    'The Food Cost Calculator works out what a recipe costs a kitchen. An entry banner in the Recipe Detail ingredients column opens a side panel listing the recipe\'s own ingredients. The chef enters what they pay per kg, litre or piece, sets the servings and the menu price, and gets the total cost, the cost per serving and the food cost % against a 25–35 % target. The calculation downloads as a PDF.',
    '<div class="notice notice--tip"><span class="notice-icon">💡</span><div>Live: the column below is the template\'s Ingredients column. Open the calculator, type prices, change the servings (here or in the panel, they stay in sync), remove or add ingredients and save the PDF. In the template a signed-out chef signs in first; on this page you\'re treated as signed in.</div></div>'
    + card('Live', LIVE))

anatomy = section('anatomy', 'Structure', 'Anatomy',
    'Two parts: <code>.ufs-fcc-banner</code> (entry point, inline in the page) and <code>.ufs-fcc</code> (the panel content, on the v1 <code>.signin-panel</code> drawer shell). The panel has a fixed header and footer; only the body scrolls, so the totals are always visible.',
    card('Parts', table(['Part', 'Element', 'Spec'], [
        ['Entry banner', '<code>.ufs-fcc-banner</code>', 'Icon (40px, 32px ≤768px) + H6 title + body-sm description + <code>.btn-primary</code> (full width ≤768px). 1px --color-mushroom-300 border, --radius-md, 24px × 20px padding. Placed between the Ingredients title and the Servings stepper.'],
        ['Panel shell', '<code>.signin-panel.ufs-fcc</code>', 'v1 drawer: 420px, full height, slides in from the inline-end edge; <code>role="dialog"</code>, <code>aria-modal</code>, <code>inert</code> + <code>aria-hidden</code> while closed'],
        ['Header', '<code>__hd</code>', 'H5 title (focus target on open) + recipe name (body-xs, one line, ellipsis) + v1 close button. Fixed.'],
        ['Setup', '<code>__setup</code>', 'Two columns: Servings (<code>.fi-qty</code>, shares its value with the page stepper) and Menu price per serving (decimal field, "€ excl. VAT" unit inside). Orange-100 30% tint, orange-300 border.'],
        ['List header', '<code>__list-hd</code>', 'H6 "Ingredients" + "{p} of {n} priced"'],
        ['Ingredient row', '<code>__row</code>', 'Two lines. Line 1: name (UFS products in --color-accessible-orange) + remove ×. Line 2: scaled quantity · share %, price field (€/kg, €/L or €/pc), line cost. Removed: name struck through + Undo.'],
        ['Add an ingredient', '<code>__add-toggle</code> / <code>__add</code>', 'Secondary small button; opens an inline form: name, quantity (for the current servings), unit (g / ml / pc), price; Cancel + Add'],
        ['Disclaimer', '<code>__disclaimer</code>', 'body-xs, --color-mushroom-900'],
        ['Actions', '<code>__actions</code>', 'One row: "Reset calculation" link (start) + "Save as PDF" (<code>.btn-secondary.btn-sm.btn-icon-left</code>, download icon) at the end. Error line below, right-aligned, --color-error.'],
        ['Footer', '<code>__ft</code>', 'Fixed. Three totals (Total cost, Per serving, Food cost) in --text-price, divided by 1px rules; status dot + label; one hint line while prices or the menu price are missing.'],
    ]))
    + card('Reference markup', code(('HTML', banner + '\n\n' + panel), ('CSS', fcc_css))))

banner_sec = section('banner', 'Structure', 'Entry Banner',
    'The calculator\'s only entry point. Signed out, the button opens Sign in with its own copy (context <code>food-cost</code>); after signing in, the calculator opens by itself. Signed in, it opens the calculator straight away.',
    card('Desktop', static(snaps['banner'], 'pv-recipe'), 'In the Ingredients column (max 440px here).')
    + card('Sign-in copy (context "food-cost")', table(['Field', 'Copy'], [
        ['Title', 'Sign up or Log in to calculate your food cost'],
        ['Description', 'Save your recipe calculations as a PDF and use them on the go.'],
        ['Success', 'You’re in! Close this panel to open the Food cost calculator.']])))

panel_sec = section('panel', 'Structure', 'Calculator Panel',
    'Ingredients come from the recipe itself (name, base quantity and unit), so the calculator always matches the page. UFS products start with an indicative price; everything else starts empty. Every number updates as the chef types.',
    card('States', static(
        '<div><p class="pv-cap">Opened: UFS prices pre-filled</p>' + snaps['initial'] + '</div>'
        '<div><p class="pv-cap">Priced, with a menu price</p>' + snaps['filled'] + '</div>'
        '<div><p class="pv-cap">Editing: Water removed, an ingredient being added</p>' + snaps['editing'] + '</div>', 'pv-drawer'),
        'Rendered by the real calculator. Shown at full height; in the page the body scrolls between the fixed header and footer.')
    + card('Footer status', static('<div class="pv-stack">'
        + ''.join('<div><p class="pv-cap">%s</p><div class="pv-strip">%s</div></div>' % (c, snaps[k]) for c, k in [
            ('Prices missing: hint line', 'ft_incomplete'), ('Below 25 %: Low (--color-mushroom-900)', 'ft_low'),
            ('25–35 %: On target (scoped green #527719, 5.2:1)', 'ft_ok'), ('Above 35 %: High (--color-error)', 'ft_high')])
        + '</div>', 'pv-drawer'))
    + card('Save as PDF button', static('<div class="pv-stack">'
        + ''.join('<div><p class="pv-cap">%s</p><div class="pv-strip pv-strip--body">%s</div></div>' % (c, snaps[k]) for c, k in [
            ('Default', 'actions'), ('Creating the PDF (aria-disabled, 60% opacity, progress cursor)', 'actions_busy'), ('Failed (library or network)', 'actions_error')])
        + '</div>', 'pv-drawer')))

calc_sec = section('calculation', 'Structure', 'Calculation',
    'All figures come from one function, <code>fccCalc()</code>, used by both the panel and the PDF.',
    card('Formulas', table(['Value', 'Formula'], [
        ['Scale', '<code>k = servings ÷ base servings</code> (base = the recipe\'s own servings, <code>data-base-servings</code>)'],
        ['Line cost', 'g / ml: <code>qty × k ÷ 1000 × price per kg / L</code> · pc: <code>qty × k × price per piece</code>. No price → no cost ("–") and the line doesn\'t count.'],
        ['Total cost', 'Sum of the priced, not-removed lines'],
        ['Per serving', '<code>total ÷ servings</code>'],
        ['Food cost %', '<code>per serving ÷ menu price × 100</code>, only with a menu price and a total above 0'],
        ['Status', '<code>&lt; 25</code> Low · <code>25–35</code> On target · <code>&gt; 35</code> High'],
        ['Share', '<code>line cost ÷ total × 100</code>, shown next to the scaled quantity'],
        ['Custom ingredient', 'Entered for the current servings, stored at base servings (<code>qty × base ÷ servings</code>) so it scales with the stepper like the rest'],
    ]))
    + card('Numbers', table(['Rule', 'Detail'], [
        ['Input', 'Decimal fields (<code>inputmode="decimal"</code>). Accepts "1,20", "1.20", "1.234,5" and a stray "€"; negative or non-numbers count as empty. On blur the field is rewritten in the locale format ("1,2" → "1,20").'],
        ['Output', 'Money: 2 decimals + " €". Quantities: whole numbers from 10, one decimal below. Percentages: up to one decimal. Prototype locale: de-DE (see i18n).'],
        ['Indicative prices', 'UFS products only, from product data (prototype: MEADOWLAND Professional 4,20 €/kg, Knorr Professional Chicken Stock Granules 18,90 €/kg)'],
    ])))

behavior_rows = [
    ['Banner button, signed out', 'Sign in opens with the "food-cost" copy. Finishing sign-in and closing it opens the calculator, with focus returning to the banner button on close.'],
    ['Banner button, signed in', 'The panel opens; focus moves to the panel title. The body behind stops scrolling.'],
    ['Servings', 'One number for the page and the panel: either stepper updates both, and the ingredient quantities on the page.'],
    ['Typing a price / menu price', 'Every keystroke recalculates. The inputs are never re-rendered, so typing is never interrupted. On blur the value is tidied to the locale format.'],
    ['Remove (×)', 'The row collapses to its struck-through name + Undo; focus stays on that row (× ⇄ Undo).'],
    ['Add an ingredient', 'The button turns into the form (focus on the name). Name and quantity are required; price is optional. Add or Cancel returns focus to the button.'],
    ['Reset calculation', 'Back to the defaults: UFS prices only, no menu price, nothing removed or added. The body scrolls to the top.'],
    ['Save as PDF', 'Downloads <code>food-cost-{recipe}.pdf</code> (see Save as PDF). The button is busy until the file is ready; on failure an error line appears under it.'],
    ['Close', '×, the backdrop or <kbd>Esc</kbd>. Focus returns to the button that opened it.'],
    ['Keeping the numbers', 'No auto-save. Everything stays while the page is open (closing and reopening keeps it) and is gone on reload. Save as PDF is how the chef keeps a calculation.'],
    ['Keyboard', '<kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> wrap inside the open panel. While closed the panel is <code>inert</code> and <code>aria-hidden</code>.'],
]
behavior = section('behavior', 'Behavior', 'Using the Calculator',
    'What happens at each step. The JS below is the complete calculator, as it runs in the template.',
    card('', table(['Moment', 'What happens'], behavior_rows))
    + card('Page hooks', table(['The calculator uses', 'From the page'], [
        ['<code>.ufs-recipe-ingredients .ufs-ingredient-row</code>', 'Each row\'s name (<code>__trigger</code> for linked UFS products, else <code>__name</code>) and <code>__qty[data-base-qty][data-unit]</code>'],
        ['<code>#servings-qty[data-base-servings]</code>, <code>#servings-value</code>, <code>stepServings()</code>', 'The page\'s Servings stepper (wrapped so the panel updates with it)'],
        ['<code>.ufs-recipe-hero__title</code>', 'The recipe name in the panel header and the PDF'],
        ['<code>S.auth</code>, <code>openSignIn(context)</code>, <code>closeSignIn()</code>, <code>REG_CONTEXT_COPY</code>', 'v1 Sign in flow (closeSignIn is wrapped to open the calculator after sign-in)'],
    ]), 'In production the ingredient list, indicative prices and recipe name can come from the recipe data instead of the DOM.')
    + card('JS', code(('JS', fcc_js))))

pdf_png = 'pdf-sample.png'
pdf_sec = section('pdf', 'Behavior', 'Save as PDF',
    'The PDF is the calculation the chef keeps: built in the browser from <code>fccCalc()</code> with jsPDF, in Plus Jakarta Sans, A4 portrait.',
    card('Sample', '<img class="pv-pdf" src="../images/food-cost/%s" alt="Sample PDF: header with recipe name, date, servings and menu price; three total boxes; the ingredient table; disclaimer and page footer" width="1240" height="1754" />'
         '<p style="margin-top:12px;font-size:13px"><a href="../images/food-cost/food-cost-sample.pdf" style="color:var(--color-accessible-orange);text-decoration:underline">Open the sample PDF</a> (state "Priced, with a menu price")</p>' % pdf_png)
    + card('Layout', table(['Part', 'Spec'], [
        ['Page', 'A4 portrait, 18mm margins, 3mm --color-accessible-orange band across the top'],
        ['Header', 'Overline "FOOD COST CALCULATION" (9pt bold, orange) · recipe name (18pt bold, wraps) · date · servings · menu price (9pt, mushroom-900)'],
        ['Totals', 'Three boxes (orange-100 tint): Total cost, Per serving, Food cost (16pt bold); the status and target under Food cost in the status colour. The hint line below while prices or the menu price are missing.'],
        ['Table', 'Ingredient · Quantity · Price · Cost · Share; names wrap, UFS products bold orange; unpriced lines show "–"; removed ingredients are left out; rows break across pages with the header repeated. Total row at the end.'],
        ['Footer', 'Disclaimer (7.5pt) after the table; on every page: recipe · "Food cost calculation" · date, and "page / pages"'],
        ['File name', '<code>food-cost-{recipe-slug}.pdf</code>, e.g. food-cost-knorr-professional-mashed-potato-for-bulk-cooking.pdf'],
    ]))
    + '<div class="notice notice--warn"><span class="notice-icon">⚠️</span><div><strong>Production:</strong> the prototype loads jsPDF 2.5.1 (cdnjs) and the Plus Jakarta Sans 2.7.1 TTFs (jsDelivr, ~130 KB each) on the first click. Self-host both, the library in the bundle and the TTFs next to the site fonts, or render the PDF on the server. The font is embedded on purpose: with the PDF standard fonts, viewers substitute Helvetica and macOS Preview mis-spaces "€". If the font can\'t load, the prototype still saves the PDF in Helvetica.</div></div>')

animation = section('animation', 'Behavior', 'Animation',
    'The calculator adds no motion of its own: numbers, rows and the add form change instantly so the figures are always readable. The only movement is the v1 drawer.',
    card('', table(['Element', 'Trigger', 'Animation', 'Duration', 'Easing'], [
        ['Panel (v1 shell)', 'Open / close', 'translateX(100%) → 0 (−100% in RTL) + shadow', '350ms', 'cubic-bezier(0.4, 0, 0.2, 1)'],
        ['Backdrop (v1 shell)', 'Open / close', 'opacity 0 → 1', '300ms', 'ease'],
        ['Totals, line costs, shares', 'Typing, servings, remove / add', 'None (instant)', '–', '–'],
        ['Remove ⇄ Undo, add form', 'Click', 'None (instant swap)', '–', '–'],
        ['Save as PDF', 'Click, until the file is ready', 'Busy: opacity 0.6, progress cursor (no transition)', '–', '–'],
        ['Reduced motion', '<code>prefers-reduced-motion</code>', 'Nothing to reduce in the calculator; the shell slide is the same as every v1 drawer', '–', '–'],
    ])))

mobile = section('mobile', 'Responsive', 'Mobile Examples',
    'At ≤768px: the banner tightens and its button goes full width; the panel fills the screen minus 16px (v1 shell, from ≤1024px), with 16px gutters, narrower price and cost columns and smaller titles and totals.',
    card('', static('<div class="pv-recipe pv-recipe--narrow pv-mob">' + snaps['banner'] + '</div>', 'pv-row') + '<div style="height:16px"></div>'
         + static(snaps['filled'], 'pv-drawer pv-m pv-mob')))

rtl_rules = '''/* The calculator CSS uses logical properties, so it mirrors without overrides */
.ufs-fcc__hd           { padding-inline: var(--space-6) var(--space-4); }
.ufs-fcc__remove       { margin-inline: 0 calc(-1 * var(--space-2)); }
.ufs-fcc__input.fi-field { padding-inline: var(--space-3) var(--space-12); text-align: end; }
.ufs-fcc__unit         { inset-inline-end: var(--space-3); }
.ufs-fcc__totals > div + div { padding-inline-start: var(--space-3); border-inline-start: 1px solid var(--color-mushroom-300); }
/* The two physical rules: the select arrow and the v1 drawer side */
[dir="rtl"] .ufs-fcc__add select.fi-field { background-position: left var(--space-3) center; }
[dir="rtl"] .signin-panel { right: auto; left: 0; transform: translateX(-100%); }
/* Room for the menu-price unit follows the language, not the direction */
.ufs-fcc__input--menu.fi-field { padding-inline-end: var(--fcc-menu-unit-w, 80px); }
.ufs-fcc:lang(ar) { --fcc-menu-unit-w: 108px; }'''
rtl = section('rtl', 'Internationalisation', 'i18n &amp; RTL',
    'Every string, the number format and the PDF follow the page language. Arabic below; the previews are the real panel in <code>dir="rtl"</code>.',
    card('Strings', table(['English', 'Arabic'], [[esc(e), '<span dir="rtl">%s</span>' % a] for e, a in AR]))
    + card('PDF strings', table(['English', 'Arabic'], [[esc(e), '<span dir="rtl">%s</span>' % a] for e, a in AR_PDF]))
    + card('Numbers and plurals', table(['Rule', 'Detail'], [
        ['Format', 'Use <code>Intl.NumberFormat(locale, { style: "currency", currency })</code> for money and the locale\'s separators for quantities and %. The prototype is fixed to de-DE and €.'],
        ['Input', 'Parse with the locale\'s decimal separator; keep accepting both "," and "." (chefs paste prices from invoices).'],
        ['Digits', 'Western digits in the previews. Follow the market\'s choice (ar-AE and ar-SA sites often keep Western digits); the PDF must use the same.'],
        ['Plurals', '"{n} more ingredient(s)" and "{n} servings" need the locale\'s plural rules (<code>Intl.PluralRules</code>); Arabic has six forms.'],
        ['Units', 'g / kg / ml / L / pc are translated labels (غ / كغ / مل / ل / قطعة); the data keeps g / ml / pc.'],
        ['Mixed labels', 'In RTL, start a price unit with a right-to-left mark (U+200F) before "€" (<code>"\\u200f€/كغ"</code>). Without it the bidi algorithm puts € on the left and the label reads "kg per €".'],
    ]))
    + card('RTL previews', static('<div class="pv-recipe pv-recipe--narrow pv-rtl" dir="rtl" lang="ar">' + to_ar(snaps['banner']) + '</div>', 'pv-row')
           + '<div style="height:16px"></div>'
           + static(to_ar(snaps['filled']).replace('class="signin-panel ufs-fcc"', 'class="signin-panel ufs-fcc pv-rtl" dir="rtl" lang="ar"', 1), 'pv-drawer'))
    + card('RTL rules', code(('CSS', rtl_rules)))
    + '<div class="notice notice--info"><span class="notice-icon">ℹ️</span><div><strong>PDF in RTL (not in the prototype):</strong> the prototype PDF is left-to-right only. For Arabic, embed an Arabic TTF (IBM Plex Sans Arabic; jsPDF shapes Arabic when the font has the glyphs) and mirror the layout: text right-aligned from the right margin, the ingredient column on the right, the number columns to its left, the orange band and totals in the same places.</div></div>')

# ── Assemble ────────────────────────────────────────────────────────────────
NAV = [('Overview', [('overview', 'Full Component Preview')]),
       ('Structure', [('anatomy', 'Anatomy'), ('banner', 'Entry Banner'), ('panel', 'Calculator Panel'), ('calculation', 'Calculation')]),
       ('Behavior', [('behavior', 'Using the Calculator'), ('pdf', 'Save as PDF'), ('animation', 'Animation')]),
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
  <title>Food Cost Calculator — UFS Spec v3.0</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=IBM+Plex+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../tokens.css" />
  <!-- Generated by explorations/food-cost-calculator/src/v3/build_spec.py — edit the source, not this file -->
  <style>
''' + CHROME_CSS + '\n' + DRAWER_CSS + '\n' + DS_CSS + '\n\n' + PV_CSS + '\n' + fcc_css + '\n\n' + MOBILE_CHROME + '''  </style>
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
    <span class="doc-topbar-current">Food Cost Calculator</span>
    <span class="doc-topbar-version">New in v3.0</span>
  </nav>

  <!-- Doc header -->
  <header class="doc-header">
    <div class="doc-header-inner">
      <img src="../images/ufs-logo.png" alt="UFS" class="doc-header-logo" />
      <div class="doc-header-vdiv"></div>
      <div class="doc-header-body">
        <div class="doc-header-eyebrow">Handover Spec · v3.0</div>
        <h1 class="doc-header-title"><span>Food Cost Calculator</span></h1>
        <p class="doc-header-desc">Recipe costing on the Recipe Detail page: an entry banner and a side panel with ingredient prices, servings, cost per serving and food cost %, saved as a PDF.</p>
      </div>
      <div class="doc-header-meta">
        <div class="doc-header-meta-row"><span class="doc-header-meta-label">Source</span></div>
        <div class="doc-header-meta-row"><span class="doc-header-meta-val"><a href="template-recipe-detail.html">handover/v3/<br/>template-recipe-detail.html</a></span></div>
        <div class="doc-header-meta-row"><span class="doc-header-meta-label">Format</span><span class="doc-header-meta-sep">·</span><span class="doc-header-meta-val">HTML + CSS + JS</span></div>
      </div>
    </div>
  </header>

  <main class="content" id="main">
''' + overview + anatomy + banner_sec + panel_sec + calc_sec + behavior + pdf_sec + animation + mobile + rtl + '''
  </main>

''' + panel + '''

  <script>
''' + DOC_JS + '''
/* ── Doc stubs ──
   In the template these come from the page: the v1 Sign in flow (S, openSignIn,
   closeSignIn, REG_CONTEXT_COPY) and the Servings stepper. This page is signed in. */
var S = { auth: true };
var REG_CONTEXT_COPY = {};
function openSignIn() {}
function closeSignIn() {}
''' + step_servings + '''
''' + fcc_js + '''

  </script>
  <script src="../ds-version.js"></script>
</body>
</html>
'''
open(OUT, 'w', encoding='utf-8').write(page)

# Sample PDF + PNG render
os.makedirs(IMG, exist_ok=True)
shutil.copyfile(os.path.join(HERE, 'food-cost-sample.pdf'), os.path.join(IMG, 'food-cost-sample.pdf'))
subprocess.run(['sips', '-s', 'format', 'png', '-Z', '1754', os.path.join(IMG, 'food-cost-sample.pdf'), '--out', os.path.join(IMG, pdf_png)],
               check=True, stdout=subprocess.DEVNULL)
print('spec ok', len(page))
