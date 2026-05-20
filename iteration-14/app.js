'use strict';

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */

const SUGGESTIONS = [
  { id: 'sc1', name: 'Þingvellir',      category: 'scenic',     lat: 64.2558, lng: -21.1296, seed: 101, rating: 4.8, desc: 'UNESCO World Heritage Site where the North American and Eurasian tectonic plates meet.' },
  { id: 'sc2', name: 'Geysir',          category: 'scenic',     lat: 64.3120, lng: -20.3003, seed: 204, rating: 4.7, desc: 'Watch Strokkur erupt every 6–10 minutes, shooting water up to 30 m high.' },
  { id: 'sc3', name: 'Gullfoss',        category: 'scenic',     lat: 64.3269, lng: -20.1209, seed: 318, rating: 4.9, desc: 'Iceland\'s most iconic waterfall, a two-tiered cascade on the Hvítá river.' },
  { id: 'sc4', name: 'Seljalandsfoss',  category: 'scenic',     lat: 63.6158, lng: -19.9886, seed: 612, rating: 4.8, desc: 'Walk behind the curtain of this 60 m waterfall — magical at golden hour.' },
  { id: 'sc5', name: 'Skógafoss',       category: 'scenic',     lat: 63.5322, lng: -19.5133, seed: 503, rating: 4.9, desc: 'Climb 527 steps to the top for sweeping views along the south coast.' },
  { id: 'sc6', name: 'Reynisfjara',     category: 'scenic',     lat: 63.4063, lng: -19.0610, seed: 616, rating: 4.7, desc: 'Dramatic black sand beach with basalt columns and powerful surf. Beware sneaker waves.' },
  { id: 'r1',  name: 'Matur og Drykkur', category: 'restaurant', lat: 64.1500, lng: -21.9400, seed: 701, rating: 4.5, price: '$$$', desc: 'Modern Icelandic cuisine rooted in old recipes. Must-try: skyr-cured salmon.' },
  { id: 'r2',  name: 'Skál! Craft Bar',  category: 'restaurant', lat: 64.1467, lng: -21.9380, seed: 711, rating: 4.4, price: '$$',  desc: 'Local craft beers and small plates. Great spot for an evening wind-down.' },
  { id: 'r3',  name: 'Geysir Glima',     category: 'restaurant', lat: 64.3110, lng: -20.2980, seed: 721, rating: 4.3, price: '$$',  desc: 'Hearty Icelandic stews and lamb soup right next to the geyser area.' },
  { id: 'r4',  name: 'Pakkhús',          category: 'restaurant', lat: 63.9336, lng: -20.9973, seed: 731, rating: 4.6, price: '$$$', desc: 'Seafood by the harbour. Known for langoustine bisque and fresh catch platters.' },
  { id: 'h1',  name: 'Hótel Kría',       category: 'hotel', lat: 63.4215, lng: -19.0020, seed: 801, rating: 4.5, price: '$195', desc: 'Vík\'s newest hotel, game room, good on-site dinner. Best Day 1 endpoint.' },
  { id: 'h2',  name: 'Hótel Selfoss',    category: 'hotel', lat: 63.9343, lng: -20.9977, seed: 811, rating: 4.4, price: '$178', desc: 'Modern property with the best breakfast on the route. Central location.' },
  { id: 'h3',  name: 'Hótel Skógafoss', category: 'hotel', lat: 63.5322, lng: -19.5133, seed: 821, rating: 4.3, price: '$229', desc: 'Right at the falls. Some rooms face the waterfall. Excellent restaurant.' },
  { id: 'h4',  name: 'The Barn',         category: 'hotel', lat: 63.4120, lng: -19.0260, seed: 831, rating: 4.5, price: '$68',  desc: 'Just outside Vík. Private rooms, ocean views, great bar. Best budget pick.' },
  { id: 'h5',  name: 'Aurora Igloo South', category: 'hotel', lat: 63.8280, lng: -20.4100, seed: 841, rating: 4.3, price: '$320', desc: 'Clear igloos for aurora viewing — a novelty stay, beautiful any season.' },
];

const CAT_ICONS = { scenic: 'landscape', restaurant: 'restaurant', hotel: 'hotel' };

const SEARCH_OVERRIDES = {
  'Þingvellir':       'Thingvellir National Park Iceland',
  'Geysir':           'Strokkur Geysir Iceland',
  'Gullfoss':         'Gullfoss waterfall Iceland',
  'Seljalandsfoss':   'Seljalandsfoss waterfall Iceland',
  'Skógafoss':        'Skogafoss waterfall Iceland',
  'Reynisfjara':      'Reynisfjara black sand beach Iceland',
  'Matur og Drykkur': 'Matur og Drykkur restaurant Reykjavik',
  'Skál! Craft Bar':  'Skal Craft Bar Reykjavik Iceland',
  'Geysir Glima':     'Geysir Glima restaurant Iceland',
  'Pakkhús':          'Pakkhus restaurant Selfoss Iceland',
  'Hótel Kría':       'Hotel Kria Vik Iceland',
  'Hótel Selfoss':    'Hotel Selfoss Iceland',
  'Hótel Skógafoss':  'Hotel Skogafoss Iceland',
  'The Barn':         'The Barn hotel Vik Iceland',
  'Aurora Igloo South': 'Aurora Igloo hotel Iceland',
};

/* ══════════════════════════════════════════════
   IMAGE CACHE
══════════════════════════════════════════════ */

const placeImages  = new Map();
let   placesService = null;

function fetchPlaceImage(name) {
  if (placeImages.has(name) || !placesService) return Promise.resolve();
  const query = SEARCH_OVERRIDES[name] ?? `${name} Iceland`;
  return new Promise(resolve => {
    placesService.findPlaceFromQuery(
      { query, fields: ['photos'] },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]?.photos?.[0]) {
          const photo = results[0].photos[0];
          placeImages.set(name, {
            small: photo.getUrl({ maxWidth: 800 }),
            thumb: photo.getUrl({ maxWidth: 120 }),
          });
        }
        resolve();
      }
    );
  });
}

function getImg(name, seed, size = 'small') {
  const dims  = size === 'thumb' ? '68/68' : '320/176';
  const entry = placeImages.get(name);
  const url   = entry && (entry[size] ?? entry.small);
  return url || `https://picsum.photos/seed/${seed}/${dims}`;
}

async function preloadImages() {
  await Promise.all(SUGGESTIONS.map(s => fetchPlaceImage(s.name)));
  refreshCardImages();
}

function refreshCardImages() {
  document.querySelectorAll('.suggestion-card-img').forEach(img => {
    const suggId = img.closest('.suggestion-card')?.dataset.id;
    if (!suggId) return;
    const sugg = SUGGESTIONS.find(s => s.id === suggId);
    if (sugg) img.src = getImg(sugg.name, sugg.seed, 'thumb');
  });
}

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */

let map           = null;
let mapReady      = false;
let routePolyline = null;
let stopMarkers   = {};      // suggId → SquarePin
let suggPinObjs   = {};      // suggId → SuggestionPin
let bookmarkPins  = {};      // suggId → BookmarkPin

let appState      = 'home';
let routeStops    = [];      // suggestions added to route (in order)
let savedPlaces   = {};      // suggId → suggestion
let activeFilter  = 'all';

let SquarePin     = null;
let SuggestionPin = null;
let BookmarkPin   = null;

let dragSrcIndex  = null;    // stop-list reorder source index
let draggingSuggId = null;   // suggestion being dragged from panel/map

let currentCardData = null;  // suggestion shown in place card

/* ══════════════════════════════════════════════
   STATE MACHINE
══════════════════════════════════════════════ */

function setState(s) {
  appState = s;
  document.body.dataset.state = s;
}

function goToMap() {
  if (appState !== 'home') return;

  const homeScreen = document.getElementById('homeScreen');
  homeScreen.style.animation = 'screenExitLeft 0.28s ease forwards';

  setTimeout(() => {
    setState('plan-ai');
    showTab('plan-ai');
    renderStopList();

    const mapView = document.getElementById('mapView');
    mapView.style.animation = 'screenEnter 0.32s ease forwards';
    setTimeout(() => { mapView.style.animation = ''; }, 320);

    setTimeout(animateSuggestions, 420);
  }, 240);
}

function showTab(tab) {
  const paneAi    = document.getElementById('paneplanai');
  const paneRoute = document.getElementById('paneroute');
  const btnAi     = document.getElementById('tabPlanAiBtn');
  const btnRoute  = document.getElementById('tabRouteBtn');

  if (tab === 'plan-ai') {
    paneAi.classList.remove('tab-pane--hidden');
    paneRoute.classList.add('tab-pane--hidden');
    btnAi.classList.add('tab-btn--active');
    btnRoute.classList.remove('tab-btn--active');
    setState('plan-ai');
  } else {
    paneRoute.classList.remove('tab-pane--hidden');
    paneAi.classList.add('tab-pane--hidden');
    btnRoute.classList.add('tab-btn--active');
    btnAi.classList.remove('tab-btn--active');
    setState('route');
  }
}

/* ══════════════════════════════════════════════
   ANIMATION — SUGGESTIONS REVEAL
══════════════════════════════════════════════ */

function typeInto(el, text, msPerWord, done) {
  el.classList.add('is-typing');
  const words = text.split(' ');
  let i = 0;
  const tick = () => {
    if (i < words.length) {
      el.textContent += (i === 0 ? '' : ' ') + words[i++];
      setTimeout(tick, msPerWord);
    } else {
      el.classList.remove('is-typing');
      if (done) done();
    }
  };
  tick();
}

function animateSuggestions() {
  const intro = document.getElementById('suggestionsIntro');
  const chips = document.getElementById('categoryChips');

  // Fade in category chips
  chips.classList.add('is-visible');

  // Type intro text
  intro.classList.add('is-visible');
  typeInto(intro, `Here are ${SUGGESTIONS.length} suggested places for your Iceland road trip`, 46, () => {

    // Render suggestion cards
    renderSuggestionCards();

    // Stagger reveal each card
    const cards = document.querySelectorAll('.suggestion-card');
    cards.forEach((card, i) => {
      setTimeout(() => card.classList.add('is-visible'), 70 * i);
    });

    // Show suggestion pins on map after a brief delay
    setTimeout(() => {
      if (mapReady) renderSuggestionPins();
    }, 300);
  });
}

/* ══════════════════════════════════════════════
   MAP INIT
══════════════════════════════════════════════ */

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 63.87, lng: -20.10 },
    zoom: 8,
    disableDefaultUI: true,
    gestureHandling: 'auto',
    styles: [
      { featureType: 'poi',     elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'road',    elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    ],
  });

  /* ── SquarePin — numbered photo pin for route stops ── */
  SquarePin = class extends google.maps.OverlayView {
    constructor(sugg, number) {
      super();
      this.sugg   = sugg;
      this.number = number;
      this.el     = null;
    }

    onAdd() {
      const s  = this.sugg;
      const el = document.createElement('div');
      el.className = 'square-pin';
      el.innerHTML = `
        <div class="square-pin-badge">${this.number}</div>
        <div class="square-pin-shell">
          <img class="square-pin-photo" src="${getImg(s.name, s.seed, 'thumb')}" alt="">
        </div>
        <div class="square-pin-tip"></div>
      `;
      el.style.opacity = '0';
      el.addEventListener('click', e => { e.stopPropagation(); showSuggCard(s, el); });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.sugg.lat, this.sugg.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 57) + 'px';
    }

    onRemove() {
      if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
      this.el = null;
    }

    fadeIn() {
      if (!this.el) return;
      let op = 0;
      const tick = setInterval(() => {
        op = Math.min(1, op + 0.1);
        if (this.el) this.el.style.opacity = op;
        if (op >= 1) clearInterval(tick);
      }, 16);
    }

    updateNumber(n) {
      this.number = n;
      if (this.el) {
        const badge = this.el.querySelector('.square-pin-badge');
        if (badge) badge.textContent = n;
      }
    }
  };

  /* ── SuggestionPin — colored dot for AI suggestions ── */
  SuggestionPin = class extends google.maps.OverlayView {
    constructor(sugg) {
      super();
      this.sugg = sugg;
      this.el   = null;
    }

    onAdd() {
      const s  = this.sugg;
      const el = document.createElement('div');
      el.className = 'square-pin suggestion-pin';
      el.innerHTML = `
        <div class="sugg-pin-badge sugg-pin-badge--${s.category}">
          <span class="material-symbols-rounded">${CAT_ICONS[s.category]}</span>
        </div>
        <div class="square-pin-shell">
          <img class="square-pin-photo" src="${getImg(s.name, s.seed, 'thumb')}" alt="">
        </div>
        <div class="square-pin-tip"></div>
      `;
      el.style.opacity = '0';
      el.draggable = true;
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('dragstart', e => {
        draggingSuggId = s.id;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'sugg-' + s.id);
        setTimeout(() => { if (this.el) this.el.style.opacity = '0.4'; }, 0);
      });
      el.addEventListener('dragend', () => {
        draggingSuggId = null;
        if (this.el) this.el.style.opacity = '1';
      });
      el.addEventListener('click', e => { e.stopPropagation(); showSuggCard(s, el); });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.sugg.lat, this.sugg.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 57) + 'px';
    }

    onRemove() {
      if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
      this.el = null;
    }

    fadeIn() {
      if (!this.el) return;
      let op = 0;
      const tick = setInterval(() => {
        op = Math.min(1, op + 0.12);
        if (this.el) this.el.style.opacity = op;
        if (op >= 1) clearInterval(tick);
      }, 16);
    }

    setVisible(visible) {
      if (this.el) this.el.style.display = visible ? 'block' : 'none';
    }

    setActive(active) {
      if (!this.el) return;
      const shell = this.el.querySelector('.square-pin-shell');
      if (active) {
        this.el.style.transform = 'scale(1.1)';
        if (shell) shell.style.boxShadow = '0 0 0 2.5px white, 0 0 0 4px #1a73e8, 0 4px 8px 3px rgba(0,0,0,0.2)';
      } else {
        this.el.style.transform = '';
        if (shell) shell.style.boxShadow = '';
      }
    }
  };

  /* ── BookmarkPin — small circle for saved places ── */
  BookmarkPin = class extends google.maps.OverlayView {
    constructor(sugg) {
      super();
      this.sugg = sugg;
      this.el   = null;
    }

    onAdd() {
      const el = document.createElement('div');
      el.className = 'bookmark-pin';
      el.innerHTML = `<span class="material-symbols-rounded">bookmark</span>`;
      el.addEventListener('click', e => { e.stopPropagation(); showSuggCard(this.sugg, el); });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.sugg.lat, this.sugg.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 10) + 'px';
      this.el.style.top  = Math.round(pt.y - 10) + 'px';
    }

    onRemove() {
      if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
      this.el = null;
    }
  };

  mapReady = true;
  placesService = new google.maps.places.PlacesService(map);
  preloadImages();

  // Close place card whenever the user interacts with the map background
  google.maps.event.addListener(map, 'click',        closePlaceCard);
  google.maps.event.addListener(map, 'dragstart',    closePlaceCard);
  google.maps.event.addListener(map, 'zoom_changed', closePlaceCard);

  if (appState === 'plan-ai' || appState === 'route') {
    renderSuggestionPins();
    renderPins();
    if (routeStops.length >= 2) renderPolyline();
  }
}

function zoomIn()  { if (map) map.setZoom(map.getZoom() + 1); }
function zoomOut() { if (map) map.setZoom(map.getZoom() - 1); }

/* ══════════════════════════════════════════════
   SUGGESTION MAP PINS
══════════════════════════════════════════════ */

function renderSuggestionPins() {
  clearSuggestionPins();
  SUGGESTIONS.forEach((sugg, i) => {
    if (routeStops.find(s => s.id === sugg.id)) return; // has square pin already
    setTimeout(() => {
      const pin = new SuggestionPin(sugg);
      pin.setMap(map);
      suggPinObjs[sugg.id] = pin;
      setTimeout(() => {
        pin.fadeIn();
        filterSuggestionPin(pin, sugg.category);
      }, 20);
    }, 45 * i);
  });
}

function clearSuggestionPins() {
  Object.values(suggPinObjs).forEach(p => p.setMap(null));
  suggPinObjs = {};
}

function filterSuggestionPin(pin, category) {
  const visible = activeFilter === 'all' || activeFilter === category;
  pin.setVisible(visible);
}

function filterSuggestionPins() {
  Object.keys(suggPinObjs).forEach(id => {
    const sugg = SUGGESTIONS.find(s => s.id === id);
    if (sugg) filterSuggestionPin(suggPinObjs[id], sugg.category);
  });
}

/* ══════════════════════════════════════════════
   ROUTE STOP PINS
══════════════════════════════════════════════ */

function renderPins() {
  clearPins();
  routeStops.forEach((stop, i) => {
    setTimeout(() => {
      const pin = new SquarePin(stop, i + 1);
      pin.setMap(map);
      stopMarkers[stop.id] = pin;
      setTimeout(() => pin.fadeIn(), 20);
    }, 60 * i);
  });
}

function clearPins() {
  Object.values(stopMarkers).forEach(m => m.setMap(null));
  stopMarkers = {};
}

function renumberPins() {
  routeStops.forEach((stop, i) => {
    if (stopMarkers[stop.id]) stopMarkers[stop.id].updateNumber(i + 1);
  });
}

/* ══════════════════════════════════════════════
   ROUTE POLYLINE
══════════════════════════════════════════════ */

function renderPolyline() {
  if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  if (routeStops.length < 2) return;

  new google.maps.DirectionsService().route({
    origin:      { lat: routeStops[0].lat, lng: routeStops[0].lng },
    destination: { lat: routeStops[routeStops.length - 1].lat, lng: routeStops[routeStops.length - 1].lng },
    waypoints:   routeStops.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
    travelMode:  google.maps.TravelMode.DRIVING,
    optimizeWaypoints: false,
  }, (result, status) => {
    if (status !== 'OK') return;
    routePolyline = new google.maps.Polyline({
      path:          result.routes[0].overview_path,
      strokeColor:   '#1a73e8',
      strokeWeight:  3,
      strokeOpacity: 0.9,
      map,
      zIndex: 5,
    });
  });
}

function renderPolylineAnimated() {
  if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  if (routeStops.length < 2) return;

  new google.maps.DirectionsService().route({
    origin:      { lat: routeStops[0].lat, lng: routeStops[0].lng },
    destination: { lat: routeStops[routeStops.length - 1].lat, lng: routeStops[routeStops.length - 1].lng },
    waypoints:   routeStops.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
    travelMode:  google.maps.TravelMode.DRIVING,
    optimizeWaypoints: false,
  }, (result, status) => {
    if (status !== 'OK') return;
    const fullPath = result.routes[0].overview_path;
    routePolyline = new google.maps.Polyline({
      path:          [fullPath[0]],
      strokeColor:   '#1a73e8',
      strokeWeight:  3,
      strokeOpacity: 0.9,
      map,
      zIndex: 5,
    });
    const totalFrames = 80;
    const chunkSize   = Math.max(1, Math.ceil(fullPath.length / totalFrames));
    let i = 1;
    const extendPath = () => {
      for (let j = 0; j < chunkSize && i < fullPath.length; j++, i++) {
        routePolyline.getPath().push(fullPath[i]);
      }
      if (i < fullPath.length) setTimeout(extendPath, 16);
    };
    setTimeout(extendPath, 100);
  });
}

/* ══════════════════════════════════════════════
   ROUTE OPTIMIZATION HELPERS
══════════════════════════════════════════════ */

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Cheapest-insertion: returns the index where inserting newStop minimises total route distance.
function bestInsertIndex(newStop) {
  const n = routeStops.length;
  if (n < 2) return n;

  let bestIdx = n;
  let bestCost = Infinity;

  for (let i = 0; i <= n; i++) {
    let cost;
    if (i === 0) {
      cost = haversineKm(newStop, routeStops[0]);
    } else if (i === n) {
      cost = haversineKm(routeStops[n - 1], newStop);
    } else {
      cost = haversineKm(routeStops[i - 1], newStop)
           + haversineKm(newStop, routeStops[i])
           - haversineKm(routeStops[i - 1], routeStops[i]);
    }
    if (cost < bestCost) { bestCost = cost; bestIdx = i; }
  }
  return bestIdx;
}

/* ══════════════════════════════════════════════
   ADD TO ROUTE
══════════════════════════════════════════════ */

function addToRoute(suggId, insertAt) {
  if (routeStops.find(s => s.id === suggId)) return;
  const sugg = SUGGESTIONS.find(s => s.id === suggId);
  if (!sugg) return;

  if (insertAt !== undefined) {
    routeStops.splice(insertAt, 0, { ...sugg });
  } else {
    // Auto-insert at the position that adds the least extra distance
    const idx = bestInsertIndex(sugg);
    routeStops.splice(idx, 0, { ...sugg });
  }

  // Replace suggestion pin with numbered square pin
  if (mapReady) {
    if (suggPinObjs[suggId]) {
      suggPinObjs[suggId].setMap(null);
      delete suggPinObjs[suggId];
    }
    // Re-number and recreate all route pins cleanly
    clearPins();
    routeStops.forEach((stop, i) => {
      const pin = new SquarePin(stop, i + 1);
      pin.setMap(map);
      stopMarkers[stop.id] = pin;
      setTimeout(() => pin.fadeIn(), 20);
    });

    // Draw / update polyline
    if (routeStops.length === 2) {
      renderPolylineAnimated();
    } else if (routeStops.length > 2) {
      renderPolyline();
    }
  }

  updateSuggestionCardUI(suggId);
  updateRouteCardUI();
  renderStopList();
  updateRouteOptChip();

  if (routeStops.length >= 2) showOptimizeToast();
}

function removeStop(id) {
  routeStops = routeStops.filter(s => s.id !== id);

  if (stopMarkers[id]) {
    stopMarkers[id].setMap(null);
    delete stopMarkers[id];
  }

  // Re-add suggestion pin for this place
  if (mapReady) {
    const sugg = SUGGESTIONS.find(s => s.id === id);
    if (sugg) {
      const pin = new SuggestionPin(sugg);
      pin.setMap(map);
      suggPinObjs[id] = pin;
      setTimeout(() => {
        pin.fadeIn();
        filterSuggestionPin(pin, sugg.category);
      }, 20);
    }
    // Re-number remaining pins
    renumberPins();

    if (routeStops.length >= 2) {
      renderPolyline();
    } else if (routePolyline) {
      routePolyline.setMap(null);
      routePolyline = null;
    }
  }

  updateSuggestionCardUI(id);
  updateRouteCardUI();
  renderStopList();
  updateRouteOptChip();
}

/* ══════════════════════════════════════════════
   OPTIMIZE TOAST
══════════════════════════════════════════════ */

let toastTimer = null;

function showOptimizeToast() {
  const toast = document.getElementById('optimizeToast');
  if (!toast) return;

  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.remove('toast-out');
  toast.classList.add('toast-in');
  toast.style.opacity = '1';

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.classList.remove('toast-out');
    }, 220);
  }, 2000);
}

/* ══════════════════════════════════════════════
   ROUTE STOP LIST
══════════════════════════════════════════════ */

function renderStopList() {
  const list        = document.getElementById('stopList');
  const emptyState  = document.getElementById('routeEmptyState');
  const routeSpacer = document.getElementById('routeSpacer');
  const infoCard    = document.getElementById('routeInfoCard');
  const spacer2     = document.getElementById('routeSpacer2');
  if (!list) return;

  const hasStops = routeStops.length > 0;
  const hasRoute = routeStops.length >= 2;

  emptyState.style.display = hasStops ? 'none' : 'flex';
  routeSpacer.style.display = hasRoute ? 'block' : 'none';
  infoCard.style.display    = hasRoute ? 'flex'  : 'none';
  spacer2.style.display     = hasRoute ? 'block' : 'none';

  list.innerHTML = '';
  routeStops.forEach((stop, i) => {
    const isLast = i === routeStops.length - 1;
    const li = document.createElement('li');
    li.className = 'stop-item';
    li.dataset.id = stop.id;
    li.draggable = true;

    li.innerHTML = `
      <span class="material-symbols-rounded stop-drag">drag_indicator</span>
      <div class="stop-dot-wrap">
        ${isLast
          ? '<span class="material-symbols-rounded stop-location-icon">location_on</span>'
          : '<div class="stop-dot"></div>'
        }
      </div>
      <div class="stop-name-pill">${stop.name}</div>
      <button class="stop-remove-btn" onclick="removeStop('${stop.id}')">
        <span class="material-symbols-rounded">highlight_off</span>
      </button>
    `;

    li.addEventListener('dragstart',  stopDragStart);
    li.addEventListener('dragover',   stopDragOver);
    li.addEventListener('dragleave',  stopDragLeave);
    li.addEventListener('drop',       stopDrop);
    li.addEventListener('dragend',    stopDragEnd);

    list.appendChild(li);
  });

  if (hasRoute) updateRouteCardUI();
}

function updateRouteCardUI() {
  const n = routeStops.length;
  if (n < 2) return;
  const hoursRaw = 1.2 + n * 0.75;
  const wholeH   = Math.floor(hoursRaw);
  const mins     = Math.round((hoursRaw % 1) * 60 / 5) * 5;
  const timeStr  = mins > 0 ? `${wholeH} hr ${mins} min` : `${wholeH} hr`;
  const miles    = 45 + n * 26;
  const timeEl   = document.getElementById('routeTimeStat');
  const distEl   = document.getElementById('routeDistanceStat');
  if (timeEl) timeEl.textContent = timeStr;
  if (distEl) distEl.textContent = `${miles} miles`;
}

function updateRouteOptChip() {
  const chip  = document.getElementById('routeOptChip');
  const label = document.getElementById('routeOptLabel');
  if (!chip || !label) return;

  const n = routeStops.length;
  if (n === 0) {
    chip.style.display = 'none';
  } else if (n === 1) {
    chip.style.display = 'flex';
    chip.classList.add('route-optimized-chip--building');
    label.textContent = '1 stop added — add more to build a route';
  } else {
    chip.style.display = 'flex';
    chip.classList.remove('route-optimized-chip--building');
    label.textContent = `Route optimized · ${n} stops`;
  }
}

/* ══════════════════════════════════════════════
   STOP DRAG-TO-REORDER
══════════════════════════════════════════════ */

function stopDragStart(e) {
  dragSrcIndex = [...e.currentTarget.parentNode.children].indexOf(e.currentTarget);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragSrcIndex));
  setTimeout(() => e.currentTarget.classList.add('is-dragging'), 0);
}

function stopDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = draggingSuggId !== null ? 'copy' : 'move';
  clearDropIndicators();
  const rect = e.currentTarget.getBoundingClientRect();
  if (e.clientY < rect.top + rect.height / 2) {
    e.currentTarget.classList.add('drop-above');
  } else {
    e.currentTarget.classList.add('drop-below');
  }
}

function stopDragLeave(e) {
  e.currentTarget.classList.remove('drop-above', 'drop-below');
}

function stopDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  let dropIndex = [...target.parentNode.children].indexOf(target);
  const rect = target.getBoundingClientRect();
  if (e.clientY >= rect.top + rect.height / 2) dropIndex += 1;
  clearDropIndicators();

  // Suggestion card / suggestion pin dropped onto stop list
  if (draggingSuggId !== null) {
    const id = draggingSuggId;
    draggingSuggId = null;
    if (!routeStops.find(s => s.id === id)) {
      addToRoute(id, Math.min(dropIndex, routeStops.length));
    }
    return;
  }

  // Stop-to-stop reorder
  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
  const insertAt = dropIndex > dragSrcIndex ? dropIndex - 1 : dropIndex;
  const [moved]  = routeStops.splice(dragSrcIndex, 1);
  routeStops.splice(insertAt, 0, moved);
  dragSrcIndex = null;

  renumberPins();
  renderStopList();
  if (mapReady && routeStops.length >= 2) renderPolyline();
}

function stopDragEnd(e) {
  e.currentTarget.classList.remove('is-dragging');
  clearDropIndicators();
  dragSrcIndex = null;
}

function clearDropIndicators() {
  document.querySelectorAll('.stop-item').forEach(el =>
    el.classList.remove('drop-above', 'drop-below')
  );
}

/* ══════════════════════════════════════════════
   DRAG — SUGGESTION CARD → ROUTE TAB
══════════════════════════════════════════════ */

function suggCardDragStart(e, suggId) {
  draggingSuggId = suggId;
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', 'sugg-' + suggId);
  const card = e.currentTarget;
  setTimeout(() => card.classList.add('is-dragging'), 0);
}

function suggCardDragEnd(e) {
  draggingSuggId = null;
  e.currentTarget.classList.remove('is-dragging');
}

function routeTabDragOver(e) {
  e.preventDefault();
  if (draggingSuggId !== null && appState !== 'route') {
    showTab('route');
  }
}

function emptyStateDrop(e) {
  e.preventDefault();
  const el = document.getElementById('routeEmptyState');
  if (el) el.classList.remove('drag-over');
  if (draggingSuggId !== null) {
    const id = draggingSuggId;
    draggingSuggId = null;
    addToRoute(id);
  }
}

/* ══════════════════════════════════════════════
   CATEGORY FILTER
══════════════════════════════════════════════ */

function setFilter(cat) {
  activeFilter = cat;

  // Update chip active states
  ['all', 'scenic', 'restaurant', 'hotel'].forEach(c => {
    const chip = document.getElementById(`chip${c.charAt(0).toUpperCase() + c.slice(1)}`);
    if (chip) chip.classList.toggle('cat-chip--active', c === cat);
  });

  // Re-render suggestion cards with filter
  renderSuggestionCards();

  // Stagger re-reveal
  const cards = document.querySelectorAll('.suggestion-card');
  cards.forEach((card, i) => {
    card.classList.remove('is-visible');
    setTimeout(() => card.classList.add('is-visible'), 50 * i);
  });

  // Filter map pins
  filterSuggestionPins();
}

/* ══════════════════════════════════════════════
   SUGGESTION CARDS
══════════════════════════════════════════════ */

function renderSuggestionCards() {
  const list = document.getElementById('suggestionsList');
  if (!list) return;

  const filtered = activeFilter === 'all'
    ? SUGGESTIONS
    : SUGGESTIONS.filter(s => s.category === activeFilter);

  list.innerHTML = filtered.map(sugg => suggestionCardHTML(sugg)).join('');
}

function suggestionCardHTML(sugg) {
  const inRoute = !!routeStops.find(s => s.id === sugg.id);
  const isSaved = !!savedPlaces[sugg.id];
  const reviews = Math.floor((sugg.seed % 97) * 8 + 45);

  return `
    <div class="suggestion-card" data-id="${sugg.id}" draggable="true"
         ondragstart="suggCardDragStart(event, '${sugg.id}')"
         ondragend="suggCardDragEnd(event)">
      <div class="sugg-thumb-wrap">
        <img class="sugg-thumb suggestion-card-img" src="${getImg(sugg.name, sugg.seed, 'thumb')}" alt="${sugg.name}">
      </div>
      <div class="suggestion-card-body">
        <div class="suggestion-card-name">${sugg.name}</div>
        <div class="suggestion-card-meta">
          <span class="material-symbols-rounded sugg-star">star</span>
          <span>${sugg.rating}</span>
          <span class="sugg-sep">·</span>
          <span>${reviews} reviews</span>
        </div>
      </div>
      <div class="sugg-card-actions">
        <button class="sugg-icon-btn sugg-save-btn ${isSaved ? 'sugg-save-btn--saved' : ''}"
                onclick="saveSuggestion('${sugg.id}')" title="${isSaved ? 'Saved' : 'Save place'}">
          <span class="material-symbols-rounded">${isSaved ? 'bookmark' : 'bookmark_border'}</span>
        </button>
        <button class="sugg-icon-btn sugg-route-btn ${inRoute ? 'sugg-route-btn--added' : ''}"
                onclick="addToRoute('${sugg.id}')" ${inRoute ? 'disabled' : ''}
                title="${inRoute ? 'Added to route' : 'Add to route'}">
          <span class="material-symbols-rounded">${inRoute ? 'check' : 'add'}</span>
        </button>
      </div>
    </div>
  `;
}

function updateSuggestionCardUI(suggId) {
  const card = document.querySelector(`.suggestion-card[data-id="${suggId}"]`);
  if (!card) return;

  const inRoute   = !!routeStops.find(s => s.id === suggId);
  const isSaved   = !!savedPlaces[suggId];
  const routeBtn  = card.querySelector('.sugg-route-btn');
  const saveBtn   = card.querySelector('.sugg-save-btn');

  if (routeBtn) {
    routeBtn.innerHTML = `<span class="material-symbols-rounded">${inRoute ? 'check' : 'add'}</span>`;
    routeBtn.title = inRoute ? 'Added to route' : 'Add to route';
    routeBtn.classList.toggle('sugg-route-btn--added', inRoute);
    routeBtn.disabled = inRoute;
  }

  if (saveBtn) {
    saveBtn.innerHTML = `<span class="material-symbols-rounded">${isSaved ? 'bookmark' : 'bookmark_border'}</span>`;
    saveBtn.title = isSaved ? 'Saved' : 'Save place';
    saveBtn.classList.toggle('sugg-save-btn--saved', isSaved);
  }
}

/* ══════════════════════════════════════════════
   SAVE / UNSAVE
══════════════════════════════════════════════ */

function saveSuggestion(suggId) {
  const sugg = SUGGESTIONS.find(s => s.id === suggId);
  if (!sugg) return;

  if (savedPlaces[suggId]) {
    // Unsave
    delete savedPlaces[suggId];
    if (bookmarkPins[suggId]) {
      bookmarkPins[suggId].setMap(null);
      delete bookmarkPins[suggId];
    }
  } else {
    // Save
    savedPlaces[suggId] = { ...sugg };
    if (mapReady) {
      const pin = new BookmarkPin(sugg);
      pin.setMap(map);
      bookmarkPins[suggId] = pin;
    }
  }

  updateSuggestionCardUI(suggId);
  renderSavedList();
  updateBookmarkBtn();
}

function unsaveSuggestion(suggId) {
  delete savedPlaces[suggId];
  if (bookmarkPins[suggId]) {
    bookmarkPins[suggId].setMap(null);
    delete bookmarkPins[suggId];
  }
  updateSuggestionCardUI(suggId);
  renderSavedList();
  updateBookmarkBtn();
}

function renderSavedList() {
  const section = document.getElementById('savedSection');
  const list    = document.getElementById('savedList');
  if (!section || !list) return;

  const items = Object.values(savedPlaces);
  section.style.display = items.length ? 'block' : 'none';

  list.innerHTML = items.map(p => `
    <li class="saved-item">
      <div class="saved-thumb-wrap">
        <img class="saved-thumb" src="${getImg(p.name, p.seed, 'thumb')}" alt="">
      </div>
      <div class="saved-info">
        <div class="saved-name">${p.name}</div>
        <div class="saved-meta">
          ${p.price ? `<span>${p.price}</span><span class="saved-sep"> · </span>` : ''}
          <span class="material-symbols-rounded saved-star">star</span>
          <span>${p.rating}</span>
        </div>
      </div>
      <button class="saved-remove-btn" onclick="unsaveSuggestion('${p.id}')">
        <span class="material-symbols-rounded">highlight_off</span>
      </button>
    </li>
  `).join('');
}

/* ══════════════════════════════════════════════
   PLACE CARD (on pin click)
══════════════════════════════════════════════ */

function showSuggCard(sugg, fromEl) {
  const card    = document.getElementById('placeCard');
  const mapArea = document.querySelector('.map-area');
  const mapW    = mapArea.offsetWidth;
  const mapH    = mapArea.offsetHeight;
  const cardW   = 320;
  const cardH   = 248;
  const gap     = 12;

  let left, top;

  if (fromEl) {
    const pinRect = fromEl.getBoundingClientRect();
    const mapRect = mapArea.getBoundingClientRect();
    const pinCX   = pinRect.left - mapRect.left + pinRect.width / 2;
    const pinTopY = pinRect.top  - mapRect.top;

    left = pinCX - cardW / 2;
    top  = pinTopY - cardH - gap;
    if (top < 8) top = pinTopY + pinRect.height + gap;
  } else {
    left = mapW - cardW - 16;
    top  = 72;
  }

  left = Math.max(8, Math.min(left, mapW - cardW - 8));
  top  = Math.max(8, Math.min(top,  mapH - cardH - 8));

  card.style.left = left + 'px';
  card.style.top  = top  + 'px';

  document.getElementById('placeCardImg').src = getImg(sugg.name, sugg.seed);
  document.getElementById('placeCardName').textContent = sugg.name;
  document.getElementById('placeCardRating').textContent = sugg.rating;

  // Highlight suggestion pin
  Object.values(suggPinObjs).forEach(p => p.setActive(false));
  if (suggPinObjs[sugg.id]) suggPinObjs[sugg.id].setActive(true);

  currentCardData = { ...sugg };
  updateBookmarkBtn();
  updateRouteBtn();
  card.classList.add('is-visible');
}

function closePlaceCard() {
  document.getElementById('placeCard').classList.remove('is-visible');
  Object.values(suggPinObjs).forEach(p => p.setActive(false));
}

function updateBookmarkBtn() {
  const icon = document.getElementById('placeCardBookmarkIcon');
  if (!icon || !currentCardData) return;
  const saved = !!savedPlaces[currentCardData.id];
  icon.textContent = saved ? 'bookmark' : 'bookmark_border';
  icon.style.color = saved ? '#1a73e8' : '';
}

function updateRouteBtn() {
  const btn  = document.getElementById('placeCardRouteBtn');
  const icon = document.getElementById('placeCardRouteIcon');
  if (!btn || !icon || !currentCardData) return;
  const inRoute = !!routeStops.find(s => s.id === currentCardData.id);
  icon.textContent = inRoute ? 'check' : 'add_location';
  btn.className = `place-card-action-btn ${inRoute ? 'place-card-action-btn--green' : 'place-card-action-btn--blue'}`;
}

function toggleSave() {
  if (!currentCardData) return;
  saveSuggestion(currentCardData.id);
}

function addToRouteFromCard() {
  if (!currentCardData) return;
  addToRoute(currentCardData.id);
  updateRouteBtn();
}

/* ══════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════ */

function submitFooter() {
  const input = document.getElementById('footerInput');
  const text = input?.value.trim();
  if (!text && !activeCircle) return;
  if (input) input.value = '';
  if (activeCircle) {
    doAreaSearch(text || 'Find things in this area');
  }
}

/* ══════════════════════════════════════════════
   VEHICLE SELECTOR
══════════════════════════════════════════════ */

function toggleVehicleDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('vehicleDropdown');
  const chevron  = document.getElementById('vehicleChipChevron');
  const isOpen   = dropdown.classList.toggle('is-open');
  chevron.textContent = isOpen ? 'expand_less' : 'expand_more';
}

function selectVehicle(optionEl, name, icon) {
  document.getElementById('vehicleChipLabel').textContent = name;
  document.getElementById('vehicleChipIcon').textContent  = icon;
  document.querySelectorAll('.vehicle-radio').forEach(r =>
    r.classList.remove('vehicle-radio--selected')
  );
  optionEl.querySelector('.vehicle-radio').classList.add('vehicle-radio--selected');
  document.getElementById('vehicleDropdown').classList.remove('is-open');
  document.getElementById('vehicleChipChevron').textContent = 'expand_more';
}

document.addEventListener('click', () => {
  const dropdown = document.getElementById('vehicleDropdown');
  if (dropdown?.classList.contains('is-open')) {
    dropdown.classList.remove('is-open');
    document.getElementById('vehicleChipChevron').textContent = 'expand_more';
  }
});

/* ══════════════════════════════════════════════
   AREA RESULTS DATA
══════════════════════════════════════════════ */

const AREA_RESULTS = [
  { id: 'ar1', name: 'Frostfjord Mountain View', category: 'scenic',     lat: 64.168, lng: -21.832, seed: 901, rating: 4.7 },
  { id: 'ar2', name: 'Glacier Peak Bistro',      category: 'restaurant', lat: 64.112, lng: -21.703, seed: 902, rating: 4.5, price: '$$' },
  { id: 'ar3', name: 'Aurora Mountain Lodge',    category: 'hotel',      lat: 64.182, lng: -22.014, seed: 903, rating: 4.6, price: '$220' },
  { id: 'ar4', name: 'Hellisheiði Overlook',     category: 'scenic',     lat: 64.025, lng: -21.385, seed: 904, rating: 4.8 },
  { id: 'ar5', name: 'Mosfellsbær Kitchen',      category: 'restaurant', lat: 64.167, lng: -21.697, seed: 905, rating: 4.4, price: '$$' },
  { id: 'ar6', name: 'Reykjanes Guesthouse',     category: 'hotel',      lat: 63.994, lng: -22.556, seed: 906, rating: 4.3, price: '$145' },
];

let areaResultPins = {};

/* ══════════════════════════════════════════════
   CIRCLE DRAW STATE
══════════════════════════════════════════════ */

let drawMode   = false;
let drawActive = false;        // mouse is pressed, actively dragging
let drawOrigin = null;         // { x, y } in mapArea-relative px
let drawRadius = 0;            // current radius in px
let activeCircle = null;       // { cx, cy, r, radiusKm } — finalized

/* ── Toggle draw mode on/off ── */
function toggleDrawMode() {
  drawMode = !drawMode;
  document.body.classList.toggle('draw-mode', drawMode);
  document.getElementById('drawCircleBtn').classList.toggle('toolbar-tool-btn--active', drawMode);

  const overlay = document.getElementById('circleOverlay');
  if (drawMode) {
    // Remove existing circle when re-entering draw mode
    if (activeCircle) removeCircle();
    overlay.addEventListener('mousedown', circleMouseDown);
    overlay.addEventListener('mousemove', circleMouseMove);
    overlay.addEventListener('mouseup',   circleMouseUp);
    document.addEventListener('keydown',  circleKeyDown);
    document.getElementById('footerInput').placeholder = 'Draw a circle on the map, then ask…';
  } else {
    overlay.removeEventListener('mousedown', circleMouseDown);
    overlay.removeEventListener('mousemove', circleMouseMove);
    overlay.removeEventListener('mouseup',   circleMouseUp);
    document.removeEventListener('keydown',  circleKeyDown);
    if (!activeCircle) {
      document.getElementById('footerInput').placeholder = 'Ask about your trip...';
    }
  }
}

function circleKeyDown(e) {
  if (e.key === 'Escape') {
    if (drawActive) { drawActive = false; hideSvgCircle(); }
    else            { removeCircle(); }
  }
}

/* ── Mouse handlers ── */
function circleMouseDown(e) {
  e.stopPropagation();
  const rect = document.getElementById('mapArea').getBoundingClientRect();
  drawOrigin = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  drawActive = true;
  drawRadius = 0;
  updateSvgCircle(drawOrigin.x, drawOrigin.y, 0);
}

function circleMouseMove(e) {
  if (!drawActive || !drawOrigin) return;
  const rect = document.getElementById('mapArea').getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  drawRadius = Math.hypot(mx - drawOrigin.x, my - drawOrigin.y);
  updateSvgCircle(drawOrigin.x, drawOrigin.y, drawRadius);
}

function circleMouseUp(e) {
  if (!drawActive || !drawOrigin) return;
  e.stopPropagation();
  drawActive = false;
  if (drawRadius < 20) { hideSvgCircle(); return; }  // too small — ignore
  finalizeCircle(drawOrigin.x, drawOrigin.y, drawRadius);
}

/* ── SVG circle rendering ── */
function updateSvgCircle(cx, cy, r) {
  const circ  = document.getElementById('svgCircle');
  const label = document.getElementById('circleLabel');
  circ.setAttribute('cx', cx);
  circ.setAttribute('cy', cy);
  circ.setAttribute('r',  r);
  circ.style.display = 'block';

  if (r < 10) { label.classList.remove('is-visible'); return; }

  // Position label at the right edge of the circle
  const radiusKm  = pixelsToKm(cx, cy, r);
  const driveMins = Math.round(radiusKm / 50 * 60);
  const distStr   = radiusKm >= 1 ? `${radiusKm.toFixed(1)} km` : `${Math.round(radiusKm * 1000)} m`;
  label.innerHTML = `<span class="material-symbols-rounded">timer</span>${distStr} · ${driveMins} min drive`;
  label.style.left = (cx + r * 0.7) + 'px';
  label.style.top  = (cy - r * 0.5) + 'px';
  label.classList.add('is-visible');
}

function hideSvgCircle() {
  document.getElementById('svgCircle').style.display = 'none';
  document.getElementById('circleLabel').classList.remove('is-visible');
}

/* ── Convert pixel radius to km using map projection ── */
function pixelsToKm(cx, cy, r) {
  if (!map || !mapReady) return r * 0.3; // fallback
  try {
    const proj   = map.getProjection();
    const bounds = map.getBounds();
    if (!proj || !bounds) return r * 0.3;
    const mapDiv = document.getElementById('map');
    const w = mapDiv.offsetWidth, h = mapDiv.offsetHeight;
    const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
    const nePt = proj.fromLatLngToPoint(ne), swPt = proj.fromLatLngToPoint(sw);
    function toLatLng(px, py) {
      const wx = swPt.x + (px / w) * (nePt.x - swPt.x);
      const wy = nePt.y + (py / h) * (swPt.y - nePt.y);
      return proj.fromPointToLatLng(new google.maps.Point(wx, wy));
    }
    const center = toLatLng(cx, cy);
    const edge   = toLatLng(cx + r, cy);
    return haversineKm(
      { lat: center.lat(), lng: center.lng() },
      { lat: edge.lat(),   lng: edge.lng() }
    );
  } catch { return r * 0.3; }
}

/* ── Finalize circle: show remove button + area chip ── */
function finalizeCircle(cx, cy, r) {
  const radiusKm = pixelsToKm(cx, cy, r);
  activeCircle = { cx, cy, r, radiusKm };

  // Position the remove button at the top of the circle
  const removeBtn = document.getElementById('circleRemoveBtn');
  removeBtn.style.left = cx + 'px';
  removeBtn.style.top  = (cy - r - 20) + 'px';
  removeBtn.classList.add('is-visible');

  // Show area chip in footer
  document.getElementById('areaChipRow').classList.add('is-visible');
  document.getElementById('footerInput').placeholder = 'Find things in this area…';

  // Lock the map so the circle stays aligned with geography
  if (map) map.setOptions({ draggable: false, scrollwheel: false, disableDoubleClickZoom: true, gestureHandling: 'none' });

  // Exit draw mode (circle is placed)
  drawMode = false;
  document.body.classList.remove('draw-mode');
  document.getElementById('drawCircleBtn').classList.remove('toolbar-tool-btn--active');
  const overlay = document.getElementById('circleOverlay');
  overlay.removeEventListener('mousedown', circleMouseDown);
  overlay.removeEventListener('mousemove', circleMouseMove);
  overlay.removeEventListener('mouseup',   circleMouseUp);
  document.removeEventListener('keydown',  circleKeyDown);
}

/* ── Remove the drawn circle and reset all state ── */
function removeCircle() {
  activeCircle = null;
  hideSvgCircle();
  document.getElementById('circleRemoveBtn').classList.remove('is-visible');
  document.getElementById('areaChipRow').classList.remove('is-visible');
  document.getElementById('footerInput').placeholder = 'Ask about your trip...';
  // Unlock the map
  if (map) map.setOptions({ draggable: true, scrollwheel: true, disableDoubleClickZoom: false, gestureHandling: 'auto' });
  // Remove any area result pins
  Object.values(areaResultPins).forEach(p => p.setMap(null));
  areaResultPins = {};
  // If the area-results list is showing, restore the normal suggestions
  const list = document.getElementById('suggestionsList');
  if (list?.dataset.showingAreaResults === 'true') {
    renderSuggestionCards();
    delete list.dataset.showingAreaResults;
    document.getElementById('areaResultsHeader')?.remove();
  }
  // Also exit draw mode if somehow still active
  if (drawMode) toggleDrawMode();
}

/* ══════════════════════════════════════════════
   AI AREA SEARCH
══════════════════════════════════════════════ */

function doAreaSearch(prompt) {
  // Show generating state inside the suggestions list
  const list = document.getElementById('suggestionsList');
  if (!list) return;

  // Clear current cards
  list.innerHTML = `
    <div class="area-generating">
      <div class="area-generating-dots">
        <span></span><span></span><span></span>
      </div>
      Searching within your area…
    </div>`;

  // After 1.6 s, show results
  setTimeout(showAreaResults, 1600);
}

function showAreaResults() {
  const list = document.getElementById('suggestionsList');
  if (!list) return;
  list.dataset.showingAreaResults = 'true';

  // Inject results header above the list
  let header = document.getElementById('areaResultsHeader');
  if (!header) {
    header = document.createElement('div');
    header.id = 'areaResultsHeader';
    header.className = 'area-results-header';
    list.parentNode.insertBefore(header, list);
  }
  header.innerHTML = `<strong>Places found in your area</strong>6 suggestions within ${activeCircle ? activeCircle.radiusKm.toFixed(1) + ' km' : 'the area'}`;

  // Render cards
  list.innerHTML = AREA_RESULTS.map(s => suggestionCardHTML(s)).join('');
  // Stagger reveal
  Array.from(list.querySelectorAll('.suggestion-card')).forEach((el, i) => {
    setTimeout(() => el.classList.add('is-visible'), i * 60);
  });

  // Add pins on the map
  if (mapReady) {
    AREA_RESULTS.forEach(s => {
      if (areaResultPins[s.id]) return;
      const pin = new SuggestionPin(s);
      pin.setMap(map);
      areaResultPins[s.id] = pin;
      suggPinObjs[s.id] = pin;
      setTimeout(() => pin.fadeIn?.(), 100);
    });
  }

  // Fetch photos for area result images
  AREA_RESULTS.forEach(s => fetchPlaceImage(s.name));
  setTimeout(refreshCardImages, 2000);
}
