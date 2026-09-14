/* ==========================================================================
   FILTERS & CATALOG TOOLBAR — ported from handover/filters-catalog-spec.html.

   No variants registered — the spec's one marketer-relevant composition is
   the desktop "Full Component Preview" (Filters Bar + Popular Filters +
   Catalog Toolbar), ported here as the single canonical layout. Active
   Filters (which replaces Popular Filters once a filter is applied) and
   the All Filters side drawer are data/interaction states and an on-demand
   overlay respectively, not marketer-facing visual toggles — see the CSS
   fragment's header comment for the full reasoning.

   Copy is the spec's own real demo content verbatim: "Search recipes"
   placeholder, the 3 quick-filter categories (Main ingredient / Cuisine +
   badge / Type of dish), the 3 Popular Filters pills (Fish & Seafood,
   Mediterranean, Sauces & Dressings), "261 recipes", and the 3 sort
   options (A-Z / Latest Added / Most Popular).

   Dropdowns and the sort panel are wired with a small open/close toggle so
   the preview reads as a live control, not a flat screenshot.
========================================================================== */
(function () {
  var CHEV = '<svg class="ufs-filters-dropdown__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
  var CHECK = '<svg class="ufs-popular-filters__pill-check" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 10 8 14 16 6"/></svg>';

  PB._filtersToggle = function (btn) {
    var host = btn.closest('.ufs-filters-dropdown, .ufs-catalog-sort');
    if (!host) return;
    var willOpen = !host.classList.contains('is-open');
    var group = host.parentElement;
    if (group) {
      group.querySelectorAll('.ufs-filters-dropdown.is-open, .ufs-catalog-sort.is-open').forEach(function (el) {
        if (el !== host) el.classList.remove('is-open');
      });
    }
    host.classList.toggle('is-open', willOpen);
  };

  PB._filtersTogglePill = function (el) {
    el.classList.toggle('is-active');
  };

  function dropdown(label, badgeCount) {
    var badge = badgeCount ? '<span class="ufs-filters-badge">' + badgeCount + '</span>' : '<span class="ufs-filters-badge" hidden>0</span>';
    return '<div class="ufs-filters-dropdown">'
      + '<button type="button" class="ufs-filters-dropdown__trigger" onclick="PB._filtersToggle(this)"><span>' + label + '</span>' + badge + CHEV + '</button>'
      + '<div class="ufs-filters-dropdown__panel" role="region" aria-label="' + label + ' filters">'
      + '<div class="fi-checkbox-row">'
      + '<label class="fi-checkbox"><input type="checkbox"/><span class="fi-checkbox-box"><img src="icons/check.svg" alt=""/></span><span class="fi-checkbox-label">Asian</span></label>'
      + '<label class="fi-checkbox"><input type="checkbox" checked/><span class="fi-checkbox-box"><img src="icons/check.svg" alt=""/></span><span class="fi-checkbox-label">Mediterranean</span></label>'
      + '<label class="fi-checkbox"><input type="checkbox"/><span class="fi-checkbox-box"><img src="icons/check.svg" alt=""/></span><span class="fi-checkbox-label">Latin American</span></label>'
      + '</div>'
      + '<div class="ufs-filters-dropdown__ft"><button type="button" class="btn btn-secondary btn-sm">Clear</button><button type="button" class="btn btn-primary btn-sm">Save</button></div>'
      + '</div></div>';
  }

  function pill(label, active) {
    return '<button type="button" class="ufs-popular-filters__pill' + (active ? ' is-active' : '') + '" onclick="PB._filtersTogglePill(this)"><span>' + label + '</span>' + CHECK + '</button>';
  }

  Object.assign(PB.VARIANTS, { 'filters-catalog': [] });
  Object.assign(PB.DEFAULT_VARIANT, { 'filters-catalog': 'default' });

  PB._filtersCatalog = function (variant, sec) {
    return '<div style="padding:var(--space-6) var(--space-6) var(--space-8);background:var(--color-salt)">'
      + '<div class="ufs-filters-bar">'
      + '<div class="ufs-filters-search">'
      + '<svg class="ufs-filters-search__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="9" r="6.5"/><line x1="17.5" y1="17.5" x2="13.5" y2="13.5"/></svg>'
      + '<input type="text" class="ufs-filters-search__input" placeholder="Search recipes" aria-label="Search recipes"/>'
      + '</div>'
      + dropdown('Main ingredient', 0)
      + dropdown('Cuisine', 2)
      + dropdown('Type of dish', 0)
      + '<button type="button" class="btn btn-secondary ufs-filters-allbtn" aria-label="All filters">'
      + '<svg class="ufs-filters-allbtn__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="17" y2="6"/><line x1="6" y1="10" x2="14" y2="10"/><line x1="8.5" y1="14" x2="11.5" y2="14"/></svg>'
      + '<span class="ufs-filters-allbtn__label">All filters</span>'
      + '<span class="ufs-filters-badge ufs-filters-allbtn__badge">2</span>'
      + '</button>'
      + '</div>'

      + '<div class="ufs-popular-filters">'
      + '<p class="ufs-popular-filters__label">Popular filters:</p>'
      + '<div class="ufs-popular-filters__pills">'
      + pill('Fish &amp; Seafood', true)
      + pill('Mediterranean', false)
      + pill('Sauces &amp; Dressings', false)
      + '</div></div>'

      + '<div class="ufs-catalog-toolbar">'
      + '<p class="ufs-catalog-results">261 recipes</p>'
      + '<div class="ufs-catalog-sort">'
      + '<button type="button" class="ufs-catalog-sort__trigger" onclick="PB._filtersToggle(this)"><span>Sort by: A&ndash;Z</span><svg class="ufs-catalog-sort__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>'
      + '<div class="ufs-catalog-sort__panel" role="region" aria-label="Sort options">'
      + '<label class="ufs-catalog-sort__option"><input type="radio" name="pb-sort-' + sec.id + '" checked/> A&ndash;Z</label>'
      + '<label class="ufs-catalog-sort__option"><input type="radio" name="pb-sort-' + sec.id + '"/> Latest Added</label>'
      + '<label class="ufs-catalog-sort__option"><input type="radio" name="pb-sort-' + sec.id + '"/> Most Popular</label>'
      + '</div></div></div>'
      + '</div>';
  };
})();
