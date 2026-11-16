"""Handover v3.0 — ships the Food Cost Calculator.

Run from anywhere after `python3 ../build.py` (which writes ../out.html):

  1. handover/v3/template-recipe-detail.html = ../out.html (v2 Recipe Detail + FCC;
     its relative paths are ../, the same depth as v2, so it is copied unchanged).
  2. handover/v3/index.html = the v2 index, cumulative: every v2-local link points
     at ../v2/, a "New in v3.0" sidebar group + What's new section come first, the
     v2 group/section stay (collapsed / renamed #whats-new-v2), Recipe Detail
     points at the v3 copy with a "v3" badge.
  0. Cross-version chrome on v1/v2 (runs first): ds-version.js on the indexes and the
     pages with back links, "Design System v3.0 (latest)" in the version selects,
     version switching keeps the #section.

v1 (handover/) and v2 (handover/v2/) are frozen (tags v1.0, v2.0): apart from the
version-switching chrome (step 0), never write to them. The spec page is build_spec.py.
Every replace asserts an exact match count, so a changed source fails loudly.
"""
import os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.expanduser('~/ufs-design-system')
H = os.path.join(REPO, 'handover')
V3 = os.path.join(H, 'v3')
os.makedirs(V3, exist_ok=True)


def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s): open(p, 'w', encoding='utf-8').write(s)


def rep(s, a, b, n=1):
    assert s.count(a) == n, ('expected', n, 'got', s.count(a), a[:80])
    return s.replace(a, b)


# 0 ── Cross-version chrome on v1 / v2 pages (idempotent; page content untouched) ─
# ds-version.js (handover root) lets reused older pages return to the version being
# browsed. Only pages with a "back to Design System" link (specs) and the indexes need it.
SCRIPT = {'': '  <script src="ds-version.js"></script>\n', 'v2': '  <script src="../ds-version.js"></script>\n'}
V3_OPT = {'': ('v3/index.html', '            <option value="v2/index.html">Design System v2.0</option>\n'),
          'v2': ('../v3/index.html', '            <option value="index.html" selected>Design System v2.0</option>\n')}
for folder in ('', 'v2'):
    d = os.path.join(H, folder)
    for f in sorted(os.listdir(d)):
        if not f.endswith('.html'): continue
        p = os.path.join(d, f); t = rd(p)
        if f != 'index.html' and 'class="doc-topbar-back"' not in t and 'class="sidebar-back"' not in t: continue
        if 'ds-version.js' not in t: t = rep(t, '</body>', SCRIPT[folder] + '</body>')
        if f == 'index.html':
            t = t.replace('window.location.href = select.value;', 'window.location.href = select.value + location.hash;   // keep the section')
            href, anchor = V3_OPT[folder]
            t = re.sub(r'            <option value="%s">Design System v3\.0[^<]*</option>\n' % re.escape(href), '', t)
            t = rep(t, anchor, anchor + '            <option value="%s">Design System v3.0 (latest)</option>\n' % href)
        wr(p, t)

# 1 ── Template ───────────────────────────────────────────────────────────────
shutil.copyfile(os.path.join(HERE, '..', 'out.html'), os.path.join(V3, 'template-recipe-detail.html'))

# 2 ── Index ──────────────────────────────────────────────────────────────────
s = rd(os.path.join(H, 'v2', 'index.html'))
s = rep(s, '<title>UFS Design System v2.0 — Developer Handover</title>',
           '<title>UFS Design System v3.0 — Developer Handover</title>')

# v2-local links → ../v2/ (the Recipe Detail template is the v3 copy)
def relink(m):
    attr, url = m.group(1), m.group(2)
    if url == 'template-recipe-detail.html' or url.startswith(('../', '#', 'http', 'mailto:', 'data:', 'javascript:')):
        return m.group(0)
    return '%s="../v2/%s"' % (attr, url)
s = re.sub(r'(href|src)="([^"]+)"', relink, s)

s = re.sub(r'            <option value="\.\./v3/index\.html">[^<]*</option>\n', '', s)   # v2's own v3 option (step 0)
s = rep(s, '''            <option value="../index.html">Design System v1.0</option>
            <option value="index.html" selected>Design System v2.0</option>''',
           '''            <option value="../index.html">Design System v1.0</option>
            <option value="../v2/index.html">Design System v2.0</option>
            <option value="index.html" selected>Design System v3.0 (latest)</option>''')

# Sidebar: v3 group first; v2 group collapsed, its What's new → #whats-new-v2
CHEV = '''            <svg class="sidebar-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 6 8 10 12 6"/>
            </svg>'''
s = rep(s, '''        <div class="sidebar-group" id="nav-group-new">
          <div class="sidebar-group-label collapsible" onclick="toggleNavGroup('nav-group-new')">
            New in v2.0''', '''        <div class="sidebar-group" id="nav-group-new-v3">
          <div class="sidebar-group-label collapsible" onclick="toggleNavGroup('nav-group-new-v3')">
            New in v3.0
''' + CHEV + '''
          </div>
          <div class="sidebar-group-links">
            <a href="#whats-new" class="sidebar-link" data-s="whats-new">
              <span class="nav-dot"></span> What's new
            </a>
            <a href="food-cost-calculator-spec.html" class="sidebar-link" style="justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:10px;"><span class="nav-dot"></span> Food Cost Calculator</span>
              <span class="new-badge">Spec</span>
            </a>
          </div>
        </div>
        <div class="sidebar-group collapsed" id="nav-group-new">
          <div class="sidebar-group-label collapsible" onclick="toggleNavGroup('nav-group-new')">
            New in v2.0''')
s = rep(s, '''            <a href="#whats-new" class="sidebar-link" data-s="whats-new">
              <span class="nav-dot"></span> What's new
            </a>
            <a href="../v2/pack-size-picker-spec.html"''', '''            <a href="#whats-new-v2" class="sidebar-link" data-s="whats-new-v2">
              <span class="nav-dot"></span> What's new in v2.0
            </a>
            <a href="../v2/pack-size-picker-spec.html"''')

# Templates list: Recipe Detail → v3 badge
s = rep(s, '''<span class="nav-dot"></span> Recipe Detail</span>
              <span style="display:flex;gap:4px;flex-shrink:0;"><span class="new-badge">v2</span>''',
           '''<span class="nav-dot"></span> Recipe Detail</span>
              <span style="display:flex;gap:4px;flex-shrink:0;"><span class="new-badge">v3</span>''')

# What's new: v3 section first, v2 section kept as #whats-new-v2
s = rep(s, '''      <section class="doc-section" id="whats-new">
        <div class="section-breadcrumb">New in v2.0</div>
        <h2 class="section-title">What's new</h2>''', '''      <section class="doc-section" id="whats-new">
        <div class="section-breadcrumb">New in v3.0</div>
        <h2 class="section-title">What's new</h2>
        <p class="section-desc">
          v3.0 adds new features on top of v2.0. Nothing from v1.0 or v2.0 has changed:
          every page in this navigation is the same page as in its own version, so
          anything already built from v1.0 or v2.0 stays valid. Templates tagged
          <span class="new-badge" style="vertical-align:1px">v3</span> are v2.0 templates
          with the new features below built in.
        </p>
        <div class="section-rule"></div>
        <div class="intro-grid whats-new-grid">
          <div class="intro-card whats-new-card">
            <span class="new-badge">Spec + template</span>
            <div class="intro-card-title" style="margin-top:14px;">Food Cost Calculator</div>
            <p class="intro-card-text">A side panel on the Recipe Detail template that works out what a recipe costs: prices per ingredient, servings, the cost per serving and the food cost % against the menu price. It downloads as a PDF.</p>
            <div class="whats-new-files"><a href="template-recipe-detail.html">Recipe Detail template →</a><br><a href="food-cost-calculator-spec.html">Food Cost Calculator spec →</a></div>
          </div>
        </div>
      </section>

      <!-- ===================================================================
           WHAT'S NEW IN v2.0 (unchanged from the v2 index)
      ==================================================================== -->
      <section class="doc-section" id="whats-new-v2">
        <div class="section-breadcrumb">New in v2.0</div>
        <h2 class="section-title">What's new in v2.0</h2>''')
s = rep(s, '''           WHAT'S NEW IN v2.0
      ==================================================================== -->
      <section class="doc-section" id="whats-new">''', '''           WHAT'S NEW IN v3.0
      ==================================================================== -->
      <section class="doc-section" id="whats-new">''')
# The v2 Ratings card keeps linking template-recipe-detail.html: in v3 that's the v3 copy (Ratings included)
wr(os.path.join(V3, 'index.html'), s)

print('v3 ok')
