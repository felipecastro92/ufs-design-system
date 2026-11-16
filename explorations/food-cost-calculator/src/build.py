"""Food Cost Calculator (WIP, not part of v2). Injects the banner + side panel into a copy of
handover/v2/template-recipe-detail.html and writes it to ./out.html (v2-relative paths, so
copy it into handover/v2/ to preview) and to ../template-recipe-detail.html (the exploration
page: same build, paths rewritten to ../../handover/). Never write back to handover/v2/ until FCC ships."""
import os, re
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, 'out.html')
src = open(os.path.expanduser('~/ufs-design-system/handover/v2/template-recipe-detail.html'), encoding='utf-8').read()
rd = lambda n: open(os.path.join(here, n), encoding='utf-8').read()
def inject(s, anchor, text, after=False):
    assert s.count(anchor) == 1, ('anchor', s.count(anchor), anchor[:60])
    return s.replace(anchor, anchor + text if after else text + anchor)
s = src
s = inject(s, '  </style>\n</head>', rd('fcc.css').lstrip('\n'))
s = inject(s, '        <h2 class="ufs-recipe-ingredients__title">Ingredients</h2>\n', rd('banner.html').lstrip('\n'), after=True)
s = inject(s, '  <!-- RATING PANEL', rd('panel.html'))
s = inject(s, '    /* Recipe tabs — mobile only (desktop shows both', rd('fcc.js').lstrip('\n') + '\n')
open(out, 'w', encoding='utf-8').write(s)
open(os.path.join(here, '..', 'template-recipe-detail.html'), 'w', encoding='utf-8').write(
    re.sub(r'(["\'(])\.\./', r'\1../../handover/', s))
print('ok', len(src), '->', len(s))
