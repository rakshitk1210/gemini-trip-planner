'use strict';

/* ══════════════════════════════════════════════
   ROUTE DATA
══════════════════════════════════════════════ */

const INITIAL_ROUTE_STOPS = [
  { id: 's0', name: 'Bellingham',  lat: 48.7519, lng: -122.4787 },
  { id: 's1', name: 'Anacortes',   lat: 48.5126, lng: -122.6124 },
  { id: 's2', name: 'Everett',     lat: 47.9790, lng: -122.2021 },
  { id: 's3', name: 'Kirkland',    lat: 47.6815, lng: -122.2087 },
  { id: 's4', name: 'Seattle',     lat: 47.6062, lng: -122.3321 },
];

const INITIAL_RECOMMENDATIONS = [
  { id: 'r0', name: 'Deception Pass',    lat: 48.4050, lng: -122.6450 },
  { id: 'r1', name: 'La Conner',         lat: 48.3921, lng: -122.4975 },
  { id: 'r2', name: 'Mukilteo',          lat: 47.9487, lng: -122.3048 },
  { id: 'r3', name: 'Edmonds',           lat: 47.8107, lng: -122.3774 },
  { id: 'r4', name: 'Bothell',           lat: 47.7623, lng: -122.2054 },
  { id: 'r5', name: 'Redmond',           lat: 47.6740, lng: -122.1215 },
  { id: 'r6', name: 'Bellevue',          lat: 47.6101, lng: -122.2015 },
];

const SAVED_TRIPS = {
  seattle: {
    title: 'Seattle day trip',
    prompt: 'Explore iconic Seattle stops on a day trip — Space Needle, Pike Place Market, Capitol Hill, and Discovery Park.',
    routeStops: [
      { id: 's0', name: 'Space Needle',      lat: 47.6205, lng: -122.3493 },
      { id: 's1', name: 'Pike Place Market', lat: 47.6085, lng: -122.3396 },
      { id: 's2', name: 'Capitol Hill',      lat: 47.6253, lng: -122.3222 },
      { id: 's3', name: 'Fremont',           lat: 47.6503, lng: -122.3499 },
      { id: 's4', name: 'Discovery Park',    lat: 47.6576, lng: -122.4034 },
    ],
    recommendations: [
      { id: 'r0', name: 'Kerry Park',         lat: 47.6295, lng: -122.3600 },
      { id: 'r1', name: 'Alki Beach',         lat: 47.5810, lng: -122.4093 },
      { id: 'r2', name: 'Green Lake',         lat: 47.6805, lng: -122.3350 },
      { id: 'r3', name: 'Woodland Park',      lat: 47.6682, lng: -122.3534 },
    ],
  },
  chicago: {
    title: 'Chicago weekend trip',
    prompt: 'Weekend road trip through Chicago — Millennium Park, Navy Pier, Lincoln Park, and Wicker Park.',
    routeStops: [
      { id: 's0', name: 'Millennium Park', lat: 41.8827, lng: -87.6233 },
      { id: 's1', name: 'Navy Pier',       lat: 41.8919, lng: -87.6051 },
      { id: 's2', name: 'Lincoln Park',    lat: 41.9217, lng: -87.6368 },
      { id: 's3', name: 'Wicker Park',     lat: 41.9086, lng: -87.6798 },
      { id: 's4', name: 'Hyde Park',       lat: 41.7943, lng: -87.5907 },
    ],
    recommendations: [
      { id: 'r0', name: 'Maggie Daley Park', lat: 41.8854, lng: -87.6199 },
      { id: 'r1', name: 'Garfield Park',     lat: 41.8875, lng: -87.7173 },
      { id: 'r2', name: 'Museum Campus',     lat: 41.8655, lng: -87.6128 },
      { id: 'r3', name: 'Bucktown',          lat: 41.9193, lng: -87.6771 },
    ],
  },
};

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */

let map       = null;
let mapReady  = false;

// allSpots: routeStops first (0..N-1), then recommendations
let allSpots     = [];
let numRouteStops = 0;

// segments: array of [a, b] unordered index pairs (active connections)
let segments  = [];
let hasEdited = false;

// Map objects
let spotMarkers      = [];   // parallel to allSpots
let segmentPolylines = [];   // one per segment
let categoryMarkers  = { hotels: [], restaurants: [], scenic: [] };

// Segment selection
let selectedSeg     = null;  // [a, b]
let selectedSegPoly = null;

// Pen draw (drag to connect)
let penSourceIdx    = null;
let penCommitted    = false; // true once drag crosses threshold
let penPolyline     = null;
let penStartClient  = null;
const PEN_THRESHOLD = 8;     // px before we commit to drawing

// Edit mode toggle
let editMode = false;

// Draw (lasso) mode
let drawMode      = false;
let isDrawing     = false;
let drawPoints    = [];
let drawPolyline  = null;
let drawnPolygon  = null;
let drawListeners = [];
let areaSpotMarkers = [];

// Bookmarks
let bookmarkedSpots = [];
let bookmarkMarkers = [];
let pinPopupSpot    = null;
let pinPopupTimers  = [];

// Chat
let selectedPlaces  = [];
let generationSeed  = 0;

/* ══════════════════════════════════════════════
   COLOURS & SVG PINS
══════════════════════════════════════════════ */

const PIN_RED    = '#EA4335';
const PIN_YELLOW = '#FBBC04';
const PIN_BLUE   = '#1a73e8';

const CATEGORY_COLORS  = { hotels: '#7c3aed', restaurants: '#ea4c00', scenic: '#0f9d58' };
const CATEGORY_SYMBOL  = { hotels: 'H', restaurants: 'R', scenic: 'S' };

const BOOKMARK_PIN = {
  hotels:      'assets/pin-hotel.svg',
  restaurants: 'assets/pin-food.svg',
  scenic:      'assets/pin-scenic.svg',
};

function makeNumberedPin(num, fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34">
    <circle cx="17" cy="17" r="15" fill="${fill}" stroke="white" stroke-width="2.5"/>
    <text x="17" y="22" font-family="Google Sans,Arial,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">${num}</text>
  </svg>`;
}

function makeYellowPin() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
    <circle cx="15" cy="15" r="13" fill="${PIN_YELLOW}" stroke="white" stroke-width="2.5"/>
    <circle cx="15" cy="15" r="5" fill="white" opacity="0.9"/>
  </svg>`;
}

function makeCategoryPinSvg(color, symbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38">
    <path d="M15 0C8.925 0 4 4.925 4 11c0 8.75 11 27 11 27S26 19.75 26 11C26 4.925 21.075 0 15 0z"
          fill="${color}" stroke="white" stroke-width="1.5"/>
    <text x="15" y="14.5" font-family="Google Sans,Arial,sans-serif" font-size="10" font-weight="700"
          fill="white" text-anchor="middle">${symbol}</text>
  </svg>`;
}

/* ══════════════════════════════════════════════
   DISTANCE HELPERS
══════════════════════════════════════════════ */

function haversineKm(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function totalRouteMiles() {
  return segments.reduce((sum, [a, b]) => sum + haversineKm(allSpots[a], allSpots[b]), 0) * 0.6214;
}

/* ══════════════════════════════════════════════
   ROUTE INFO BAR
══════════════════════════════════════════════ */

function syncRouteInfoBar(selectedSegment) {
  const bar       = document.getElementById('routeInfoBar');
  const distEl    = document.getElementById('rInfoDist');
  const timeEl    = document.getElementById('rInfoTime');
  const stopsEl   = document.getElementById('rInfoStops');
  const stopsItem = document.getElementById('rInfoStopsItem');
  const stopsSep  = document.getElementById('rInfoStopsSep');
  if (!bar || !distEl) return;

  if (selectedSegment) {
    // Segment-selected: show only that leg's distance + time
    const km = haversineKm(allSpots[selectedSegment[0]], allSpots[selectedSegment[1]]);
    const mi = (km * 0.6214).toFixed(1);
    const hr = (km * 0.6214 / 55).toFixed(1);
    distEl.textContent   = mi + ' mi';
    timeEl.textContent   = hr + ' hr';
    stopsItem.style.display = 'none';
    stopsSep.style.display  = 'none';
    bar.classList.add('seg-active');
  } else {
    // Full route totals
    const mi   = totalRouteMiles().toFixed(1);
    const hr   = (totalRouteMiles() / 55).toFixed(1);
    const conn = getConnectedSet().size;
    distEl.textContent   = mi + ' mi';
    timeEl.textContent   = hr + ' hr';
    stopsEl.textContent  = conn + ' stop' + (conn !== 1 ? 's' : '');
    stopsItem.style.display = '';
    stopsSep.style.display  = '';
    bar.classList.remove('seg-active');
  }
}

/* ══════════════════════════════════════════════
   CONNECTIVITY  (BFS from index 0)
══════════════════════════════════════════════ */

function getConnectedSet() {
  if (!allSpots.length) return new Set();
  const visited = new Set([0]);
  const queue   = [0];
  while (queue.length) {
    const curr = queue.shift();
    for (const [a, b] of segments) {
      const nb = a === curr ? b : b === curr ? a : -1;
      if (nb !== -1 && !visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  return visited;
}

function hasDisconnected() {
  const conn = getConnectedSet();
  return allSpots.some((_, i) => !conn.has(i));
}

/* ══════════════════════════════════════════════
   COORDINATE HELPERS
══════════════════════════════════════════════ */

function latLngFromEvent(e) {
  if (!map) return null;
  const bounds = map.getBounds();
  if (!bounds) return null;
  const rect = document.getElementById('map').getBoundingClientRect();
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

/* ══════════════════════════════════════════════
   SPOT MARKER RENDERING
══════════════════════════════════════════════ */

function clearSpotMarkers() {
  spotMarkers.forEach(m => m && m.setMap(null));
  spotMarkers = [];
}

function buildSpotMarker(idx, connected) {
  const spot = allSpots[idx];
  const isConn = connected.has(idx);

  let svgStr, sz, anch;
  if (isConn) {
    const rank = [...connected].sort((a, b) => a - b).indexOf(idx) + 1;
    svgStr = makeNumberedPin(rank, PIN_RED);
    sz     = new google.maps.Size(34, 34);
    anch   = new google.maps.Point(17, 17);
  } else {
    svgStr = makeYellowPin();
    sz     = new google.maps.Size(30, 30);
    anch   = new google.maps.Point(15, 15);
  }

  const marker = new google.maps.Marker({
    position:  { lat: spot.lat, lng: spot.lng },
    map,
    icon: { url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr), scaledSize: sz, anchor: anch },
    title:  spot.name,
    zIndex: isConn ? 10 : 8,
    cursor: 'pointer',
  });

  // Mousedown → start pen draw
  google.maps.event.addListener(marker, 'mousedown', domEvent => {
    startPenDraw(idx, domEvent.domEvent || domEvent);
  });

  // Click (fires if no drag committed) → show spot tooltip
  marker.addListener('click', () => {
    if (!penCommitted) showSpotTooltip(spot);
  });

  return marker;
}

function renderSpotMarkers() {
  clearSpotMarkers();
  const connected = getConnectedSet();
  allSpots.forEach((_, i) => {
    spotMarkers[i] = buildSpotMarker(i, connected);
  });
}

/* ══════════════════════════════════════════════
   SEGMENT POLYLINE RENDERING
══════════════════════════════════════════════ */

function clearSegmentPolylines() {
  segmentPolylines.forEach(p => p && p.setMap(null));
  segmentPolylines = [];
}

function buildSegmentPolyline(a, b, isSelected) {
  const path = [
    { lat: allSpots[a].lat, lng: allSpots[a].lng },
    { lat: allSpots[b].lat, lng: allSpots[b].lng },
  ];
  const poly = new google.maps.Polyline({
    path,
    strokeColor:   isSelected ? '#c5221f' : PIN_BLUE,
    strokeWeight:  isSelected ? 6 : 4,
    strokeOpacity: 1,
    icons: isSelected ? [{
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
      offset: '0', repeat: '18px',
    }] : [],
    map,
    clickable: true,
    zIndex: isSelected ? 5 : 3,
  });
  poly._seg = [a, b];
  poly.addListener('click', () => onSegmentClick(a, b, poly));
  return poly;
}

function renderSegmentPolylines() {
  clearSegmentPolylines();
  segments.forEach(([a, b]) => {
    const isSel = selectedSeg && selectedSeg[0] === a && selectedSeg[1] === b;
    segmentPolylines.push(buildSegmentPolyline(a, b, isSel));
  });
}

/* ══════════════════════════════════════════════
   FULL REDRAW
══════════════════════════════════════════════ */

function redraw() {
  renderSegmentPolylines();
  renderSpotMarkers();
  syncRouteStopsList();
  syncAutoCompleteBtn();
  syncRouteInfoBar(null);
}

/* ══════════════════════════════════════════════
   SEGMENT SELECTION & DELETE
══════════════════════════════════════════════ */

function onSegmentClick(a, b, poly) {
  if (penCommitted) return;

  // Toggle deselect
  if (selectedSeg && selectedSeg[0] === a && selectedSeg[1] === b) {
    deselectSegment();
    return;
  }

  deselectSegment();
  selectedSeg     = [a, b];

  // Swap to selected style
  poly.setMap(null);
  const selPoly = buildSegmentPolyline(a, b, true);
  const idx = segmentPolylines.findIndex(p => p._seg && p._seg[0] === a && p._seg[1] === b);
  if (idx !== -1) segmentPolylines[idx] = selPoly;
  selectedSegPoly = selPoly;

  positionSegmentCard(a, b);
  document.getElementById('segmentCard').style.display = 'flex';
  syncRouteInfoBar([a, b]);
}

function deselectSegment() {
  if (!selectedSeg) return;
  const [a, b] = selectedSeg;

  // Redraw as normal
  if (selectedSegPoly) selectedSegPoly.setMap(null);
  const norm = buildSegmentPolyline(a, b, false);
  const idx = segmentPolylines.findIndex(p => p._seg && p._seg[0] === a && p._seg[1] === b);
  if (idx !== -1) segmentPolylines[idx] = norm;

  selectedSeg = null;
  selectedSegPoly = null;
  document.getElementById('segmentCard').style.display = 'none';
  syncRouteInfoBar(null);
}

function deleteSelectedSegment() {
  if (!selectedSeg) return;
  const [a, b] = selectedSeg;
  segments = segments.filter(([sa, sb]) => !(sa === a && sb === b));
  selectedSeg = null;
  selectedSegPoly = null;
  document.getElementById('segmentCard').style.display = 'none';
  hasEdited = true;
  redraw();
}

function positionSegmentCard(a, b) {
  const card = document.getElementById('segmentCard');
  if (!card || !map || !mapReady) return;
  const midLat = (allSpots[a].lat + allSpots[b].lat) / 2;
  const midLng = (allSpots[a].lng + allSpots[b].lng) / 2;
  const pos = latLngToScreenXY(midLat, midLng);
  if (!pos) return;

  const stageRect = document.querySelector('.stage').getBoundingClientRect();
  // Card is 240px wide; center it on the midpoint
  let left = pos.x - stageRect.left - 120;
  let top  = pos.y - stageRect.top  - 60;  // above the line

  const PANEL = 370, MARGIN = 12;
  left = Math.max(PANEL, Math.min(stageRect.width  - 260, left));
  top  = Math.max(70,    Math.min(stageRect.height - 80,  top));

  card.style.left = left + 'px';
  card.style.top  = top  + 'px';
}

/* ══════════════════════════════════════════════
   PEN DRAW  (drag a stop to connect)
══════════════════════════════════════════════ */

function startPenDraw(idx, domEvent) {
  if (drawMode) return;
  penSourceIdx   = idx;
  penCommitted   = false;
  penStartClient = { x: domEvent.clientX, y: domEvent.clientY };
  map.setOptions({ draggable: false, gestureHandling: 'none' });
}

document.addEventListener('mousemove', e => {
  if (penSourceIdx === null) return;

  const dx = e.clientX - penStartClient.x;
  const dy = e.clientY - penStartClient.y;

  if (!penCommitted && Math.hypot(dx, dy) > PEN_THRESHOLD) {
    penCommitted = true;
    document.body.classList.add('pen-mode');
    deselectSegment(); // clear any segment selection so card doesn't interfere

    const src = allSpots[penSourceIdx];
    penPolyline = new google.maps.Polyline({
      path: [{ lat: src.lat, lng: src.lng }, { lat: src.lat, lng: src.lng }],
      strokeColor:   PIN_BLUE,
      strokeWeight:  3,
      strokeOpacity: 0.8,
      icons: [{
        icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
        offset: '0', repeat: '12px',
      }],
      map,
      zIndex: 25,
      clickable: false,
    });
  }

  if (penCommitted && penPolyline) {
    const ll = latLngFromEvent(e);
    if (!ll) return;
    const src = allSpots[penSourceIdx];
    penPolyline.setPath([{ lat: src.lat, lng: src.lng }, ll]);

    highlightNearestSnap(e.clientX, e.clientY);
    highlightBookmarkSnap(e.clientX, e.clientY);
  }
});

document.addEventListener('mouseup', e => {
  if (penSourceIdx === null) return;

  map.setOptions({ draggable: true, gestureHandling: 'auto' });
  document.body.classList.remove('pen-mode');
  clearSnapHighlight();
  clearBookmarkSnapHighlight();

  if (penPolyline) { penPolyline.setMap(null); penPolyline = null; }

  if (penCommitted) {
    const targetIdx = findSnapTarget(e.clientX, e.clientY, penSourceIdx);
    if (targetIdx !== -1) {
      const a = Math.min(penSourceIdx, targetIdx);
      const b = Math.max(penSourceIdx, targetIdx);
      if (!segments.some(([sa, sb]) => sa === a && sb === b)) {
        segments.push([a, b]);
        hasEdited = true;
        flashConnectionMade(penSourceIdx, targetIdx);
      }
      redraw();
    } else {
      // Check if dropped on a bookmarked place
      const { spot: bmSpot } = findBookmarkSnapTarget(e.clientX, e.clientY);
      if (bmSpot) connectToBookmark(penSourceIdx, bmSpot);
      else redraw();
    }
  }

  penSourceIdx   = null;
  penCommitted   = false;
  penStartClient = null;
});

let _snapHighlightIdx  = -1;
let _bookmarkSnapIdx   = -1;

function highlightNearestSnap(clientX, clientY) {
  const target = findSnapTarget(clientX, clientY, penSourceIdx);
  if (target === _snapHighlightIdx) return;

  clearSnapHighlight();
  _snapHighlightIdx = target;

  if (target !== -1 && spotMarkers[target]) {
    // Briefly scale up the target marker icon to signal snap
    const spot = allSpots[target];
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42">
      <circle cx="21" cy="21" r="18" fill="${getConnectedSet().has(target) ? PIN_RED : PIN_YELLOW}" stroke="${PIN_BLUE}" stroke-width="3"/>
      <circle cx="21" cy="21" r="7" fill="white" opacity="0.9"/>
    </svg>`;
    spotMarkers[target].setIcon({
      url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr),
      scaledSize: new google.maps.Size(42, 42),
      anchor: new google.maps.Point(21, 21),
    });
  }
}

function clearSnapHighlight() {
  if (_snapHighlightIdx !== -1 && spotMarkers[_snapHighlightIdx]) {
    // Restore the marker's normal appearance
    const connected = getConnectedSet();
    const idx = _snapHighlightIdx;
    spotMarkers[idx].setMap(null);
    spotMarkers[idx] = buildSpotMarker(idx, connected);
  }
  _snapHighlightIdx = -1;
}

function findSnapTarget(clientX, clientY, excludeIdx) {
  const SNAP_RADIUS = 52; // px
  let nearest = -1, nearestDist = Infinity;
  allSpots.forEach((spot, i) => {
    if (i === excludeIdx) return;
    const pos = latLngToScreenXY(spot.lat, spot.lng);
    if (!pos) return;
    const d = Math.hypot(clientX - pos.x, clientY - pos.y);
    if (d < SNAP_RADIUS && d < nearestDist) { nearestDist = d; nearest = i; }
  });
  return nearest;
}

function flashConnectionMade(fromIdx, toIdx) {
  [fromIdx, toIdx].forEach(idx => {
    if (!spotMarkers[idx]) return;
    const m = spotMarkers[idx];
    const origZIndex = m.getZIndex();
    m.setZIndex(99);
    setTimeout(() => m.setZIndex(origZIndex), 300);
  });
}

/* ── Bookmark snap (drag-to-connect targets) ── */

function findBookmarkSnapTarget(clientX, clientY) {
  const SNAP_RADIUS = 56;
  let nearest = null, nearestIdx = -1, nearestDist = Infinity;
  bookmarkedSpots.forEach((spot, idx) => {
    if (allSpots.find(s => s.id === spot.id)) return; // already on route
    const pos = latLngToScreenXY(spot.lat, spot.lng);
    if (!pos) return;
    const d = Math.hypot(clientX - pos.x, clientY - pos.y);
    if (d < SNAP_RADIUS && d < nearestDist) {
      nearestDist = d; nearest = spot; nearestIdx = idx;
    }
  });
  return { spot: nearest, idx: nearestIdx };
}

function highlightBookmarkSnap(clientX, clientY) {
  const { idx } = findBookmarkSnapTarget(clientX, clientY);
  if (idx === _bookmarkSnapIdx) return;
  clearBookmarkSnapHighlight();
  _bookmarkSnapIdx = idx;
  if (idx !== -1 && bookmarkMarkers[idx]) {
    const spot = bookmarkedSpots[idx];
    bookmarkMarkers[idx].setIcon({
      url:        BOOKMARK_PIN[spot.category] || 'assets/pin-scenic.svg',
      scaledSize: new google.maps.Size(58, 58),
      anchor:     new google.maps.Point(29, 58),
    });
  }
}

function clearBookmarkSnapHighlight() {
  if (_bookmarkSnapIdx !== -1 && bookmarkMarkers[_bookmarkSnapIdx]) {
    const spot = bookmarkedSpots[_bookmarkSnapIdx];
    bookmarkMarkers[_bookmarkSnapIdx].setIcon({
      url:        BOOKMARK_PIN[spot.category] || 'assets/pin-scenic.svg',
      scaledSize: new google.maps.Size(44, 44),
      anchor:     new google.maps.Point(22, 44),
    });
  }
  _bookmarkSnapIdx = -1;
}

function connectToBookmark(sourceIdx, bmSpot) {
  // Add the bookmarked place into allSpots so the route system can own it
  let targetIdx = allSpots.findIndex(s => s.id === bmSpot.id);
  if (targetIdx === -1) {
    allSpots.push(bmSpot);
    targetIdx = allSpots.length - 1;
    // Remove its separate bookmark marker — redraw() will create a numbered spot marker
    const mIdx = bookmarkMarkers.findIndex(m => m.spotId === bmSpot.id);
    if (mIdx !== -1) { bookmarkMarkers[mIdx].setMap(null); bookmarkMarkers.splice(mIdx, 1); }
  }
  const a = Math.min(sourceIdx, targetIdx);
  const b = Math.max(sourceIdx, targetIdx);
  if (!segments.some(([sa, sb]) => sa === a && sb === b)) {
    segments.push([a, b]);
    hasEdited = true;
    flashConnectionMade(sourceIdx, targetIdx);
  }
  redraw();
}

/* ══════════════════════════════════════════════
   AUTO COMPLETE
══════════════════════════════════════════════ */

function autoCompleteRoute() {
  const connected = getConnectedSet();
  const disconnected = allSpots.map((_, i) => i).filter(i => !connected.has(i));

  // Greedy: connect each disconnected spot to its nearest connected neighbour
  for (const discIdx of disconnected) {
    let nearest = -1, nearestDeg = Infinity;
    for (const connIdx of connected) {
      const dLat = allSpots[discIdx].lat - allSpots[connIdx].lat;
      const dLng = allSpots[discIdx].lng - allSpots[connIdx].lng;
      const d = Math.sqrt(dLat * dLat + dLng * dLng);
      if (d < nearestDeg) { nearestDeg = d; nearest = connIdx; }
    }
    if (nearest !== -1) {
      const a = Math.min(discIdx, nearest), b = Math.max(discIdx, nearest);
      if (!segments.some(([sa, sb]) => sa === a && sb === b)) segments.push([a, b]);
      connected.add(discIdx);
    }
  }

  hasEdited = true;
  redraw();
  document.getElementById('autoCompleteBtn').style.display = 'none';
}

function syncAutoCompleteBtn() {
  const btn = document.getElementById('autoCompleteBtn');
  if (!btn) return;
  btn.style.display = (hasEdited && hasDisconnected()) ? 'flex' : 'none';
}

/* ══════════════════════════════════════════════
   CATEGORY MARKERS  (from iter 9)
══════════════════════════════════════════════ */

function clearCategoryMarkers() {
  Object.values(categoryMarkers).forEach(arr => arr.forEach(m => m.setMap(null)));
  categoryMarkers = { hotels: [], restaurants: [], scenic: [] };
}

function renderCategoryMarkers(places) {
  if (!map || !mapReady) return;
  clearCategoryMarkers();
  places.forEach(place => {
    const pinUrl = BOOKMARK_PIN[place.category] || 'assets/pin-scenic.svg';
    const m = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      icon: {
        url:        pinUrl,
        scaledSize: new google.maps.Size(40, 40),
        anchor:     new google.maps.Point(20, 40),
      },
      title: place.name, zIndex: 6,
    });
    m.addListener('click', e => showCategoryPopup(place, e.domEvent.clientX, e.domEvent.clientY));
    categoryMarkers[place.category]?.push(m);
  });
}

/* ══════════════════════════════════════════════
   MAP INIT
══════════════════════════════════════════════ */

window.initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 48.18, lng: -122.4 },
    zoom: 9,
    disableDefaultUI: true,
    clickableIcons:   false,
    styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
  });
  mapReady = true;

  if (allSpots.length) fitAndDraw();

  map.addListener('click', () => {
    deselectSegment();
    hidePinPopup();
    hideMapBar();
  });
};

/* ══════════════════════════════════════════════
   ROUTE INIT
══════════════════════════════════════════════ */

function initRouteData(routeStops, recommendations) {
  numRouteStops = routeStops.length;
  allSpots      = [...routeStops, ...recommendations];
  segments      = [];
  for (let i = 0; i < routeStops.length - 1; i++) segments.push([i, i + 1]);
  hasEdited     = false;
  selectedSeg   = null;
  selectedSegPoly = null;
}

function fitAndDraw() {
  if (!map || !mapReady) return;
  const bounds = new google.maps.LatLngBounds();
  allSpots.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
  map.fitBounds(bounds, { left: 400, top: 60, right: 80, bottom: 60 });
  redraw();
}

/* ══════════════════════════════════════════════
   ROUTE STOPS PANEL LIST
══════════════════════════════════════════════ */

function syncRouteStopsList() {
  const list = document.getElementById('routeStopsList');
  if (!list) return;

  const connected = getConnectedSet();
  const inOrder   = [...connected].sort((a, b) => a - b);

  if (!inOrder.length) { list.innerHTML = '<p style="padding:16px;color:#5f6368;font-size:13px">No stops connected yet.</p>'; return; }

  list.innerHTML = inOrder.map((spotIdx, rank) => {
    const stop = allSpots[spotIdx];
    const isLast = rank === inOrder.length - 1;
    const iconEl = isLast
      ? `<span class="material-symbols-rounded stop-pin">location_on</span>`
      : `<span class="material-symbols-rounded stop-circle">radio_button_unchecked</span>`;
    return `<div class="route-stop-row" data-idx="${spotIdx}">
      <span class="material-symbols-rounded stop-drag">drag_indicator</span>
      <div class="stop-icon-col">${iconEl}</div>
      <div class="stop-pill">${stop.name}</div>
      <button class="stop-remove-btn" onclick="removeRouteStop(${spotIdx})" title="Remove stop">
        <span class="material-symbols-rounded">highlight_off</span>
      </button>
    </div>`;
  }).join('');

  // Along the route photos
  const grid = document.getElementById('alongRouteGrid');
  if (grid && allSpots.length) {
    const recs = allSpots.slice(numRouteStops);
    const show = recs.slice(0, 6);
    const seeds = [201, 209, 221, 233, 215, 227, 241, 249];
    grid.innerHTML = show.map((spot, i) => `
      <div class="route-photo-card">
        <img src="https://picsum.photos/seed/${seeds[i % seeds.length]}/200/160" alt="${spot.name}">
        <div class="route-photo-overlay"></div>
        <div class="route-photo-info">
          <p class="route-photo-name">${spot.name}</p>
        </div>
      </div>`).join('');
  }
}

function removeRouteStop(spotIdx) {
  segments = segments.filter(([a, b]) => a !== spotIdx && b !== spotIdx);
  hasEdited = true;
  deselectSegment();
  redraw();
}

/* ══════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════ */

function goHome() {
  document.body.dataset.state = 'landing';
  deselectSegment();
  hidePinPopup();
  exitDrawMode();
  clearDrawing();
}

/* ══════════════════════════════════════════════
   SUBMIT PROMPT
══════════════════════════════════════════════ */

function submitPrompt() {
  const promptText = document.getElementById('promptInput').value.trim()
    || 'Explore Seattle on a 2-day road trip, discovering iconic landmarks, vibrant neighborhoods, and scenic views along the way.';

  document.body.dataset.state = 'generating';
  document.body.dataset.tab   = 'plan-ai';
  syncTabButtons('plan-ai');

  initRouteData(INITIAL_ROUTE_STOPS, INITIAL_RECOMMENDATIONS);
  clearCategoryMarkers();
  selectedPlaces = [];
  exitDrawMode();
  clearDrawing();
  document.getElementById('segmentCard').style.display   = 'none';
  document.getElementById('autoCompleteBtn').style.display = 'none';

  if (mapReady) fitAndDraw();

  // Show prompt + typing immediately in panel
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';
  addUserBubble(promptText);
  addTypingIndicator();

  setTimeout(() => {
    document.body.dataset.state = 'plan';
    removeTypingIndicator();
    addGeminiBlock(buildPlanResponse(promptText));
    syncRouteStopsList();
    }, 1200);
}

/* ══════════════════════════════════════════════
   LOAD SAVED TRIP
══════════════════════════════════════════════ */

function loadSavedTrip(tripId) {
  const trip = SAVED_TRIPS[tripId];
  if (!trip) return;

  document.body.dataset.state = 'generating';
  document.body.dataset.tab   = 'plan-ai';
  syncTabButtons('plan-ai');

  initRouteData(trip.routeStops, trip.recommendations);
  clearCategoryMarkers();
  selectedPlaces = [];
  exitDrawMode();
  clearDrawing();
  document.getElementById('segmentCard').style.display    = 'none';
  document.getElementById('autoCompleteBtn').style.display = 'none';

  if (mapReady) fitAndDraw();

  const container = document.getElementById('chatMessages');
  container.innerHTML = '';
  addUserBubble(trip.prompt);
  addTypingIndicator();

  setTimeout(() => {
    document.body.dataset.state = 'plan';
    removeTypingIndicator();
    addGeminiBlock(buildPlanResponse(trip.prompt));
    syncRouteStopsList();
    }, 1200);
}

/* ══════════════════════════════════════════════
   PLAN AI RESPONSE BUILDER
══════════════════════════════════════════════ */

const NARRATIVES = [
  s => `Explore the scenic routes around <strong>${s[0]}</strong> on a multi-day road trip. Discover charming waterfront towns, lush mountain retreats, and sweeping coastal views finishing in <strong>${s[s.length-1]}</strong>. Perfect for a getaway filled with adventure and relaxation.`,
  s => `Your route from <strong>${s[0]}</strong> to <strong>${s[s.length-1]}</strong> winds through some of the Pacific Northwest's most beautiful scenery — small towns, forested hills, and dramatic waterways. Yellow pins are AI-recommended detours worth considering.`,
  s => `A curated journey starting in <strong>${s[0]}</strong>, with ${s.length} stops through the region's highlights. Each leg brings new landscapes and local gems. Red pins are on your route — yellow pins are nearby recommendations.`,
];

function buildPlanResponse(promptText) {
  const connStops = [...getConnectedSet()].sort((a, b) => a - b).map(i => allSpots[i].name);
  const narrative = NARRATIVES[Math.floor(Math.random() * NARRATIVES.length)](connStops.length ? connStops : ['your start', 'your destination']);

  const seeds = [201, 221, 233, 209, 215, 241];
  const photoStrip = `<div class="photo-strip">
    ${seeds.slice(0,3).map(s => `<img src="https://picsum.photos/seed/${s}/200/160" alt="">`).join('')}
  </div>`;

  const planCard = `<div class="plan-created-card">
    <div class="plan-created-header">
      <span class="plan-created-label">Plan Created</span>
      <span class="material-symbols-rounded plan-created-chevron" onclick="switchTab('route')">chevron_right</span>
    </div>
    <div class="plan-created-images">
      ${seeds.slice(3,6).map(s => `<img src="https://picsum.photos/seed/${s}/120/90" alt="">`).join('')}
    </div>
  </div>`;

  return `<p>${narrative}</p>
    ${photoStrip}
    ${planCard}
    <a class="plan-link" onclick="switchTab('route')">View Route <span class="material-symbols-rounded">chevron_right</span></a>`;
}

/* ══════════════════════════════════════════════
   SPOT TOOLTIP  (simple popup on click)
══════════════════════════════════════════════ */

const PLACE_DESCRIPTIONS = {
  s0: 'Gateway to the San Juan Islands — beautiful harbor and stunning views across the Sound.',
  s1: 'Ferry hub for the islands, with a charming maritime downtown and fresh seafood.',
  s2: "Port city with a vibrant arts scene, great waterfront dining, and Boeing's museum.",
  s3: 'Walkable lakeside city known for boutique shops, waterfront parks, and the tech corridor.',
  s4: 'A world-class city — Pike Place Market, the Space Needle, and neighborhood culture galore.',
  r0: 'Dramatic tidal channels and a suspension bridge — one of the most photographed spots in Washington.',
  r1: 'A quaint Skagit Valley town surrounded by tulip fields and historic Victorian buildings.',
  r2: 'Where I-5 meets the water — catch a Washington State Ferry and watch planes land at Paine Field.',
  r3: 'Quiet beach town with a pedestrian-friendly main street and great views of the Olympics.',
  r4: 'Growing suburb with the Canyon Park tech hub and easy access to both Seattle and Eastside.',
  r5: 'Home to Microsoft campus, bike trails along the Sammamish River, and the Redmond Town Center.',
  r6: 'Gleaming skyline across the lake from Seattle — fantastic parks, food halls, and shopping.',
};

function showSpotTooltip(spot) {
  clearPinPopupTimers();
  pinPopupSpot = spot;

  const popup = document.getElementById('pin-popup');
  if (!popup) return;

  popup.querySelector('.pin-popup-name').textContent = spot.name;
  popup.querySelector('.pin-popup-meta').innerHTML = '';

  const seed = spot.id.split('').reduce((s, c) => s + c.charCodeAt(0), 42) % 280 + 100;
  popup.querySelector('.pin-popup-thumb').src = `https://picsum.photos/seed/${seed}/400/240`;

  const summaryBox = popup.querySelector('.pin-popup-summary-box');
  const skeleton   = popup.querySelector('.pin-popup-skeleton');
  const desc       = popup.querySelector('.pin-popup-desc');
  const gemini     = popup.querySelector('.pin-popup-gemini');
  const addBtn     = document.getElementById('pinPopupAddBtn');

  summaryBox.removeAttribute('hidden');
  skeleton.style.display = 'flex';
  desc.hidden = true;
  desc.textContent = '';
  gemini.textContent = '✦ Gemini …';

  const alreadySaved = bookmarkedSpots.some(b => b.id === spot.id);
  addBtn.removeAttribute('hidden');
  addBtn.textContent = alreadySaved ? 'Saved' : 'Save place';
  addBtn.disabled    = alreadySaved;
  addBtn.classList.toggle('added', alreadySaved);

  const pos = latLngToScreenXY(spot.lat, spot.lng);
  if (!pos) return;
  const stageRect = document.querySelector('.stage').getBoundingClientRect();
  const w = 220;
  const PANEL_RIGHT = stageRect.left + 370 + 8;
  let left = pos.x - w - 16;
  let top  = pos.y - 40;
  left = Math.max(PANEL_RIGHT, Math.min(stageRect.right - w - 8, left));
  top  = Math.max(60, Math.min(stageRect.bottom - 280, top));
  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';
  popup.removeAttribute('hidden');

  const t = setTimeout(() => {
    skeleton.style.display = 'none';
    desc.hidden            = false;
    gemini.textContent     = '✦ Gemini';
    const text = PLACE_DESCRIPTIONS[spot.id] || 'A great stop along your route with local character and memorable views.';
    let i = 0;
    const tw = setInterval(() => {
      desc.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(tw);
    }, 10);
    pinPopupTimers.push(tw);
  }, 900);
  pinPopupTimers.push(t);
}

function hidePinPopup() {
  const popup = document.getElementById('pin-popup');
  if (popup) popup.setAttribute('hidden', '');
}

/* ══════════════════════════════════════════════
   RIGHT TOOLBAR  (lasso / edit / zoom)
══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   DRAW (LASSO) MODE
══════════════════════════════════════════════ */

function toggleLasso() {
  if (drawMode) { exitDrawMode(); clearDrawing(); }
  else          { enterDrawMode(); }
}

function enterDrawMode() {
  drawMode = true;
  document.getElementById('lassoBtn').classList.add('active');
  document.body.dataset.drawing = 'on';
  map.setOptions({ draggable: false, gestureHandling: 'none' });
  deselectSegment();
  setupDrawListeners();
}

function exitDrawMode() {
  drawMode  = false;
  isDrawing = false;
  document.getElementById('lassoBtn').classList.remove('active');
  document.body.dataset.drawing = 'off';
  if (map) map.setOptions({ draggable: true, gestureHandling: 'auto' });
  removeDrawListeners();
  if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
  drawPoints = [];
}

function clearDrawing() {
  if (drawnPolygon) { drawnPolygon.setMap(null); drawnPolygon = null; }
  areaSpotMarkers.forEach(m => m.setMap(null));
  areaSpotMarkers = [];
  hidePinPopup();
  hideMapBar();
}

function setupDrawListeners() {
  const mapDiv = document.getElementById('map');

  const onMouseDown = e => {
    if (!drawMode) return;
    isDrawing  = true;
    drawPoints = [];
    if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
    const ll = latLngFromEvent(e);
    if (!ll) return;
    drawPoints.push(ll);
    drawPolyline = new google.maps.Polyline({
      path: drawPoints, strokeColor: PIN_BLUE,
      strokeWeight: 2.5, strokeOpacity: 0.85, map,
    });
  };

  const onMouseMove = e => {
    if (!drawMode || !isDrawing || !drawPolyline) return;
    const ll = latLngFromEvent(e);
    if (!ll) return;
    drawPoints.push(ll);
    drawPolyline.setPath(drawPoints);
  };

  const onMouseUp = () => {
    if (!drawMode || !isDrawing) return;
    isDrawing = false;
    if (drawPoints.length >= 3) commitDraw();
    else {
      if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
      drawPoints = [];
    }
  };

  mapDiv.addEventListener('mousedown', onMouseDown);
  mapDiv.addEventListener('mousemove', onMouseMove);
  mapDiv.addEventListener('mouseup',   onMouseUp);
  drawListeners = [
    { el: mapDiv, type: 'mousedown', fn: onMouseDown },
    { el: mapDiv, type: 'mousemove', fn: onMouseMove },
    { el: mapDiv, type: 'mouseup',   fn: onMouseUp   },
  ];
}

function removeDrawListeners() {
  drawListeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
  drawListeners = [];
}

function commitDraw() {
  if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
  if (drawnPolygon)   drawnPolygon.setMap(null);

  const pts = [...drawPoints];
  drawnPolygon = new google.maps.Polygon({
    paths: pts, strokeColor: PIN_BLUE, strokeWeight: 2, strokeOpacity: 0.9,
    fillColor: PIN_BLUE, fillOpacity: 0.1, map,
  });

  exitDrawMode();
  showBarBelowShape(pts);
}

function showBarBelowShape(points) {
  const bounds = map.getBounds();
  if (!bounds || !points.length) return;

  const ne     = bounds.getNorthEast(), sw = bounds.getSouthWest();
  const rect   = document.getElementById('map').getBoundingClientRect();
  const stageRect = document.querySelector('.stage').getBoundingClientRect();

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  points.forEach(p => {
    minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng);
  });

  const centerLng = (minLng + maxLng) / 2;
  const xFrac     = (centerLng - sw.lng()) / (ne.lng() - sw.lng());
  const yFrac     = (ne.lat() - minLat)    / (ne.lat() - sw.lat());

  const barMaxW = 440;
  let barLeft = rect.left - stageRect.left + xFrac * rect.width - barMaxW / 2;
  let barTop  = rect.top  - stageRect.top  + yFrac * rect.height + 20;

  const PANEL = 370;
  barLeft = Math.max(PANEL + 8, Math.min(stageRect.width - barMaxW - 16, barLeft));
  barTop  = Math.max(60, Math.min(stageRect.height - 70, barTop));

  const bar = document.getElementById('mapBar');
  bar.style.left   = barLeft + 'px';
  bar.style.top    = barTop  + 'px';
  bar.style.display = 'flex';
  document.getElementById('mapBarInput').focus();
}

function hideMapBar() {
  const bar = document.getElementById('mapBar');
  if (bar) bar.style.display = 'none';
}

/* ══════════════════════════════════════════════
   AREA SPOT PINS  (after draw query)
══════════════════════════════════════════════ */

function addAreaPinsForPlaces(places) {
  areaSpotMarkers.forEach(m => m.setMap(null));
  areaSpotMarkers = [];

  places.filter(p => p.lat && p.lng).forEach(place => {
    const pinUrl = BOOKMARK_PIN[place.category] || 'assets/pin-scenic.svg';
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      icon: {
        url:        pinUrl,
        scaledSize: new google.maps.Size(44, 44),
        anchor:     new google.maps.Point(22, 44),
      },
      title: place.name, zIndex: 20,
    });
    marker.spotId = place.id;
    marker.addListener('click', e => showCategoryPopup(place, e.domEvent.clientX, e.domEvent.clientY));
    areaSpotMarkers.push(marker);
  });
}

/* ══════════════════════════════════════════════
   MAP BAR SEND  (area query)
══════════════════════════════════════════════ */

function handleMapBarSend() {
  const input = document.getElementById('mapBarInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  hideMapBar();
  switchTab('plan-ai');
  addUserBubble(text);
  addTypingIndicator();

  const areaPlaces   = selectPlaces(text);
  const scenicFirst  = areaPlaces.filter(p => p.category === 'scenic');
  const toShow       = (scenicFirst.length ? scenicFirst : areaPlaces).slice(0, 3);

  setTimeout(() => {
    removeTypingIndicator();
    selectedPlaces = [...selectedPlaces, ...toShow];

    addGeminiBlock(`
      <p>Here are a few spots in that area you might like:</p>
      <div class="spot-list">
        ${toShow.map(place => `
          <div class="spot-card">
            <img class="spot-thumb" src="${place.photo}" alt="${place.name}" onerror="this.src='assets/photo-1.png'">
            <div class="spot-info">
              <p class="spot-name">${place.name}</p>
              <p class="spot-meta">${place.rating} ⭐ · ${place.reviews.toLocaleString()} reviews</p>
            </div>
            <button class="add-btn" data-spot-id="${place.id}" onclick="addPlaceToBookmarks('${place.id}')">Save</button>
          </div>`).join('')}
      </div>`);

    addAreaPinsForPlaces(toShow);
  }, 1100);
}

document.getElementById('mapBarInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleMapBarSend();
});

function toggleEditMode() {
  editMode = !editMode;
  document.getElementById('editBtn').classList.toggle('active', editMode);
  document.body.classList.toggle('edit-mode', editMode);
}

function zoomIn()  { if (map) map.setZoom(map.getZoom() + 1); }
function zoomOut() { if (map) map.setZoom(map.getZoom() - 1); }

/* ══════════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════════ */

function switchTab(tab) {
  document.body.dataset.tab = tab;
  syncTabButtons(tab);
}

function syncTabButtons(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ══════════════════════════════════════════════
   CHAT
══════════════════════════════════════════════ */

function handleChatSend() {
  const input = document.getElementById('chatInputField');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  switchTab('plan-ai');
  addUserBubble(text);
  addTypingIndicator();

  const newPlaces = selectPlaces(text);
  selectedPlaces  = newPlaces;

  setTimeout(() => {
    removeTypingIndicator();
    if (newPlaces.length) {
      renderCategoryMarkers(newPlaces);
      addGeminiBlock(`<p>${buildIntroText(text)}</p>${buildPhotoStripHTML(newPlaces)}${buildPlaceCardsHTML(newPlaces)}`);
    } else {
      addGeminiBlock('<p>Got it! Try asking about <strong>hotels</strong>, <strong>restaurants</strong>, or <strong>scenic spots</strong> along your route.</p>');
    }
  }, 900 + Math.random() * 500);
}

document.getElementById('chatInputField').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleChatSend();
});

function addUserBubble(text) {
  const c = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = 'user-bubble'; d.textContent = text;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}

function addGeminiBlock(html) {
  const c = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = 'gemini-block'; d.innerHTML = html;
  c.appendChild(d); c.scrollTop = c.scrollHeight;
  return d;
}

function addTypingIndicator() {
  const c = document.getElementById('chatMessages');
  const d = document.createElement('div');
  d.className = 'gemini-block typing-indicator'; d.id = 'typingIndicator';
  d.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  c.appendChild(d); c.scrollTop = c.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

/* ══════════════════════════════════════════════
   PLACE SELECTION  (from iter 9)
══════════════════════════════════════════════ */

const CITY_KEYWORDS = {
  seattle: ['seattle','washington','puget','bellingham','anacortes','everett','kirkland','tacoma','olympia','redmond'],
  chicago: ['chicago','illinois','navy pier','millennium','wrigley','wicker','lincoln park','hyde park'],
};
const CATEGORY_KEYWORDS = {
  hotels:      ['hotel','stay','sleep','lodge','inn','accommodation','resort','motel','hostel','airbnb','where to stay'],
  restaurants: ['restaurant','food','eat','dining','lunch','dinner','breakfast','brunch','cafe','cuisine','pizza','sushi','burger','bar','bistro','grill'],
  scenic:      ['scenic','nature','park','view','viewpoint','landmark','attraction','museum','sight','explore','hike','trail','beach','waterfall','garden'],
};

function detectCity(text) {
  const lower = text.toLowerCase();
  for (const [city, keys] of Object.entries(CITY_KEYWORDS)) {
    if (keys.some(k => lower.includes(k))) return city;
  }
  return 'generic';
}

function detectCategories(text) {
  const lower = text.toLowerCase(), found = [];
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keys.some(k => lower.includes(k))) found.push(cat);
  }
  return found;
}

function shufflePick(arr, n) { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

function photoUrl(place) {
  let pool = IMAGE_DB[place.category] || IMAGE_DB.scenic;
  if (place.category === 'scenic') {
    const city = place.id.startsWith('ss') ? 'seattle' : place.id.startsWith('cs') ? 'chicago' : null;
    if (city) pool = IMAGE_DB[`scenic_${city}`] || pool;
  }
  const offset  = place.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const seedNum = pool[(generationSeed + offset) % pool.length];
  return `https://picsum.photos/seed/${seedNum}/400/280`;
}

function selectPlaces(text, perCat = 3) {
  generationSeed = Math.floor(Math.random() * 99999);
  const city = detectCity(text), cats = detectCategories(text);
  const db   = PLACE_DB[city] || PLACE_DB.generic;
  const places = [];
  cats.forEach(cat => {
    const pool = db[cat] || [];
    shufflePick(pool, perCat).forEach(p => places.push({ ...p, category: cat, photo: photoUrl(p) }));
  });
  return scatterIfNeeded(places);
}

function getRouteCenterLatLng() {
  if (!allSpots.length) return { lat: 47.6, lng: -122.33 };
  return {
    lat: allSpots.reduce((s, p) => s + p.lat, 0) / allSpots.length,
    lng: allSpots.reduce((s, p) => s + p.lng, 0) / allSpots.length,
  };
}

function scatterIfNeeded(places) {
  const c = getRouteCenterLatLng();
  return places.map((p, i) => {
    if (p.lat !== 0 || p.lng !== 0) return p;
    const angle = (i / Math.max(places.length, 1)) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
    const r     = 0.04 + Math.random() * 0.12;
    return { ...p, lat: c.lat + Math.sin(angle) * r, lng: c.lng + Math.cos(angle) * r };
  });
}

/* ══════════════════════════════════════════════
   CHAT HTML BUILDERS  (from iter 9)
══════════════════════════════════════════════ */

function buildPhotoStripHTML(places) {
  if (!places.length) return '';
  return `<div class="photo-strip">${places.slice(0,3).map(p => `<img src="${p.photo}" alt="${p.name}" onerror="this.src='assets/photo-1.png'">`).join('')}</div>`;
}

function buildPlaceCardsHTML(places) {
  const groupOrder = ['hotels','restaurants','scenic'];
  const labels     = { hotels:'Hotels', restaurants:'Restaurants', scenic:'Scenic Spots' };
  const by = {};
  places.forEach(p => { (by[p.category] = by[p.category] || []).push(p); });

  return groupOrder.filter(cat => by[cat]).map(cat =>
    `<p class="place-category-label">${labels[cat]}</p>
     <div class="spot-list">${by[cat].map(place => {
       const saved = bookmarkedSpots.some(b => b.id === place.id);
       return `
      <div class="spot-card">
        <img class="spot-thumb" src="${place.photo}" alt="${place.name}" onerror="this.src='assets/photo-1.png'">
        <div class="spot-info">
          <p class="spot-name">${place.name}</p>
          <p class="spot-meta">${place.rating} ⭐ · ${place.reviews?.toLocaleString()} reviews${place.price ? ' · ' + place.price : ''}</p>
        </div>
        <button class="add-btn${saved ? ' added' : ''}" data-spot-id="${place.id}" onclick="addPlaceToBookmarks('${place.id}')"${saved ? ' disabled' : ''}>${saved ? 'Saved' : 'Save'}</button>
      </div>`;}).join('')}</div>`
  ).join('');
}

function buildIntroText(text) {
  const city = detectCity(text), cats = detectCategories(text);
  const cityLabel = city === 'generic' ? 'your destination' : city.charAt(0).toUpperCase() + city.slice(1);
  if (cats.includes('hotels') && cats.includes('restaurants')) return `Here are hotels and dining spots in <strong>${cityLabel}</strong>.`;
  if (cats.includes('hotels'))      return `Here are some great places to stay in <strong>${cityLabel}</strong>.`;
  if (cats.includes('restaurants')) return `Here are some top spots to eat in <strong>${cityLabel}</strong>.`;
  return `Here are scenic highlights and attractions in <strong>${cityLabel}</strong>.`;
}

/* ══════════════════════════════════════════════
   SAVED TAB
══════════════════════════════════════════════ */

function openSavedTab() {
  if (document.body.dataset.state !== 'landing') switchTab('saved');
}

function toggleBookmarkPanel() { openSavedTab(); }
function showBookmarkPanel()   { openSavedTab(); }
function hideBookmarkPanel()   {}

/* ══════════════════════════════════════════════
   ADD / REMOVE BOOKMARKS
══════════════════════════════════════════════ */

function addPlaceToBookmarks(spotId) {
  if (bookmarkedSpots.find(b => b.id === spotId)) return;

  const spot = selectedPlaces.find(p => p.id === spotId)
    || allSpots.find(p => p.id === spotId);
  if (!spot) return;

  bookmarkedSpots.push(spot);
  if (map && mapReady) createSingleBookmarkMarker(spot, true);
  refreshBookmarkList();

  document.querySelectorAll(`[data-spot-id="${spotId}"]`).forEach(btn => {
    if (!btn.classList.contains('bookmark-remove')) {
      btn.textContent = 'Saved';
      btn.classList.add('added');
      btn.disabled = true;
    }
  });
}

function removeBookmark(spotId) {
  const idx = bookmarkedSpots.findIndex(b => b.id === spotId);
  if (idx === -1) return;
  bookmarkedSpots.splice(idx, 1);

  const mIdx = bookmarkMarkers.findIndex(m => m.spotId === spotId);
  if (mIdx !== -1) { bookmarkMarkers[mIdx].setMap(null); bookmarkMarkers.splice(mIdx, 1); }

  refreshBookmarkList();

  document.querySelectorAll(`[data-spot-id="${spotId}"]`).forEach(btn => {
    if (!btn.classList.contains('bookmark-remove')) {
      btn.textContent = 'Save';
      btn.classList.remove('added');
      btn.disabled = false;
    }
  });
}

function createSingleBookmarkMarker(spot, visible) {
  const pinUrl = BOOKMARK_PIN[spot.category] || 'assets/pin-scenic.svg';
  const m = new google.maps.Marker({
    position: { lat: spot.lat, lng: spot.lng },
    map: visible ? map : null,
    icon: {
      url:        pinUrl,
      scaledSize: new google.maps.Size(44, 44),
      anchor:     new google.maps.Point(22, 44),
    },
    title: spot.name, zIndex: 15,
  });
  m.spotId = spot.id;
  m.addListener('click', e => showCategoryPopup(spot, e.domEvent.clientX, e.domEvent.clientY));
  bookmarkMarkers.push(m);
  return m;
}

function refreshBookmarkList() {
  const listEl   = document.getElementById('bookmarkList');
  const countEl  = document.getElementById('savedTabCount');
  if (!listEl) return;

  const n = bookmarkedSpots.length;
  if (countEl) countEl.textContent = n ? `${n} place${n !== 1 ? 's' : ''} saved` : 'No saved places yet';

  if (!n) {
    listEl.innerHTML = '<p class="bookmark-empty">No saved spots yet. Use <strong>Save place</strong> on any spot.</p>';
    return;
  }

  listEl.innerHTML = bookmarkedSpots.map(spot => {
    const cat      = spot.category || 'scenic';
    const catLabel = { hotels: 'Hotel', restaurants: 'Restaurant', scenic: 'Scenic spot' }[cat] || 'Place';
    const seed     = spot.id.split('').reduce((s, c) => s + c.charCodeAt(0), 42) % 280 + 100;
    const thumb    = spot.photo || `https://picsum.photos/seed/${seed}/200/160`;
    return `
      <div class="bookmark-item" data-spot-id="${spot.id}">
        <img class="bookmark-thumb" src="${thumb}" alt="${spot.name}" onerror="this.src='https://picsum.photos/seed/${seed}/200/160'">
        <div class="bookmark-info">
          <p class="bookmark-name">${spot.name}</p>
          <p class="bookmark-meta">${spot.rating ? spot.rating + ' ⭐ · ' : ''}${catLabel}</p>
        </div>
        <button class="bookmark-remove" onclick="removeBookmark('${spot.id}')" title="Remove">
          <span class="material-symbols-rounded">bookmark_remove</span>
        </button>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   CATEGORY POPUP  (area result pins)
══════════════════════════════════════════════ */

const CATEGORY_DESCRIPTIONS = {
  hotels:      [
    'A comfortable stay with great amenities — perfect for your road trip base.',
    'Well-rated by travelers for cleanliness, location, and friendly service.',
    'Modern hotel with easy access to local attractions and dining.',
  ],
  restaurants: [
    'Local favorite known for fresh ingredients and a welcoming atmosphere.',
    'Great spot to recharge — popular for lunch and dinner with road-trippers.',
    'Highly rated cuisine with a mix of local and classic dishes.',
  ],
  scenic: [
    'Stunning natural setting worth a detour — bring your camera.',
    "One of the area's most photographed spots, especially at golden hour.",
    'A peaceful escape with beautiful scenery and easy walking trails.',
  ],
};

function clearPinPopupTimers() {
  pinPopupTimers.forEach(t => { clearTimeout(t); clearInterval(t); });
  pinPopupTimers = [];
}

function showCategoryPopup(spot, clientX, clientY) {
  clearPinPopupTimers();
  pinPopupSpot = spot;

  const popup = document.getElementById('pin-popup');
  if (!popup) return;

  popup.querySelector('.pin-popup-name').textContent = spot.name;
  popup.querySelector('.pin-popup-meta').innerHTML = spot.rating
    ? `<span class="pin-popup-score">${spot.rating} ⭐</span><span class="pin-popup-reviews">${spot.reviews?.toLocaleString()} reviews</span>`
    : '';

  const seed = spot.id.split('').reduce((s, c) => s + c.charCodeAt(0), 42) % 280 + 100;
  popup.querySelector('.pin-popup-thumb').src = spot.photo || `https://picsum.photos/seed/${seed}/400/240`;

  const summaryBox = popup.querySelector('.pin-popup-summary-box');
  const skeleton   = popup.querySelector('.pin-popup-skeleton');
  const desc       = popup.querySelector('.pin-popup-desc');
  const gemini     = popup.querySelector('.pin-popup-gemini');
  const addBtn     = document.getElementById('pinPopupAddBtn');

  summaryBox.removeAttribute('hidden');
  skeleton.style.display = 'flex';
  desc.hidden = true;
  desc.textContent = '';
  gemini.textContent = '✦ Gemini …';

  const alreadySaved = bookmarkedSpots.some(b => b.id === spot.id);
  addBtn.removeAttribute('hidden');
  addBtn.textContent = alreadySaved ? 'Saved' : 'Save place';
  addBtn.disabled    = alreadySaved;
  addBtn.classList.toggle('added', alreadySaved);

  const stageRect = document.querySelector('.stage').getBoundingClientRect();
  const w = 220;
  const PANEL_RIGHT = stageRect.left + 370 + 8;
  let left = clientX - w - 16;
  let top  = clientY - 40;
  left = Math.max(PANEL_RIGHT, Math.min(stageRect.right - w - 8, left));
  top  = Math.max(60, Math.min(stageRect.bottom - 280, top));
  popup.style.left = left + 'px';
  popup.style.top  = top  + 'px';
  popup.removeAttribute('hidden');

  const descs = CATEGORY_DESCRIPTIONS[spot.category] || CATEGORY_DESCRIPTIONS.scenic;
  const text  = descs[Math.floor(Math.random() * descs.length)];

  const t = setTimeout(() => {
    skeleton.style.display = 'none';
    desc.hidden            = false;
    gemini.textContent     = '✦ Gemini';
    let i = 0;
    const tw = setInterval(() => {
      desc.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(tw);
    }, 10);
    pinPopupTimers.push(tw);
  }, 700);
  pinPopupTimers.push(t);
}

function pinPopupAdd() {
  if (!pinPopupSpot) return;
  addPlaceToBookmarks(pinPopupSpot.id);
  const addBtn = document.getElementById('pinPopupAddBtn');
  addBtn.textContent = 'Saved';
  addBtn.disabled    = true;
  addBtn.classList.add('added');
}

/* ══════════════════════════════════════════════
   KEYBOARD SHORTCUTS
══════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedSeg && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    deleteSelectedSegment();
  }
  if (e.key === 'Escape') {
    deselectSegment();
    hidePinPopup();
    if (drawMode) exitDrawMode();
    clearDrawing();
  }
});
