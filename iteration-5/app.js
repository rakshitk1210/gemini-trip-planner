(function () {
  'use strict';

  const STOPS = [
    { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { name: 'Everett', lat: 47.9790, lng: -122.2021 },
    { name: 'Bellingham', lat: 48.7519, lng: -122.4787 },
    { name: 'Portland', lat: 45.5152, lng: -122.6784 }
  ];

  let map = null;
  let routePath = null;

  // ─── State Machine ─────────────────────────────────────────

  function setState(newState) {
    document.body.setAttribute('data-state', newState);

    const itineraryView = document.querySelector('.itinerary-view');
    if (newState === 'split-itinerary') {
      itineraryView.removeAttribute('hidden');
    } else {
      itineraryView.setAttribute('hidden', '');
    }

    if (map && (newState === 'split-route' || newState === 'map-fullscreen' || newState === 'split-details')) {
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
        fitMapToBounds();
      }, 350);
    }
  }

  function getState() {
    return document.body.getAttribute('data-state');
  }

  // ─── Trip Intro Bar ────────────────────────────────────────
  // Gap 5: only trigger on send/Enter, NOT on focus

  const introInput = document.querySelector('.trip-intro-bar__input');
  const introSend = document.querySelector('.trip-intro-bar__send');

  function handleTripStart() {
    if (getState() === 'map-fullscreen') {
      setState('split-route');
    }
  }

  introSend.addEventListener('click', handleTripStart);

  introInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      handleTripStart();
    }
  });

  // ─── Nav Rail ──────────────────────────────────────────────

  document.querySelectorAll('.nav-rail__btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const action = this.dataset.action;
      if (action === 'home') {
        setState('map-fullscreen');
      } else if (action === 'road-trip') {
        if (getState() === 'map-fullscreen') {
          setState('split-route');
        }
      }
    });
  });

  // ─── Main Tabs (Route / Itinerary) ────────────────────────

  document.querySelectorAll('[data-main-tab]').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('[data-main-tab]').forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      const target = this.dataset.mainTab;
      if (target === 'route') {
        setState('split-route');
      } else if (target === 'itinerary') {
        setState('split-itinerary');
      }
    });
  });

  // ─── Panel Tabs (Attractions / Restaurants / Gas) ──────────

  document.querySelectorAll('.tabs--panel .tabs__item').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tabs--panel .tabs__item').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ─── State 4: Right Panel (stop/POI click → split-details) ──

  document.querySelectorAll('.stop-row, .poi-item').forEach(el => {
    el.addEventListener('click', function () {
      if (getState() !== 'map-fullscreen') {
        setState('split-details');
      }
    });
  });

  document.querySelector('.right-panel__close').addEventListener('click', function () {
    setState('split-route');
    // Keep Route tab active
    document.querySelectorAll('[data-main-tab]').forEach(t => {
      t.classList.toggle('active', t.dataset.mainTab === 'route');
    });
  });

  // ─── Google Maps ───────────────────────────────────────────

  function fitMapToBounds() {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    STOPS.forEach(stop => bounds.extend({ lat: stop.lat, lng: stop.lng }));
    map.fitBounds(bounds, { top: 80, right: 120, bottom: 120, left: 40 });
  }

  window.initMap = function () {
    const mapEl = document.getElementById('map');

    map = new google.maps.Map(mapEl, {
      center: { lat: 47.6062, lng: -122.3321 },
      zoom: 8,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      // Gap 7: clean, muted map style matching Figma aesthetic
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', stylers: [{ color: '#c9e9f6' }] },
        { featureType: 'landscape.natural', stylers: [{ color: '#e8f5e9' }] },
        { featureType: 'road', stylers: [{ color: '#f5f5f5' }, { weight: 0.8 }] },
        { featureType: 'road.highway', stylers: [{ color: '#ffffff' }, { weight: 1.5 }] },
        { featureType: 'road.arterial', stylers: [{ color: '#f8f8f8' }, { weight: 0.9 }] },
        { featureType: 'administrative', stylers: [{ visibility: 'simplified' }] }
      ]
    });

    const routeCoords = [
      { lat: 47.6062, lng: -122.3321 },
      { lat: 47.65, lng: -122.35 },
      { lat: 47.75, lng: -122.30 },
      { lat: 47.85, lng: -122.25 },
      { lat: 47.9790, lng: -122.2021 },
      { lat: 48.1, lng: -122.30 },
      { lat: 48.3, lng: -122.38 },
      { lat: 48.5, lng: -122.42 },
      { lat: 48.7519, lng: -122.4787 },
      { lat: 48.5, lng: -122.55 },
      { lat: 48.0, lng: -122.60 },
      { lat: 47.5, lng: -122.55 },
      { lat: 47.0, lng: -122.60 },
      { lat: 46.5, lng: -122.65 },
      { lat: 46.0, lng: -122.67 },
      { lat: 45.5152, lng: -122.6784 }
    ];

    routePath = new google.maps.Polyline({
      path: routeCoords,
      geodesic: true,
      strokeColor: '#1a73e8',
      strokeOpacity: 1.0,
      strokeWeight: 4
    });
    routePath.setMap(map);

    STOPS.forEach((stop, i) => {
      const isLast = i === STOPS.length - 1;
      new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isLast ? 8 : 6,
          fillColor: isLast ? '#ea4335' : '#1a73e8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: stop.name
      });
    });

    fitMapToBounds();
  };
})();
