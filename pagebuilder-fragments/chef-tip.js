/* ==========================================================================
   CHEF'S TIP — ported from handover/chef-tip-spec.html.

   No variants registered — Collapsed/Expanded is an interaction state, not
   a marketer-facing visual toggle (see the CSS fragment's header comment).
   Rendered expanded by default so the photo + link + CTA are visible in
   the builder without requiring a click; the Read more/Read less toggle
   is still fully wired.

   Copy is the spec's own real demo content verbatim: "Keep it lump-free at
   scale" heading/body and the "Go to: www.ufs.com/recipes" link, continuing
   the same Meadowland Mash recipe the Ingredients/Steps Panel sections
   document.
========================================================================== */
(function () {
  PB._chefTipToggle = function (btn) {
    var card = btn.closest('.ufs-chef-tip');
    if (!card) return;
    var expanded = card.classList.toggle('is-expanded');
    btn.textContent = expanded ? btn.getAttribute('data-less-label') : btn.getAttribute('data-more-label');
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };

  Object.assign(PB.VARIANTS, { 'chef-tip': [] });
  Object.assign(PB.DEFAULT_VARIANT, { 'chef-tip': 'default' });

  PB._chefTip = function (variant, sec) {
    var src = (sec.images && sec.images.photo) || 'handover/images/hero/recipe.jpg';
    return '<div style="padding:var(--space-8) var(--space-6) var(--space-12);background:var(--color-mushroom-100)">'
      + '<div class="ufs-chef-tip is-expanded">'
      + '<div class="ufs-chef-tip__eyebrow">'
      + '<div class="ufs-chef-tip__eyebrow-icon"><img src="icons/flame.svg" alt=""/></div>'
      + '<p class="ufs-chef-tip__eyebrow-text">Chef&rsquo;s tip</p>'
      + '</div>'
      + '<p class="ufs-chef-tip__heading">Keep it lump-free at scale</p>'
      + '<p class="ufs-chef-tip__body">Whisk MEADOWLAND Professional into hot milk before folding it through the potatoes &mdash; adding it cold or straight from the block is the most common cause of lumps when this recipe is scaled up for bulk service. For an extra glossy finish under the bain-marie, stir in a knob of butter just before service rather than during mixing.</p>'
      + '<div class="ufs-chef-tip__extra">'
      + '<div class="ufs-chef-tip__photo pb-img-slot" onclick="PB.replaceImage(\'' + sec.id + '\',\'photo\',this)">'
      + '<img src="' + src + '" alt="">'
      + '<div class="pb-img-overlay"><div class="pb-img-overlay-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div><span class="pb-img-overlay-label">Replace</span></div>'
      + '</div>'
      + '<p class="ufs-chef-tip__link">Go to: <a href="#" onclick="return false">www.ufs.com/recipes</a></p>'
      + '<a class="btn btn-secondary" href="#" onclick="return false">Example button</a>'
      + '</div>'
      + '<button type="button" class="ufs-chef-tip__toggle" data-more-label="Read more" data-less-label="Read less" aria-expanded="true" onclick="PB._chefTipToggle(this)">Read less</button>'
      + '</div></div>';
  };
})();
