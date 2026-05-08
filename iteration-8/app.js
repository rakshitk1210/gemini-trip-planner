(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     STATIC DATA — POI catalog by category
     Coordinates fall inside the default selection
     bounds so markers always render meaningfully.
     ───────────────────────────────────────────── */

  const POI_CATALOG = {
    restaurants: [
      { id: 'r1', name: "Ludwig's Fish and Chips",      rating: 4.7, reviews: 231, lat: 47.6510, lng: -122.3500, photo: 'assets/food-1.png' },
      { id: 'r2', name: "Tito's",                       rating: 4.7, reviews: 231, lat: 47.6315, lng: -122.3120, photo: 'https://picsum.photos/seed/titos/300/220' },
      { id: 'r3', name: "Leon's",                       rating: 4.7, reviews: 231, lat: 47.6720, lng: -122.3870, photo: 'https://picsum.photos/seed/leons/300/220' },
      { id: 'r4', name: "Hakka House",                  rating: 4.6, reviews: 412, lat: 47.6105, lng: -122.3406, photo: 'https://picsum.photos/seed/hakka/300/220' },
      { id: 'r5', name: "The Grilled Oak",              rating: 4.8, reviews: 154, lat: 47.6203, lng: -122.3221, photo: 'https://picsum.photos/seed/oak/300/220' }
    ],
    hotels: [
      { id: 'h1', name: "The Edgewater Inn",            rating: 4.5, reviews: 821, lat: 47.6119, lng: -122.3508, photo: 'https://picsum.photos/seed/edgewater/300/220' },
      { id: 'h2', name: "Pike Place Suites",            rating: 4.6, reviews: 612, lat: 47.6090, lng: -122.3400, photo: 'https://picsum.photos/seed/pike-suite/300/220' },
      { id: 'h3', name: "Cascade Boutique Hotel",       rating: 4.7, reviews: 304, lat: 47.6320, lng: -122.3550, photo: 'https://picsum.photos/seed/cascade/300/220' }
    ],
    spots: [
      { id: 's1', name: "Discovery Park Lookout",       rating: 4.8, reviews: 612, lat: 47.6587, lng: -122.4180, photo: 'https://picsum.photos/seed/discovery/300/220' },
      { id: 's2', name: "Kerry Park Viewpoint",         rating: 4.9, reviews: 287, lat: 47.6294, lng: -122.3601, photo: 'https://picsum.photos/seed/kerry/300/220' },
      { id: 's3', name: "Gas Works Park",               rating: 4.7, reviews: 421, lat: 47.6456, lng: -122.3344, photo: 'https://picsum.photos/seed/gasworks/300/220' },
      { id: 's4', name: "Alki Beach",                   rating: 4.7, reviews: 408, lat: 47.5763, lng: -122.4090, photo: 'https://picsum.photos/seed/alki/300/220' }
    ]
  };

  const CATEGORY_ICONS = {
    restaurants: 'lunch_dining',
    hotels: 'hotel',
    spots: 'camera_alt'
  };

  const CATEGORY_TITLES = {
    restaurants: 'Restaurants',
    hotels: 'Hotels',
    spots: 'Spots'
  };

  /* Default Seattle-area selection box used for the demo */
  const DEFAULT_BOUNDS = {
    south: 47.55, west: -122.43,
    north: 47.70, east:  -122.28
  };

  /* ─────────────────────────────────────────────
     STATE
     ───────────────────────────────────────────── */

  const state = {
    map: null,
    drawing: false,
    selectionBounds: null,    // google.maps.LatLngBounds
    selectionRect: null,      // google.maps.Rectangle
    cornerMarkers: [],        // google.maps.Marker corner dots
    markerOverlays: {},       // id -> { marker, poi, category }
    activeCategory: 'restaurants',
    activeTripTab:  'restaurants',
    trip: { restaurants: [], hotels: [], spots: [] },
    projectionProxy: null,    // google.maps.OverlayView for pixel projection
    poiPanelOpen: true,       // user explicitly closed the POI panel?
    loadingTimer: null
  };

  /* ─────────────────────────────────────────────
     DOM REFS
     ───────────────────────────────────────────── */

  const body         = document.body;
  const poiPanel     = document.querySelector('[data-poi-panel]');
  const poiTitle     = document.querySelector('[data-poi-title]');
  const poiList      = document.querySelector('[data-poi-list]');
  const tripPanel    = document.querySelector('[data-trip-panel]');
  const tripList     = document.querySelector('[data-trip-list]');
  const chipsAnchor  = document.querySelector('[data-chips-anchor]');
  const chipsBar     = document.querySelector('[data-chips]');
  const chipInput    = document.querySelector('[data-chip-input]');
  const drawBtn      = document.querySelector('[data-action="draw"]');
  const editBtn      = document.querySelector('[data-action="edit"]');
  const zoomInBtn    = document.querySelector('[data-action="zoom-in"]');
  const zoomOutBtn   = document.querySelector('[data-action="zoom-out"]');
  const closePoiBtn  = document.querySelector('[data-action="close-poi"]');
  const askBtn       = document.querySelector('[data-action="ask"]');
  const askCancelBtn = document.querySelector('[data-action="ask-cancel"]');
  const askSubmitBtn = document.querySelector('[data-action="ask-submit"]');

  /* ─────────────────────────────────────────────
     UTILITIES
     ───────────────────────────────────────────── */

  function escapeHTML(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

  function setBodyState(s) { body.setAttribute('data-state', s); }

  function findInTrip(category, id) {
    return state.trip[category].some(p => p.id === id);
  }

  function findPoi(id) {
    for (const cat in POI_CATALOG) {
      const p = POI_CATALOG[cat].find(x => x.id === id);
      if (p) return { poi: p, category: cat };
    }
    return null;
  }

  function totalTripCount() {
    return state.trip.restaurants.length
         + state.trip.hotels.length
         + state.trip.spots.length;
  }

  /* ─────────────────────────────────────────────
     MAP — Google Maps init
     ───────────────────────────────────────────── */

  window.initMap = function () {
    state.map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 47.62, lng: -122.34 },
      zoom: 11,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      clickableIcons: false,
      styles: [
        { featureType: 'poi',       stylers: [{ visibility: 'off' }] },
        { featureType: 'transit',   stylers: [{ visibility: 'off' }] },
        { featureType: 'road',      elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
      ]
    });

    /* OverlayView gives us a projection that exposes container pixels,
       which lets us anchor DOM (the chip bar) to a lat/lng on the map.   */
    state.projectionProxy = new google.maps.OverlayView();
    state.projectionProxy.onAdd    = function () {};
    state.projectionProxy.draw     = function () { repositionChipsBar(); };
    state.projectionProxy.onRemove = function () {};
    state.projectionProxy.setMap(state.map);

    state.map.addListener('bounds_changed', repositionChipsBar);
    state.map.addListener('idle',           repositionChipsBar);
  };

  function fitToSelection() {
    if (!state.selectionBounds || !state.map) return;
    state.map.fitBounds(state.selectionBounds, {
      top: 60,
      right: 120,
      bottom: 140,
      left: 380
    });
  }

  /* ─────────────────────────────────────────────
     CHIPS BAR — anchored to bottom-center of selection
     ───────────────────────────────────────────── */

  function repositionChipsBar() {
    if (!state.selectionBounds || !state.projectionProxy) return;
    const proj = state.projectionProxy.getProjection();
    if (!proj) return;

    const sw = state.selectionBounds.getSouthWest();
    const ne = state.selectionBounds.getNorthEast();
    const anchor = new google.maps.LatLng(
      sw.lat(),
      (sw.lng() + ne.lng()) / 2
    );
    const px = proj.fromLatLngToContainerPixel(anchor);
    if (!px) return;

    chipsAnchor.style.left = px.x + 'px';
    chipsAnchor.style.top  = px.y + 'px';
  }

  /* ─────────────────────────────────────────────
     SELECTION RECTANGLE  (dashed blue + corner dots)
     ───────────────────────────────────────────── */

  function clearSelection() {
    if (state.selectionRect) {
      if (state.selectionRect._dashed) state.selectionRect._dashed.setMap(null);
      state.selectionRect.setMap(null);
      state.selectionRect = null;
    }
    state.cornerMarkers.forEach(m => m.setMap(null));
    state.cornerMarkers = [];
    state.selectionBounds = null;
  }

  function showSelection(bounds) {
    clearSelection();
    state.selectionBounds = bounds;

    state.selectionRect = new google.maps.Rectangle({
      bounds,
      map: state.map,
      strokeColor: '#1a73e8',
      strokeOpacity: 0.95,
      strokeWeight: 2,
      strokePosition: google.maps.StrokePosition.INSIDE,
      fillColor: '#1a73e8',
      fillOpacity: 0.06,
      clickable: false
    });

    /* Google Maps Rectangle doesn't support dashed strokes; emulate
       by overlaying a Polyline with a dashed icon pattern.            */
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const dashSymbol = {
      path: 'M 0,-1 0,1',
      strokeOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#1a73e8',
      scale: 3
    };
    const dashedPath = new google.maps.Polyline({
      path: [
        { lat: ne.lat(), lng: sw.lng() },
        { lat: ne.lat(), lng: ne.lng() },
        { lat: sw.lat(), lng: ne.lng() },
        { lat: sw.lat(), lng: sw.lng() },
        { lat: ne.lat(), lng: sw.lng() }
      ],
      strokeOpacity: 0,
      icons: [{ icon: dashSymbol, offset: '0', repeat: '10px' }],
      map: state.map,
      clickable: false
    });
    state.selectionRect._dashed = dashedPath;

    /* Corner dots — top-left & bottom-right (matches Figma). */
    const cornerIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: '#1a73e8',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    };
    const tl = new google.maps.Marker({
      position: { lat: ne.lat(), lng: sw.lng() },
      map: state.map, icon: cornerIcon, clickable: false, zIndex: 9
    });
    const br = new google.maps.Marker({
      position: { lat: sw.lat(), lng: ne.lng() },
      map: state.map, icon: cornerIcon, clickable: false, zIndex: 9
    });
    state.cornerMarkers = [tl, br];
  }


  /* ─────────────────────────────────────────────
     DRAW MODE — click-and-drag a rectangle
     ───────────────────────────────────────────── */

  function enterDrawMode() {
    if (state.drawing) return;
    state.drawing = true;
    body.setAttribute('data-draw', 'on');
    drawBtn.classList.add('is-active');
    setBodyState('drawing');
    state.map.setOptions({ draggable: false, gestureHandling: 'none' });

    const mapDiv = state.map.getDiv();
    const startProj = state.map.getProjection();
    let startLatLng = null;
    let liveRect = null;

    function onDown(e) {
      startLatLng = projectFromEvent(e);
      if (!startLatLng) return;
      liveRect = new google.maps.Rectangle({
        bounds: new google.maps.LatLngBounds(startLatLng, startLatLng),
        map: state.map,
        strokeColor: '#1a73e8', strokeOpacity: 0.9, strokeWeight: 2,
        fillColor: '#1a73e8', fillOpacity: 0.08, clickable: false
      });
      mapDiv.addEventListener('mousemove', onMove);
      mapDiv.addEventListener('mouseup',   onUp);
    }

    function onMove(e) {
      if (!liveRect || !startLatLng) return;
      const cur = projectFromEvent(e);
      if (!cur) return;
      const sw = new google.maps.LatLng(
        Math.min(startLatLng.lat(), cur.lat()),
        Math.min(startLatLng.lng(), cur.lng())
      );
      const ne = new google.maps.LatLng(
        Math.max(startLatLng.lat(), cur.lat()),
        Math.max(startLatLng.lng(), cur.lng())
      );
      liveRect.setBounds(new google.maps.LatLngBounds(sw, ne));
    }

    function onUp() {
      mapDiv.removeEventListener('mousemove', onMove);
      mapDiv.removeEventListener('mouseup',   onUp);
      mapDiv.removeEventListener('mousedown', onDown);
      const finalBounds = liveRect ? liveRect.getBounds() : null;
      if (liveRect) liveRect.setMap(null);
      exitDrawMode();
      if (finalBounds && !boundsAreTrivial(finalBounds)) {
        commitSelection(finalBounds);
      } else {
        commitSelection(boundsFromObject(DEFAULT_BOUNDS));
      }
    }

    mapDiv.addEventListener('mousedown', onDown);

    /* Provide an immediate fallback: a single click commits the demo bounds. */
    state._drawFallbackTimer = setTimeout(() => {
      if (state.drawing) {
        // user hovered but didn't drag; do nothing (still in draw mode)
      }
    }, 8000);
  }

  function exitDrawMode() {
    state.drawing = false;
    body.setAttribute('data-draw', 'off');
    drawBtn.classList.remove('is-active');
    state.map.setOptions({ draggable: true, gestureHandling: 'greedy' });
    if (state._drawFallbackTimer) clearTimeout(state._drawFallbackTimer);
  }

  function projectFromEvent(e) {
    const rect = state.map.getDiv().getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const proj = state.map.getProjection();
    if (!proj) return null;
    const bounds = state.map.getBounds();
    if (!bounds) return null;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const lng = sw.lng() + (ne.lng() - sw.lng()) * (x / rect.width);
    const lat = ne.lat() - (ne.lat() - sw.lat()) * (y / rect.height);
    return new google.maps.LatLng(lat, lng);
  }

  function boundsAreTrivial(b) {
    const ne = b.getNorthEast(), sw = b.getSouthWest();
    return Math.abs(ne.lat() - sw.lat()) < 0.005 || Math.abs(ne.lng() - sw.lng()) < 0.005;
  }

  function boundsFromObject(o) {
    return new google.maps.LatLngBounds(
      { lat: o.south, lng: o.west },
      { lat: o.north, lng: o.east }
    );
  }

  function commitSelection(bounds) {
    showSelection(bounds);
    setBodyState('selected');
    chipsAnchor.hidden = false;
    setChipsMode('categories');

    /* Panels stay hidden until the user picks a category from the chips.
       Only the trip list comes back if the user already had saved items.  */
    poiPanel.hidden    = true;
    state.poiPanelOpen = false;
    state.activeCategory = null;
    syncChipState();
    syncTripPanelVisibility();
    renderMarkers();
    fitToSelection();

    requestAnimationFrame(repositionChipsBar);
  }

  /* Trip panel is only visible while there's at least one saved item. */
  function syncTripPanelVisibility() {
    tripPanel.hidden = totalTripCount() === 0;
    if (!tripPanel.hidden) renderTripList();
  }

  /* ─────────────────────────────────────────────
     POI PANEL — loading skeleton + cards
     ───────────────────────────────────────────── */

  function showPoiLoading(durationMs) {
    if (state.loadingTimer) {
      clearTimeout(state.loadingTimer);
      state.loadingTimer = null;
    }
    poiTitle.textContent = CATEGORY_TITLES[state.activeCategory];
    poiList.innerHTML = renderSkeletons(3);

    const delay = typeof durationMs === 'number' ? durationMs : (650 + Math.random() * 250);
    state.loadingTimer = setTimeout(() => {
      state.loadingTimer = null;
      renderPoiList();
    }, delay);
  }

  function renderSkeletons(n) {
    let html = '';
    for (let i = 0; i < n; i++) {
      html += `
        <article class="poi-skeleton" aria-busy="true" aria-label="Loading suggestions">
          <div class="poi-skeleton__body">
            <div>
              <div class="poi-skeleton__line poi-skeleton__line--title"></div>
              <div class="poi-skeleton__line poi-skeleton__line--rating" style="margin-top: 8px;"></div>
            </div>
            <div class="poi-skeleton__line poi-skeleton__line--btn"></div>
          </div>
          <div class="poi-skeleton__image"></div>
        </article>
      `;
    }
    return html;
  }

  function renderPoiList() {
    const cat = state.activeCategory;
    poiTitle.textContent = CATEGORY_TITLES[cat];
    const items = POI_CATALOG[cat];

    poiList.innerHTML = items.map(poi => {
      const added = findInTrip(cat, poi.id);
      const btn = added
        ? `<button class="poi-card__btn poi-card__btn--added" data-action="toggle" data-id="${poi.id}">
             <span class="material-symbols-rounded">check</span>
             Added
           </button>`
        : `<button class="poi-card__btn" data-action="toggle" data-id="${poi.id}">Add</button>`;

      const photo = poi.photo
        ? `style="background-image:url('${poi.photo}')"`
        : '';

      return `
        <article class="poi-card" data-poi="${poi.id}">
          <div class="poi-card__body">
            <div>
              <div class="poi-card__title">${escapeHTML(poi.name)}</div>
              <div class="poi-card__rating">
                <span>${poi.rating} (${poi.reviews})</span>
                <span class="material-symbols-rounded">star</span>
              </div>
            </div>
            ${btn}
          </div>
          <div class="poi-card__image" ${photo}></div>
        </article>
      `;
    }).join('');
  }

  poiList.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="toggle"]');
    if (!btn) return;
    const id = btn.dataset.id;
    toggleTripItem(id);
  });

  /* ─────────────────────────────────────────────
     TRIP PANEL — list + tabs
     ───────────────────────────────────────────── */

  function renderTripList() {
    const cat = state.activeTripTab;
    const items = state.trip[cat];

    /* Update tab counts */
    Object.keys(state.trip).forEach(k => {
      const counter = document.querySelector(`[data-tab-count="${k}"]`);
      if (counter) counter.textContent = state.trip[k].length;
    });

    /* Highlight active tab */
    document.querySelectorAll('.trip-tab').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tripTab === cat);
    });

    if (items.length === 0) {
      tripList.innerHTML = `
        <div class="trip-empty" data-trip-empty>
          <span class="material-symbols-rounded">add_location_alt</span>
          <p>No ${cat} added yet. Tap <strong>Add</strong> on a suggestion to start your list.</p>
        </div>
      `;
      return;
    }

    tripList.innerHTML = items.map(poi => `
      <div class="trip-item" data-trip-id="${poi.id}">
        <div class="trip-item__thumb" ${poi.photo ? `style="background-image:url('${poi.photo}')"` : ''}></div>
        <div class="trip-item__body">
          <div class="trip-item__title">${escapeHTML(poi.name)}</div>
          <div class="trip-item__meta">
            <span class="trip-item__rating">
              ${poi.rating}
              <span class="material-symbols-rounded">star</span>
            </span>
            <span class="trip-item__dot">·</span>
            <span>${poi.reviews} reviews</span>
          </div>
        </div>
        <button class="trip-item__remove" data-action="remove" data-id="${poi.id}" aria-label="Remove">
          <span class="material-symbols-rounded">close</span>
        </button>
      </div>
    `).join('');
  }

  tripList.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-action="remove"]');
    if (removeBtn) {
      e.stopPropagation();
      toggleTripItem(removeBtn.dataset.id);
      return;
    }
    const item = e.target.closest('[data-trip-id]');
    if (item) focusMarker(item.dataset.tripId);
  });

  document.querySelectorAll('.trip-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.activeTripTab = tab.dataset.tripTab;
      renderTripList();
    });
  });

  /* ─────────────────────────────────────────────
     ADD / REMOVE FROM TRIP
     ───────────────────────────────────────────── */

  function toggleTripItem(id) {
    const found = findPoi(id);
    if (!found) return;
    const { poi, category } = found;
    const list = state.trip[category];
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(poi);
      /* Auto-jump the trip tab to wherever we're adding so the new item
         is visible immediately — but never modify the chip selection.    */
      state.activeTripTab = category;
    }
    if (state.activeCategory) renderPoiList();
    syncTripPanelVisibility();
    renderMarkers();
  }

  /* ─────────────────────────────────────────────
     MAP MARKERS — pin + label per POI in trip
     (and dimmed pins for unselected suggestions)
     ───────────────────────────────────────────── */

  function clearMarkers() {
    Object.values(state.markerOverlays).forEach(o => o.marker.setMap(null));
    state.markerOverlays = {};
  }

  function pinSvg(color) {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
        <path d="M14 1C7.4 1 2 6.4 2 13c0 9 12 22 12 22s12-13 12-22c0-6.6-5.4-12-12-12z"
              fill="${color}" stroke="white" stroke-width="1.5"/>
        <circle cx="14" cy="13" r="4.5" fill="white"/>
      </svg>
    `);
  }

  function placePin(poi, category, isInTrip) {
    const color  = isInTrip ? '#ea4335' : '#9aa0a6';
    const marker = new google.maps.Marker({
      position: { lat: poi.lat, lng: poi.lng },
      map: state.map,
      icon: {
        url: pinSvg(color),
        scaledSize: new google.maps.Size(28, 36),
        anchor: new google.maps.Point(14, 36),
        labelOrigin: new google.maps.Point(14, 44)
      },
      label: isInTrip ? {
        text: poi.name,
        color: '#202124',
        fontFamily: '"Google Sans", sans-serif',
        fontSize: '12px',
        fontWeight: '500',
        className: 'poi-marker-label'
      } : undefined,
      zIndex: isInTrip ? 10 : 5
    });
    marker.addListener('click', () => {
      if (!findInTrip(category, poi.id)) toggleTripItem(poi.id);
    });
    state.markerOverlays[poi.id] = { marker, poi, category };
  }

  function renderMarkers() {
    clearMarkers();
    const cat = state.activeCategory;

    if (cat) {
      /* When a category is active, show all of its POIs as pins. */
      POI_CATALOG[cat].forEach(poi => {
        placePin(poi, cat, findInTrip(cat, poi.id));
      });
    }

    /* Always overlay pins for items already saved in the trip — even if
       they belong to a category other than the active one. This keeps the
       map honest while the user browses categories.                       */
    Object.keys(state.trip).forEach(c => {
      if (c === cat) return; // already drawn above
      state.trip[c].forEach(poi => placePin(poi, c, true));
    });
  }

  function focusMarker(id) {
    const overlay = state.markerOverlays[id];
    if (!overlay) return;
    state.map.panTo(overlay.marker.getPosition());
  }

  /* ─────────────────────────────────────────────
     BOTTOM CHIPS — category switch, ask mode, panel reopen
     ───────────────────────────────────────────── */

  function syncChipState() {
    document.querySelectorAll('.chip[data-chip]').forEach(c => {
      c.classList.toggle('is-active', c.dataset.chip === state.activeCategory);
    });
  }

  function isAddedAnywhere(id) {
    return Object.keys(state.trip).some(cat => findInTrip(cat, id));
  }

  function setChipsMode(mode) {
    chipsBar.setAttribute('data-mode', mode);
    if (mode === 'input') {
      requestAnimationFrame(() => chipInput && chipInput.focus());
    }
  }

  document.querySelectorAll('.chip[data-chip]').forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.chip;
      state.activeCategory = cat;

      /* Open the POI panel (chip is the only entry point now). */
      poiPanel.hidden    = false;
      state.poiPanelOpen = true;

      syncChipState();
      renderMarkers();
      showPoiLoading();
    });
  });

  /* Blue button → enter ask mode (text field) */
  if (askBtn) askBtn.addEventListener('click', () => setChipsMode('input'));

  /* Back arrow → return to category mode */
  if (askCancelBtn) askCancelBtn.addEventListener('click', () => {
    chipInput.value = '';
    setChipsMode('categories');
  });

  /* Submit a query (the prototype just collapses back to chips). */
  function submitChipQuery() {
    const q = (chipInput.value || '').trim();
    if (!q) return;
    chipInput.value = '';
    setChipsMode('categories');
    /* Treat any free-text query as a "Restaurants" search for the demo. */
    state.activeCategory = 'restaurants';
    poiPanel.hidden    = false;
    state.poiPanelOpen = true;
    syncChipState();
    renderMarkers();
    showPoiLoading(900);
  }

  if (askSubmitBtn) askSubmitBtn.addEventListener('click', submitChipQuery);
  if (chipInput) chipInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitChipQuery();
    else if (e.key === 'Escape') {
      chipInput.value = '';
      setChipsMode('categories');
    }
  });

  /* ─────────────────────────────────────────────
     TOOLBAR ACTIONS
     ───────────────────────────────────────────── */

  drawBtn.addEventListener('click', () => {
    if (state.drawing) return;
    /* For prototype reliability we offer two paths:
       - If the map is already projecting (mouse drag), use draw mode.
       - Otherwise, fall back to the canonical demo bounds.            */
    if (state.map && state.map.getProjection && state.map.getProjection()) {
      enterDrawMode();
    } else {
      commitSelection(boundsFromObject(DEFAULT_BOUNDS));
    }
  });

  editBtn.addEventListener('click', () => {
    /* Trigger the demo selection regardless of map readiness. */
    commitSelection(boundsFromObject(DEFAULT_BOUNDS));
  });

  zoomInBtn.addEventListener('click', () => {
    if (state.map) state.map.setZoom(state.map.getZoom() + 1);
  });

  zoomOutBtn.addEventListener('click', () => {
    if (state.map) state.map.setZoom(state.map.getZoom() - 1);
  });

  closePoiBtn.addEventListener('click', () => {
    poiPanel.hidden      = true;
    state.poiPanelOpen   = false;
    state.activeCategory = null;
    syncChipState();
    renderMarkers();
  });

  /* ─────────────────────────────────────────────
     EXIT SELECTION — clears everything, back to empty
     ───────────────────────────────────────────── */

  function exitSelection() {
    if (state.loadingTimer) {
      clearTimeout(state.loadingTimer);
      state.loadingTimer = null;
    }
    clearSelection();
    clearMarkers();
    poiPanel.hidden    = true;
    tripPanel.hidden   = true;
    chipsAnchor.hidden = true;
    setChipsMode('categories');
    if (chipInput) chipInput.value = '';
    state.poiPanelOpen   = true;
    state.activeCategory = null;
    syncChipState();
    setBodyState('empty');
  }

  /* ESC key: cancel draw mode if active, else exit the whole selection. */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;

    /* Let the chip input field handle its own Escape (collapses input mode). */
    if (document.activeElement === chipInput) return;

    if (state.drawing) {
      exitDrawMode();
      return;
    }
    if (body.getAttribute('data-state') === 'selected') {
      exitSelection();
    }
  });

  /* ─────────────────────────────────────────────
     INITIAL STATE
     ───────────────────────────────────────────── */

  setBodyState('empty');
})();
