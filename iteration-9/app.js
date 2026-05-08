'use strict';

/* ── Static route data ── */
const ROUTE_STOPS = [
  { num: 1, name: 'Bellingham',  lat: 48.7519, lng: -122.4787 },
  { num: 2, name: 'Anacortes',   lat: 48.5126, lng: -122.6124 },
  { num: 3, name: 'Everett',     lat: 47.9790, lng: -122.2021 },
  { num: 4, name: 'Kirkland',    lat: 47.6815, lng: -122.2087 },
  { num: 5, name: 'Seattle',     lat: 47.6062, lng: -122.3321 },
];

const SAVED_TRIPS = {
  seattle: {
    title: 'Seattle day trip',
    prompt: 'Explore iconic Seattle stops on a day trip — Space Needle, Pike Place Market, Capitol Hill, and Discovery Park.',
    stops: [
      { num: 1, name: 'Space Needle',      lat: 47.6205, lng: -122.3493 },
      { num: 2, name: 'Pike Place Market', lat: 47.6085, lng: -122.3396 },
      { num: 3, name: 'Capitol Hill',      lat: 47.6253, lng: -122.3222 },
      { num: 4, name: 'Fremont',           lat: 47.6503, lng: -122.3499 },
      { num: 5, name: 'Discovery Park',    lat: 47.6576, lng: -122.4034 },
    ],
  },
  chicago: {
    title: 'Chicago weekend trip',
    prompt: 'Weekend road trip through Chicago — Millennium Park, Navy Pier, Lincoln Park, and Wicker Park.',
    stops: [
      { num: 1, name: 'Millennium Park', lat: 41.8827, lng: -87.6233 },
      { num: 2, name: 'Navy Pier',       lat: 41.8919, lng: -87.6051 },
      { num: 3, name: 'Lincoln Park',    lat: 41.9217, lng: -87.6368 },
      { num: 4, name: 'Wicker Park',     lat: 41.9086, lng: -87.6798 },
      { num: 5, name: 'Hyde Park',       lat: 41.7943, lng: -87.5907 },
    ],
  },
};

const BAR_WIDTH = 480;
const PANEL_WIDTH = 360;

/* ── State ── */
let map        = null;
let mapReady   = false;
let pendingRoute           = false;
let pendingCategoryRender  = null;   // places to render once map is ready
let activeStops            = ROUTE_STOPS;
let routePolylines         = [];
let routeMarkers           = [];
let drawMode               = false;
let isDrawing              = false;
let drawPoints             = [];
let drawPolyline           = null;
let drawnPolygon           = null;
let drawListeners          = [];
let areaSpotMarkers        = [];
let bookmarkedSpots        = [];
let bookmarkMarkers        = [];
let categoryMarkers        = { hotels: [], restaurants: [], scenic: [] };
let selectedPlaces         = [];   // current render's places
let generationSeed         = 0;    // changes each submission → different Unsplash images

/* ═══════════════════════════════════════════════
   PLACE SELECTION  (uses PLACE_DB from data.js)
═══════════════════════════════════════════════ */

const CITY_KEYWORDS = {
  seattle:  ['seattle', 'washington', 'puget', 'bellingham', 'anacortes', 'everett', 'kirkland', 'tacoma', 'olympia', 'redmond'],
  chicago:  ['chicago', 'illinois', 'navy pier', 'millennium', 'wrigley', 'wicker', 'lincoln park', 'hyde park'],
};

const CATEGORY_KEYWORDS = {
  hotels:      ['hotel', 'stay', 'sleep', 'lodge', 'inn', 'accommodation', 'resort', 'motel', 'hostel', 'airbnb', 'where to stay'],
  restaurants: ['restaurant', 'food', 'eat', 'dining', 'lunch', 'dinner', 'breakfast', 'brunch', 'cafe', 'cuisine', 'pizza', 'sushi', 'burger', 'bar', 'bistro', 'grill'],
  scenic:      ['scenic', 'nature', 'park', 'view', 'viewpoint', 'landmark', 'attraction', 'museum', 'sight', 'explore', 'hike', 'trail', 'beach', 'waterfall', 'garden'],
};

function detectCity(text) {
  const lower = text.toLowerCase();
  for (const [city, keys] of Object.entries(CITY_KEYWORDS)) {
    if (keys.some(k => lower.includes(k))) return city;
  }
  return 'generic';
}

function detectCategories(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const [cat, keys] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keys.some(k => lower.includes(k))) found.push(cat);
  }
  return found;
}

function shufflePick(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

function getRouteCenterLatLng() {
  if (!activeStops || !activeStops.length) return { lat: 47.6, lng: -122.33 };
  const lat = activeStops.reduce((s, p) => s + p.lat, 0) / activeStops.length;
  const lng = activeStops.reduce((s, p) => s + p.lng, 0) / activeStops.length;
  return { lat, lng };
}

function scatterIfNeeded(places) {
  const center = getRouteCenterLatLng();
  return places.map((p, i) => {
    if (p.lat !== 0 || p.lng !== 0) return p;
    const angle  = (i / Math.max(places.length, 1)) * 2 * Math.PI + (Math.random() - 0.5) * 0.8;
    const radius = 0.04 + Math.random() * 0.12;
    return { ...p, lat: center.lat + Math.sin(angle) * radius, lng: center.lng + Math.cos(angle) * radius };
  });
}

function photoUrl(place) {
  // Pick from the IMAGE_DB seed pool for this category.
  // picsum.photos/seed/{n}/w/h — always loads, no auth, beautiful photos.
  let pool = IMAGE_DB[place.category] || IMAGE_DB.scenic;

  if (place.category === 'scenic') {
    const city = place.id.startsWith('ss') ? 'seattle'
               : place.id.startsWith('cs') ? 'chicago'
               : null;
    if (city) pool = IMAGE_DB[`scenic_${city}`] || pool;
  }

  // generationSeed changes each submission → different image each query.
  // offset is stable per place → same place gets same image within one response.
  const offset    = place.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const seedNum   = pool[(generationSeed + offset) % pool.length];
  return `https://picsum.photos/seed/${seedNum}/400/280`;
}

function selectPlaces(text, perCategory = 3) {
  generationSeed = Math.floor(Math.random() * 99999);

  const city       = detectCity(text);
  const categories = detectCategories(text);
  const db         = PLACE_DB[city] || PLACE_DB.generic;

  let places = [];
  categories.forEach(cat => {
    const pool   = db[cat] || [];
    const picked = shufflePick(pool, perCategory);
    picked.forEach(p => places.push({ ...p, category: cat, photo: photoUrl(p) }));
  });

  return scatterIfNeeded(places);
}

/* ═══════════════════════════════════════════════
   MAP MARKERS  (category-coloured)
═══════════════════════════════════════════════ */

const CATEGORY_COLORS = { hotels: '#7c3aed', restaurants: '#ea4c00', scenic: '#0f9d58' };
const CATEGORY_SYMBOL = { hotels: 'H', restaurants: 'R', scenic: 'S' };

function makeCategoryPin(color, symbol) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38">
    <path d="M15 0C8.925 0 4 4.925 4 11c0 8.75 11 27 11 27S26 19.75 26 11C26 4.925 21.075 0 15 0z"
          fill="${color}" stroke="white" stroke-width="1.5"/>
    <text x="15" y="14.5" font-family="Google Sans,Arial,sans-serif" font-size="10" font-weight="700"
          fill="white" text-anchor="middle">${symbol}</text>
  </svg>`;
}

function clearCategoryMarkers() {
  Object.values(categoryMarkers).forEach(arr => arr.forEach(m => m.setMap(null)));
  categoryMarkers = { hotels: [], restaurants: [], scenic: [] };
}

function renderCategoryMarkers(places) {
  if (!map || !mapReady) { pendingCategoryRender = places; return; }
  clearCategoryMarkers();

  places.forEach(place => {
    const color  = CATEGORY_COLORS[place.category] || '#1a73e8';
    const symbol = CATEGORY_SYMBOL[place.category] || '•';
    const svg    = makeCategoryPin(color, symbol);

    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      icon: {
        url:        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(30, 38),
        anchor:     new google.maps.Point(15, 38),
      },
      title:  place.name,
      zIndex: 8,
    });

    const bucket = place.category;
    if (!categoryMarkers[bucket]) categoryMarkers[bucket] = [];
    categoryMarkers[bucket].push(marker);
  });
}

/* ═══════════════════════════════════════════════
   CHAT HTML BUILDERS
═══════════════════════════════════════════════ */

function buildPhotoStripHTML(places) {
  if (!places.length) return '';
  const three = places.slice(0, 3);
  return `<div class="photo-strip">
    ${three.map(p => `<img src="${p.photo}" alt="${p.name}" onerror="this.src='assets/photo-1.png'">`).join('')}
  </div>`;
}

function buildPlaceCardsHTML(places) {
  const groupOrder = ['hotels', 'restaurants', 'scenic'];
  const labels     = { hotels: 'Hotels', restaurants: 'Restaurants', scenic: 'Scenic Spots' };
  const byCategory = {};
  places.forEach(p => { (byCategory[p.category] = byCategory[p.category] || []).push(p); });

  return groupOrder
    .filter(cat => byCategory[cat])
    .map(cat => {
      const items = byCategory[cat];
      const cards = items.map(place => {
        const meta = place.price
          ? `${place.rating} ⭐ · ${place.reviews.toLocaleString()} reviews · ${place.price}`
          : `${place.rating} ⭐ · ${place.reviews.toLocaleString()} reviews`;
        return `<div class="spot-card">
          <img class="spot-thumb" src="${place.photo}" alt="${place.name}" onerror="this.src='assets/photo-1.png'">
          <div class="spot-info">
            <p class="spot-name">${place.name}</p>
            <p class="spot-meta">${meta}</p>
          </div>
          <button class="add-btn" data-spot-id="${place.id}" onclick="addPlaceToBookmarks('${place.id}')">Add</button>
        </div>`;
      }).join('');
      return `<p class="place-category-label">${labels[cat]}</p><div class="spot-list">${cards}</div>`;
    }).join('');
}

function buildIntroText(text) {
  const city = detectCity(text);
  const cats = detectCategories(text);
  const cityLabel = city === 'generic' ? 'your destination' : city.charAt(0).toUpperCase() + city.slice(1);
  if (cats.length === 3) return `Here's a curated selection of places for your trip to <strong>${cityLabel}</strong> — hotels, restaurants, and top attractions mapped along your route.`;
  if (cats.includes('hotels'))      return `Here are some great places to stay in <strong>${cityLabel}</strong>.`;
  if (cats.includes('restaurants')) return `Here are some top spots to eat in <strong>${cityLabel}</strong>.`;
  return `Here are scenic highlights and attractions in <strong>${cityLabel}</strong>.`;
}

/* ═══════════════════════════════════════════════
   BOOKMARKS  (places-aware)
═══════════════════════════════════════════════ */

function addPlaceToBookmarks(spotId) {
  const spot = selectedPlaces.find(s => s.id === spotId);
  if (!spot || bookmarkedSpots.find(s => s.id === spotId)) return;

  bookmarkedSpots.push({ ...spot, distance: null });
  refreshBookmarkList();

  const marker = createSingleBookmarkMarker(spot, document.body.dataset.tab === 'bookmark');
  bookmarkMarkers.push(marker);

  document.querySelectorAll(`.add-btn[data-spot-id="${spotId}"]`).forEach(btn => {
    btn.textContent = 'Added';
    btn.disabled    = true;
    btn.classList.add('added');
  });
}

function refreshBookmarkList() {
  const list = document.getElementById('bookmarkList');
  if (!list) return;
  if (!bookmarkedSpots.length) {
    list.innerHTML = `<p class="bookmark-empty">No saved spots yet. Use Add in Plan AI to save spots here.</p>`;
    return;
  }
  list.innerHTML = bookmarkedSpots.map(spot => `
    <div class="bookmark-item" data-id="${spot.id}">
      <img class="bookmark-thumb" src="${spot.photo || 'assets/photo-1.png'}" alt="${spot.name}"
           onerror="this.src='assets/photo-1.png'">
      <div class="bookmark-info">
        <div class="bookmark-name">${spot.name}</div>
        <div class="bookmark-meta">${spot.rating} ⭐ · ${spot.reviews.toLocaleString()} reviews${spot.distance ? ' · ' + spot.distance : ''}</div>
      </div>
      <button class="bookmark-remove" onclick="removeBookmark('${spot.id}')" title="Remove">
        <span class="material-symbols-rounded">bookmark_remove</span>
      </button>
    </div>
  `).join('');
}

function createBookmarkMarkers(spots) {
  bookmarkMarkers.forEach(m => m.setMap(null));
  bookmarkMarkers = [];
  if (!map || !mapReady) return;
  const show = document.body.dataset.tab === 'bookmark';
  spots.forEach(spot => bookmarkMarkers.push(createSingleBookmarkMarker(spot, show)));
}

function createSingleBookmarkMarker(spot, visible) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40">
    <path d="M16 0C9.373 0 4 5.373 4 12c0 9.5 12 28 12 28S28 21.5 28 12C28 5.373 22.627 0 16 0z"
          fill="#FBBC04" stroke="white" stroke-width="1.5"/>
    <path d="M11.5 7h9v14l-4.5-3.5L11.5 21V7z" fill="white"/>
  </svg>`;
  return new google.maps.Marker({
    position: { lat: spot.lat, lng: spot.lng },
    map: visible ? map : null,
    icon: {
      url:        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 40),
      anchor:     new google.maps.Point(16, 40),
    },
    title:  spot.name,
    zIndex: 15,
  });
}

function syncBookmarkMarkers() {
  const show = document.body.dataset.tab === 'bookmark';
  bookmarkMarkers.forEach(m => m.setMap(show ? map : null));
}

function removeBookmark(spotId) {
  const idx = bookmarkedSpots.findIndex(s => s.id === spotId);
  if (idx === -1) return;
  bookmarkedSpots.splice(idx, 1);
  const marker = bookmarkMarkers.splice(idx, 1)[0];
  if (marker) marker.setMap(null);
  refreshBookmarkList();
}

/* ═══════════════════════════════════════════════
   MAP INIT
═══════════════════════════════════════════════ */

window.initMap = function () {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 48.18, lng: -122.4 },
    zoom: 9,
    disableDefaultUI: true,
    clickableIcons: false,
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    ],
  });

  mapReady = true;

  if (pendingRoute) {
    drawRoute();
    pendingRoute = false;
  }
  if (pendingCategoryRender) {
    renderCategoryMarkers(pendingCategoryRender);
    pendingCategoryRender = null;
  }
  createBookmarkMarkers(bookmarkedSpots);
};

/* ═══════════════════════════════════════════════
   ROUTE DRAWING
═══════════════════════════════════════════════ */

function drawRoute() {
  google.maps.event.trigger(map, 'resize');

  routePolylines.forEach(p => p.setMap(null));
  routeMarkers.forEach(m => m.setMap(null));
  routePolylines = [];
  routeMarkers   = [];

  const bounds = new google.maps.LatLngBounds();
  const path   = activeStops.map(s => { const ll = { lat: s.lat, lng: s.lng }; bounds.extend(ll); return ll; });

  routePolylines.push(new google.maps.Polyline({
    path, strokeColor: '#1a73e8', strokeWeight: 3, strokeOpacity: 1, map,
  }));

  activeStops.forEach(stop => {
    const svg    = makePinSvg(stop.num, '#1a73e8', 'white');
    const marker = new google.maps.Marker({
      position: { lat: stop.lat, lng: stop.lng },
      map,
      icon: { url: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), scaledSize: new google.maps.Size(32, 32), anchor: new google.maps.Point(16, 16) },
      title:  stop.name,
      zIndex: 10,
    });
    routeMarkers.push(marker);
  });

  map.fitBounds(bounds, { left: 380, top: 60, right: 80, bottom: 60 });
}

function makePinSvg(label, bg, fg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
    <circle cx="16" cy="16" r="14" fill="${bg}" stroke="white" stroke-width="2"/>
    <text x="16" y="21" font-family="Google Sans,Arial,sans-serif" font-size="13" font-weight="600" fill="${fg}" text-anchor="middle">${label}</text>
  </svg>`;
}

/* ═══════════════════════════════════════════════
   DRAG-AND-DROP  (route stops)
═══════════════════════════════════════════════ */

(function () {
  const list = document.getElementById('routeStopsList');
  if (!list) return;
  let dragging = null;

  list.addEventListener('dragstart', e => {
    const row = e.target.closest('.route-stop-row');
    if (!row) return;
    dragging = row;
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => row.classList.add('is-dragging'));
  });

  list.addEventListener('dragend', () => {
    if (dragging) dragging.classList.remove('is-dragging');
    dragging = null;
    list.querySelectorAll('.route-stop-row').forEach(r => r.classList.remove('drag-over-above', 'drag-over-below'));
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    if (!dragging) return;
    const row = e.target.closest('.route-stop-row');
    if (!row || row === dragging) return;
    list.querySelectorAll('.route-stop-row').forEach(r => r.classList.remove('drag-over-above', 'drag-over-below'));
    const rect  = row.getBoundingClientRect();
    const above = e.clientY < rect.top + rect.height / 2;
    if (above) { row.classList.add('drag-over-above'); list.insertBefore(dragging, row); }
    else        { row.classList.add('drag-over-below'); list.insertBefore(dragging, row.nextSibling); }
  });

  list.addEventListener('drop', e => e.preventDefault());
})();

/* ═══════════════════════════════════════════════
   NAVIGATION / HOME
═══════════════════════════════════════════════ */

function goHome() {
  document.body.dataset.state = 'landing';
}

/* ═══════════════════════════════════════════════
   LANDING → PLAN  (prompt submit)
═══════════════════════════════════════════════ */

function submitPrompt() {
  activeStops = ROUTE_STOPS;
  document.body.dataset.state = 'generating';

  const promptText = document.getElementById('promptInput').value.trim()
    || 'Explore Seattle on a 2-day road trip, discovering iconic landmarks, vibrant neighborhoods, and scenic views.';

  selectedPlaces = [];

  setTimeout(() => {
    document.body.dataset.state = 'plan';
    document.body.dataset.tab   = 'plan-ai';
    syncTabButtons('plan-ai');

    clearCategoryMarkers();
    if (mapReady) { drawRoute(); }
    else          { pendingRoute = true; }

    bookmarkedSpots = [];
    createBookmarkMarkers([]);
    refreshBookmarkList();
    populateRouteStopsUI(activeStops);
    populateAlongRoute([]);
    populateInitialChat(promptText);
  }, 900);
}

/* ═══════════════════════════════════════════════
   LOAD SAVED TRIP
═══════════════════════════════════════════════ */

function loadSavedTrip(tripId) {
  const trip = SAVED_TRIPS[tripId];
  if (!trip) return;

  activeStops = trip.stops;

  areaSpotMarkers.forEach(m => m.setMap(null));
  areaSpotMarkers = [];
  clearCategoryMarkers();
  bookmarkMarkers.forEach(m => m.setMap(null));
  bookmarkMarkers = [];
  bookmarkedSpots = [];

  selectedPlaces = [];
  document.body.dataset.state = 'generating';

  setTimeout(() => {
    document.body.dataset.state = 'plan';
    document.body.dataset.tab   = 'plan-ai';
    syncTabButtons('plan-ai');

    populateRouteStopsUI(trip.stops);
    refreshBookmarkList();
    populateAlongRoute(selectedPlaces);

    clearCategoryMarkers();
    if (mapReady) { drawRoute(); }
    else          { pendingRoute = true; }

    populateTripChat(trip);
  }, 900);
}

/* ═══════════════════════════════════════════════
   ROUTE TAB  UI
═══════════════════════════════════════════════ */

function populateRouteStopsUI(stops) {
  const list = document.getElementById('routeStopsList');
  if (!list) return;
  list.innerHTML = stops.map(stop => `
    <div class="route-stop-row" draggable="true">
      <div class="stop-icon-col">
        <div class="stop-dot"></div>
        <span class="material-symbols-rounded stop-pin">location_on</span>
      </div>
      <div class="stop-pill">${stop.name}</div>
      <span class="material-symbols-rounded stop-drag">drag_indicator</span>
    </div>`).join('');
}

function populateAlongRoute(places) {
  const grid = document.querySelector('.along-route-grid');
  if (!grid) return;
  if (!places.length) return;

  // Shuffle all places and pick up to 8
  const shuffled = [...places].sort(() => Math.random() - 0.5).slice(0, 8);

  grid.innerHTML = shuffled.map(place => {
    const meta = place.price ? `${place.rating} ★  (${place.reviews.toLocaleString()})` : `${place.rating} ★  (${place.reviews.toLocaleString()})`;
    return `<div class="route-photo-card">
      <img src="${place.photo}" alt="${place.name}" onerror="this.src='assets/photo-1.png'">
      <div class="route-photo-overlay"></div>
      <div class="route-photo-info">
        <p class="route-photo-name">${place.name}</p>
        <div class="route-photo-rating">
          <span>${place.rating}</span>
          <span class="material-symbols-rounded">star</span>
          <span>(${place.reviews.toLocaleString()})</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════
   CHAT
═══════════════════════════════════════════════ */

function populateInitialChat(promptText) {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';
  addUserBubble(promptText);

  setTimeout(() => {
    const hasPlaces = selectedPlaces.length > 0;
    addGeminiBlock(`
      <p>I've planned your route and mapped the stops. Ask me about hotels, restaurants, or scenic spots and I'll show them on the map.</p>
      <a class="plan-link" onclick="switchTab('route')">View Route <span class="material-symbols-rounded">chevron_right</span></a>
      ${hasPlaces ? buildPhotoStripHTML(selectedPlaces) : ''}
      ${hasPlaces ? buildPlaceCardsHTML(selectedPlaces) : ''}
    `);
  }, 450);
}

function populateTripChat(trip) {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';
  addUserBubble(trip.prompt);

  setTimeout(() => {
    addGeminiBlock(`
      <p>Here's your planned road trip for <strong>${trip.title}</strong>. Ask me about hotels, restaurants, or scenic spots to see them on the map.</p>
      <a class="plan-link" onclick="switchTab('route')">View Route <span class="material-symbols-rounded">chevron_right</span></a>
    `);
  }, 450);
}

function addUserBubble(text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'user-bubble';
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function addGeminiBlock(html) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'gemini-block';
  div.innerHTML  = html;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = 'gemini-block typing-indicator';
  div.id        = 'typingIndicator';
  div.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

/* ═══════════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════════ */

function switchTab(tab) {
  document.body.dataset.tab = tab;
  syncTabButtons(tab);
  syncBookmarkMarkers();
}

function syncTabButtons(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ═══════════════════════════════════════════════
   PANEL FOOTER  (chat input)
═══════════════════════════════════════════════ */

function handleChatSend() {
  const input = document.getElementById('chatInputField');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  switchTab('plan-ai');
  addUserBubble(text);
  addTypingIndicator();

  // Pick a fresh set of places for this query
  const newPlaces = selectPlaces(text);
  selectedPlaces  = newPlaces;

  setTimeout(() => {
    removeTypingIndicator();

    if (newPlaces.length) {
      renderCategoryMarkers(newPlaces);
      populateAlongRoute(newPlaces);
      addGeminiBlock(`
        <p>${buildIntroText(text)}</p>
        ${buildPhotoStripHTML(newPlaces)}
        ${buildPlaceCardsHTML(newPlaces)}
      `);
    } else {
      addGeminiBlock(`<p>Got it! Try asking me specifically about <strong>hotels</strong>, <strong>restaurants</strong>, or <strong>scenic spots</strong> and I'll map them for you.</p>`);
    }
  }, 1000 + Math.random() * 600);
}

document.getElementById('chatInputField').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleChatSend();
});

/* ═══════════════════════════════════════════════
   FLOATING MAP BAR  (after draw)
═══════════════════════════════════════════════ */

function handleMapBarSend() {
  const input = document.getElementById('mapBarInput');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  hideMapBar();
  switchTab('plan-ai');
  addUserBubble(text);
  addTypingIndicator();

  const areaPlaces  = selectPlaces(text);
  // For area queries, favour scenic spots; fall back to all
  const scenicFirst = areaPlaces.filter(p => p.category === 'scenic');
  const toShow      = scenicFirst.length ? scenicFirst.slice(0, 3) : areaPlaces.slice(0, 3);

  setTimeout(() => {
    removeTypingIndicator();
    selectedPlaces = [...selectedPlaces, ...toShow];

    addGeminiBlock(`
      <p>Here are a few 📸 spots you might be interested in within that area:</p>
      <div class="spot-list">
        ${toShow.map(place => `
          <div class="spot-card">
            <img class="spot-thumb" src="${place.photo}" alt="${place.name}" onerror="this.src='assets/photo-1.png'">
            <div class="spot-info">
              <p class="spot-name">${place.name}</p>
              <p class="spot-meta">${place.rating} ⭐ · ${place.reviews.toLocaleString()} reviews</p>
            </div>
            <button class="add-btn" data-spot-id="${place.id}" onclick="addPlaceToBookmarks('${place.id}')">Add</button>
          </div>`).join('')}
      </div>
    `);

    addAreaPinsForPlaces(toShow);
  }, 1300);
}

document.getElementById('mapBarInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleMapBarSend();
});

function showBarBelowShape(points) {
  const bounds = map.getBounds();
  if (!bounds || !points.length) return;

  const ne     = bounds.getNorthEast();
  const sw     = bounds.getSouthWest();
  const mapDiv = document.getElementById('map');
  const rect   = mapDiv.getBoundingClientRect();

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  points.forEach(p => {
    minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng);
  });

  const centerLng = (minLng + maxLng) / 2;
  const xFrac     = (centerLng - sw.lng()) / (ne.lng() - sw.lng());
  const yFrac     = (ne.lat() - minLat)    / (ne.lat() - sw.lat());

  let barLeft = xFrac * rect.width - BAR_WIDTH / 2;
  let barTop  = yFrac * rect.height + 20;

  barLeft = Math.max(PANEL_WIDTH + 16, Math.min(rect.width - BAR_WIDTH - 16, barLeft));
  barTop  = Math.max(80, Math.min(rect.height - 72, barTop));

  const bar = document.getElementById('mapBar');
  bar.style.left   = barLeft + 'px';
  bar.style.top    = barTop  + 'px';
  bar.style.right  = 'auto';
  bar.style.bottom = 'auto';
  bar.style.display = 'flex';

  document.getElementById('mapBarInput').focus();
}

function hideMapBar() {
  document.getElementById('mapBar').style.display = 'none';
}

/* ═══════════════════════════════════════════════
   AREA SPOT PINS  (after draw)
═══════════════════════════════════════════════ */

function addAreaPinsForPlaces(places) {
  areaSpotMarkers.forEach(m => m.setMap(null));
  areaSpotMarkers = [];

  places.filter(p => p.lat && p.lng).forEach(place => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.5 14 22 14 22S28 23.5 28 14C28 6.268 21.732 0 14 0z" fill="#ea4335"/>
      <circle cx="14" cy="14" r="5.5" fill="white"/>
    </svg>`;
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lng },
      map,
      icon: {
        url:        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(28, 36),
        anchor:     new google.maps.Point(14, 36),
      },
      title:  place.name,
      zIndex: 20,
    });
    areaSpotMarkers.push(marker);
  });
}

/* ═══════════════════════════════════════════════
   DRAW MODE
═══════════════════════════════════════════════ */

document.addEventListener('keydown', e => { if (e.key === 'Escape') clearDrawing(); });

function clearDrawing() {
  if (drawnPolygon) { drawnPolygon.setMap(null); drawnPolygon = null; }
  hideMapBar();
  if (drawMode) exitDrawMode();
}

function toggleDrawMode() {
  drawMode = !drawMode;
  document.getElementById('lassoBtn').classList.toggle('active', drawMode);
  document.body.dataset.drawing = drawMode ? 'on' : 'off';
  if (drawMode) { map.setOptions({ draggable: false, gestureHandling: 'none' }); setupDrawListeners(); }
  else          { exitDrawMode(); }
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
    drawPolyline = new google.maps.Polyline({ path: drawPoints, strokeColor: '#1a73e8', strokeWeight: 2.5, strokeOpacity: 0.85, map });
  };

  const onMouseMove = e => {
    if (!drawMode || !isDrawing) return;
    const ll = latLngFromEvent(e);
    if (!ll) return;
    drawPoints.push(ll);
    drawPolyline.setPath(drawPoints);
  };

  const onMouseUp = () => {
    if (!drawMode || !isDrawing) return;
    isDrawing = false;
    if (drawPoints.length >= 3) { commitDraw(); }
    else { if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; } drawPoints = []; }
  };

  mapDiv.addEventListener('mousedown', onMouseDown);
  mapDiv.addEventListener('mousemove', onMouseMove);
  mapDiv.addEventListener('mouseup',   onMouseUp);
  drawListeners = [
    { el: mapDiv, type: 'mousedown', fn: onMouseDown },
    { el: mapDiv, type: 'mousemove', fn: onMouseMove },
    { el: mapDiv, type: 'mouseup',   fn: onMouseUp },
  ];
}

function removeDrawListeners() {
  drawListeners.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
  drawListeners = [];
}

function latLngFromEvent(e) {
  if (!map) return null;
  const bounds = map.getBounds();
  if (!bounds) return null;
  const rect = document.getElementById('map').getBoundingClientRect();
  const ne   = bounds.getNorthEast();
  const sw   = bounds.getSouthWest();
  return {
    lat: ne.lat() - ((e.clientY - rect.top)  / rect.height) * (ne.lat() - sw.lat()),
    lng: sw.lng() + ((e.clientX - rect.left) / rect.width)  * (ne.lng() - sw.lng()),
  };
}

function commitDraw() {
  if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
  if (drawnPolygon)   drawnPolygon.setMap(null);

  const committed = [...drawPoints];
  drawnPolygon = new google.maps.Polygon({
    paths: committed, strokeColor: '#1a73e8', strokeWeight: 2, strokeOpacity: 0.9,
    fillColor: '#1a73e8', fillOpacity: 0.1, map,
  });

  exitDrawMode();
  showBarBelowShape(committed);
}
