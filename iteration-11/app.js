'use strict';

/* ══════════════════════════════════════════════
   PLACE DATA — Capitol Hill, Seattle
══════════════════════════════════════════════ */

const PLACES = [
  // Restaurants
  { id: 'ch-r0', cat: 'restaurants', name: 'Oddfellows Café + Bar',    lat: 47.6228, lng: -122.3199, rating: 4.6, seed: 431, desc: 'Neighborhood favorite with serious espresso and all-day brunch.' },
  { id: 'ch-r1', cat: 'restaurants', name: 'Tacos Chukis',             lat: 47.6195, lng: -122.3218, rating: 4.7, seed: 218, desc: 'Cash-preferred taqueria with genuinely tiny prices and genuinely great tacos.' },
  { id: 'ch-r2', cat: 'restaurants', name: 'Via Tribunali',            lat: 47.6243, lng: -122.3224, rating: 4.6, seed: 823, desc: 'Wood-fired Neapolitan pizza in a tight, loud, candlelit room.' },
  { id: 'ch-r3', cat: 'restaurants', name: 'Poppy',                    lat: 47.6253, lng: -122.3195, rating: 4.4, seed: 756, desc: 'Inventive seasonal menus from a James Beard-nominated kitchen.' },
  { id: 'ch-r4', cat: 'restaurants', name: 'Stateside',                lat: 47.6217, lng: -122.3203, rating: 4.5, seed: 319, desc: 'French-Vietnamese fusion — bánh mì and pâté en croûte, side by side.' },
  { id: 'ch-r5', cat: 'restaurants', name: 'Nue',                      lat: 47.6238, lng: -122.3214, rating: 4.4, seed: 542, desc: 'Global street food done with precision. Happy hour Tue–Fri 4–6pm.' },
  { id: 'ch-r6', cat: 'restaurants', name: 'Taylor Shellfish Farms',   lat: 47.6270, lng: -122.3189, rating: 4.5, seed: 677, desc: 'Fresh oysters shucked to order. Simple room, exceptional product.' },
  { id: 'ch-r7', cat: 'restaurants', name: "Rachel's Ginger Beer",     lat: 47.6221, lng: -122.3196, rating: 4.6, seed: 901, desc: 'House-brewed ginger beer in 20+ flavors. No alcohol, no apology.' },
  // Spots (views + activities + hidden gems)
  { id: 'ch-s0', cat: 'spots', name: 'Cal Anderson Park',        lat: 47.6165, lng: -122.3196, rating: 4.8, seed: 163, desc: 'Beloved reservoir park at the center of the neighborhood. Locals, dogs, bocce.' },
  { id: 'ch-s1', cat: 'spots', name: 'Volunteer Park',           lat: 47.6379, lng: -122.3162, rating: 4.7, seed: 485, desc: 'Water tower with 360° panorama, conservatory, and the Seattle Asian Art Museum.' },
  { id: 'ch-s2', cat: 'spots', name: 'Broadway + Pine',          lat: 47.6228, lng: -122.3215, rating: 4.5, seed: 729, desc: "The intersection everyone photographs. Capitol Hill's social center." },
  { id: 'ch-s3', cat: 'spots', name: 'Lake View Cemetery',       lat: 47.6393, lng: -122.3156, rating: 4.6, seed: 234, desc: "Bruce Lee's grave, city views, and a level of quiet rare in Seattle." },
  { id: 'ch-s4', cat: 'spots', name: 'Neumos',                   lat: 47.6222, lng: -122.3205, rating: 4.5, seed: 267, desc: 'The indie and alternative venue. If a show is on, do not miss it.' },
  { id: 'ch-s5', cat: 'spots', name: 'Elliott Bay Book Company', lat: 47.6189, lng: -122.3210, rating: 4.9, seed: 112, desc: 'Labyrinthine independent bookstore with a serious events calendar.' },
  { id: 'ch-s6', cat: 'spots', name: 'Melrose Market',           lat: 47.6227, lng: -122.3230, rating: 4.6, seed: 556, desc: 'Tucked-away indoor food hall: butcher, wine shop, florist, café.' },
  { id: 'ch-s7', cat: 'spots', name: 'Chophouse Row',            lat: 47.6235, lng: -122.3228, rating: 4.4, seed: 723, desc: 'Boutique retail arcade with local designers and a hidden courtyard.' },
];

const CAT_CFG = {
  restaurants: { fill: '#FA7B17' },
  spots:       { fill: '#1a73e8' },
  hotels:      { fill: '#34A853' },
};

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */

let map           = null;
let mapReady      = false;
let appState      = 'idle';   // idle | draw-mode | results

// Draw engine
let drawMode      = false;
let isDrawing     = false;
let drawPoints    = [];
let drawStroke    = null;     // google.maps.Polyline (live stroke)
let drawnShape    = null;     // google.maps.Polygon (committed shape)
let drawListeners = [];

// Results
let visiblePlaces = [];
let placeMarkers  = {};       // placeId → google.maps.Marker
let activeChipCat = null;     // single-select, null = all

/* ══════════════════════════════════════════════
   PHOTO PIN — custom OverlayView
   Matches Figma: 36×42 teardrop shell, 34×34
   circular photo, 11px name label below.
══════════════════════════════════════════════ */

// Teardrop SVG path for a 36×42 viewBox.
// Circle (r≈17) centred at (18,18); tip at (18,41).
const TEARDROP_PATH =
  'M18 1C8.059 1 1 8.059 1 18C1 28.5 18 41 18 41C18 41 35 28.5 35 18C35 8.059 27.941 1 18 1Z';

class PhotoPin extends google.maps.OverlayView {
  constructor(place) {
    super();
    this.place  = place;
    this.el     = null;
    this._op    = 0;   // start transparent for fade-in
    this._z     = 10;
  }

  onAdd() {
    const p   = this.place;
    const el  = document.createElement('div');
    el.className    = 'photo-pin';
    el.style.opacity = this._op;
    el.style.zIndex  = this._z;
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
    // Centre pin horizontally; align teardrop tip (y=41 of 42px) with the lat/lng point
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
  const rect = document.getElementById('map').getBoundingClientRect();
  let bounds = map.getBounds();

  if (!bounds) {
    const center = map.getCenter();
    if (!center) return null;
    const scale    = 256 * Math.pow(2, map.getZoom());
    const lngPerPx = 360 / scale;
    const latPerPx = 360 / scale;
    const hw = rect.width  / 2 * lngPerPx;
    const hh = rect.height / 2 * latPerPx;
    bounds = {
      getNorthEast: () => ({ lat: () => center.lat() + hh, lng: () => center.lng() + hw }),
      getSouthWest: () => ({ lat: () => center.lat() - hh, lng: () => center.lng() - hw }),
    };
  }

  const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
  return {
    lat: ne.lat() - ((e.clientY - rect.top)  / rect.height) * (ne.lat() - sw.lat()),
    lng: sw.lng() + ((e.clientX - rect.left) / rect.width)  * (ne.lng() - sw.lng()),
  };
}

function latLngToScreenXY(lat, lng) {
  if (!map) return null;
  const bounds = map.getBounds();
  if (!bounds) return null;
  const rect = document.getElementById('map').getBoundingClientRect();
  const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
  return {
    x: rect.left + ((lng - sw.lng()) / (ne.lng() - sw.lng())) * rect.width,
    y: rect.top  + ((ne.lat() - lat) / (ne.lat() - sw.lat())) * rect.height,
  };
}

function polygonCentroid(points) {
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
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
    center: { lat: 47.6219, lng: -122.3209 },
    zoom: 14,
    disableDefaultUI: true,
    gestureHandling: 'auto',
    styles: [
      { featureType: 'poi',     elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'road',    elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    ],
  });
  mapReady = true;
}

function zoomIn()  { if (map) map.setZoom(map.getZoom() + 1); }
function zoomOut() { if (map) map.setZoom(map.getZoom() - 1); }

/* ══════════════════════════════════════════════
   DRAW ENGINE
══════════════════════════════════════════════ */

function startExplore() {
  if (appState === 'draw-mode') { cancelDraw(); return; }
  if (appState === 'results')   { redrawArea(); return; }
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

function setupDrawListeners() {
  const overlay = document.getElementById('drawOverlay');

  const onDown = e => {
    if (!drawMode) return;
    e.preventDefault();
    isDrawing  = true;
    drawPoints = [];
    clearStroke();

    // Create stroke before latLngFromEvent so onMove can record even if first point conversion fails
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
  // Attach move/up to document so events aren't lost when cursor leaves overlay mid-drag
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

function commitDraw() {
  const MIN_POINTS = 3;

  // Remove live stroke polyline but preserve drawPoints for validation + polygon creation
  if (drawStroke) { drawStroke.setMap(null); drawStroke = null; }

  if (drawPoints.length < MIN_POINTS) {
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
  let inArea = PLACES.filter(p => pointInPolygon({ lat: p.lat, lng: p.lng }, drawPoints));
  if (inArea.length < 3) inArea = PLACES;

  visiblePlaces = inArea;
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
   CHIP FILTER (single-select)
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
  // Hide chip bar using inline style so it overrides the results-state CSS
  const chipBar = document.getElementById('chipBar');
  chipBar.style.opacity = '0';
  chipBar.style.pointerEvents = 'none';
  document.getElementById('searchInput').focus();
}

function closeSearch() {
  document.getElementById('searchBar').classList.remove('open');
  document.getElementById('searchInput').value = '';
  // Restore chip bar
  const chipBar = document.getElementById('chipBar');
  chipBar.style.opacity = '';
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
    ? visiblePlaces.filter(p => p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)).length
    : visiblePlaces.length;
  showResultPill(count);
}

/* ══════════════════════════════════════════════
   RESULT PILL
══════════════════════════════════════════════ */

function showResultPill(count) {
  const pill = document.getElementById('resultPill');
  pill.textContent = count + ' place' + (count !== 1 ? 's' : '');
  pill.classList.add('visible');
}

function hideResultPill() {
  document.getElementById('resultPill').classList.remove('visible');
}

/* ══════════════════════════════════════════════
   REDRAW
══════════════════════════════════════════════ */

function redrawArea() {
  if (drawnShape) { drawnShape.setMap(null); drawnShape = null; }
  clearAllPins();
  visiblePlaces = [];
  activeChipCat = null;
  if (document.getElementById('searchBar').classList.contains('open')) closeSearch();
  hideResultPill();
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
