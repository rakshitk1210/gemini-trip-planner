'use strict';

/* ══════════════════════════════════════════════
   PLACE DATA — Whidbey Island & Puget Sound, WA
══════════════════════════════════════════════ */

const PLACES = [
  // Spots
  { id: 'wi-s0', cat: 'spots', name: 'Langley Village',        lat: 47.9834, lng: -122.4091, seed: 331, desc: 'Charming waterfront village with galleries, shops, and sweeping Sound views.' },
  { id: 'wi-s1', cat: 'spots', name: "Ebey's Landing",         lat: 48.2115, lng: -122.6972, seed: 524, desc: 'National historic reserve with dramatic bluffs and one of the best coastal views in Washington.' },
  { id: 'wi-s2', cat: 'spots', name: 'Deception Pass',         lat: 48.3981, lng: -122.6453, seed: 741, desc: 'Iconic bridge over swirling tidal waters. Dramatic currents and old-growth forest.' },
  { id: 'wi-s3', cat: 'spots', name: 'Coupeville Wharf',       lat: 48.2173, lng: -122.6878, seed: 128, desc: 'Historic wharf jutting into Penn Cove. Seagulls, fresh mussels, quiet mornings.' },
  { id: 'wi-s4', cat: 'spots', name: 'Fort Casey',             lat: 48.1574, lng: -122.6754, seed: 892, desc: 'Abandoned coastal fortification with underground bunkers and panoramic water views.' },
  { id: 'wi-s5', cat: 'spots', name: 'South Whidbey State Park', lat: 48.0537, lng: -122.5492, seed: 267, desc: 'Old-growth forest meets saltwater shoreline. Quiet trails through massive cedars.' },

  // Restaurants
  { id: 'wi-r0', cat: 'restaurants', name: 'The Braeburn',       lat: 47.9851, lng: -122.4097, seed: 445, desc: 'Farm-to-table dishes using local Whidbey ingredients. Weekend brunch is unmissable.' },
  { id: 'wi-r1', cat: 'restaurants', name: 'Orchard Kitchen',    lat: 48.0821, lng: -122.5583, seed: 783, desc: 'Six-course dinners served in a working orchard. Reserve well in advance.' },
  { id: 'wi-r2', cat: 'restaurants', name: "Toby's Tavern",      lat: 48.2177, lng: -122.6876, seed: 319, desc: 'Historic tavern on the Coupeville Wharf. Penn Cove mussels steamed with local beer.' },
  { id: 'wi-r3', cat: 'restaurants', name: "Mike's Seafood",     lat: 47.9843, lng: -122.4105, seed: 612, desc: 'Unpretentious fish and chips steps from the Langley waterfront.' },
  { id: 'wi-r4', cat: 'restaurants', name: 'Saltwater Fish House', lat: 48.3943, lng: -122.6464, seed: 255, desc: 'Fresh catch from local waters. The chowder alone is worth the drive.' },
  { id: 'wi-r5', cat: 'restaurants', name: 'Café Langley',       lat: 47.9828, lng: -122.4087, seed: 576, desc: 'Mediterranean-inspired menu in the heart of the village. Great espresso.' },

  // Hotels
  { id: 'wi-h0', cat: 'hotels', name: 'Inn at Langley',         lat: 47.9847, lng: -122.4099, seed: 891, desc: 'Boutique hotel on the bluff with floor-to-ceiling Sound views and a wood-fired restaurant.' },
  { id: 'wi-h1', cat: 'hotels', name: 'Captain Whidbey Inn',    lat: 48.2191, lng: -122.7094, seed: 434, desc: 'Historic log inn on Penn Cove since 1907. Rustic rooms, excellent bar.' },
  { id: 'wi-h2', cat: 'hotels', name: 'Coupeville Inn',         lat: 48.2183, lng: -122.6882, seed: 668, desc: 'Clean, comfortable base for exploring Central Whidbey. Walking distance to the wharf.' },
  { id: 'wi-h3', cat: 'hotels', name: 'Saratoga Inn',           lat: 47.9839, lng: -122.4093, seed: 112, desc: 'Elegant B&B overlooking Saratoga Passage. Fireplace rooms, full breakfast.' },
];

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */

let map           = null;
let appState      = 'idle';   // idle | draw-mode | results

// Draw engine
let drawMode      = false;
let isDrawing     = false;
let drawPoints    = [];
let drawStroke    = null;
let drawnShape    = null;
let drawListeners = [];

// Results
let visiblePlaces = [];
let placeMarkers  = {};       // placeId → PhotoPin
let activeChipCat = null;

/* ══════════════════════════════════════════════
   PHOTO PIN — custom OverlayView
══════════════════════════════════════════════ */

const TEARDROP_PATH =
  'M18 1C8.059 1 1 8.059 1 18C1 28.5 18 41 18 41C18 41 35 28.5 35 18C35 8.059 27.941 1 18 1Z';

class PhotoPin extends google.maps.OverlayView {
  constructor(place) {
    super();
    this.place = place;
    this.el    = null;
    this._op   = 0;
    this._z    = 10;
  }

  onAdd() {
    const p  = this.place;
    const el = document.createElement('div');
    el.className      = 'photo-pin';
    el.style.opacity  = this._op;
    el.style.zIndex   = this._z;
    el.innerHTML = `
      <div class="pin-shell">
        <svg class="pin-shape" viewBox="0 0 36 42" width="36" height="42" xmlns="http://www.w3.org/2000/svg">
          <path d="${TEARDROP_PATH}" fill="white" stroke="#DADCE0" stroke-width="1"/>
        </svg>
        <img class="pin-photo" src="https://picsum.photos/seed/${p.seed}/68/68" alt="">
      </div>
      <div class="pin-name">${p.name}</div>
    `;
    this.el = el;
    this.getPanes().overlayMouseTarget.appendChild(el);
  }

  draw() {
    if (!this.el) return;
    const proj = this.getProjection();
    if (!proj) return;
    const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.place.lat, this.place.lng));
    if (!pt) return;
    this.el.style.left = Math.round(pt.x - 38) + 'px';
    this.el.style.top  = Math.round(pt.y - 41) + 'px';
  }

  onRemove() {
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }

  setOpacity(op) {
    this._op = op;
    if (this.el) this.el.style.opacity = op;
  }

  setZIndex(z) {
    this._z = z;
    if (this.el) this.el.style.zIndex = z;
  }
}

/* ══════════════════════════════════════════════
   COORDINATE HELPERS
══════════════════════════════════════════════ */

function latLngFromEvent(e) {
  if (!map) return null;
  const rect   = document.getElementById('map').getBoundingClientRect();
  const bounds = map.getBounds();
  if (!bounds) return null;
  const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
  return {
    lat: ne.lat() - ((e.clientY - rect.top)  / rect.height) * (ne.lat() - sw.lat()),
    lng: sw.lng() + ((e.clientX - rect.left) / rect.width)  * (ne.lng() - sw.lng()),
  };
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/* ══════════════════════════════════════════════
   STATE MACHINE
══════════════════════════════════════════════ */

function setState(state) {
  appState = state;
  document.body.dataset.state = state;
}

/* ══════════════════════════════════════════════
   MAP INIT
══════════════════════════════════════════════ */

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 48.05, lng: -122.52 },
    zoom: 10,
    disableDefaultUI: true,
    gestureHandling: 'auto',
    styles: [
      { featureType: 'poi',     elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'road',    elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    ],
  });
}

function zoomIn()  { if (map) map.setZoom(map.getZoom() + 1); }
function zoomOut() { if (map) map.setZoom(map.getZoom() - 1); }

/* ══════════════════════════════════════════════
   EXPLORE ENTRY POINT
══════════════════════════════════════════════ */

function startExplore() {
  if (appState === 'draw-mode') {
    cancelDraw();
    return;
  }
  if (appState === 'results') {
    redrawArea();
    return;
  }
  enterDrawMode();
}

function enterDrawMode() {
  setState('draw-mode');
  drawMode = true;
  if (map) map.setOptions({ draggable: false, gestureHandling: 'none' });
  setupDrawListeners();
}

function exitDrawMode() {
  drawMode  = false;
  isDrawing = false;
  if (map) map.setOptions({ draggable: true, gestureHandling: 'auto' });
  removeDrawListeners();
}

function cancelDraw() {
  clearStroke();
  exitDrawMode();
  setState('idle');
}

function clearStroke() {
  if (drawStroke) { drawStroke.setMap(null); drawStroke = null; }
  drawPoints = [];
}

/* ══════════════════════════════════════════════
   DRAW LISTENERS
══════════════════════════════════════════════ */

function setupDrawListeners() {
  const overlay = document.getElementById('drawOverlay');

  const onDown = e => {
    if (!drawMode) return;
    e.preventDefault();
    isDrawing  = true;
    drawPoints = [];
    clearStroke();

    drawStroke = new google.maps.Polyline({
      path: [], strokeColor: '#1a73e8',
      strokeWeight: 2.5, strokeOpacity: 0.7,
      map, clickable: false, zIndex: 12,
    });

    const ll = latLngFromEvent(e);
    if (ll) { drawPoints.push(ll); drawStroke.setPath(drawPoints); }
  };

  const onMove = e => {
    if (!drawMode || !isDrawing) return;
    const ll = latLngFromEvent(e);
    if (!ll) return;
    drawPoints.push(ll);
    if (drawStroke) drawStroke.setPath(drawPoints);
  };

  const onUp = () => {
    if (!drawMode || !isDrawing) return;
    isDrawing = false;
    commitDraw();
  };

  overlay.addEventListener('mousedown', onDown);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup',   onUp);
  drawListeners = [
    { el: overlay,  type: 'mousedown', fn: onDown },
    { el: document, type: 'mousemove', fn: onMove },
    { el: document, type: 'mouseup',   fn: onUp   },
  ];
}

function removeDrawListeners() {
  drawListeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
  drawListeners = [];
}

/* ══════════════════════════════════════════════
   COMMIT DRAW
══════════════════════════════════════════════ */

function commitDraw() {
  if (drawStroke) { drawStroke.setMap(null); drawStroke = null; }

  if (drawPoints.length < 3) {
    showInvalidDraw();
    return;
  }

  exitDrawMode();

  if (drawnShape) drawnShape.setMap(null);
  drawnShape = new google.maps.Polygon({
    paths: drawPoints,
    strokeColor: 'rgba(26,115,232,0.4)', strokeWeight: 1.5, strokeOpacity: 1,
    fillColor: '#1a73e8', fillOpacity: 0.08,
    map, clickable: false, zIndex: 6,
  });

  showResults();
}

function showInvalidDraw() {
  let hint = document.getElementById('drawErrorHint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'drawErrorHint';
    hint.className = 'draw-error-hint';
    hint.textContent = 'Draw a larger area to search';
    document.getElementById('stage').appendChild(hint);
  }
  hint.classList.add('visible');
  setTimeout(() => hint.classList.remove('visible'), 2000);
  isDrawing  = false;
  drawPoints = [];
}

/* ══════════════════════════════════════════════
   RESULTS
══════════════════════════════════════════════ */

function showResults() {
  visiblePlaces = PLACES;
  activeChipCat = null;
  document.querySelectorAll('.chip-pill[data-cat]').forEach(c => c.classList.remove('active'));

  setState('results');
  renderPins(visiblePlaces);
  showResultPill(visiblePlaces.length);
}

/* ══════════════════════════════════════════════
   PIN RENDERING
══════════════════════════════════════════════ */

function renderPins(places) {
  clearAllPins();
  const shuffled = [...places].sort(() => Math.random() - 0.5);
  shuffled.forEach((place, i) => {
    setTimeout(() => addPin(place), 28 * i);
  });
}

function addPin(place) {
  const pin = new PhotoPin(place);
  pin.setMap(map);
  placeMarkers[place.id] = pin;

  let op = 0;
  const fadeIn = setInterval(() => {
    op = Math.min(1, op + 0.12);
    pin.setOpacity(op);
    if (op >= 1) clearInterval(fadeIn);
  }, 16);
}

function clearAllPins() {
  Object.values(placeMarkers).forEach(m => m.setMap(null));
  placeMarkers = {};
}

/* ══════════════════════════════════════════════
   CHIP FILTER — single-select
══════════════════════════════════════════════ */

function filterByChip(btn, cat) {
  if (activeChipCat === cat) {
    activeChipCat = null;
    btn.classList.remove('active');
  } else {
    document.querySelectorAll('.chip-pill[data-cat]').forEach(c => c.classList.remove('active'));
    activeChipCat = cat;
    btn.classList.add('active');
  }
  applyChipFilter();
}

function applyChipFilter() {
  visiblePlaces.forEach(p => {
    const m = placeMarkers[p.id];
    if (!m) return;
    const show = !activeChipCat || p.cat === activeChipCat;
    m.setOpacity(show ? 1 : 0.12);
    m.setZIndex(show ? 10 : 4);
  });

  const count = activeChipCat
    ? visiblePlaces.filter(p => p.cat === activeChipCat).length
    : visiblePlaces.length;
  showResultPill(count);
}

/* ══════════════════════════════════════════════
   SEARCH
══════════════════════════════════════════════ */

function openSearch() {
  document.getElementById('searchBar').classList.add('open');
  const chipBar = document.getElementById('chipBar');
  chipBar.style.opacity      = '0';
  chipBar.style.pointerEvents = 'none';
  document.getElementById('searchInput').focus();
}

function closeSearch() {
  document.getElementById('searchBar').classList.remove('open');
  document.getElementById('searchInput').value = '';
  const chipBar = document.getElementById('chipBar');
  chipBar.style.opacity      = '';
  chipBar.style.pointerEvents = '';
  applyChipFilter();
}

function onSearchInput() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  filterBySearch(q);
}

function onSearchKey(e) {
  if (e.key === 'Enter')  doSearch();
  if (e.key === 'Escape') closeSearch();
}

function doSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  filterBySearch(q);
}

function filterBySearch(q) {
  visiblePlaces.forEach(p => {
    const m = placeMarkers[p.id];
    if (!m) return;
    const match = !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
    m.setOpacity(match ? 1 : 0.1);
    m.setZIndex(match ? 10 : 4);
  });

  const count = q
    ? visiblePlaces.filter(p =>
        p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      ).length
    : visiblePlaces.length;

  if (q) {
    const pill = document.getElementById('resultPill');
    pill.textContent = count + ' place' + (count !== 1 ? 's' : '') + ' found';
    pill.classList.add('visible');
  } else {
    showResultPill(count);
  }
}

/* ══════════════════════════════════════════════
   RESULT PILL
══════════════════════════════════════════════ */

function showResultPill(count) {
  const pill = document.getElementById('resultPill');
  pill.textContent = count + ' place' + (count !== 1 ? 's' : '');
  pill.classList.add('visible');
}

/* ══════════════════════════════════════════════
   REDRAW
══════════════════════════════════════════════ */

function redrawArea() {
  if (drawnShape) { drawnShape.setMap(null); drawnShape = null; }
  clearAllPins();
  visiblePlaces = [];
  activeChipCat = null;
  document.querySelectorAll('.chip-pill[data-cat]').forEach(c => c.classList.remove('active'));
  if (document.getElementById('searchBar').classList.contains('open')) closeSearch();
  document.getElementById('resultPill').classList.remove('visible');
  enterDrawMode();
}

/* ══════════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (appState === 'draw-mode') cancelDraw();
    else if (document.getElementById('searchBar').classList.contains('open')) closeSearch();
  }
});
