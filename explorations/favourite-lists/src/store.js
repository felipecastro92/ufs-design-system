    /* ================================================================
       FAVOURITE LISTS STORE — one store for the webshop catalog (the
       heart + Favourite Lists panel) and My Favourites → Order Lists.
       Both pages read and write localStorage 'ufs-webshop-lists', so a
       list created or a product hearted in the catalog is in Order Lists,
       and a product removed there is no longer hearted in the catalog.
       Storage can be blocked (private mode) or switched off
       (FAV_STORE_MEMORY = true, the spec page): the store then lives in
       memory for the page.

       Shape (v: 1):
         lists:    [{ id, name, created (ISO), items: [{ id, at (ms) }] }]
                   panel order = array order; Default list is always first
         products: { productId: { name, cat, img, price, rating } }
                   a snapshot, so Order Lists can render without the catalog
         last:     id of the list the product was last added to (panel)
    ================================================================ */
    var FAV_STORE_KEY = 'ufs-webshop-lists';
    var FAV_DEFAULT_ID = 'default';
    var FAV_SEED_PRODUCTS = {
      granules:  { name: 'Knorr Professional Tomato Pronto - 2 Kg', cat: 'Sauces', img: 'catalog/knorr/tomato-pronto-2kg.jpg', price: 18.90, rating: 332 },
      demiglace: { name: 'Knorr Professional Mash Flakes - 2 Kg', cat: 'Sides', img: 'catalog/knorr/mash-flakes-2kg.jpg', price: 24.90, rating: 122 },
      mayo:      { name: 'Knorr Aromat Original 1 Kg', cat: 'Seasonings', img: 'catalog/knorr/aromat-original-1kg.jpg', price: 32.40, rating: 87 },
      garlic:    { name: 'Knorr Professional Brown Onion Soup - 1.6 Kg', cat: 'Soups', img: 'catalog/knorr/brown-onion-soup-1-6kg.jpg', price: 12.30, rating: 45 },
      roux:      { name: 'Knorr Professional Chicken Stock Granules 1 Kg', cat: 'Stocks', img: 'catalog/knorr/chicken-stock-granules-1kg.jpg', price: 15.60, rating: 29 },
      tomato:    { name: 'Knorr Professional Hollandaise Sauce - 1 L', cat: 'Sauces', img: 'catalog/knorr/hollandaise-sauce-1l.jpg', price: 9.80, rating: 210 },
      chicken:   { name: 'Knorr Professional Chicken Stock Paste 1 kg', cat: 'Stocks', img: 'tiles/packshot.webp', price: 22.60, rating: 154 },
      veg:       { name: 'Knorr Professional Vegetable Bouillon 1 kg', cat: 'Stocks', img: 'product-detail/product-hero/product-2.png', price: 14.20, rating: 71 },
      curry:     { name: 'Knorr Professional Korma Sauce 2.4 kg', cat: 'Sauces', img: 'tiles/packshot.webp', price: 29.50, rating: 57 }
    };
    // First visit only: Default list + the two lists from the v1 Order Lists design
    function favSeed() {
      var now = Date.now(), day = 864e5;
      function items(ids, from) { return ids.map(function (id, i) { return { id: id, at: from + i * 60000 }; }); }
      return {
        v: 1,
        lists: [
          { id: FAV_DEFAULT_ID, name: 'Default list', created: new Date(now - 30 * day).toISOString(), items: items(['tomato', 'granules'], now - 2 * day) },
          { id: 'weekly-essentials', name: 'Weekly Essentials', created: '2026-06-10T09:00:00.000Z', items: items(['veg', 'chicken', 'roux'], Date.parse('2026-06-10T09:00:00Z')) },
          { id: 'event-catering-kit', name: 'Event Catering Kit', created: '2026-05-01T09:00:00.000Z', items: items(['granules', 'demiglace', 'mayo', 'garlic', 'curry'], Date.parse('2026-05-01T09:00:00Z')) }
        ],
        products: JSON.parse(JSON.stringify(FAV_SEED_PRODUCTS)),
        last: FAV_DEFAULT_ID
      };
    }
    function favStoreRead() {
      if (window.FAV_STORE_MEMORY) return null;
      try { var v = JSON.parse(localStorage.getItem(FAV_STORE_KEY)); return v && v.v === 1 && v.lists && v.lists.length ? v : null; } catch (e) { return null; }
    }
    var favStore = favStoreRead() || favSeed();
    function favStoreSave() {
      // Drop snapshots no list uses any more
      var used = {};
      favStore.lists.forEach(function (l) { l.items.forEach(function (it) { used[it.id] = 1; }); });
      Object.keys(favStore.products).forEach(function (id) { if (!used[id]) delete favStore.products[id]; });
      if (window.FAV_STORE_MEMORY) return;
      try { localStorage.setItem(FAV_STORE_KEY, JSON.stringify(favStore)); } catch (e) {}
    }
    favStoreSave();   // first visit: write the seed, so both pages start from the same lists

    // Another tab (e.g. the catalog next to Order Lists) changed the lists
    window.addEventListener('storage', function (e) {
      if (e.key !== FAV_STORE_KEY) return;
      favStore = favStoreRead() || favSeed();
      if (typeof favOnStoreChange === 'function') favOnStoreChange();
    });

    function favList(id) { return favStore.lists.filter(function (l) { return l.id === id; })[0] || null; }
    function favHas(list, pid) { return list.items.some(function (it) { return it.id === pid; }); }
    // Ids of the lists a product is in, in panel order
    function favListsOf(pid) { return favStore.lists.filter(function (l) { return favHas(l, pid); }).map(function (l) { return l.id; }); }
    function favAddTo(listId, pid, snapshot) {
      var l = favList(listId);
      if (!l || favHas(l, pid)) return;
      if (snapshot) favStore.products[pid] = snapshot;
      l.items.push({ id: pid, at: Date.now() });
      favStore.last = listId;
    }
    function favRemoveFrom(listId, pid) {
      var l = favList(listId);
      if (l) l.items = l.items.filter(function (it) { return it.id !== pid; });
    }
    // Where a product sits in every list, so Undo puts it back exactly
    function favTake(pid, onlyListId) {
      var taken = [];
      favStore.lists.forEach(function (l) {
        if (onlyListId && l.id !== onlyListId) return;
        l.items.forEach(function (it, i) { if (it.id === pid) taken.push({ list: l.id, index: i, item: it }); });
      });
      taken.forEach(function (t) { favRemoveFrom(t.list, pid); });
      return { pid: pid, product: favStore.products[pid], taken: taken };
    }
    function favPutBack(snap) {
      if (snap.product) favStore.products[snap.pid] = snap.product;
      snap.taken.forEach(function (t) {
        var l = favList(t.list);
        if (l && !favHas(l, snap.pid)) l.items.splice(Math.min(t.index, l.items.length), 0, t.item);
      });
    }
    function favNameTaken(name) {
      return favStore.lists.some(function (l) { return l.name.toLowerCase() === name.toLowerCase(); });
    }
    function favCreate(name) {
      var id = 'list-' + Date.now().toString(36);
      favStore.lists.push({ id: id, name: name, created: new Date().toISOString(), items: [] });
      return id;
    }
    // Order Lists deep link: the list, or the Lists overview when there's none
    var FAV_PAGE = 'template-profile-favourites.html';
    function favLink(listId) { return FAV_PAGE + '#order-lists' + (listId && favList(listId) ? '/' + listId : ''); }
    function favMoney(n) { return '€' + n.toFixed(2); }   // same format as the catalog
