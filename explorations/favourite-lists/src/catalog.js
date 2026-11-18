    /* ================================================================
       FAVOURITE LISTS — product tile hearts on this page.
       Signed out: the heart opens Sign In ('favourite' context); once
       signed in the product goes into Default list and the lists panel
       opens. Signed in: an inactive heart adds to Default list + opens
       the panel; an active heart removes the product from every list
       straight away and shows a toast with Undo (no panel).
       Lists live in the shared store above (v3): they're the lists in
       My Favourites → Order Lists, and "Go to Shopping List" opens the
       list the product was last added to there.
    ================================================================ */
    // Product wording for the shared sign-in block's 'favourite' context
    // (its default copy talks about recipes)
    REG_CONTEXT_COPY.favourite = {
      title: 'Sign up or Log in to save products to your lists.',
      desc: 'Join over 1 million chefs already getting inspired.',
      success: 'Tap the heart to save products — your lists will be waiting in your profile.'
    };
    var FAV_HEART_PATH = 'M8.3791 3.6C9.60313 3.60007 10.7701 4.0008 11.7336 4.74062L11.923 4.89297L12.0031 4.96328L12.0822 4.89492C12.9523 4.16561 14.0086 3.7266 15.132 3.62832L15.3742 3.6127L15.6174 3.60781C17.1105 3.60781 18.5128 4.20128 19.5676 5.27969C20.6201 6.35594 21.2003 7.78851 21.2004 9.31094C21.1967 10.7454 20.6784 12.1019 19.7355 13.1537L19.5646 13.3363L13.1154 19.9311C12.8248 20.2282 12.4197 20.3998 12.007 20.3998C11.6368 20.3998 11.2817 20.2671 11.0012 20.0268L10.8996 19.9311L4.43574 13.3256C3.38221 12.2483 2.80003 10.8156 2.8 9.29922C2.8 7.77774 3.37971 6.34478 4.43281 5.26797C5.48799 4.19314 6.89044 3.6 8.3791 3.6Z';
    var favPanelFor = null;       // product id the panel is showing
    var favPanelList = null;      // list "Go to Shopping List" opens
    var favPendingId = null;      // product id waiting on sign-in

    function favIn(pid) { return favListsOf(pid); }
    function favSnapshot(pid) {
      var p = byId(pid);
      return p ? { name: p.name, cat: p.cat, img: p.img, price: p.price, rating: p.rating } : favStore.products[pid];
    }
    // The product is in exactly these lists afterwards
    function favSet(pid, ids) {
      favStore.lists.forEach(function(l) {
        var want = ids.indexOf(l.id) !== -1;
        if (want && !favHas(l, pid)) favAddTo(l.id, pid, favSnapshot(pid));
        if (!want && favHas(l, pid)) favRemoveFrom(l.id, pid);
      });
      favStoreSave();
      favChanged(pid);
    }
    function favChanged(pid) {
      favs[pid] = favIn(pid).length > 0;
      favSyncTiles(pid);
    }
    // Every tile heart for this product (a product can appear in more than
    // one tile, and tiles re-render on concept switches)
    function favSyncTiles(pid) {
      var on = favIn(pid).length > 0;
      document.querySelectorAll('.ufs-tile__fav[data-fav-id="' + pid + '"]').forEach(function(btn) {
        if (btn.classList.contains('is-active') === on) return;
        if (on) toggleTileFav(btn);   // plays the pop/splash animation
        else {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', 'Add to favourites');
        }
      });
    }
    // Order Lists changed in another tab: hearts follow, the open panel re-renders
    function favOnStoreChange() {
      PRODUCTS.forEach(function(p) { favChanged(p.id); });
      if (favPanelFor) {
        if (favPanelList && !favList(favPanelList)) favPanelList = null;
        favRenderLists();
      }
    }

    function favTileClick(btn, event, pid) {
      if (event) event.stopPropagation();
      if (!S.auth) {
        openSignIn('favourite');
        // after openSignIn() — its regResetFlow() clears the pending button
        regPendingFavBtn = btn;
        favPendingId = pid;
        return;
      }
      if (favIn(pid).length) favRemoveAll(pid);
      else favAddDefault(pid);
    }
    function favAddDefault(pid) {
      favSet(pid, [FAV_DEFAULT_ID]);
      openFavListPanel(pid, FAV_DEFAULT_ID);
    }
    function favRemoveAll(pid) {
      var snap = favTake(pid);
      favStoreSave();
      favChanged(pid);
      toastAction('Removed from your lists', 'Undo', function() { favPutBack(snap); favStoreSave(); favChanged(pid); });
    }

    /* Completes the favourite that triggered sign-in. Overrides the shared
       sign-in block's version (declared earlier in this script — the later
       declaration wins) because here a favourite means "add to Default list
       and open the lists panel", not just toggling the heart. */
    function regCompletePendingFavourite() {
      var pid = favPendingId;
      regPendingFavBtn = null;
      favPendingId = null;
      if (pid && !favIn(pid).length) favAddDefault(pid);
    }

    /* --- Panel --- */
    function favEsc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
    function favRenderLists(newId) {
      var inList = favIn(favPanelFor);
      document.getElementById('fav-list-rows').innerHTML = favStore.lists.map(function(l) {
        var on = inList.indexOf(l.id) !== -1;
        return '<button type="button" class="ufs-favlist__row' + (l.id === newId ? ' is-new' : '') + '" aria-pressed="' + on + '" onclick="favToggleList(\'' + l.id + '\')">' +
          '<span class="ufs-favlist__name">' + favEsc(l.name) + '</span>' +
          '<svg class="ufs-favlist__heart" viewBox="0 0 24 24" aria-hidden="true"><path d="' + FAV_HEART_PATH + '"/></svg>' +
        '</button>';
      }).join('');
      document.getElementById('fav-list-go').href = favLink(favPanelList);
    }
    function favToggleList(listId) {
      var ids = favIn(favPanelFor).slice(), i = ids.indexOf(listId);
      var name = favList(listId).name;
      if (i === -1) ids.push(listId); else ids.splice(i, 1);
      favSet(favPanelFor, ids);
      // Go to Shopping List follows the list just added to; removing it
      // falls back to the newest list the product is still in
      if (i === -1) favPanelList = listId;
      else if (favPanelList === listId) favPanelList = favNewestListOf(favPanelFor);
      favRenderLists();
      document.getElementById('fav-list-status').textContent = (i === -1 ? 'Added to ' : 'Removed from ') + name;
    }
    function favNewestListOf(pid) {
      var best = null, at = -1;
      favStore.lists.forEach(function(l) { l.items.forEach(function(it) { if (it.id === pid && it.at > at) { at = it.at; best = l.id; } }); });
      return best;
    }
    function favShowCreate(show) {
      document.getElementById('fav-list-create').hidden = show;
      document.getElementById('fav-list-form').hidden = !show;
      document.getElementById('fav-list-ft').hidden = show;
      document.getElementById('fav-list-ft-create').hidden = !show;
      var input = document.getElementById('fav-list-name');
      input.value = '';
      favNameInput();
      if (show) input.focus();
    }
    function favNameInput() {
      var input = document.getElementById('fav-list-name');
      document.getElementById('fav-list-add').disabled = !input.value.trim();
      document.getElementById('fav-list-error').textContent = '';
      input.classList.remove('is-invalid');
    }
    function favCreateList(event) {
      event.preventDefault();
      var input = document.getElementById('fav-list-name');
      var name = input.value.trim();
      if (!name) return;
      if (favNameTaken(name)) {
        document.getElementById('fav-list-error').textContent = 'You already have a list with this name';
        input.classList.add('is-invalid');
        return;
      }
      var id = favCreate(name);
      favSet(favPanelFor, favIn(favPanelFor).concat(id));
      favPanelList = id;
      favShowCreate(false);
      favRenderLists(id);
      document.getElementById('fav-list-status').textContent = 'Created ' + name + ' and added the product to it';
    }
    function openFavListPanel(pid, listId) {
      favPanelFor = pid;
      favPanelList = listId || favNewestListOf(pid);
      favShowCreate(false);
      favRenderLists();
      document.getElementById('fav-list-status').textContent = '';
      document.getElementById('fav-list-backdrop').classList.add('is-open');
      document.getElementById('fav-list-panel').classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeFavListPanel() {
      var panel = document.getElementById('fav-list-panel');
      if (!panel.classList.contains('is-open')) return;
      document.getElementById('fav-list-backdrop').classList.remove('is-open');
      panel.classList.remove('is-open');
      document.body.style.overflow = '';
      favPanelFor = null;
      favPanelList = null;
    }
