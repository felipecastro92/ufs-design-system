

    /* ================================================================
       FOOD COST CALCULATOR (v3)
       Ingredients are read from the recipe's own rows (name, base qty,
       unit), so the calculator always matches the page. Prices are per
       kg (g), per L (ml) or per piece (pc). UFS products come with an
       indicative price; everything else starts empty.
       Servings are shared with the page stepper (stepServings is wrapped
       below), so both always show the same number.
       No auto-save: prices, menu price, removed and added ingredients
       live in memory, so they survive closing and reopening the panel
       but not a page reload. "Save as PDF" downloads the calculation
       (jsPDF, loaded from cdnjs on first use).
    ================================================================ */
    var FCC_UFS_PRICES = {                       // indicative, € per kg
      'MEADOWLAND Professional': 4.2,
      'Knorr Professional Chicken Stock Granules': 18.9
    };
    var FCC_PER = { g: 'kg', ml: 'L', pc: 'pc' };
    var fcc = { items: [], state: null, pending: false, lastFocus: null, lib: null };

    function fccNum(v) {
      v = String(v == null ? '' : v).trim().replace(/[\s€]/g, '');
      if (!v) return null;
      if (v.indexOf(',') > -1) v = v.replace(/\./g, '').replace(',', '.');
      var n = parseFloat(v);
      return isFinite(n) && n >= 0 ? n : null;
    }
    function fccMoney(n) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
    function fccDec(n) { return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function fccQty(n, unit) { return n.toLocaleString('de-DE', { maximumFractionDigits: n >= 10 ? 0 : 1 }) + ' ' + unit; }
    function fccEsc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function fccServings() { return parseInt(document.getElementById('servings-value').textContent, 10) || 1; }
    function fccBase() { return parseInt(document.getElementById('servings-qty').dataset.baseServings, 10) || 1; }

    // Recipe rows → calculator items (once)
    function fccReadRecipe() {
      fcc.items = [];
      document.querySelectorAll('.ufs-recipe-ingredients .ufs-ingredient-row').forEach(function (row, i) {
        var q = row.querySelector('.ufs-ingredient-row__qty[data-base-qty]');
        if (!q) return;
        var nameEl = row.querySelector('.ufs-ingredient-row__trigger') || row.querySelector('.ufs-ingredient-row__name');
        var name = nameEl.textContent.trim();
        fcc.items.push({ id: 'r' + i, name: name, qty: parseFloat(q.dataset.baseQty), unit: q.dataset.unit, ufs: FCC_UFS_PRICES.hasOwnProperty(name) });
      });
    }
    function fccDefaults() {
      var prices = {};
      fcc.items.forEach(function (it) { if (it.ufs) prices[it.id] = FCC_UFS_PRICES[it.name]; });
      return { prices: prices, menu: null, removed: [], custom: [] };
    }
    function fccAll() { return fcc.items.concat(fcc.state.custom); }

    function fccCost(it, k) {
      var p = fcc.state.prices[it.id];
      if (p == null) return null;
      var q = it.qty * k;
      return it.unit === 'pc' ? q * p : q / 1000 * p;
    }

    function fccRowHTML(it) {
      var removed = fcc.state.removed.indexOf(it.id) > -1, p = fcc.state.prices[it.id];
      var name = '<span class="ufs-fcc__name' + (it.ufs ? ' is-ufs' : '') + '">' + fccEsc(it.name) + '</span>';
      if (removed) {
        return '<li class="ufs-fcc__row is-removed" data-id="' + it.id + '">' + name +
          '<button type="button" class="ufs-fcc__restore" onclick="fccRemove(\'' + it.id + '\', false)" aria-label="Add ' + fccEsc(it.name) + ' back to the calculation">Undo</button></li>';
      }
      return '<li class="ufs-fcc__row" data-id="' + it.id + '">' + name +
        '<button type="button" class="ufs-fcc__remove" onclick="fccRemove(\'' + it.id + '\', true)" aria-label="Remove ' + fccEsc(it.name) + ' from the calculation">' +
          '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg></button>' +
        '<span class="ufs-fcc__meta" id="fcc-meta-' + it.id + '"></span>' +
        '<span class="ufs-fcc__money ufs-fcc__price"><input class="fi-field ufs-fcc__input" type="text" inputmode="decimal" autocomplete="off" placeholder="Price" value="' + (p == null ? '' : fccDec(p)) + '" ' +
          'aria-label="Price of ' + fccEsc(it.name) + ' per ' + FCC_PER[it.unit] + '" data-id="' + it.id + '" oninput="fccPrice(this)" onblur="fccTidy(this)" />' +
          '<span class="ufs-fcc__unit">€/' + FCC_PER[it.unit] + '</span></span>' +
        '<span class="ufs-fcc__value" id="fcc-val-' + it.id + '"></span></li>';
    }
    function fccRenderList() {
      document.getElementById('fcc-list').innerHTML = fccAll().map(fccRowHTML).join('');
    }

    // One calculation, shared by the panel and the PDF
    var FCC_STATUS = { high: 'High', ok: 'On target', low: 'Low' };
    function fccPct(n) { return n.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' %'; }
    function fccCalc() {
      var serv = fccServings(), k = serv / fccBase(), total = 0, priced = 0, rows = [];
      fccAll().forEach(function (it) {
        if (fcc.state.removed.indexOf(it.id) > -1) return;
        var c = fccCost(it, k);
        rows.push({ it: it, qty: it.qty * k, cost: c, price: fcc.state.prices[it.id] });
        if (c != null) { priced++; total += c; }
      });
      var per = total / serv, menu = fcc.state.menu, pct = menu && total > 0 ? per / menu * 100 : null;
      var active = rows.length, missing = active - priced;
      return {
        serv: serv, rows: rows, total: total, per: per, menu: menu, pct: pct, priced: priced, active: active,
        kind: pct == null ? null : pct > 35 ? 'high' : pct >= 25 ? 'ok' : 'low',
        note: priced === active && menu ? '' : missing
          ? 'Add prices for ' + missing + ' more ingredient' + (missing === 1 ? '' : 's') + ' for a complete total.'
          : 'Add your menu price to see the food cost %. Target: 25–35 %.'
      };
    }

    // Numbers only — never re-renders the inputs, so typing is never interrupted
    function fccUpdate() {
      var d = fccCalc();
      document.getElementById('fcc-serv').textContent = d.serv;
      document.getElementById('fcc-serv-dec').disabled = d.serv <= 1;
      d.rows.forEach(function (r) {
        var c = r.cost, val = document.getElementById('fcc-val-' + r.it.id);
        document.getElementById('fcc-meta-' + r.it.id).textContent = fccQty(r.qty, r.it.unit) + (c != null && d.total > 0 ? ' · ' + fccPct(c / d.total * 100) : '');
        val.textContent = c == null ? '–' : fccMoney(c);
        val.classList.toggle('is-empty', c == null);
      });
      document.getElementById('fcc-total').textContent = fccMoney(d.total);
      document.getElementById('fcc-per').textContent = fccMoney(d.per);
      document.getElementById('fcc-pct').textContent = d.pct == null ? '–' : fccPct(d.pct);
      var st = document.getElementById('fcc-status');
      st.hidden = d.pct == null;
      if (d.kind) { st.className = 'ufs-fcc__status ufs-fcc__status--' + d.kind; st.textContent = FCC_STATUS[d.kind]; }
      document.getElementById('fcc-priced').textContent = d.priced + ' of ' + d.active + ' priced';
      var note = document.getElementById('fcc-note');
      note.hidden = !d.note; note.textContent = d.note;
    }

    function fccPrice(input) {
      fcc.state.prices[input.dataset.id] = fccNum(input.value);
      if (fcc.state.prices[input.dataset.id] == null) delete fcc.state.prices[input.dataset.id];
      fccUpdate();
    }
    function fccTidy(input) { var n = fccNum(input.value); input.value = n == null ? '' : fccDec(n); }
    function fccMenu(input) { fcc.state.menu = fccNum(input.value); fccUpdate(); }

    function fccRemove(id, on) {
      var r = fcc.state.removed, i = r.indexOf(id);
      if (on && i < 0) r.push(id);
      if (!on && i > -1) r.splice(i, 1);
      fccRenderList(); fccUpdate();
      // keep focus on the same row (Remove ⇄ Undo)
      var row = document.querySelector('.ufs-fcc__row[data-id="' + id + '"]');
      var btn = row && row.querySelector(on ? '.ufs-fcc__restore' : '.ufs-fcc__remove');
      if (btn) btn.focus();
    }

    function fccShowAdd(show) {
      var form = document.getElementById('fcc-add'), tog = document.getElementById('fcc-add-toggle');
      form.hidden = !show; tog.hidden = show;
      tog.setAttribute('aria-expanded', String(show));
      if (show) { document.getElementById('fcc-add-name').focus(); form.scrollIntoView({ block: 'nearest' }); }
      else { form.reset(); fccAddUnit(); tog.focus(); }
    }
    function fccAddUnit() { document.getElementById('fcc-add-price-unit').textContent = '€/' + FCC_PER[document.getElementById('fcc-add-unit').value]; }
    function fccAdd(e) {
      e.preventDefault();
      var name = document.getElementById('fcc-add-name').value.trim(), qty = fccNum(document.getElementById('fcc-add-qty').value);
      if (!name || !qty) { (name ? document.getElementById('fcc-add-qty') : document.getElementById('fcc-add-name')).focus(); return; }
      var id = 'c' + Date.now(), price = fccNum(document.getElementById('fcc-add-price').value);
      // stored at the recipe's base servings so it scales with the stepper like the rest
      fcc.state.custom.push({ id: id, name: name, qty: qty * fccBase() / fccServings(), unit: document.getElementById('fcc-add-unit').value, ufs: false });
      if (price != null) fcc.state.prices[id] = price;
      fccRenderList(); fccUpdate();
      fccShowAdd(false);
      document.getElementById('fcc-add-toggle').focus();
    }

    function fccReset() {
      fcc.state = fccDefaults();
      document.getElementById('fcc-menu').value = '';
      fccRenderList(); fccUpdate();
      document.getElementById('fcc-body').scrollTop = 0;
    }

    function openFcc(returnTo) {
      fcc.lastFocus = returnTo || document.activeElement;
      if (!fcc.state) fcc.state = fccDefaults();   // kept in memory until the page reloads
      document.getElementById('fcc-recipe').textContent = document.querySelector('.ufs-recipe-hero__title').textContent.trim();
      document.getElementById('fcc-pdf-error').textContent = '';
      document.getElementById('fcc-menu').value = fcc.state.menu == null ? '' : fccDec(fcc.state.menu);
      fccRenderList(); fccUpdate();
      document.getElementById('fcc-add').hidden = true; document.getElementById('fcc-add-toggle').hidden = false;
      var panel = document.getElementById('fcc-panel');
      panel.inert = false; panel.removeAttribute('aria-hidden');
      document.getElementById('fcc-backdrop').classList.add('is-open');
      panel.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      document.getElementById('fcc-body').scrollTop = 0;
      setTimeout(function () { document.getElementById('fcc-title').focus({ preventScroll: true }); }, 50);
    }
    function closeFcc() {
      var panel = document.getElementById('fcc-panel');
      if (!panel.classList.contains('is-open')) return;
      document.getElementById('fcc-backdrop').classList.remove('is-open');
      panel.classList.remove('is-open');
      panel.inert = true; panel.setAttribute('aria-hidden', 'true');   // closed: out of the tab order and the a11y tree
      document.body.style.overflow = '';
      if (fcc.lastFocus && fcc.lastFocus.focus) fcc.lastFocus.focus({ preventScroll: true });
    }

    /* ── Save as PDF ──
       Built from fccCalc(), so it always matches the panel. Removed
       ingredients are left out. Colours are the DS tokens as RGB
       (brand-dark, mushroom-900/-300, accessible-orange, orange-100,
       success-text, error). Plus Jakarta Sans (static TTFs, the DS font)
       is embedded so every viewer shows the same glyphs and spacing; if
       it can't be fetched the PDF falls back to Helvetica. */
    var FCC_JSPDF = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    var FCC_FONT = 'https://cdn.jsdelivr.net/gh/tokotype/PlusJakartaSans@2.7.1/fonts/ttf/PlusJakartaSans-';
    function fccScript() {
      if (window.jspdf) return Promise.resolve();
      return new Promise(function (ok, fail) {
        var s = document.createElement('script');
        s.src = FCC_JSPDF; s.crossOrigin = 'anonymous';
        s.onload = function () { window.jspdf ? ok() : fail(); };
        s.onerror = function () { s.remove(); fail(); };
        document.head.appendChild(s);
      });
    }
    function fccFont(weight) {
      return fetch(FCC_FONT + weight + '.ttf').then(function (r) { if (!r.ok) throw r.status; return r.arrayBuffer(); }).then(function (buf) {
        var bytes = new Uint8Array(buf), bin = '';
        for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return btoa(bin);
      });
    }
    // → { jsPDF, fonts: { Regular, Bold } | null }; cached after the first success
    function fccLib() {
      if (!fcc.lib) fcc.lib = Promise.all([
        fccScript(),
        Promise.all([fccFont('Regular'), fccFont('Bold')]).catch(function () { return null; })
      ]).then(function (r) {
        return { jsPDF: window.jspdf.jsPDF, fonts: r[1] && { Regular: r[1][0], Bold: r[1][1] } };
      }, function (e) { fcc.lib = null; throw e; });
      return fcc.lib;
    }
    function fccSlug(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'recipe'; }

    function fccPdfDoc(lib) {
      var d = fccCalc(), doc = new lib.jsPDF({ unit: 'mm', format: 'a4' }), family = 'helvetica';
      if (lib.fonts) {
        family = 'PlusJakartaSans';
        ['Regular', 'Bold'].forEach(function (w) {
          doc.addFileToVFS('PlusJakartaSans-' + w + '.ttf', lib.fonts[w]);
          doc.addFont('PlusJakartaSans-' + w + '.ttf', family, w === 'Bold' ? 'bold' : 'normal');
        });
      }
      var C = { ink: [34, 29, 55], grey: [91, 89, 90], line: [226, 223, 224], orange: [209, 73, 0], tint: [255, 245, 240], ok: [82, 119, 25], high: [200, 30, 30], low: [91, 89, 90] };
      var W = 210, H = 297, M = 18, R = W - M, y;
      var recipe = document.getElementById('fcc-recipe').textContent.trim();
      var date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      function ink(c) { doc.setTextColor(c[0], c[1], c[2]); }
      function font(style, size, c) { doc.setFont(family, style); doc.setFontSize(size); ink(c || C.ink); }
      function rule(yy) { doc.setDrawColor(C.line[0], C.line[1], C.line[2]); doc.setLineWidth(0.3); doc.line(M, yy, R, yy); }

      // Header
      doc.setFillColor(C.orange[0], C.orange[1], C.orange[2]); doc.rect(0, 0, W, 3, 'F');
      y = M + 2;
      font('bold', 9, C.orange); doc.text('FOOD COST CALCULATION', M, y);
      y += 8; font('bold', 18);
      var title = doc.splitTextToSize(recipe, R - M); doc.text(title, M, y); y += (title.length - 1) * 7.5 + 7;
      font('normal', 9, C.grey);
      doc.text([date, d.serv + ' servings', d.menu ? 'Menu price ' + fccMoney(d.menu) + ' per serving excl. VAT' : 'No menu price set'].join('   ·   '), M, y);

      // Totals
      y += 7;
      var bw = (R - M - 8) / 3, bh = d.kind ? 24 : 20;
      [['Total cost', fccMoney(d.total)], ['Per serving', fccMoney(d.per)], ['Food cost', d.pct == null ? '–' : fccPct(d.pct)]].forEach(function (b, i) {
        var x = M + i * (bw + 4);
        doc.setFillColor(C.tint[0], C.tint[1], C.tint[2]); doc.roundedRect(x, y, bw, bh, 2, 2, 'F');
        font('normal', 8.5, C.grey); doc.text(b[0], x + 5, y + 7);
        font('bold', 16); doc.text(b[1], x + 5, y + 15);
        if (i === 2 && d.kind) { font('bold', 8.5, C[d.kind]); doc.text(FCC_STATUS[d.kind] + '  (target 25–35 %)', x + 5, y + 20.5); }
      });
      y += bh + 6;
      if (d.note) { font('normal', 8.5, C.grey); doc.text(d.note, M, y); y += 6; }

      // Ingredients table
      var col = { qty: 112, price: 142, cost: 168, share: R };
      function head() {
        y += 4; font('bold', 8, C.grey);
        doc.text('INGREDIENT', M, y);
        doc.text('QUANTITY', col.qty, y, { align: 'right' });
        doc.text('PRICE', col.price, y, { align: 'right' });
        doc.text('COST', col.cost, y, { align: 'right' });
        doc.text('SHARE', col.share, y, { align: 'right' });
        y += 2.5; rule(y);
      }
      head();
      d.rows.forEach(function (r) {
        font(r.it.ufs ? 'bold' : 'normal', 9.5, r.it.ufs ? C.orange : C.ink);
        var name = doc.splitTextToSize(r.it.name, col.qty - M - 26), rh = name.length * 4.4 + 4.6;
        if (y + rh > H - 30) { doc.addPage(); y = M; head(); font(r.it.ufs ? 'bold' : 'normal', 9.5, r.it.ufs ? C.orange : C.ink); }
        var ty = y + 5.8;
        doc.text(name, M, ty);
        font('normal', 9.5);
        doc.text(fccQty(r.qty, r.it.unit), col.qty, ty, { align: 'right' });
        doc.text(r.price == null ? '–' : fccDec(r.price) + ' €/' + FCC_PER[r.it.unit], col.price, ty, { align: 'right' });
        font(r.cost == null ? 'normal' : 'bold', 9.5, r.cost == null ? C.grey : C.ink);
        doc.text(r.cost == null ? '–' : fccMoney(r.cost), col.cost, ty, { align: 'right' });
        font('normal', 9.5, C.grey);
        doc.text(r.cost != null && d.total > 0 ? fccPct(r.cost / d.total * 100) : '–', col.share, ty, { align: 'right' });
        y += rh; rule(y);
      });
      y += 5; font('bold', 9.5);
      doc.text('Total (' + d.priced + ' of ' + d.active + ' priced)', M, y);
      doc.text(fccMoney(d.total), col.cost, y, { align: 'right' });

      // Disclaimer + page footer
      var disc = doc.splitTextToSize(document.querySelector('.ufs-fcc__disclaimer').textContent.trim(), R - M);
      if (y + 10 + disc.length * 3.6 > H - 16) { doc.addPage(); y = M; }
      y += 10; font('normal', 7.5, C.grey); doc.text(disc, M, y);
      for (var p = 1, n = doc.getNumberOfPages(); p <= n; p++) {
        doc.setPage(p); font('normal', 7.5, C.grey);
        doc.text(recipe + ' · Food cost calculation · ' + date, M, H - 10, { maxWidth: R - M - 20 });
        doc.text(p + ' / ' + n, R, H - 10, { align: 'right' });
      }
      return { doc: doc, name: 'food-cost-' + fccSlug(recipe) + '.pdf' };
    }

    function fccPdf(btn) {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      var err = document.getElementById('fcc-pdf-error');
      err.textContent = '';
      btn.setAttribute('aria-disabled', 'true');   // not `disabled`: keeps keyboard focus on the button
      fccLib().then(function (lib) {
        var out = fccPdfDoc(lib);
        out.doc.save(out.name);
      }).catch(function (e) {
        if (e) console.error(e);
        err.textContent = 'The PDF couldn’t be created. Check your connection and try again.';
      }).then(function () { btn.removeAttribute('aria-disabled'); });
    }

    // Banner CTA: signed out → Sign in, then the calculator opens
    function fccEntry() {
      if (S.auth) { openFcc(); return; }
      openSignIn('food-cost');
      fcc.pending = true;            // after openSignIn(): it resets the flow
    }
    REG_CONTEXT_COPY['food-cost'] = {
      title: 'Sign up or Log in to calculate your food cost',
      desc: 'Save your recipe calculations as a PDF and use them on the go.',
      success: 'You’re in! Close this panel to open the Food cost calculator.'
    };
    // Deferred: regFinish() closes the sign-in panel before it calls setAuth(true)
    var fccCloseSignIn = closeSignIn;
    closeSignIn = function () {
      fccCloseSignIn();
      if (!fcc.pending) return;
      fcc.pending = false;
      setTimeout(function () { if (S.auth) openFcc(document.getElementById('fcc-open')); }, 0);
    };

    // Servings: one number for the page and the calculator
    var fccStepServings = stepServings;
    stepServings = function (delta) {
      fccStepServings(delta);
      if (document.getElementById('fcc-panel').classList.contains('is-open')) fccUpdate();
    };

    document.getElementById('fcc-menu').addEventListener('input', function () { fccMenu(this); });
    document.getElementById('fcc-menu').addEventListener('blur', function () { fccTidy(this); });
    // Modal: Esc closes; Tab / Shift+Tab wrap inside the open panel
    function fccTrapTab(e, panel) {
      var f = [].filter.call(panel.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]'), function (el) {
        return !el.disabled && el.offsetParent && !el.closest('[hidden], [inert]');
      });
      if (!f.length) { e.preventDefault(); return; }
      var first = f[0], last = f[f.length - 1], a = document.activeElement, inList = f.indexOf(a) > -1;
      if (e.shiftKey && (a === first || !inList)) { e.preventDefault(); last.focus(); }   // also from the focused title (tabindex -1)
      else if (!e.shiftKey && (a === last || !panel.contains(a))) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', function (e) {
      var panel = document.getElementById('fcc-panel');
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeFcc();
      else if (e.key === 'Tab') fccTrapTab(e, panel);
    });
    fccReadRecipe();
