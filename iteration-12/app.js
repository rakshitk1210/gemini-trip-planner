'use strict';

/* ══════════════════════════════════════════════
   IMAGE CACHE  (Google Places Photos API)
   Uses the same API key already in index.html —
   requires &libraries=places on the script tag.
══════════════════════════════════════════════ */

// English query overrides for Icelandic place names
const SEARCH_OVERRIDES = {
  'Þingvellir':     'Thingvellir National Park Iceland',
  'Kerið Crater':   'Kerid Crater Iceland',
  'Secret Lagoon':  'Secret Lagoon Fontana Iceland',
  'Vík':            'Vik Iceland',
  'Víkurfjara':     'Vikurfjara black sand beach Iceland',
  'Dyrhólaey':      'Dyrholaey Iceland',
  'Skógafoss':      'Skogafoss waterfall Iceland',
  'Seljalandsfoss': 'Seljalandsfoss waterfall Iceland',
  'Reykjavík':      'Reykjavik Iceland',
};

const placeImages  = new Map(); // name → { small: url, thumb: url }
let   placesService = null;     // set in initMap() once the SDK is ready

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
            thumb: photo.getUrl({ maxWidth: 100 }),
          });
        }
        resolve();
      }
    );
  });
}

// Returns a cached Google photo URL, or falls back to picsum
function getImg(name, seed, size = 'small') {
  const dims  = size === 'thumb' ? '48/48' : size === 'micro' ? '56/56' : '320/176';
  const entry = placeImages.get(name);
  const url   = entry && (entry[size] ?? (size === 'micro' ? entry.thumb : null) ?? entry.small);
  return url || `https://picsum.photos/seed/${seed}/${dims}`;
}

async function preloadImages() {
  const names = [
    ...TRIP_STOPS.map(s => s.name),
    ...HOTELS.map(h => h.name),
    'Iceland Golden Circle',
    'Iceland South Coast',
  ];
  await Promise.all(names.map(fetchPlaceImage));
  updateStaticImages();
}

function updateStaticImages() {
  const dayNames = ['Geysir', 'Gullfoss', 'Víkurfjara', 'Skógafoss'];
  document.querySelectorAll('.day-img').forEach((img, i) => {
    const entry = placeImages.get(dayNames[i]);
    if (entry) img.src = entry.small;
  });

  const tripNames = ['Iceland Golden Circle', 'Iceland South Coast'];
  document.querySelectorAll('.trip-card-img').forEach((img, i) => {
    const entry = placeImages.get(tripNames[i]);
    if (entry) img.src = entry.small;
  });
}

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */

const HOTELS = [
  { name: 'Hótel Selfoss',      stars: 4.4, price: '$178', desc: 'Modern, best breakfast on the route. Skip Saturday nights — the club gets loud.',     seed: 2201, lat: 63.9343, lng: -20.9977 },
  { name: 'Hótel Kvika',        stars: 4.7, price: '$145', desc: 'Just outside Selfoss. Hot tub and sauna, dark skies, great value.',                   seed: 2342, lat: 63.9200, lng: -20.8500 },
  { name: 'Hotel Vatnsholt',    stars: 4.3, price: '$122', desc: 'Countryside base between Selfoss and Hella. Quiet, good Day 1 stopover.',              seed: 2487, lat: 63.8200, lng: -20.3800 },
  { name: 'Stracta Hotel',      stars: 4.1, price: '$95',  desc: 'Hella. Chalet-style rooms, some with private hot tubs. Ask for a renovated room.',    seed: 2618, lat: 63.8336, lng: -20.3900 },
  { name: 'Aurora Igloo South', stars: 4.3, price: '$320', desc: 'Hella. Clear igloos — novelty stay, fun any season.',                                 seed: 2755, lat: 63.8280, lng: -20.4100 },
  { name: 'Hótel Skógafoss',    stars: 4.3, price: '$229', desc: 'Right at Skógafoss. Some rooms face the waterfall. Excellent restaurant.',             seed: 2901, lat: 63.5322, lng: -19.5133 },
  { name: 'Hótel Kría',         stars: 4.5, price: '$195', desc: 'Vik. Newest hotel in town, game room, good on-site dinner. Best Day 1 endpoint.',     seed: 3034, lat: 63.4215, lng: -19.0020 },
  { name: 'The Barn',           stars: 4.5, price: '$68',  desc: 'Just outside Vik. Private rooms, ocean views, great bar. Budget pick.',               seed: 3122, lat: 63.4120, lng: -19.0260 },
];

const TRIP_STOPS = [
  { id: 1,  name: 'Þingvellir',     lat: 64.2558, lng: -21.1296, seed: 101  },
  { id: 2,  name: 'Geysir',         lat: 64.3120, lng: -20.3003, seed: 204  },
  { id: 3,  name: 'Gullfoss',       lat: 64.3269, lng: -20.1209, seed: 318  },
  { id: 6,  name: 'Seljalandsfoss', lat: 63.6158, lng: -19.9886, seed: 612  },
  { id: 11, name: 'Reykjavík',      lat: 64.1355, lng: -21.8954, seed: 1122 },
];

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */


let map              = null;
let mapReady         = false;
let routePolyline    = null;
let stopMarkers      = {};
let appState         = 'home';
let activeStops      = [...TRIP_STOPS];
let SquarePin        = null;
let HotelPin         = null;
let BookmarkPin      = null;
let animationPending = false;
let dragSrcIndex     = null;
let draggingHotelIdx = null;
let searchState      = null; // null | 'loading' | 'results'
let hotelMarkers     = [];
let savedPlaces      = {};   // keyed by 'hotel-{idx}' or 'stop-{id}'
let savedPinMarkers  = {};
let currentCardData  = null; // { key, name, seed, price, stars, lat, lng }

/* ══════════════════════════════════════════════
   STATE MACHINE
══════════════════════════════════════════════ */

function setState(state) {
  appState = state;
  document.body.dataset.state = state;
}

function goToMap() {
  if (appState !== 'home') return;

  animationPending = true;

  // ── 1. Exit home screen ──
  const homeScreen = document.getElementById('homeScreen');
  homeScreen.style.animation = 'screenExitLeft 0.28s ease forwards';

  setTimeout(() => {
    // ── 2. Switch state, render stop list ──
    setState('route');
    renderStopList();

    // ── 3. Fade map view in ──
    const mapView = document.getElementById('mapView');
    mapView.style.animation = 'screenEnter 0.32s ease forwards';
    setTimeout(() => { mapView.style.animation = ''; }, 320);

    // ── 4. Render map immediately ──
    setTimeout(renderMapAfterAI, 180);

    // ── 5. Pre-fill prompt bar with hotel search query ──
    setTimeout(() => prefillPromptInput('Show me hotels along my route'), 1400);

  }, 240);
}

function renderMapAfterAI() {
  animationPending = false;
  if (!mapReady) {
    setTimeout(renderMapAfterAI, 120);
    return;
  }
  renderPins();
  // Animate the polyline after all pins have faded in
  setTimeout(renderPolylineAnimated, activeStops.length * 60 + 300);
}

function renderPolylineAnimated() {
  if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  if (activeStops.length < 2) return;

  new google.maps.DirectionsService().route({
    origin:      { lat: activeStops[0].lat,                          lng: activeStops[0].lng },
    destination: { lat: activeStops[activeStops.length - 1].lat,     lng: activeStops[activeStops.length - 1].lng },
    waypoints:   activeStops.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
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

    // Animate: draw the full road path in ~1.5 s at ~60 fps
    const totalFrames = 90;
    const chunkSize   = Math.max(1, Math.ceil(fullPath.length / totalFrames));
    let i = 1;
    const extendPath = () => {
      for (let j = 0; j < chunkSize && i < fullPath.length; j++, i++) {
        routePolyline.getPath().push(fullPath[i]);
      }
      if (i < fullPath.length) setTimeout(extendPath, 16);
    };
    setTimeout(extendPath, 130);
  });
}


/* ══════════════════════════════════════════════
   MAP INIT — called by Maps API when loaded
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

  SquarePin = class extends google.maps.OverlayView {
    constructor(stop, number) {
      super();
      this.stop   = stop;
      this.number = number;
      this.el     = null;
    }

    onAdd() {
      const s  = this.stop;
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
      el.addEventListener('click', () => {
        const mapArea = document.querySelector('.map-area');
        const pinRect = el.getBoundingClientRect();
        const mapRect = mapArea.getBoundingClientRect();
        const pinCenterX = pinRect.left - mapRect.left + pinRect.width / 2;
        const pinTopY    = pinRect.top  - mapRect.top;
        showPlaceCard(s, pinCenterX, pinTopY);
      });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.stop.lat, this.stop.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 57) + 'px';
    }

    onRemove() {
      if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
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
  };

  // Hotel pins: 48×48 square photo + price label above (matches Figma node 306:8944)
  HotelPin = class extends google.maps.OverlayView {
    constructor(hotel, idx) {
      super();
      this.hotel = hotel;
      this.idx   = idx;
      this.el    = null;
    }

    onAdd() {
      const h  = this.hotel;
      const el = document.createElement('div');
      el.className = 'hotel-pin';
      el.innerHTML = `
        <div class="hotel-pin-price">${h.price}</div>
        <div class="hotel-pin-shell">
          <img class="hotel-pin-photo" src="${getImg(h.name, h.seed, 'thumb')}" alt="">
        </div>
        <div class="hotel-pin-tip"></div>
      `;
      el.style.opacity = '0';
      el.draggable = true;
      el.addEventListener('mousedown', e => e.stopPropagation()); // prevent map pan during drag
      el.addEventListener('dragstart', e => {
        draggingHotelIdx = this.idx;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'hotel-' + this.idx);
        setTimeout(() => { if (this.el) this.el.style.opacity = '0.4'; }, 0);
      });
      el.addEventListener('dragend', () => {
        draggingHotelIdx = null;
        if (this.el) this.el.style.opacity = '1';
      });
      el.addEventListener('click', () => showHotelCard(this.idx, el));
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.hotel.lat, this.hotel.lng)
      );
      if (!pt) return;
      // Anchor: bottom of shell (where tip is), offset so tip sits on lat/lng point
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 69) + 'px'; // 21+48 = 69px from top to bottom of shell
    }

    onRemove() {
      if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
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
  };

  // Small bookmark circle pin shown when a place is saved
  BookmarkPin = class extends google.maps.OverlayView {
    constructor(place) {
      super();
      this.place = place;
      this.el    = null;
    }

    onAdd() {
      const el = document.createElement('div');
      el.className = 'bookmark-pin';
      el.innerHTML = `<span class="material-symbols-rounded">bookmark</span>`;
      el.addEventListener('click', () => {
        const place = this.place;
        if (place.key.startsWith('hotel-')) {
          const idx = parseInt(place.key.split('-')[1], 10);
          showHotelCard(idx, el);
        } else {
          const mapArea = document.querySelector('.map-area');
          const pinRect = el.getBoundingClientRect();
          const mapRect = mapArea.getBoundingClientRect();
          const pinCenterX = pinRect.left - mapRect.left + pinRect.width / 2;
          const pinTopY    = pinRect.top  - mapRect.top;
          showPlaceCard(
            { id: parseInt(place.key.split('-')[1], 10), name: place.name, seed: place.seed, lat: place.lat, lng: place.lng },
            pinCenterX, pinTopY
          );
        }
      });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.place.lat, this.place.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 10) + 'px';
      this.el.style.top  = Math.round(pt.y - 10) + 'px';
    }

    onRemove() {
      if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
      this.el = null;
    }
  };

  mapReady = true;
  placesService = new google.maps.places.PlacesService(map);
  preloadImages();

  if (appState === 'route' && !animationPending) {
    renderPins();
    renderPolyline();
  }
}

function zoomIn()  { if (map) map.setZoom(map.getZoom() + 1); }
function zoomOut() { if (map) map.setZoom(map.getZoom() - 1); }

/* ══════════════════════════════════════════════
   PIN RENDERING
══════════════════════════════════════════════ */

function renderPins() {
  clearPins();
  activeStops.forEach((stop, i) => {
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

function renderHotelPins() {
  clearHotelPins();
  HOTELS.forEach((hotel, i) => {
    setTimeout(() => {
      const pin = new HotelPin(hotel, i);
      pin.setMap(map);
      hotelMarkers.push(pin);
      setTimeout(() => pin.fadeIn(), 20);
    }, 40 * i);
  });
  const badge = document.getElementById('showingHotelsBadge');
  if (badge) badge.style.display = 'flex';
}

function clearHotelPins() {
  hotelMarkers.forEach(m => m.setMap(null));
  hotelMarkers = [];
}

function dismissHotelPins() {
  clearHotelPins();
  const badge = document.getElementById('showingHotelsBadge');
  if (badge) badge.style.display = 'none';
  closePlaceCard();
}

/* ══════════════════════════════════════════════
   ROUTE POLYLINE
══════════════════════════════════════════════ */

function renderPolyline() {
  if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  if (activeStops.length < 2) return;

  new google.maps.DirectionsService().route({
    origin:      { lat: activeStops[0].lat,                          lng: activeStops[0].lng },
    destination: { lat: activeStops[activeStops.length - 1].lat,     lng: activeStops[activeStops.length - 1].lng },
    waypoints:   activeStops.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
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

/* ══════════════════════════════════════════════
   STOP LIST (Route tab)
══════════════════════════════════════════════ */

function renderStopList() {
  const list = document.getElementById('stopList');
  if (!list) return;
  list.innerHTML = '';

  activeStops.forEach((stop, i) => {
    const isLast = i === activeStops.length - 1;
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
      <button class="stop-remove-btn" onclick="removeStop(${stop.id})">
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
}

/* ══════════════════════════════════════════════
   STOP DRAG-TO-REORDER
══════════════════════════════════════════════ */

function stopDragStart(e) {
  dragSrcIndex = [...e.currentTarget.parentNode.children].indexOf(e.currentTarget);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcIndex);
  setTimeout(() => e.currentTarget.classList.add('is-dragging'), 0);
}

function stopDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = draggingHotelIdx !== null ? 'copy' : 'move';
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

  // Hotel pin dropped into stop list
  if (draggingHotelIdx !== null) {
    const h = HOTELS[draggingHotelIdx];
    const newStop = {
      id:   2000 + draggingHotelIdx,
      name: h.name,
      lat:  h.lat,
      lng:  h.lng,
      seed: h.seed,
    };
    activeStops.splice(dropIndex, 0, newStop);

    // Remove the hotel price pin (replaced by numbered route stop pin)
    const hm = hotelMarkers[draggingHotelIdx];
    if (hm) hm.setMap(null);

    draggingHotelIdx = null;
    renderStopList();
    if (mapReady) { renderPins(); renderPolyline(); }
    return;
  }

  // Stop-to-stop reorder
  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;

  const insertAt = dropIndex > dragSrcIndex ? dropIndex - 1 : dropIndex;
  const [moved]  = activeStops.splice(dragSrcIndex, 1);
  activeStops.splice(insertAt, 0, moved);

  renderStopList();
  if (mapReady) { renderPins(); renderPolyline(); }
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

function removeStop(id) {
  activeStops = activeStops.filter(s => s.id !== id);

  if (stopMarkers[id]) {
    stopMarkers[id].setMap(null);
    delete stopMarkers[id];
  }

  renderStopList();

  if (mapReady && routePolyline) {
    renderPolyline();
  }
}

/* ══════════════════════════════════════════════
   PLACE CARD
══════════════════════════════════════════════ */

function showPlaceCard(stop, pinCenterX, pinTopY) {
  const card    = document.getElementById('placeCard');
  const mapArea = document.querySelector('.map-area');
  const mapW    = mapArea.offsetWidth;
  const mapH    = mapArea.offsetHeight;
  const cardW   = 320;
  const cardH   = 248;
  const gap     = 12;

  let left = pinCenterX - cardW / 2;
  let top  = pinTopY - cardH - gap;

  if (top < 8) top = pinTopY + 62 + gap;

  left = Math.max(8, Math.min(left, mapW - cardW - 8));
  top  = Math.max(8, Math.min(top,  mapH - cardH - 8));

  card.style.left = left + 'px';
  card.style.top  = top  + 'px';

  document.getElementById('placeCardImg').src = getImg(stop.name, stop.seed);
  document.getElementById('placeCardName').textContent = stop.name;

  currentCardData = { key: `stop-${stop.id}`, name: stop.name, seed: stop.seed, stars: 4.7, lat: stop.lat, lng: stop.lng };
  updateBookmarkBtn();
  card.classList.add('is-visible');
}

function closePlaceCard() {
  document.getElementById('placeCard').classList.remove('is-visible');
  hotelMarkers.forEach(m => { if (m.el) m.el.classList.remove('hotel-pin--active'); });
}

function updateBookmarkBtn() {
  const icon = document.getElementById('placeCardBookmarkIcon');
  if (!icon || !currentCardData) return;
  const saved = !!savedPlaces[currentCardData.key];
  icon.textContent = saved ? 'bookmark' : 'bookmark_border';
  icon.style.color = saved ? '#1a73e8' : '';
}

function toggleSave() {
  if (!currentCardData) return;
  const key = currentCardData.key;
  if (savedPlaces[key]) {
    unsavePlace(key);
  } else {
    savedPlaces[key] = { ...currentCardData };
    if (mapReady && currentCardData.lat) {
      const pin = new BookmarkPin(currentCardData);
      pin.setMap(map);
      savedPinMarkers[key] = pin;
    }
    renderSavedList();
    updateBookmarkBtn();
  }
}

function unsavePlace(key) {
  delete savedPlaces[key];
  if (savedPinMarkers[key]) {
    savedPinMarkers[key].setMap(null);
    delete savedPinMarkers[key];
  }
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
        <img class="saved-thumb" src="${getImg(p.name, p.seed, 'micro')}" alt="">
      </div>
      <div class="saved-info">
        <div class="saved-name">${p.name}</div>
        <div class="saved-meta">
          ${p.price ? `<span>${p.price}</span><span class="saved-sep">|</span>` : ''}
          <span>${p.stars}</span>
          <span class="material-symbols-rounded saved-star">star</span>
          <span class="saved-sep">·</span>
          <span>123 reviews</span>
        </div>
      </div>
      <button class="saved-remove-btn" onclick="unsavePlace('${p.key}')">
        <span class="material-symbols-rounded">highlight_off</span>
      </button>
    </li>
  `).join('');
}

/* ══════════════════════════════════════════════
   SEARCH / FIND HOTELS
══════════════════════════════════════════════ */

function prefillPromptInput(text) {
  const input = document.getElementById('mapPromptInput');
  if (!input || input.disabled) return;
  input.value = '';
  let i = 0;
  const tick = () => {
    if (i < text.length) {
      input.value += text[i++];
      setTimeout(tick, 35);
    }
  };
  tick();
}

function submitSearch() {
  const input = document.getElementById('mapPromptInput');
  const query = input ? input.value.trim() : '';
  if (!query || searchState === 'loading') return;

  searchState = 'loading';
  if (input) { input.value = ''; input.disabled = true; input.placeholder = 'Finding hotels...'; }

  document.getElementById('searchSkeleton').classList.add('is-visible');
  setTimeout(showSearchResults, 2200);
}

function showSearchResults() {
  searchState = 'results';
  document.getElementById('searchSkeleton').classList.remove('is-visible');

  renderHotelCards();
  const section = document.getElementById('searchResultsSection');
  section.classList.add('is-visible');

  if (mapReady) renderHotelPins();

  const input = document.getElementById('mapPromptInput');
  if (input) { input.disabled = false; input.placeholder = 'Ask about your trip...'; }

  // Scroll the panel so results are visible
  const panelContent = document.querySelector('.panel-content');
  if (panelContent) {
    setTimeout(() => { panelContent.scrollTop = panelContent.scrollHeight; }, 80);
  }
}

function hotelCardHTML(h, i) {
  return `
    <div class="hotel-card" onclick="showHotelCard(${i})">
      <div class="hotel-thumb-wrap">
        <img class="hotel-thumb" src="${getImg(h.name, h.seed, 'micro')}" alt="">
      </div>
      <div class="hotel-info">
        <div class="hotel-name">${h.name}</div>
        <div class="hotel-rating-row">
          <span class="hotel-rating-score">${h.stars}</span>
          <span class="material-symbols-rounded hotel-star">star</span>
          <span class="hotel-rating-dot">·</span>
          <span class="hotel-rating-count">123 reviews</span>
        </div>
      </div>
      <div class="hotel-price-pill">${h.price}</div>
    </div>
  `;
}

function renderHotelCards() {
  const list = document.getElementById('searchResultsList');
  if (!list) return;
  const visible = HOTELS.slice(0, 3);
  const hidden  = HOTELS.slice(3);
  list.innerHTML =
    visible.map((h, i) => hotelCardHTML(h, i)).join('') +
    (hidden.length ? `
      <div id="hotelExpandRow" class="hotel-expand-row">
        <button class="hotel-expand-btn" onclick="expandHotels()">
          See all ${HOTELS.length} hotels
          <span class="material-symbols-rounded">expand_more</span>
        </button>
      </div>
    ` : '');
}

function expandHotels() {
  const list = document.getElementById('searchResultsList');
  const expandRow = document.getElementById('hotelExpandRow');
  if (!list || !expandRow) return;
  const extraHTML = HOTELS.slice(3).map((h, i) => hotelCardHTML(h, i + 3)).join('');
  expandRow.insertAdjacentHTML('beforebegin', extraHTML);
  expandRow.remove();
}

function showHotelCard(idx, el) {
  const h       = HOTELS[idx];
  const card    = document.getElementById('placeCard');
  const mapArea = document.querySelector('.map-area');
  const mapW    = mapArea.offsetWidth;
  const mapH    = mapArea.offsetHeight;
  const cardW   = 320;
  const cardH   = 248;
  const gap     = 12;

  hotelMarkers.forEach((m, i) => {
    if (m.el) m.el.classList.toggle('hotel-pin--active', i === idx);
  });

  let left, top;

  if (el) {
    // Clicked from map pin: position card above (or below) the pin, same as route stop cards
    const pinRect = el.getBoundingClientRect();
    const mapRect = mapArea.getBoundingClientRect();
    const pinCenterX = pinRect.left - mapRect.left + pinRect.width / 2;
    const pinTopY    = pinRect.top  - mapRect.top;

    left = pinCenterX - cardW / 2;
    top  = pinTopY - cardH - gap;
    if (top < 8) top = pinTopY + pinRect.height + gap;
  } else {
    // Clicked from panel list: pan map to hotel, place card at top-right to avoid center overlap
    if (map) map.panTo({ lat: h.lat, lng: h.lng });
    left = mapW - cardW - 16;
    top  = 72;
  }

  left = Math.max(8, Math.min(left, mapW - cardW - 8));
  top  = Math.max(8, Math.min(top,  mapH - cardH - 8));

  card.style.left = left + 'px';
  card.style.top  = top  + 'px';
  document.getElementById('placeCardImg').src = getImg(h.name, h.seed);
  document.getElementById('placeCardName').textContent = h.name;

  currentCardData = { key: `hotel-${idx}`, name: h.name, seed: h.seed, price: h.price, stars: h.stars, lat: h.lat, lng: h.lng };
  updateBookmarkBtn();
  card.classList.add('is-visible');
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
  if (dropdown && dropdown.classList.contains('is-open')) {
    dropdown.classList.remove('is-open');
    document.getElementById('vehicleChipChevron').textContent = 'expand_more';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('mapPromptInput');
  if (promptInput) {
    promptInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitSearch();
    });
  }
});
