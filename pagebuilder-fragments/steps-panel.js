/* ==========================================================================
   STEPS PANEL — ported from handover/steps-panel-spec.html.

   Single canonical layout — no variants registered, matching the task's
   guidance for a spec that documents only one example (plus a responsive
   resize and an RTL mirror, neither a marketer-facing toggle).

   Copy is the spec's own real demo content verbatim: the intro paragraph
   and all 3 numbered steps for "Meadowland Mash" (the same recipe the
   Ingredients Panel section documents).
========================================================================== */
(function () {
  function step(index, subtitle, items) {
    return '<li class="ufs-recipe-step">'
      + '<div class="ufs-recipe-step__index">' + index + '</div>'
      + '<div class="ufs-recipe-step__body">'
      + '<p class="ufs-recipe-step__subtitle">' + subtitle + '</p>'
      + '<ul class="ufs-recipe-step__list">' + items.map(function (li) { return '<li>' + li + '</li>'; }).join('') + '</ul>'
      + '</div></li>';
  }

  Object.assign(PB.VARIANTS, { 'steps-panel': [] });
  Object.assign(PB.DEFAULT_VARIANT, { 'steps-panel': 'default' });

  PB._stepsPanel = function (variant, sec) {
    var steps = [
      step(1, 'Cook the potatoes:', [
        'Peel and dice the potatoes into even 3cm chunks. Place in a large pot, cover with the water, add the salt and bring to the boil.',
        'Simmer for 15&ndash;18 minutes until fork-tender, then drain well and return to the pot over low heat for 1 minute to steam off excess moisture.',
      ]),
      step(2, 'Make the mash:', [
        'Add the MEADOWLAND Professional and warmed milk, then mash until smooth, or pass through a ricer for a bulk-service finish.',
        'Stir in the Knorr Professional Chicken Stock Granules, white pepper and nutmeg until fully combined.',
      ]),
      step(3, 'For serving:', [
        'Taste and adjust the seasoning, then finish with a generous scatter of chopped chives.',
        'Hold in a bain-marie at 63&deg;C or above until service, stirring occasionally to keep the texture smooth.',
      ]),
    ].join('');

    return '<div style="padding:var(--space-10) var(--space-6);background:var(--color-salt)">'
      + '<div class="ufs-recipe-prep">'
      + '<p class="ufs-recipe-prep__intro">A rich, silky mashed potato built for high-volume service &mdash; MEADOWLAND Professional keeps it glossy and stable under a bain-marie, while Knorr Professional Chicken Stock Granules rounds out the seasoning without extra prep. Scales cleanly from a la carte to full banquet covers.</p>'
      + '<div>'
      + '<h2 class="ufs-recipe-prep__title" style="margin-bottom:var(--space-8)">Preparation</h2>'
      + '<ol class="ufs-recipe-steps">' + steps + '</ol>'
      + '</div>'
      + '</div></div>';
  };
})();
