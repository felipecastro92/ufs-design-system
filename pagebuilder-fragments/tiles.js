/* ==========================================================================
   TILES — ported from handover/tiles-spec.html.

   4 variants registered: Product, Recipe, Training, Article — the 4 tile
   content-types that share the plain vertical .ufs-tile anatomy and read as
   an actual "grid of cards" a marketer would drop onto a page. Topic Tile
   (full-bleed hero/CTA block), Brand Tile (carousel-only logo row) and Chef
   Tile (profile card) were deliberately left out of this variant set: all
   three carry their own bespoke CSS instead of reusing .ufs-tile, and read
   as one-off blocks rather than a repeatable grid item — see the port
   report for the full reasoning.

   Card copy reuses the real examples from tiles-spec.html itself (Knorr
   Professional Garde D'or Hollandaise sauce, Herb-Roasted Chicken with Pan
   Sauce, Middle Eastern Cuisine with Chef Rabeh, the menu-trends article)
   plus MEADOWLAND Professional / Knorr Professional Chicken Stock Granules
   / "Meadowland Mash" sourced from ingredients-panel-spec.html and
   steps-panel-spec.html (same handover project, same recipe). A few
   additional cards per variant were needed to fill out a realistic 3-card
   grid; those reuse real UFS/DS vocabulary (footer's own "Culinary Bases" /
   "Food Trends" categories, filters-catalog-spec's "Fish & Seafood" /
   "Mediterranean" filter pills) rather than inventing unrelated copy.
========================================================================== */
(function () {
  var STAR = '<svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg>';
  var STARS5 = STAR + STAR + STAR + STAR + STAR;
  var FAV_SVG = '<svg width="20" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  var PLAY_ICON = '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M6.5 5.3v5.4l4.5-2.7z" fill="currentColor"/></svg>';
  var BARS_ICON = '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="9" width="3" height="5" rx="0.5"/><rect x="6.5" y="6" width="3" height="8" rx="0.5"/><rect x="12" y="2" width="3" height="12" rx="0.5"/></svg>';
  var UPLOAD_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';

  function metaTags(tags) {
    return tags.map(function (t, i) {
      return '<span class="ufs-tile__meta-item">' + t + '</span>' + (i < tags.length - 1 ? '<span class="ufs-tile__meta-sep">&middot;</span>' : '');
    }).join('');
  }

  function imgSlot(sec, key, defaultSrc) {
    var src = (sec.images && sec.images[key]) || defaultSrc;
    return '<div class="ufs-tile__image pb-img-slot" onclick="event.stopPropagation();PB.replaceImage(\'' + sec.id + '\',\'' + key + '\',this)">'
      + '<img class="ufs-tile__image-media" src="' + src + '" alt="">'
      + '<button type="button" class="ufs-tile__fav" aria-label="Add to favourites" onclick="event.stopPropagation();this.classList.toggle(\'is-active\')">' + FAV_SVG + '</button>'
      + '<div class="pb-img-overlay"><div class="pb-img-overlay-icon">' + UPLOAD_ICON + '</div><span class="pb-img-overlay-label">Replace</span></div>'
      + '</div>';
  }

  function productCard(sec, key, defaultSrc, eyebrow, title, badge, count, tags) {
    return '<div class="ufs-tile">'
      + imgSlot(sec, key, defaultSrc)
      + '<span class="ufs-tile__badge">' + badge + '</span>'
      + '<div class="ufs-tile__content"><div class="ufs-tile__body">'
      + '<div class="ufs-tile__eyebrow">' + eyebrow + '</div>'
      + '<h3 class="ufs-tile__title">' + title + '</h3>'
      + '<div class="ufs-tile__rating"><span class="ufs-tile__stars">' + STARS5 + '</span><span>(' + count + ')</span></div>'
      + '<div class="ufs-tile__meta">' + metaTags(tags) + '</div>'
      + '</div><div class="ufs-tile__cta"><button type="button" class="btn btn-primary">Buy it now</button></div></div>'
      + '</div>';
  }

  function recipeCard(sec, key, defaultSrc, title, badge, count, tags) {
    return '<div class="ufs-tile">'
      + imgSlot(sec, key, defaultSrc)
      + (badge ? '<span class="ufs-tile__badge">' + badge + '</span>' : '')
      + '<div class="ufs-tile__content"><div class="ufs-tile__body">'
      + '<h3 class="ufs-tile__title">' + title + '</h3>'
      + '<div class="ufs-tile__rating"><span class="ufs-tile__stars">' + STARS5 + '</span><span>(' + count + ')</span></div>'
      + '<div class="ufs-tile__meta">' + metaTags(tags) + '</div>'
      + '</div></div>'
      + '</div>';
  }

  function trainingCard(sec, key, defaultSrc, eyebrow, title, badge, count, videos, difficulty) {
    return '<div class="ufs-tile">'
      + imgSlot(sec, key, defaultSrc)
      + '<span class="ufs-tile__badge">' + badge + '</span>'
      + '<div class="ufs-tile__content"><div class="ufs-tile__body">'
      + '<div class="ufs-tile__eyebrow">' + eyebrow + '</div>'
      + '<h3 class="ufs-tile__title">' + title + '</h3>'
      + '<div class="ufs-tile__rating"><span class="ufs-tile__stars">' + STARS5 + '</span><span>(' + count + ')</span></div>'
      + '<div class="ufs-tile__meta"><span class="ufs-tile__meta-item">' + PLAY_ICON + videos + '</span><span class="ufs-tile__meta-sep">&middot;</span><span class="ufs-tile__meta-item">' + BARS_ICON + difficulty + '</span></div>'
      + '</div></div>'
      + '</div>';
  }

  function articleCard(sec, key, defaultSrc, eyebrow, title, badge, readTime) {
    return '<div class="ufs-tile">'
      + imgSlot(sec, key, defaultSrc)
      + (badge ? '<span class="ufs-tile__badge">' + badge + '</span>' : '')
      + '<div class="ufs-tile__content"><div class="ufs-tile__body">'
      + '<div class="ufs-tile__eyebrow">' + eyebrow + '</div>'
      + '<h3 class="ufs-tile__title">' + title + '</h3>'
      + '<div class="ufs-tile__meta"><span class="ufs-tile__meta-item">' + readTime + '</span></div>'
      + '</div></div>'
      + '</div>';
  }

  Object.assign(PB.VARIANTS, { 'tiles': ['product', 'recipe', 'training', 'article'] });
  Object.assign(PB.DEFAULT_VARIANT, { 'tiles': 'product' });
  if (!PB.VAR_LABELS) PB.VAR_LABELS = {};
  Object.assign(PB.VAR_LABELS, { product: 'Product', recipe: 'Recipe', training: 'Training', article: 'Article' });

  PB._tiles = function (variant, sec) {
    var cards;
    if (variant === 'recipe') {
      cards = [
        recipeCard(sec, 'tile0', 'handover/images/tiles/recipe.jpg', 'Herb-Roasted Chicken with Pan Sauce', 'Popular', 332, ['Chicken', 'Main', 'Gluten Free']),
        recipeCard(sec, 'tile1', 'handover/images/hero/recipe.jpg', 'Meadowland Mash', '', 198, ['Potato', 'Side', 'Banquet']),
        recipeCard(sec, 'tile2', 'images/M_GPP_6074.jpg', 'Mediterranean Baked Fish with Herbs', '', 276, ['Fish &amp; Seafood', 'Mediterranean', 'Main']),
      ].join('');
    } else if (variant === 'training') {
      cards = [
        trainingCard(sec, 'tile0', 'handover/images/tiles/training.jpg', 'Culinary Techniques', 'Middle Eastern Cuisine with Chef Rabeh', 'Certified', 332, '3 videos', 'Intermediate'),
        trainingCard(sec, 'tile1', 'images/academy/74770da0-cda1-486b-b4ae-85a2a9fe1c46.jpg', 'Knife Skills', 'Knife Skills Fundamentals for Professional Kitchens', 'New', 140, '5 videos', 'Beginner'),
        trainingCard(sec, 'tile2', 'images/academy/47ed07c4-9091-4eb1-aab8-73da86e1b556.jpg', 'Menu Design', 'Building Plant-Forward Menus That Sell', 'Popular', 96, '4 videos', 'Advanced'),
      ].join('');
    } else if (variant === 'article') {
      cards = [
        articleCard(sec, 'tile0', 'handover/images/tiles/article.jpg', 'Trend Watch', 'How to update your menus: new trends and designs', 'Trending', '5 minutes read'),
        articleCard(sec, 'tile1', 'images/banners/promo-2.jpg', 'Food Trends', 'The Rise of Plant-Forward Menus in Foodservice', '', '4 minutes read'),
        articleCard(sec, 'tile2', 'images/banners/promo-3.jpg', 'Sustainability', 'Reducing Food Waste in High-Volume Kitchens', '', '7 minutes read'),
      ].join('');
    } else {
      cards = [
        productCard(sec, 'tile0', 'handover/images/tiles/product.jpg', 'Sauces', 'Knorr Professional Garde D&oacute;r Hollandaise sauce &ndash; 600ml', 'New', 332, ['Vegetarian', 'Gluten Free', 'No MSG']),
        productCard(sec, 'tile1', 'handover/images/tiles/packshot.webp', 'Fats &amp; Oils', 'MEADOWLAND Professional Liquid Margarine, 10 L', "Chef's pick", 332, ['Gluten Free', 'Vegetarian']),
        productCard(sec, 'tile2', 'images/K_GPP_3996.jpg', 'Culinary Bases', 'Knorr Professional Chicken Stock Granules, 1 kg', 'Bestseller', 215, ['Gluten Free', 'No MSG']),
      ].join('');
    }
    return '<div class="ufs-catalog-grid" style="padding:var(--space-8) var(--space-6)">' + cards + '</div>';
  };
})();
