'use strict';

/* ══════════════════════════════════════════════
   IMAGE CACHE  (Google Places Photos API)
══════════════════════════════════════════════ */

const SEARCH_OVERRIDES = {
  'Þingvellir':     'Thingvellir National Park Iceland',
  'Kerið Crater':   'Kerid Crater Iceland',
  'Secret Lagoon':  'Secret Lagoon Fontana Iceland',
  'Vík':            'Vik Iceland',
  'Skógafoss':      'Skogafoss waterfall Iceland',
  'Seljalandsfoss': 'Seljalandsfoss waterfall Iceland',
  'Reykjavík':      'Reykjavik Iceland',
  'Dyrhólaey':      'Dyrholaey Iceland',
};

const placeImages   = new Map();
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
            thumb: photo.getUrl({ maxWidth: 100 }),
          });
        }
        resolve();
      }
    );
  });
}

function getImg(name, seed, size = 'small') {
  const dims  = size === 'thumb' ? '48/48' : size === 'micro' ? '56/56' : '320/176';
  const entry = placeImages.get(name);
  const url   = entry && (entry[size] ?? (size === 'micro' ? entry.thumb : null) ?? entry.small);
  return url || `https://picsum.photos/seed/${seed}/${dims}`;
}

async function preloadImages() {
  const names = [
    ...ROUTE_OPTIONS.A.stops.map(s => s.name),
    ...ROUTE_OPTIONS.B.stops.map(s => s.name),
    ...HOTELS.map(h => h.name),
  ];
  const unique = [...new Set(names)];
  await Promise.all(unique.map(fetchPlaceImage));
  refreshDayImages();
}

function refreshDayImages() {
  const days = ROUTE_OPTIONS[activeRoute].days;
  [0, 1].forEach(i => {
    const sec = document.getElementById('daySection' + (i + 1));
    if (!sec) return;
    const imgs = sec.querySelectorAll('.day-img');
    if (imgs[0]) imgs[0].src = getImg(days[i].img1, days[i].seed1);
    if (imgs[1]) imgs[1].src = getImg(days[i].img2, days[i].seed2);
  });
}

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */

const ROUTE_OPTIONS = {
  A: {
    stops: [
      { id: 1, name: 'Þingvellir',     lat: 64.2558, lng: -21.1296, seed: 101  },
      { id: 2, name: 'Geysir',         lat: 64.3120, lng: -20.3003, seed: 204  },
      { id: 3, name: 'Gullfoss',       lat: 64.3269, lng: -20.1209, seed: 318  },
      { id: 4, name: 'Seljalandsfoss', lat: 63.6158, lng: -19.9886, seed: 612  },
      { id: 5, name: 'Reykjavík',      lat: 64.1355, lng: -21.8954, seed: 1122 },
    ],
    days: [
      {
        label: 'Day 1',
        desc:  "Iceland's Golden Circle in one day — Þingvellir rift valley, Geysir erupting on cue, and Gullfoss roaring double waterfall.",
        img1: 'Geysir',         seed1: 204,
        img2: 'Gullfoss',       seed2: 318,
      },
      {
        label: 'Day 2',
        desc:  'Chase Seljalandsfoss — walk behind the curtain of water — then explore the lava fields and coastal views before the scenic drive back to Reykjavík.',
        img1: 'Seljalandsfoss', seed1: 612,
        img2: 'Reykjavík',      seed2: 1122,
      },
    ],
  },
  B: {
    stops: [
      { id: 1, name: 'Reykjavík',      lat: 64.1355, lng: -21.8954, seed: 1122 },
      { id: 2, name: 'Seljalandsfoss', lat: 63.6158, lng: -19.9886, seed: 612  },
      { id: 3, name: 'Skógafoss',      lat: 63.5322, lng: -19.5133, seed: 901  },
      { id: 4, name: 'Vík',            lat: 63.4215, lng: -19.0020, seed: 422  },
      { id: 5, name: 'Dyrhólaey',      lat: 63.4058, lng: -19.1289, seed: 515  },
    ],
    days: [
      {
        label: 'Day 1',
        desc:  'Drive the South Coast — slip behind Seljalandsfoss, then climb to the top of Skógafoss for sweeping views all the way to the sea.',
        img1: 'Seljalandsfoss', seed1: 612,
        img2: 'Skógafoss',      seed2: 901,
      },
      {
        label: 'Day 2',
        desc:  "Walk Víkurfjara's jet-black shore, photograph the sea stacks at Reynisfjara, then climb Dyrhólaey for sweeping Atlantic views before heading back.",
        img1: 'Vík',            seed1: 422,
        img2: 'Dyrhólaey',      seed2: 515,
      },
    ],
  },
};

const HOTELS = [
  { name: 'Hótel Selfoss',      stars: 4.4, price: '$178', desc: 'Modern, best breakfast on the route.',           seed: 2201, lat: 63.9343, lng: -20.9977 },
  { name: 'Hótel Kvika',        stars: 4.7, price: '$145', desc: 'Hot tub, sauna, dark skies — great value.',       seed: 2342, lat: 63.9200, lng: -20.8500 },
  { name: 'Hotel Vatnsholt',    stars: 4.3, price: '$122', desc: 'Quiet countryside base, good Day 1 stopover.',    seed: 2487, lat: 63.8200, lng: -20.3800 },
  { name: 'Stracta Hotel',      stars: 4.1, price: '$95',  desc: 'Hella. Ask for a renovated room.',                seed: 2618, lat: 63.8336, lng: -20.3900 },
  { name: 'Aurora Igloo South', stars: 4.3, price: '$320', desc: 'Clear igloos — novelty stay, any season.',        seed: 2755, lat: 63.8280, lng: -20.4100 },
  { name: 'Hótel Skógafoss',    stars: 4.3, price: '$229', desc: 'Some rooms face the waterfall. Great restaurant.',seed: 2901, lat: 63.5322, lng: -19.5133 },
  { name: 'Hótel Kría',         stars: 4.5, price: '$195', desc: 'Vik. Newest hotel in town, great on-site dinner.',seed: 3034, lat: 63.4215, lng: -19.0020 },
  { name: 'The Barn',           stars: 4.5, price: '$68',  desc: 'Just outside Vik. Ocean views, great bar.',       seed: 3122, lat: 63.4120, lng: -19.0260 },
];

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */

let map              = null;
let mapReady         = false;
let routePolyline    = null;
let stopMarkers      = {};
let appState         = 'home';
let activeRoute      = 'A';
let activeStops      = [...ROUTE_OPTIONS.A.stops];
let SquarePin        = null;
let HotelPin         = null;
let BookmarkPin      = null;
let animationPending = false;
let dragSrcIndex     = null;
let draggingHotelIdx = null;
let searchState      = null;
let hotelMarkers     = [];
let savedPlaces      = {};
let savedPinMarkers  = {};
let currentCardData  = null;

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
  setState('plan-ai');
  showTab('plan-ai');
  resetPlanPane();
  renderStopList();

  // Small delay so CSS transition on home-overlay fires
  setTimeout(animateItinerary, 320);
}

function resetPlanPane() {
  const ids = ['tripHeaderCard', 'optionsLabel', 'routeOptionsRow', 'daysCard'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-visible');
  });

  [1, 2].forEach(i => {
    const sec = document.getElementById('daySection' + i);
    if (!sec) return;
    sec.querySelector('.day-label').textContent = '';
    sec.querySelector('.day-desc').textContent  = '';
    sec.querySelector('.day-images').style.opacity = '0';
    sec.classList.remove('is-visible');
  });

  const divider = document.querySelector('.day-divider');
  if (divider) divider.classList.remove('is-visible');

  const footer = document.querySelector('.footer-input');
  if (footer) { footer.value = ''; footer.disabled = false; footer.placeholder = 'Show me hotels along my route'; }

  // Reset hotel search state
  searchState = null;
  const skeleton = document.getElementById('searchSkeleton');
  if (skeleton) skeleton.classList.remove('is-visible');
  const results = document.getElementById('searchResultsSection');
  if (results) results.classList.remove('is-visible');
}

/* ══════════════════════════════════════════════
   ROUTE SWITCHING
══════════════════════════════════════════════ */

function switchRoute(option) {
  if (option === activeRoute) return;
  activeRoute = option;
  activeStops = [...ROUTE_OPTIONS[option].stops];

  document.getElementById('optionPill1').classList.toggle('route-option-pill--active', option === 'A');
  document.getElementById('optionPill2').classList.toggle('route-option-pill--active', option === 'B');

  fillDayContent(option);
  renderStopList();
  if (mapReady) {
    clearPins();
    renderPins();
    renderPolylineAnimated();
  }
}

function fillDayContent(option) {
  const { days } = ROUTE_OPTIONS[option];
  [0, 1].forEach(i => {
    const sec = document.getElementById('daySection' + (i + 1));
    if (!sec) return;
    sec.querySelector('.day-label').textContent = days[i].label;
    sec.querySelector('.day-desc').textContent  = days[i].desc;
    const imgs = sec.querySelectorAll('.day-img');
    if (imgs[0]) imgs[0].src = getImg(days[i].img1, days[i].seed1);
    if (imgs[1]) imgs[1].src = getImg(days[i].img2, days[i].seed2);
    sec.querySelector('.day-images').style.opacity = '1';
    sec.classList.add('is-visible');
  });
  const divider = document.querySelector('.day-divider');
  if (divider) divider.classList.add('is-visible');
  const daysCard = document.getElementById('daysCard');
  if (daysCard) daysCard.classList.add('is-visible');
}

/* ══════════════════════════════════════════════
   ITINERARY ANIMATION (typewriter, Route A only)
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

function fadeIn(el, delay = 0) {
  if (!el) return;
  setTimeout(() => el.classList.add('is-visible'), delay);
}

function animateItinerary() {
  const days = ROUTE_OPTIONS.A.days;

  // 1. Fade in trip header card
  fadeIn(document.getElementById('tripHeaderCard'));

  // 2. Fade in options label after a beat
  setTimeout(() => {
    fadeIn(document.getElementById('optionsLabel'));
  }, 300);

  // 3. Fade in daysCard container, then type Day 1
  setTimeout(() => {
    const daysCard = document.getElementById('daysCard');
    if (daysCard) daysCard.classList.add('is-visible');

    const sec1 = document.getElementById('daySection1');
    if (sec1) sec1.classList.add('is-visible');

    typeInto(sec1.querySelector('.day-label'), days[0].label, 60, () => {
      typeInto(sec1.querySelector('.day-desc'), days[0].desc, 22, () => {

        // Show Day 1 images
        const imgs1 = sec1.querySelectorAll('.day-img');
        if (imgs1[0]) imgs1[0].src = getImg(days[0].img1, days[0].seed1);
        if (imgs1[1]) imgs1[1].src = getImg(days[0].img2, days[0].seed2);
        sec1.querySelector('.day-images').style.opacity = '1';

        // 4. Divider
        setTimeout(() => {
          const divider = document.querySelector('.day-divider');
          if (divider) divider.classList.add('is-visible');

          // 5. Type Day 2
          setTimeout(() => {
            const sec2 = document.getElementById('daySection2');
            if (sec2) sec2.classList.add('is-visible');

            typeInto(sec2.querySelector('.day-label'), days[1].label, 60, () => {
              typeInto(sec2.querySelector('.day-desc'), days[1].desc, 22, () => {

                // Show Day 2 images
                const imgs2 = sec2.querySelectorAll('.day-img');
                if (imgs2[0]) imgs2[0].src = getImg(days[1].img1, days[1].seed1);
                if (imgs2[1]) imgs2[1].src = getImg(days[1].img2, days[1].seed2);
                sec2.querySelector('.day-images').style.opacity = '1';

                // 6. Reveal option pills
                setTimeout(() => {
                  fadeIn(document.getElementById('routeOptionsRow'));
                }, 400);

                // 7. Start map rendering
                setTimeout(renderMapAfterAI, 600);

                // 8. Pre-fill footer
                setTimeout(() => prefillFooterInput('Show me hotels along my route'), 1400);

              });
            });
          }, 200);
        }, 300);
      });
    });
  }, 500);
}

function renderMapAfterAI() {
  animationPending = false;
  if (!mapReady) { setTimeout(renderMapAfterAI, 120); return; }
  renderPins();
  setTimeout(renderPolylineAnimated, activeStops.length * 60 + 300);
}

/* ══════════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════════ */

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
   MAP INIT
══════════════════════════════════════════════ */

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 64.0, lng: -20.10 },
    zoom: 7,
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
        showPlaceCard(s, pinRect.left - mapRect.left + pinRect.width / 2, pinRect.top - mapRect.top);
      });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }
    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.stop.lat, this.stop.lng));
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
      el.addEventListener('mousedown', e => e.stopPropagation());
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
      const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.hotel.lat, this.hotel.lng));
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 69) + 'px';
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
          showHotelCard(parseInt(place.key.split('-')[1], 10), el);
        } else {
          const mapArea = document.querySelector('.map-area');
          const pinRect = el.getBoundingClientRect();
          const mapRect = mapArea.getBoundingClientRect();
          showPlaceCard(
            { id: parseInt(place.key.split('-')[1], 10), name: place.name, seed: place.seed, lat: place.lat, lng: place.lng },
            pinRect.left - mapRect.left + pinRect.width / 2,
            pinRect.top  - mapRect.top
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
      const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.place.lat, this.place.lng));
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

  if ((appState === 'plan-ai' || appState === 'route') && !animationPending) {
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
    origin:      { lat: activeStops[0].lat, lng: activeStops[0].lng },
    destination: { lat: activeStops[activeStops.length - 1].lat, lng: activeStops[activeStops.length - 1].lng },
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

function renderPolylineAnimated() {
  if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  if (activeStops.length < 2) return;

  new google.maps.DirectionsService().route({
    origin:      { lat: activeStops[0].lat, lng: activeStops[0].lng },
    destination: { lat: activeStops[activeStops.length - 1].lat, lng: activeStops[activeStops.length - 1].lng },
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
    li.addEventListener('dragstart', stopDragStart);
    li.addEventListener('dragover',  stopDragOver);
    li.addEventListener('dragleave', stopDragLeave);
    li.addEventListener('drop',      stopDrop);
    li.addEventListener('dragend',   stopDragEnd);
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
  e.currentTarget.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drop-above' : 'drop-below');
}
function stopDragLeave(e) { e.currentTarget.classList.remove('drop-above', 'drop-below'); }
function stopDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  let dropIndex = [...target.parentNode.children].indexOf(target);
  const rect = target.getBoundingClientRect();
  if (e.clientY >= rect.top + rect.height / 2) dropIndex += 1;
  clearDropIndicators();

  if (draggingHotelIdx !== null) {
    const h = HOTELS[draggingHotelIdx];
    activeStops.splice(dropIndex, 0, { id: 2000 + draggingHotelIdx, name: h.name, lat: h.lat, lng: h.lng, seed: h.seed });
    const hm = hotelMarkers[draggingHotelIdx];
    if (hm) hm.setMap(null);
    draggingHotelIdx = null;
    renderStopList();
    if (mapReady) { renderPins(); renderPolyline(); }
    showTab('route');
    return;
  }

  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
  const insertAt = dropIndex > dragSrcIndex ? dropIndex - 1 : dropIndex;
  const [moved] = activeStops.splice(dragSrcIndex, 1);
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
  document.querySelectorAll('.stop-item').forEach(el => el.classList.remove('drop-above', 'drop-below'));
}
function removeStop(id) {
  activeStops = activeStops.filter(s => s.id !== id);
  if (stopMarkers[id]) { stopMarkers[id].setMap(null); delete stopMarkers[id]; }
  renderStopList();
  if (mapReady && routePolyline) renderPolyline();
}

/* ══════════════════════════════════════════════
   PLACE CARD
══════════════════════════════════════════════ */

function showPlaceCard(stop, pinCenterX, pinTopY) {
  const card    = document.getElementById('placeCard');
  const mapArea = document.querySelector('.map-area');
  const mapW    = mapArea.offsetWidth;
  const mapH    = mapArea.offsetHeight;
  const cardW = 320, cardH = 248, gap = 12;

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
  if (savedPinMarkers[key]) { savedPinMarkers[key].setMap(null); delete savedPinMarkers[key]; }
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

function showHotelCard(idx, el) {
  const h       = HOTELS[idx];
  const card    = document.getElementById('placeCard');
  const mapArea = document.querySelector('.map-area');
  const mapW    = mapArea.offsetWidth;
  const mapH    = mapArea.offsetHeight;
  const cardW = 320, cardH = 248, gap = 12;

  hotelMarkers.forEach((m, i) => { if (m.el) m.el.classList.toggle('hotel-pin--active', i === idx); });

  let left, top;
  if (el) {
    const pinRect = el.getBoundingClientRect();
    const mapRect = mapArea.getBoundingClientRect();
    left = pinRect.left - mapRect.left + pinRect.width / 2 - cardW / 2;
    top  = pinRect.top - mapRect.top - cardH - gap;
    if (top < 8) top = pinRect.top - mapRect.top + pinRect.height + gap;
  } else {
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
   SEARCH / HOTEL RESULTS
══════════════════════════════════════════════ */

function prefillFooterInput(text) {
  const input = document.querySelector('.footer-input');
  if (!input || input.disabled) return;
  input.value = '';
  let i = 0;
  const tick = () => {
    if (i < text.length) { input.value += text[i++]; setTimeout(tick, 35); }
  };
  tick();
}

function submitSearch() {
  const input = document.querySelector('.footer-input');
  const query = input ? input.value.trim() : '';
  if (!query || searchState === 'loading') return;

  searchState = 'loading';
  if (input) { input.value = ''; input.disabled = true; input.placeholder = ''; }

  const skeleton = document.getElementById('searchSkeleton');
  if (skeleton) skeleton.classList.add('is-visible');
  setTimeout(showSearchResults, 2200);
}

function showSearchResults() {
  searchState = 'results';
  const skeleton = document.getElementById('searchSkeleton');
  if (skeleton) skeleton.classList.remove('is-visible');

  renderHotelCards();
  const section = document.getElementById('searchResultsSection');
  if (section) section.classList.add('is-visible');
  if (mapReady) renderHotelPins();

  const input = document.querySelector('.footer-input');
  if (input) { input.disabled = false; input.placeholder = 'Tell me more...'; }

  const panelContent = document.querySelector('.panel-content');
  if (panelContent) setTimeout(() => { panelContent.scrollTop = panelContent.scrollHeight; }, 80);
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
  expandRow.insertAdjacentHTML('beforebegin', HOTELS.slice(3).map((h, i) => hotelCardHTML(h, i + 3)).join(''));
  expandRow.remove();
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
  document.querySelectorAll('.vehicle-radio').forEach(r => r.classList.remove('vehicle-radio--selected'));
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
