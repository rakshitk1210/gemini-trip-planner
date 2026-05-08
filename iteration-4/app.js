/* ═══════════════════════════════════════════════════
   Google Maps — Iteration 4: Road Trip Planner
   ═══════════════════════════════════════════════════ */

// ── Trip data (lat/lng format for Google Maps API) ──
const ALL_STOPS = [
  { name: 'Seattle',     lat: 47.6062, lng: -122.3321 },
  { name: 'U-District',  lat: 47.6615, lng: -122.3132 },
  { name: 'Bellevue',    lat: 47.6101, lng: -122.2015 },
  { name: 'Redmond',     lat: 47.6740, lng: -122.1215 },
  { name: 'Tacoma',      lat: 47.2529, lng: -122.4443 },
  { name: 'Kirkland',    lat: 47.6815, lng: -122.2087 },
  { name: 'Everett',     lat: 47.9790, lng: -122.2021 },
];

const EXTRA_STOPS = {
  'skagit valley':    { name: 'Skagit Valley',    lat: 48.4490, lng: -122.3376 },
  'deception pass':   { name: 'Deception Pass',   lat: 48.3965, lng: -122.6455 },
  'leavenworth':      { name: 'Leavenworth',      lat: 47.5962, lng: -120.6615 },
  'snoqualmie falls': { name: 'Snoqualmie Falls',  lat: 47.5427, lng: -121.8368 },
  'olympia':          { name: 'Olympia',           lat: 47.0379, lng: -122.9007 },
  'port townsend':    { name: 'Port Townsend',     lat: 48.1170, lng: -122.7604 },
  'whidbey island':   { name: 'Whidbey Island',    lat: 48.2200, lng: -122.6780 },
};

const POI_DATA = {
  restaurants: [
    { name: 'The Walrus and the Carpenter', detail: 'Seafood · Ballard', rating: '4.7', img: 'https://picsum.photos/seed/rest1/104/104' },
    { name: 'Canlis', detail: 'Fine Dining · Westlake', rating: '4.8', img: 'https://picsum.photos/seed/rest2/104/104' },
    { name: 'Paseo Caribbean Food', detail: 'Caribbean · Fremont', rating: '4.6', img: 'https://picsum.photos/seed/rest3/104/104' },
    { name: 'Din Tai Fung', detail: 'Chinese · U-Village', rating: '4.5', img: 'https://picsum.photos/seed/rest4/104/104' },
  ],
  hotels: [
    { name: 'The Edgewater Hotel', detail: 'Waterfront · Pier 67', rating: '4.6', img: 'https://picsum.photos/seed/hotel1/104/104' },
    { name: 'Hotel Ballard', detail: 'Boutique · Ballard', rating: '4.5', img: 'https://picsum.photos/seed/hotel2/104/104' },
    { name: 'Hyatt Regency Bellevue', detail: 'Downtown Bellevue', rating: '4.4', img: 'https://picsum.photos/seed/hotel3/104/104' },
    { name: 'Inn at the Market', detail: 'Pike Place Market', rating: '4.7', img: 'https://picsum.photos/seed/hotel4/104/104' },
  ],
};

// ── State ──
let appState = 'welcome';
let visibleStops = [...ALL_STOPS];
let activeTab = 'restaurants';
let map;
let markers = [];
let routeLine = null;
let routeDrawn = false;
let chatMessages = [];

// ── DOM refs ──
const welcomeCard = document.getElementById('welcome-card');
const welcomeInput = document.getElementById('welcome-input');
const welcomeSend = document.getElementById('welcome-send');
const planningLayout = document.getElementById('planning-layout');
const locationList = document.getElementById('location-list');
const sliderDistance = document.getElementById('slider-distance');
const sliderHours = document.getElementById('slider-hours');
const metricDistance = document.getElementById('metric-distance');
const metricHours = document.getElementById('metric-hours');
const poiTabs = document.getElementById('poi-tabs');
const poiList = document.getElementById('poi-list');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const aiThread = document.getElementById('ai-thread');
const aiModuleExpanded = document.getElementById('ai-module-expanded');
const aiModuleCollapsed = document.getElementById('ai-module-collapsed');
const btnCollapse = document.getElementById('btn-collapse');
const btnExpand = document.getElementById('btn-expand');

// ── initMap — called by Google Maps API callback ──
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 47.6062, lng: -122.3321 },
    zoom: 9,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    styles: [
      { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    ],
  });

  // Wire up zoom controls now that map exists
  document.getElementById('zoom-in').addEventListener('click', () => map.setZoom(map.getZoom() + 1));
  document.getElementById('zoom-out').addEventListener('click', () => map.setZoom(map.getZoom() - 1));
}

// ── AI Chat Thread ──
function addInitialAIMessage() {
  chatMessages = [{
    type: 'ai',
    chip: 'Road trip from around Seattle, for 2 days',
    text: 'Explore the scenic routes around Seattle on a 2-day road trip. Discover charming towns, lush forests, and stunning waterfront views. Perfect for a quick getaway filled with adventure and relaxation.',
    plan: {
      label: 'Plan created',
      icon: 'chevron_right',
      images: [
        'https://picsum.photos/seed/seattle1/196/160',
        'https://picsum.photos/seed/seattle2/196/160',
        'https://picsum.photos/seed/seattle3/196/160',
      ],
    },
  }];
  renderThread();
}

function renderThread() {
  aiThread.innerHTML = '';
  chatMessages.forEach(msg => {
    const el = document.createElement('div');
    el.className = 'ai-msg';

    if (msg.type === 'user') {
      el.innerHTML = `<div class="ai-msg__user-bubble">${msg.text}</div>`;
    } else if (msg.type === 'ai') {
      let html = '';
      if (msg.chip) {
        html += `<div class="ai-msg__user-bubble">${msg.chip}</div>`;
      }
      if (msg.text) {
        html += `<div class="ai-msg__text">${msg.text}</div>`;
      }
      if (msg.plan) {
        const isUpdate = msg.plan.icon === 'task_alt';
        html += `<div class="ai-msg__plan-card">`;
        html += `<div class="ai-msg__plan-header ${isUpdate ? 'ai-msg__plan-header--success' : ''}">`;
        html += `<span>${msg.plan.label}</span>`;
        html += `<span class="material-symbols-rounded">${msg.plan.icon}</span>`;
        html += `</div>`;
        if (msg.plan.images && msg.plan.images.length) {
          html += `<div class="ai-msg__plan-images">`;
          msg.plan.images.forEach(img => {
            html += `<div class="ai-msg__plan-img" style="background-image: url('${img}')"></div>`;
          });
          html += `</div>`;
        }
        html += `</div>`;
      }
      el.innerHTML = html;
    } else if (msg.type === 'loading') {
      el.innerHTML = `<div class="loading-dots"><span></span><span></span><span></span></div>`;
    }

    aiThread.appendChild(el);
  });

  aiThread.scrollTop = aiThread.scrollHeight;
}

function handleUserMessage(text) {
  chatMessages.push({ type: 'user', text });
  chatMessages.push({ type: 'loading' });
  renderThread();

  const locationMatch = findLocationInMessage(text);

  setTimeout(() => {
    chatMessages.pop();

    if (locationMatch) {
      visibleStops.push(locationMatch);
      renderLocationList();
      drawRoute();
      updateDistanceFromStops();

      chatMessages.push({
        type: 'ai',
        text: `Updating your route to include ${locationMatch.name}`,
        plan: { label: 'Plan updated', icon: 'task_alt', images: null },
      });
    } else {
      chatMessages.push({
        type: 'ai',
        text: `I've updated your trip plan based on: "${text}". The route has been adjusted to accommodate your preferences.`,
        plan: { label: 'Plan updated', icon: 'task_alt', images: null },
      });
    }

    renderThread();
  }, 1200);
}

function findLocationInMessage(msg) {
  const lower = msg.toLowerCase();
  for (const [key, stop] of Object.entries(EXTRA_STOPS)) {
    if (lower.includes(key)) return { ...stop };
  }
  return null;
}

function updateDistanceFromStops() {
  const totalMiles = Math.round(30 + ((visibleStops.length / (ALL_STOPS.length + 3)) * 170));
  metricDistance.textContent = totalMiles + 'mi';
  sliderDistance.value = totalMiles;
  updateSliderProgress(sliderDistance);
}

// ── Collapse / Expand ──
function collapseModule() {
  aiModuleExpanded.hidden = true;
  aiModuleCollapsed.hidden = false;
}

function expandModule() {
  aiModuleCollapsed.hidden = true;
  aiModuleExpanded.hidden = false;
  aiThread.scrollTop = aiThread.scrollHeight;
}

// ── Render functions ──
function renderLocationList() {
  locationList.innerHTML = '';
  visibleStops.forEach((stop, i) => {
    const isLast = i === visibleStops.length - 1;
    const item = document.createElement('div');
    item.className = 'location-item';

    const dot = document.createElement('div');
    if (isLast) {
      dot.className = 'location-item__dot location-item__dot--destination';
      dot.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px">location_on</span>';
    } else {
      dot.className = 'location-item__dot';
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'location-item__name';
    nameEl.textContent = stop.name;

    item.appendChild(dot);
    item.appendChild(nameEl);

    if (!isLast) {
      const connector = document.createElement('div');
      connector.className = 'location-item__connector';
      item.appendChild(connector);
    }

    locationList.appendChild(item);
  });
}

function renderPOIList() {
  const items = POI_DATA[activeTab] || [];
  poiList.innerHTML = '';
  items.forEach(poi => {
    const el = document.createElement('div');
    el.className = 'poi-item';
    el.innerHTML = `
      <div class="poi-item__image" style="background-image: url('${poi.img}')"></div>
      <div class="poi-item__info">
        <div class="poi-item__name">${poi.name}</div>
        <div class="poi-item__detail">${poi.detail}</div>
        <div class="poi-item__rating">
          <span class="material-symbols-rounded">star</span>
          ${poi.rating}
        </div>
      </div>
    `;
    poiList.appendChild(el);
  });
}

function updateSliderProgress(slider) {
  const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
  slider.style.setProperty('--slider-progress', pct + '%');
}

// ── Map route (Google Maps) ──
function markerIcon(type) {
  const colors = { start: '#34a853', end: '#ea4335', mid: '#1a73e8' };
  const fill = colors[type] || colors.mid;
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: type === 'mid' ? 7 : 9,
    fillColor: fill,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
  };
}

function drawRoute() {
  clearMarkers();

  const path = visibleStops.map(s => ({ lat: s.lat, lng: s.lng }));

  // Draw / update the polyline
  if (routeLine) {
    routeLine.setPath(path);
  } else {
    routeLine = new google.maps.Polyline({
      path,
      map,
      geodesic: true,
      strokeColor: '#1a73e8',
      strokeOpacity: 0.85,
      strokeWeight: 4,
    });
  }

  // Place markers
  visibleStops.forEach((stop, i) => {
    const type = i === 0 ? 'start' : i === visibleStops.length - 1 ? 'end' : 'mid';
    const marker = new google.maps.Marker({
      position: { lat: stop.lat, lng: stop.lng },
      map,
      icon: markerIcon(type),
      title: stop.name,
    });
    markers.push(marker);
  });

  // Fit all stops in view
  const bounds = new google.maps.LatLngBounds();
  path.forEach(p => bounds.extend(p));
  map.fitBounds(bounds, { top: 80, right: 480, bottom: 80, left: 420 });

  routeDrawn = true;
}

function clearMarkers() {
  markers.forEach(m => m.setMap(null));
  markers = [];
}

// ── Transitions ──
function enterPlanningState() {
  appState = 'planning';
  welcomeCard.classList.add('welcome-card--hidden');
  planningLayout.classList.add('planning-layout--active');

  renderLocationList();
  renderPOIList();
  updateSliderProgress(sliderDistance);
  updateSliderProgress(sliderHours);
  addInitialAIMessage();

  setTimeout(() => drawRoute(), 400);
}

// ── Event listeners ──

welcomeInput.addEventListener('input', () => {
  welcomeSend.disabled = !welcomeInput.value.trim();
});

welcomeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && welcomeInput.value.trim()) enterPlanningState();
});

welcomeSend.addEventListener('click', () => {
  if (welcomeInput.value.trim()) enterPlanningState();
});

sliderDistance.addEventListener('input', () => {
  const val = parseInt(sliderDistance.value);
  metricDistance.textContent = val + 'mi';
  updateSliderProgress(sliderDistance);

  const ratio = (val - 30) / (200 - 30);
  const stopCount = Math.max(2, Math.round(ratio * ALL_STOPS.length));
  visibleStops = ALL_STOPS.slice(0, stopCount);
  renderLocationList();
  if (routeDrawn) drawRoute();
});

sliderHours.addEventListener('input', () => {
  const val = parseInt(sliderHours.value);
  metricHours.textContent = val + 'hrs';
  updateSliderProgress(sliderHours);
});

poiTabs.addEventListener('click', e => {
  const tab = e.target.closest('.poi-tab');
  if (!tab) return;
  poiTabs.querySelectorAll('.poi-tab').forEach(t => t.classList.remove('poi-tab--active'));
  tab.classList.add('poi-tab--active');
  activeTab = tab.dataset.tab;
  renderPOIList();
});

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    handleUserMessage(chatInput.value.trim());
    chatInput.value = '';
  }
});

chatSend.addEventListener('click', () => {
  if (chatInput.value.trim()) {
    handleUserMessage(chatInput.value.trim());
    chatInput.value = '';
  }
});

btnCollapse.addEventListener('click', collapseModule);
btnExpand.addEventListener('click', expandModule);

// Note: zoom controls are wired inside initMap() once the map is ready.
// initMap() itself is called by the Google Maps API via the ?callback= URL param.
