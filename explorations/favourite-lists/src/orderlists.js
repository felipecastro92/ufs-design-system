    /* ================================================================
       ORDER LISTS (v3) — My Favourites → Order Lists, rendered from the
       shared lists store (FAVOURITE LISTS STORE above), so it shows what
       was saved with the heart in the webshop catalog.
         All    every product in any list, newest first
         Lists  one card per list (newest first); a card opens the list
         List   back link, name, Order all bar, the list's products
       A heart here removes: in All from every list, in a list from that
       list. A toast offers Undo. Deep link: #order-lists opens the Lists
       view, #order-lists/{listId} that list (the catalog panel's
       "Go to Shopping List"); an unknown id falls back to Lists.
    ================================================================ */
    var OL_IMG = '../images/';
    var OL_STAR = '<svg viewBox="0 0 20 20"><path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.8L10 14.6l-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.7z"/></svg>';
    var OL_HEART = '<svg width="20" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
    var OL_CART = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
    var OL_BACK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>';
    var OL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function olEsc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function olAttr(s) { return olEsc(s).replace(/"/g, '&quot;'); }
    function olPlural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
    function olDate(iso) { var d = new Date(iso); return ('0' + d.getDate()).slice(-2) + ' ' + OL_MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
    function olTotal(items) { return items.reduce(function (s, it) { var p = favStore.products[it.id]; return s + (p ? p.price : 0); }, 0); }
    function olNewest(items) { return items.slice().sort(function (a, b) { return b.at - a.at; }); }
    function olOpenId() {   // the list whose detail is showing, or null
      var d = document.querySelector('#ol-details .pg-fav-sublist-detail:not([hidden])');
      return d ? d.dataset.list : null;
    }

    function olTile(pid, listId) {
      var p = favStore.products[pid];
      if (!p) return '';
      var from = listId ? 'from ' + favList(listId).name : 'from your lists';
      return '<div class="ufs-tile" data-pid="' + pid + '">' +
        '<div class="ufs-tile__image">' +
          '<div class="ufs-tile__image-media" style="background-image:url(\'' + OL_IMG + p.img + '\')"></div>' +
          '<button class="ufs-tile__fav is-active" aria-pressed="true" aria-label="Remove ' + olAttr(p.name) + ' ' + olAttr(from) + '" onclick="olRemove(event, \'' + pid + '\'' + (listId ? ', \'' + listId + '\'' : '') + ')">' + OL_HEART + '</button>' +
        '</div>' +
        '<div class="ufs-tile__content">' +
        '<div class="ufs-tile__body">' +
          '<div class="ufs-tile__eyebrow">' + olEsc(p.cat) + '</div>' +
          '<h3 class="ufs-tile__title">' + olEsc(p.name) + '</h3>' +
          '<div class="ufs-tile__rating"><span class="ufs-tile__stars">' + OL_STAR + OL_STAR + OL_STAR + OL_STAR + OL_STAR + '</span><span>(' + p.rating + ')</span></div>' +
        '</div>' +
        '<div class="ufs-tile__cta"><button class="btn btn-primary">Buy it now</button></div>' +
        '</div>' +
      '</div>';
    }
    // Up to 4 thumbnails; more products: the 4 newest + "+n" (v1 rule)
    function olThumbs(items) {
      if (!items.length) return '<div class="ufs-ol-card-empty">No products yet</div>';
      var show = items.slice(0, 4);
      return '<div class="pg-fav-sublist-thumbs">' + show.map(function (it) {
        var p = favStore.products[it.id];
        return '<div class="pg-fav-sublist-thumb pg-fav-sublist-thumb--product"><img src="' + OL_IMG + (p ? p.img : '') + '" alt="" /></div>';
      }).join('') + (items.length > 4 ? '<div class="pg-fav-sublist-thumb-overflow">+' + (items.length - 4) + '</div>' : '') + '</div>';
    }
    function olCard(l) {
      var items = olNewest(l.items);
      return '<div class="pg-fav-sublist-card" role="button" tabindex="0" data-list="products-list-' + l.id + '" onclick="openFavSublist(\'products-list-' + l.id + '\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openFavSublist(\'products-list-' + l.id + '\');}">' +
        '<div class="pg-fav-sublist-card-top">' +
          '<div class="pg-fav-sublist-card-name">' + olEsc(l.name) + '</div>' +
          '<div class="pg-fav-sublist-card-date">Created on ' + olDate(l.created) + '</div>' +
          '<div class="pg-fav-sublist-card-meta">' + olPlural(items.length, 'product', 'products') + (items.length ? ' &middot; ' + favMoney(olTotal(items)) : '') + '</div>' +
        '</div>' +
        olThumbs(items) +
        '<span class="btn btn-secondary btn-full">View list</span>' +
      '</div>';
    }
    function olDetail(l) {
      var items = olNewest(l.items), n = items.length;
      return '<div id="products-list-' + l.id + '" class="pg-fav-sublist-detail" data-list="' + l.id + '" hidden>' +
        '<div class="pg-fav-sublist-back-row">' +
          '<button class="pg-fav-sublist-back-btn" onclick="closeFavSublist(\'products\')">' + OL_BACK + 'My lists</button>' +
          '<div class="pg-fav-sublist-title-row">' +
            '<h3 class="pg-fav-sublist-detail-name" tabindex="-1">' + olEsc(l.name) + '</h3>' +
            '<span class="pg-fav-sec-count">' + olPlural(n, 'product', 'products') + '</span>' +
          '</div>' +
        '</div>' +
        (n ? '<div class="pg-fav-sublist-order-all-bar">' +
              '<div class="pg-fav-sublist-order-all-info"><strong>' + olPlural(n, 'product', 'products') + '</strong> at qty 1 each &middot; ' + favMoney(olTotal(items)) + ' total</div>' +
              '<button class="btn btn-primary btn-sm">' + OL_CART + 'Order all</button>' +
            '</div>' +
            '<div class="pg-content-tiles ufs-catalog-grid">' + items.map(function (it) { return olTile(it.id, l.id); }).join('') + '</div>'
          : '<div class="ufs-ol-empty">' +
              '<p class="ufs-ol-empty__title">This list is empty</p>' +
              '<p class="ufs-ol-empty__text">Products you save to ' + olEsc(l.name) + ' in the shop show up here.</p>' +
              '<a class="btn btn-secondary btn-sm" href="template-products-catalog-webshop.html">Browse products</a>' +
            '</div>') +
      '</div>';
    }
    // Rebuilt children keep the page's sort dropdown working: data-orig-i is the
    // "Most recent" order (its handler sorts back by it), A–Z is re-applied here
    function olSorted(container) {
      var kids = [].slice.call(container.children);
      kids.forEach(function (el, i) { el.dataset.origI = i; });
      container.dataset.origOrder = kids.map(function (el, i) { return i; }).join(',');
      var opt = container.parentNode.querySelector('.pg-fav-sort-active');   // this view's own Sort
      if (opt && opt.dataset.sort === 'alpha') {
        kids.sort(function (a, b) {
          var ta = (a.querySelector('.ufs-tile__title, .pg-fav-sublist-card-name') || {}).textContent || '';
          var tb = (b.querySelector('.ufs-tile__title, .pg-fav-sublist-card-name') || {}).textContent || '';
          return ta.trim().localeCompare(tb.trim());
        }).forEach(function (el) { container.appendChild(el); });
      }
    }

    function olRender() {
      var open = olOpenId();
      // All: each product once, by when it was last saved to any list
      var latest = {};
      favStore.lists.forEach(function (l) { l.items.forEach(function (it) { if (!latest[it.id] || it.at > latest[it.id].at) latest[it.id] = it; }); });
      var all = olNewest(Object.keys(latest).map(function (id) { return latest[id]; }));
      var lists = favStore.lists.slice().sort(function (a, b) { return Date.parse(b.created) - Date.parse(a.created); });

      document.getElementById('ol-count-products').textContent = olPlural(all.length, 'product', 'products');
      document.getElementById('ol-count-lists').textContent = olPlural(lists.length, 'list', 'lists');
      var grid = document.getElementById('ol-all-grid');
      grid.innerHTML = all.map(function (it) { return olTile(it.id); }).join('');
      grid.hidden = !all.length;
      document.getElementById('ol-all-empty').hidden = !!all.length;
      olSorted(grid);
      var cards = document.getElementById('ol-lists-grid');
      cards.innerHTML = lists.map(olCard).join('');
      olSorted(cards);
      document.getElementById('ol-details').innerHTML = lists.map(olDetail).join('');
      if (open && favList(open)) olShowList(open, false);
      else if (open) closeFavSublist('products');
    }

    function olShowList(listId, focus) {
      document.getElementById('products-sublists-grid').hidden = true;
      document.querySelectorAll('#ol-details .pg-fav-sublist-detail').forEach(function (d) { d.hidden = d.dataset.list !== listId; });
      if (focus) { var h = document.querySelector('#products-list-' + listId + ' .pg-fav-sublist-detail-name'); if (h) h.focus({ preventScroll: true }); }
    }

    // Keep the URL in step, so a reload (or a shared link) lands on the same view
    var olQuiet = false;   // true while the deep link itself switches views
    function olSetHash(h) { if (!olQuiet && location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search); }
    var olOpenSublist = openFavSublist, olCloseSublist = closeFavSublist, olSetView = setFavView;
    openFavSublist = function (id) {
      if (id.indexOf('products-list-') !== 0) return olOpenSublist(id);
      olShowList(id.slice(14), true);
      olSetHash('#order-lists/' + id.slice(14));
    };
    closeFavSublist = function (panel) {
      var wasOpen = panel === 'products' && olOpenId();
      olCloseSublist(panel);
      if (panel === 'products') {
        document.querySelectorAll('#ol-details .pg-fav-sublist-detail').forEach(function (d) { d.hidden = true; });
        if (wasOpen && !olQuiet) {
          olSetHash('#order-lists');
          var card = document.querySelector('#ol-lists-grid [data-list="products-list-' + wasOpen + '"]');
          if (card) card.focus({ preventScroll: true });
        }
      }
    };
    setFavView = function (panel, view) {
      olSetView(panel, view);
      if (panel === 'products' && /^#order-lists/.test(location.hash)) olSetHash(view === 'lists' ? '#order-lists' : '');
    };

    function olRemove(event, pid, listId) {
      event.stopPropagation();
      var name = (favStore.products[pid] || {}).name || 'Product';
      var snap = favTake(pid, listId);
      favStoreSave();
      olRender();
      olToast(listId ? 'Removed from ' + favList(listId).name : 'Removed from your lists', function () {
        favPutBack(snap); favStoreSave(); olRender();
      });
      // Focus stays in the grid: the next tile's heart, or the view heading
      var root = listId ? document.getElementById('products-list-' + listId) : document.getElementById('products-view-all');
      var next = root && root.querySelector('.ufs-tile__fav');
      if (next) next.focus({ preventScroll: true });
      else if (listId) { var h = root.querySelector('.pg-fav-sublist-detail-name'); if (h) h.focus({ preventScroll: true }); }
    }

    /* Toast + Undo — same look and timing as the webshop toasts
       (pack-size-picker spec): newest at the bottom, max 2, 3.2s */
    var olReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function olToast(msg, undo) {
      var st = document.getElementById('ol-toast-stack'), el = document.createElement('div');
      el.className = 'x-toast-item';
      el.innerHTML = '<span></span><button type="button">Undo</button>';
      el.firstChild.textContent = msg;
      el.lastChild.onclick = function () { undo(); olDismiss(el); };
      st.appendChild(el);
      var live = [].filter.call(st.children, function (c) { return !c.classList.contains('is-leaving'); });
      while (live.length > 2) olDismiss(live.shift());
      if (!olReduceMotion.matches) {
        var h = el.offsetHeight; el.style.overflow = 'hidden';
        el.animate([{ height: 0, opacity: 0, marginTop: '-8px', transform: 'translateY(8px)' }, { height: h + 'px', opacity: 1, marginTop: '0px', transform: 'none' }],
          { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }).onfinish = function () { el.style.overflow = ''; };
      }
      el._timer = setTimeout(function () { olDismiss(el); }, 3200);
    }
    function olDismiss(el) {
      if (el.classList.contains('is-leaving')) return;
      el.classList.add('is-leaving'); clearTimeout(el._timer);
      if (olReduceMotion.matches) { el.remove(); return; }
      var h = el.offsetHeight; el.style.overflow = 'hidden';
      el.animate([{ height: h + 'px', opacity: 1, marginBottom: '0px' }, { height: 0, opacity: 0, marginBottom: '-8px' }],
        { duration: 200, easing: 'ease-in', fill: 'forwards' }).onfinish = function () { el.remove(); };
    }

    // #order-lists[/listId] → Order Lists tab (accordion section on mobile), Lists view, that list
    function olDeepLink() {
      var m = /^#order-lists(?:\/([\w-]+))?$/.exec(location.hash);
      if (!m) return;
      setFavPanel('products');
      document.querySelectorAll('.pg-fav-section').forEach(function (sec) {
        var open = sec.id === 'panel-products';
        sec.classList.toggle('pg-fav-open', open);
        var hdr = sec.querySelector('.pg-fav-sec-hdr');
        if (hdr) hdr.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      olQuiet = true;
      olSetView('products', 'lists');
      olQuiet = false;
      if (m[1] && favList(m[1])) olShowList(m[1], false);
      else {
        olCloseSublist('products');
        document.querySelectorAll('#ol-details .pg-fav-sublist-detail').forEach(function (d) { d.hidden = true; });
        if (m[1]) olSetHash('#order-lists');   // the list is gone: show them all
      }
      olScrollToSection();
    }
    // Mobile: Order Lists is an accordion section further down the page — bring
    // it under the sticky header, and keep it there while the layout above
    // settles (fonts, images, carousels) — for 1.5s or until the chef scrolls
    // Height of the sticky mobile header + search row (whichever are showing)
    function olStickyTop() {
      return ['.ufs-mnav', '.ufs-msearch-bar'].reduce(function (h, sel) { var el = document.querySelector(sel); return h + (el && el.offsetParent !== null ? el.offsetHeight : 0); }, 0);
    }
    function olScrollToSection() {
      if (window.innerWidth > 768) return;
      var sec = document.getElementById('panel-products');
      if (!sec || !window.ResizeObserver) return;
      var stop = false;
      function align() {
        if (stop) return;
        var off = olStickyTop() + 16;
        window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - off, behavior: 'instant' });
      }
      function end() { stop = true; ro.disconnect(); ['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.removeEventListener(t, end); }); }
      var ro = new ResizeObserver(align);
      ro.observe(document.body);
      ['wheel', 'touchstart', 'keydown'].forEach(function (t) { window.addEventListener(t, end, { passive: true }); });
      setTimeout(end, 1500);
      align();
    }

    // The catalog (another tab) changed the lists
    function favOnStoreChange() { olRender(); }

    olRender();
    olDeepLink();
    window.addEventListener('hashchange', olDeepLink);
