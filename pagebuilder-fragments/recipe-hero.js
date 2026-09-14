/* Recipe Hero — ported from handover/recipe-hero-spec.html. Real
   variant registered: 'default' (photo only — "what every recipe uses
   today" per the spec) vs 'video' (dark scrim + play control +
   "Watch preparation" label, the spec's own named "Video Variant").
   VAR_LABELS gets one addition since 'video' has no existing label in
   page-builder.html. Content panel (rating/tags/author) is kept full
   in both variants rather than stripped down the way the spec's own
   side-by-side demo does — that demo trims content purely to keep the
   comparison compact, not because video precludes it. The media
   photo is wired as an editable slot via PB.replaceImage. */
Object.assign(PB.VARIANTS, { 'recipe-hero': ['default', 'video'] });
Object.assign(PB.DEFAULT_VARIANT, { 'recipe-hero': 'default' });
Object.assign(PB.VAR_LABELS, { video: 'Video' });

PB._recipeHero = function(variant, sec) {
  const photoSrc = (sec.images && sec.images['photo']) || 'handover/images/hero/recipe.jpg';
  const uploadIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
  const star = `<svg viewBox="0 0 20 20" fill="currentColor" style="color:var(--color-brand-primary)"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg>`;

  const watchHTML = variant === 'video'
    ? `<div class="ufs-recipe-hero__overlay"></div>
       <button type="button" class="ufs-recipe-hero__watch" aria-label="Watch preparation">
         <span class="ufs-recipe-hero__watch-icon"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
         <span class="ufs-recipe-hero__watch-label">Watch preparation</span>
       </button>`
    : '';

  return `<section class="ufs-recipe-hero">
    <div class="ufs-recipe-hero__panel">
      <div class="ufs-recipe-hero__content">
        <div class="ufs-recipe-hero__text-group">
          <p class="ufs-recipe-hero__eyebrow">Recipe</p>
          <h1 class="ufs-recipe-hero__title">Knorr Professional Mashed Potato for Bulk Cooking</h1>
          <div class="ufs-recipe-hero__rating">
            <span class="ufs-tile__stars">${star}${star}${star}${star}${star}</span>
            <span>(332)</span>
          </div>
          <div class="ufs-recipe-hero__tags">
            <span class="ufs-recipe-hero__tag">Side dish</span>
            <span class="ufs-recipe-hero__tag">Bulk cooking</span>
            <span class="ufs-recipe-hero__tag">Gluten free</span>
          </div>
        </div>
        <div class="ufs-recipe-hero__author">
          <p class="ufs-recipe-hero__author-label">Created by:</p>
          <div class="ufs-recipe-hero__author-row">
            <div class="ufs-recipe-hero__author-avatar" style="background-image:url('handover/images/chef-profiles/philip-li.png')"></div>
            <div>
              <p class="ufs-recipe-hero__author-name">Chef Philip Li</p>
              <p class="ufs-recipe-hero__author-role">Plating &amp; Presentation Specialist</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ufs-recipe-hero__media">
      <div class="pb-img-slot" style="position:absolute;inset:0;" onclick="PB.replaceImage('${sec.id}','photo',this)">
        <img class="ufs-recipe-hero__photo" src="${photoSrc}" alt="" />
        ${watchHTML}
        <div class="pb-img-overlay">
          <div class="pb-img-overlay-icon">${uploadIcon}</div>
          <span class="pb-img-overlay-label">Replace image</span>
        </div>
      </div>
      <button class="ufs-tile__fav ufs-recipe-hero__fav" aria-label="Add to favourites" aria-pressed="false">
        <svg width="20" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </button>
    </div>
  </section>`;
};
