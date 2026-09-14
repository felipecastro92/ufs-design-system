/* ==========================================================================
   INGREDIENTS PANEL — ported from handover/ingredients-panel-spec.html.

   Single canonical layout — spec shows one full-width example (plus a
   responsive resize and an RTL mirror, neither a marketer-facing toggle),
   so VARIANTS is left empty per the task's guidance.

   Copy is the spec's own real demo content verbatim: the Meadowland Mash
   ingredient list, grouped "For the mash:" / "For the seasoning:", and the
   MEADOWLAND Professional inline product-tile disclosure (shipped expanded
   by default on the real page, per the spec's own "Default state" note).

   Servings stepper is wired with the spec's own live-scaling formula
   (baseQty × next / base, whole numbers ≥10, one decimal below it) so the
   preview behaves like the real component, not just a static screenshot.
========================================================================== */
(function () {
  function fmtQty(base, servings, baseServings, unit) {
    var val = (base * servings) / baseServings;
    val = val >= 10 ? Math.round(val) : Math.round(val * 10) / 10;
    return val + ' ' + unit;
  }

  // Attached to PB (shared global) so the inline onclick handlers below can
  // reach it; namespaced to avoid colliding with other ported sections.
  PB._ingStepServings = function (btn, dir) {
    var qtyEl = btn.closest('.fi-qty');
    var panel = btn.closest('.ufs-recipe-ingredients');
    if (!qtyEl || !panel) return;
    var baseServings = parseInt(qtyEl.getAttribute('data-base-servings'), 10) || 1;
    var valueEl = qtyEl.querySelector('.fi-qty-value');
    var current = parseInt(valueEl.textContent, 10) || baseServings;
    var next = Math.max(1, current + dir);
    valueEl.textContent = next;
    var decBtn = qtyEl.querySelector('.fi-qty-btn[aria-label*="Decrease"]');
    if (decBtn) decBtn.disabled = next <= 1;
    panel.querySelectorAll('[data-base-qty]').forEach(function (el) {
      var base = parseFloat(el.getAttribute('data-base-qty'));
      var unit = el.getAttribute('data-unit') || '';
      el.textContent = fmtQty(base, next, baseServings, unit);
    });
  };

  PB._ingToggleRow = function (btn) {
    var row = btn.closest('.ufs-ingredient-row');
    if (!row) return;
    var open = row.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  function qtySpan(base, unit) {
    return '<span class="ufs-ingredient-row__qty" data-base-qty="' + base + '" data-unit="' + unit + '">' + base + ' ' + unit + '</span>';
  }

  function plainRow(name, base, unit) {
    return '<div class="ufs-ingredient-row"><div class="ufs-ingredient-row__main">'
      + '<span class="ufs-ingredient-row__name">' + name + '</span>' + qtySpan(base, unit)
      + '</div></div>';
  }

  function meadowlandTile(sec) {
    var src = (sec.images && sec.images.ingredientTile) || 'handover/images/tiles/product.jpg';
    return '<div class="ufs-tile ufs-tile--catalog-preview ufs-tile--catalog-preview-sm-img">'
      + '<div class="ufs-tile__image pb-img-slot" onclick="event.stopPropagation();PB.replaceImage(\'' + sec.id + '\',\'ingredientTile\',this)">'
      + '<img class="ufs-tile__image-media" src="' + src + '" alt="">'
      + '<div class="pb-img-overlay"><div class="pb-img-overlay-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div><span class="pb-img-overlay-label">Replace</span></div>'
      + '</div>'
      + '<span class="ufs-tile__badge">Chef&rsquo;s pick</span>'
      + '<div class="ufs-tile__content"><div class="ufs-tile__body">'
      + '<div class="ufs-tile__eyebrow">Fats &amp; Oils</div>'
      + '<h3 class="ufs-tile__title">MEADOWLAND Professional Liquid Margarine, 10 L</h3>'
      + '<div class="ufs-tile__rating"><span class="ufs-tile__stars"><svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg><svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg><svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg><svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg><svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg></span><span>(332)</span></div>'
      + '<div class="ufs-tile__meta"><span class="ufs-tile__meta-item">Gluten Free</span><span class="ufs-tile__meta-sep">&middot;</span><span class="ufs-tile__meta-item">Vegetarian</span></div>'
      + '</div><div class="ufs-tile__cta"><a href="#" class="btn btn-primary btn-sm" onclick="return false">Buy it now</a></div></div>'
      + '</div>';
  }

  Object.assign(PB.VARIANTS, { 'ingredients-panel': [] });
  Object.assign(PB.DEFAULT_VARIANT, { 'ingredients-panel': 'default' });

  PB._ingredientsPanel = function (variant, sec) {
    var qtyId = 'ing-qty-' + sec.id;
    return '<div style="padding:var(--space-10) var(--space-6);background:var(--color-salt)">'
      + '<div class="ufs-recipe-ingredients">'
      + '<h2 class="ufs-recipe-ingredients__title">Ingredients</h2>'
      + '<div class="ufs-recipe-ingredients__servings">'
      + '<p class="ufs-recipe-ingredients__servings-label">Servings:</p>'
      + '<div class="fi-qty" id="' + qtyId + '" data-base-servings="10">'
      + '<button type="button" class="fi-qty-btn" aria-label="Decrease servings" onclick="PB._ingStepServings(this,-1)"><svg viewBox="0 0 45 45" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M33.75 20.7C34.4542 20.7 35.0917 20.9854 35.5531 21.4469C36.0146 21.9083 36.3 22.5458 36.3 23.25C36.3 23.9542 36.0146 24.5917 35.5531 25.0531C35.0917 25.5146 34.4542 25.8 33.75 25.8H11.25C10.5458 25.8 9.90835 25.5146 9.44689 25.0531C8.98543 24.5917 8.70001 23.9542 8.70001 23.25C8.70001 22.5458 8.98543 21.9083 9.44689 21.4469C9.90835 20.9854 10.5458 20.7 11.25 20.7H33.75Z"/></svg></button>'
      + '<span class="fi-qty-pill"><span class="fi-qty-value">10</span></span>'
      + '<button type="button" class="fi-qty-btn" aria-label="Increase servings" onclick="PB._ingStepServings(this,1)"><svg viewBox="0 0 45 45" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M22.5 9.45C23.2042 9.45 23.8417 9.73542 24.3031 10.1969C24.7646 10.6583 25.05 11.2958 25.05 12V20.7H33.75C34.4542 20.7 35.0917 20.9854 35.5531 21.4469C36.0146 21.9083 36.3 22.5458 36.3 23.25C36.3 23.9542 36.0146 24.5917 35.5531 25.0531C35.0917 25.5146 34.4542 25.8 33.75 25.8H25.05V34.5C25.05 35.2042 24.7646 35.8417 24.3031 36.3031C23.8417 36.7646 23.2042 37.05 22.5 37.05C21.7958 37.05 21.1583 36.7646 20.6969 36.3031C20.2354 35.8417 19.95 35.2042 19.95 34.5V25.8H11.25C10.5458 25.8 9.90835 25.5146 9.44689 25.0531C8.98543 24.5917 8.70001 23.9542 8.70001 23.25C8.70001 22.5458 8.98543 21.9083 9.44689 21.4469C9.90835 20.9854 10.5458 20.7 11.25 20.7H19.95V12C19.95 11.2958 20.2354 10.6583 20.6969 10.1969C21.1583 9.73542 21.7958 9.45 22.5 9.45Z"/></svg></button>'
      + '</div></div>'
      + '<div class="ufs-recipe-ingredients__group">'
      + '<h3 class="ufs-recipe-ingredients__group-title">For the mash:</h3>'
      + plainRow('Potatoes, peeled &amp; diced', 2000, 'g')
      + plainRow('Water', 1500, 'ml')
      + plainRow('Salt', 10, 'g')
      + '<div class="ufs-ingredient-row ufs-ingredient-row--linked is-open">'
      + '<div class="ufs-ingredient-row__main">'
      + '<button type="button" class="ufs-ingredient-row__trigger" aria-expanded="true" onclick="PB._ingToggleRow(this)">MEADOWLAND Professional<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>'
      + qtySpan(200, 'g')
      + '</div>'
      + '<div class="ufs-ingredient-row__panel"><div class="ufs-ingredient-row__panel-inner">' + meadowlandTile(sec) + '</div></div>'
      + '</div>'
      + plainRow('Whole milk, warmed', 300, 'ml')
      + '</div>'
      + '<div class="ufs-recipe-ingredients__group">'
      + '<h3 class="ufs-recipe-ingredients__group-title">For the seasoning:</h3>'
      + plainRow('Knorr Professional Chicken Stock Granules', 40, 'g')
      + plainRow('White pepper, ground', 4, 'g')
      + plainRow('Nutmeg, ground', 2, 'g')
      + plainRow('Chives, finely chopped', 15, 'g')
      + '</div>'
      + '<button type="button" class="btn btn-primary btn-icon-left ufs-recipe-ingredients__cta">'
      + '<img src="icons/cart.svg" alt="" style="filter:brightness(0) invert(1)"/>Add all UFS Products to Cart</button>'
      + '</div></div>';
  };
})();
