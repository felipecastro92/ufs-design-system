/* Breadcrumb — ported from handover/breadcrumb-spec.html. No real
   variant: desktop/mobile is handled purely by CSS, and the spec's
   "trail length" examples are a content fact (how many levels a given
   page actually has), not a visual theme toggle. */
Object.assign(PB.VARIANTS, { breadcrumb: [] });
Object.assign(PB.DEFAULT_VARIANT, { breadcrumb: 'default' });

PB._breadcrumb = function(variant, sec) {
  const chevron = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 2 8 6 4 10"/></svg>`;
  const homeIcon = `<svg class="ufs-breadcrumb__home-icon" viewBox="0 0 45 45" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M35.6281 15.9671L25.7007 7.26398C23.8164 5.57867 20.9666 5.57867 19.0823 7.26398L9.15489 15.9671C8.09173 16.9179 7.48897 18.2801 7.50015 19.7064V34.1674C7.50015 36.9088 9.72265 39.1311 12.464 39.1311H32.319C35.0603 39.1311 37.2827 36.9088 37.2827 34.1674V19.6899C37.2893 18.2693 36.6869 16.9141 35.6281 15.9671ZM19.0823 35.822V27.5491C19.0823 26.6353 19.8231 25.8945 20.7369 25.8945H24.046C24.9598 25.8945 25.7006 26.6353 25.7006 27.5491V35.822H19.0823ZM32.3189 35.822H29.0097V27.5491C29.0097 24.8077 26.7874 22.5854 24.046 22.5854H20.7369C17.9955 22.5854 15.7731 24.8077 15.7731 27.5491V35.822H12.464C11.5502 35.822 10.8094 35.0812 10.8094 34.1674V19.6899C10.81 19.2146 11.0149 18.7626 11.372 18.4489L21.2994 9.76241C21.924 9.21368 22.8588 9.21368 23.4835 9.76241L33.4109 18.4489C33.768 18.7626 33.9729 19.2146 33.9735 19.6899V34.1674C33.9735 35.0812 33.2327 35.822 32.3189 35.822Z"/></svg>`;

  return `<nav class="ufs-breadcrumb" aria-label="Breadcrumb">
    <ol class="ufs-breadcrumb__list">
      <li class="ufs-breadcrumb__item"><a href="#" class="ufs-breadcrumb__link" aria-label="Home">${homeIcon}<span class="ufs-breadcrumb__home-text">Home</span></a></li>
      <li class="ufs-breadcrumb__sep" aria-hidden="true">${chevron}</li>

      <li class="ufs-breadcrumb__item ufs-breadcrumb__mid"><a href="#" class="ufs-breadcrumb__link">Products</a></li>
      <li class="ufs-breadcrumb__sep ufs-breadcrumb__mid" aria-hidden="true">${chevron}</li>
      <li class="ufs-breadcrumb__item ufs-breadcrumb__mid"><a href="#" class="ufs-breadcrumb__link">Sauces &amp; Condiments</a></li>
      <li class="ufs-breadcrumb__sep ufs-breadcrumb__mid" aria-hidden="true">${chevron}</li>

      <li class="ufs-breadcrumb__item ufs-breadcrumb__collapsed">
        <button type="button" class="ufs-breadcrumb__ellipsis" aria-haspopup="true" aria-expanded="false" aria-label="Show hidden breadcrumb levels">&hellip;</button>
        <div class="ufs-breadcrumb__drop">
          <a href="#" class="ufs-breadcrumb__drop-item">Products</a>
          <a href="#" class="ufs-breadcrumb__drop-item">Sauces &amp; Condiments</a>
        </div>
      </li>
      <li class="ufs-breadcrumb__sep ufs-breadcrumb__collapsed" aria-hidden="true">${chevron}</li>

      <li class="ufs-breadcrumb__item is-current"><span class="ufs-breadcrumb__current" aria-current="page">Ketchup &amp; Tomato Sauces</span></li>
    </ol>
  </nav>`;
};
