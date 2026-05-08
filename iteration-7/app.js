(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     DATA
     ───────────────────────────────────────────── */

  const TRIP_STOPS = [
    { name: 'Seattle',     lat: 47.6062, lng: -122.3321 },
    { name: 'Bellevue',    lat: 47.6101, lng: -122.2015 },
    { name: 'Everett',     lat: 47.9790, lng: -122.2021 },
    { name: 'Bellingham',  lat: 48.7519, lng: -122.4787 }
  ];

  const ROUTE_PATH = [
    { lat: 47.6062, lng: -122.3321 },
    { lat: 47.65,   lng: -122.30  },
    { lat: 47.75,   lng: -122.27  },
    { lat: 47.85,   lng: -122.24  },
    { lat: 47.9790, lng: -122.2021 },
    { lat: 48.10,   lng: -122.30  },
    { lat: 48.30,   lng: -122.38  },
    { lat: 48.55,   lng: -122.43  },
    { lat: 48.7519, lng: -122.4787 }
  ];

  const POI_CARDS = [
    { name: 'Saint Clair Beach',  rating: 4.7, count: 325, seed: 'beach1' },
    { name: 'Discovery Park',     rating: 4.8, count: 612, seed: 'park2' },
    { name: 'Pike Place Market',  rating: 4.6, count: 982, seed: 'pike3' },
    { name: 'Gas Works Park',     rating: 4.7, count: 421, seed: 'gas4' },
    { name: 'Kerry Park',         rating: 4.9, count: 287, seed: 'kerry5' },
    { name: 'Ballard Locks',      rating: 4.7, count: 354, seed: 'locks6' },
    { name: 'Olympic Sculpture',  rating: 4.5, count: 198, seed: 'olymp7' },
    { name: 'Alki Beach',         rating: 4.7, count: 408, seed: 'alki8' }
  ];

  const FIRST_RESPONSE_TEMPLATES = [
    'Explore the scenic routes around Seattle on a 2-day road trip. Discover charming towns, lush forests, and stunning waterfront views. Perfect for a quick getaway filled with adventure and relaxation.',
    'I\'ve mapped out a beautiful trip starting in Seattle. You\'ll pass through cozy waterfront towns, mountain viewpoints, and Skagit Valley.',
    'Great pick! I\'ve drafted a route through Seattle, Everett, and Bellingham — including a few must-see overlooks along the way.'
  ];

  const UPDATE_RESPONSE_TEMPLATES = [
    'Updating your route to include {place}. The detour adds a scenic stretch with some beautiful views along the way.',
    'Done — {place} is now on your route. Traffic looks clear so it should be a smooth drive.',
    '{place} added to your trip. I\'ve adjusted the route to keep driving time efficient.'
  ];

  const SUGGESTED_SPOTS = [
    { name: "Ludwig's Fish and Chips",   seed: 'ludwigs' },
    { name: 'Casa de Tacos',             seed: 'tacos' },
    { name: 'The Grilled Oak',           seed: 'oak' }
  ];

  /* ─────────────────────────────────────────────
     STATE
     ───────────────────────────────────────────── */

  let map = null;
  let routePolyline = null;
  let routeMarkers = [];
  let routePlotted = false;
  let responseIndex = 0;

  // Drawing
  let drawMode = false;
  let drawnPoints = [];
  let drawMarkers = [];
  let drawPolyline = null;
  let drawOverlay = null;
  let shapeClosed = false;
  const CLOSE_THRESHOLD_PX = 32;

  // Suggestion pins placed inside the drawn polygon
  let suggestionMarkers = [];

  /* ─────────────────────────────────────────────
     ELEMENT REFS
     ───────────────────────────────────────────── */

  const body          = document.body;
  const panelBody     = document.querySelector('.panel__body');
  const thread        = document.querySelector('[data-thread]');
  const poiGrid       = document.querySelector('[data-poi-grid]');
  const stage         = document.querySelector('.stage');
  const tools         = document.querySelector('[data-tools]');
  const mapPrompt     = document.querySelector('[data-map-prompt]');

  const panelInput    = document.querySelector('.panel .footer .prompt-box__input');
  const panelSend     = document.querySelector('.panel .footer .prompt-box__send');
  const mapPromptInput = document.querySelector('.map-prompt .prompt-box__input');
  const mapPromptSend  = document.querySelector('.map-prompt .prompt-box__send');

  /* ─────────────────────────────────────────────
     UTILS
     ───────────────────────────────────────────── */

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setBodyState(s) { body.setAttribute('data-state', s); }
  function getBodyState()  { return body.getAttribute('data-state'); }

  function scrollPanelToBottom() {
    requestAnimationFrame(() => { panelBody.scrollTop = panelBody.scrollHeight; });
  }

  /* ─────────────────────────────────────────────
     POI GRID — render once
     ───────────────────────────────────────────── */

  function renderPoiGrid() {
    poiGrid.innerHTML = POI_CARDS.map(p => `
      <div class="poi-card">
        <img class="poi-card__img" loading="lazy"
             src="https://picsum.photos/seed/${p.seed}/320/240"
             alt="${escapeHTML(p.name)}">
        <div class="poi-card__scrim"></div>
        <div class="poi-card__info">
          <span class="poi-card__name">${escapeHTML(p.name)}</span>
          <div class="poi-card__rating">
            <span>${p.rating}</span>
            <span class="material-symbols-rounded">star</span>
            <span>(${p.count})</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  /* ─────────────────────────────────────────────
     TABS
     ───────────────────────────────────────────── */

  function switchTab(target) {
    body.setAttribute('data-tab', target);
    document.querySelectorAll('.tabs__tab').forEach(t => {
      t.classList.toggle('is-active', t.dataset.tab === target);
    });
  }

  document.querySelectorAll('.tabs__tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  /* ─────────────────────────────────────────────
     PLAN AI — conversation
     ───────────────────────────────────────────── */

  function ensureConversationVisible() {
    setBodyState('conversation');
  }

  function appendUserBubble(text) {
    const wrap = document.createElement('div');
    wrap.className = 'thread__exchange animate-in';
    wrap.innerHTML = `
      <div class="user-bubble-wrap">
        <span class="user-bubble">${escapeHTML(text)}</span>
      </div>
    `;
    thread.appendChild(wrap);
    scrollPanelToBottom();
    return wrap;
  }

  function appendTyping(parent) {
    const t = document.createElement('div');
    t.className = 'typing animate-in';
    t.id = 'typing-' + Date.now();
    t.innerHTML = '<span class="typing__dot"></span><span class="typing__dot"></span><span class="typing__dot"></span>';
    parent.appendChild(t);
    scrollPanelToBottom();
    return t;
  }

  function removeTyping(t) { if (t && t.parentNode) t.parentNode.removeChild(t); }

  function appendAIResponse(parent, response) {
    const p = document.createElement('p');
    p.className = 'ai-text animate-in';
    p.textContent = response.text;
    parent.appendChild(p);

    const card = document.createElement('div');
    card.className = 'plan-card animate-in' + (response.images ? '' : ' plan-card--compact');

    let html = `
      <div class="plan-card__header">
        <span>${response.images ? 'Plan created' : 'Plan updated'}</span>
        <span class="material-symbols-rounded">${response.images ? 'chevron_right' : 'task_alt'}</span>
      </div>
    `;

    if (response.images) {
      html += '<div class="plan-card__images">';
      response.images.forEach(src => {
        html += `<img class="plan-card__img" src="${src}" alt="" loading="lazy">`;
      });
      html += '</div>';
    }

    card.innerHTML = html;
    parent.appendChild(card);
    scrollPanelToBottom();
  }

  function buildResponse(userText) {
    const isFirst = responseIndex === 0;
    const idx = isFirst
      ? Math.floor(Math.random() * FIRST_RESPONSE_TEMPLATES.length)
      : (responseIndex - 1) % UPDATE_RESPONSE_TEMPLATES.length;

    const place = userText.length > 60 ? userText.substring(0, 60) : userText;
    const text = (isFirst ? FIRST_RESPONSE_TEMPLATES[idx] : UPDATE_RESPONSE_TEMPLATES[idx])
      .replace(/\{place\}/g, place);

    responseIndex++;

    if (isFirst) {
      const seed = encodeURIComponent(place || 'trip');
      return {
        text,
        images: [
          `https://picsum.photos/seed/${seed}-a/200/160`,
          `https://picsum.photos/seed/${seed}-b/200/160`,
          `https://picsum.photos/seed/${seed}-c/200/160`
        ]
      };
    }
    return { text, images: null };
  }

  function handlePromptSubmit() {
    const text = panelInput.value.trim();
    if (!text) return;
    panelInput.value = '';

    switchTab('plan-ai');
    ensureConversationVisible();

    const exchange = appendUserBubble(text);
    const typing   = appendTyping(exchange);

    const delay = 1200 + Math.random() * 800;
    triggerMapThinking(delay);

    setTimeout(() => {
      removeTyping(typing);
      const response = buildResponse(text);
      appendAIResponse(exchange, response);
      plotRoute();
    }, delay);
  }

  panelSend.addEventListener('click', handlePromptSubmit);
  panelInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); handlePromptSubmit(); }
  });

  /* ─────────────────────────────────────────────
     MAP — Google Maps init
     ───────────────────────────────────────────── */

  window.initMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 47.85, lng: -122.4 },
      zoom: 9,
      disableDefaultUI: true,
      gestureHandling: 'greedy',
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] }
      ]
    });

    map.addListener('click', e => handleMapClick(e.latLng));
  };

  function fitMapToBounds() {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    TRIP_STOPS.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
    map.fitBounds(bounds, { top: 80, right: 120, bottom: 80, left: 80 });
  }

  function plotRoute() {
    if (routePlotted || !map) return;
    routePlotted = true;

    routePolyline = new google.maps.Polyline({
      path: ROUTE_PATH,
      geodesic: true,
      strokeColor: '#1a73e8',
      strokeOpacity: 1,
      strokeWeight: 4,
      map
    });

    TRIP_STOPS.forEach((stop, i) => {
      const isLast = i === TRIP_STOPS.length - 1;
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        title: stop.name,
        icon: isLast ? {
          path: 'M 0,-12 C -6,-12 -10,-7 -10,-2 C -10,5 0,12 0,12 C 0,12 10,5 10,-2 C 10,-7 6,-12 0,-12 z',
          fillColor: '#ea4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.2,
          anchor: new google.maps.Point(0, 12)
        } : {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#ffffff',
          fillOpacity: 1,
          strokeColor: '#1a73e8',
          strokeWeight: 4
        }
      });
      routeMarkers.push(marker);
    });

    fitMapToBounds();
  }

  function triggerMapThinking(duration) {
    if (!map) return;
    stage.classList.add('is-thinking');
    setTimeout(() => stage.classList.remove('is-thinking'), duration + 200);
  }

  /* ─────────────────────────────────────────────
     DRAW MODE
     ───────────────────────────────────────────── */

  function setDrawMode(on) {
    drawMode = on;
    body.setAttribute('data-draw', on ? 'on' : 'off');
    document.querySelector('[data-action="draw"]').classList.toggle('is-active', on);

    if (on) {
      shapeClosed = false;
      clearDrawState();
      clearSuggestionMarkers();
      mapPrompt.hidden = true;
      if (!drawOverlay && map) {
        drawOverlay = new google.maps.OverlayView();
        drawOverlay.draw = function () {};
        drawOverlay.setMap(map);
      }
    } else {
      mapPrompt.hidden = true;
    }
  }

  function clearDrawState() {
    drawnPoints = [];
    drawMarkers.forEach(m => m.setMap(null));
    drawMarkers = [];
    if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
    shapeClosed = false;
  }

  function makeDrawDot(filled) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: filled ? '#1a73e8' : '#ffffff',
      fillOpacity: 1,
      strokeColor: filled ? '#ffffff' : '#1a73e8',
      strokeWeight: 2.5
    };
  }

  function updateDrawPolyline(close) {
    const pts = drawnPoints.map(p => ({ lat: p.lat, lng: p.lng }));
    if (close) pts.push(pts[0]);

    if (drawPolyline) {
      drawPolyline.setPath(pts);
    } else {
      drawPolyline = new google.maps.Polyline({
        path: pts,
        strokeColor: '#1a73e8',
        strokeOpacity: 0,
        strokeWeight: 3,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.85, scale: 3 },
          offset: '0',
          repeat: '12px'
        }],
        map
      });
    }
  }

  function isNearFirstPoint(latLng) {
    if (drawnPoints.length < 3) return false;
    const proj = drawOverlay && drawOverlay.getProjection();
    if (!proj) return false;
    const firstPx = proj.fromLatLngToContainerPixel(
      new google.maps.LatLng(drawnPoints[0].lat, drawnPoints[0].lng)
    );
    const clickPx = proj.fromLatLngToContainerPixel(latLng);
    const dx = firstPx.x - clickPx.x;
    const dy = firstPx.y - clickPx.y;
    return Math.sqrt(dx * dx + dy * dy) < CLOSE_THRESHOLD_PX;
  }

  function getCentroid(points) {
    let lat = 0, lng = 0;
    points.forEach(p => { lat += p.lat; lng += p.lng; });
    return new google.maps.LatLng(lat / points.length, lng / points.length);
  }

  function positionMapPrompt(latLng) {
    const proj = drawOverlay && drawOverlay.getProjection();
    if (!proj) {
      mapPrompt.style.bottom = '120px';
      mapPrompt.style.right = '120px';
      mapPrompt.style.left = 'auto';
      mapPrompt.style.top = 'auto';
      mapPrompt.hidden = false;
      return;
    }
    const px = proj.fromLatLngToContainerPixel(latLng);
    const stageRect = stage.getBoundingClientRect();
    const promptW = 360;
    let left = px.x - promptW / 2;
    let top  = px.y + 32;

    left = Math.max(0, Math.min(left, stageRect.width - promptW));
    top  = Math.max(0, Math.min(top,  stageRect.height - 100));

    mapPrompt.style.left = left + 'px';
    mapPrompt.style.top  = top + 'px';
    mapPrompt.style.right = 'auto';
    mapPrompt.style.bottom = 'auto';
    mapPrompt.hidden = false;
  }

  function closeShape() {
    shapeClosed = true;
    if (drawMarkers[0]) drawMarkers[0].setIcon(makeDrawDot(true));
    updateDrawPolyline(true);
    positionMapPrompt(getCentroid(drawnPoints));
    setTimeout(() => mapPromptInput.focus(), 250);
  }

  function handleMapClick(latLng) {
    if (!drawMode || shapeClosed) return;

    if (isNearFirstPoint(latLng)) {
      closeShape();
      return;
    }

    const point = { lat: latLng.lat(), lng: latLng.lng() };
    drawnPoints.push(point);

    const marker = new google.maps.Marker({
      position: point,
      map,
      icon: makeDrawDot(true),
      zIndex: 100
    });
    drawMarkers.push(marker);

    if (drawnPoints.length > 1) updateDrawPolyline(false);
  }

  function appendSuggestionsResponse(parent, spots) {
    const lede = document.createElement('p');
    lede.className = 'ai-text animate-in';
    lede.textContent = 'Here are a few suggest spots';
    parent.appendChild(lede);

    const list = document.createElement('div');
    list.className = 'suggestions-list animate-in';
    list.innerHTML = spots.map((spot, i) => `
      <div class="suggestion-card" data-suggestion-idx="${i}">
        <div class="suggestion-card__head">
          <span class="suggestion-card__title">${i + 1}. ${escapeHTML(spot.name)}</span>
          <button class="suggestion-card__add" aria-label="Add this stop">
            <span class="material-symbols-rounded">add</span>
          </button>
        </div>
        <img class="suggestion-card__img" loading="lazy"
             src="https://picsum.photos/seed/${spot.seed}/304/136"
             alt="${escapeHTML(spot.name)}">
      </div>
    `).join('');
    parent.appendChild(list);

    // Add toggle: + → check
    list.querySelectorAll('.suggestion-card__add').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const isAdded = btn.classList.toggle('is-added');
        btn.querySelector('.material-symbols-rounded').textContent = isAdded ? 'check' : 'add';
      });
    });

    // Hovering a card highlights its map marker
    list.querySelectorAll('.suggestion-card').forEach(card => {
      const idx = Number(card.dataset.suggestionIdx);
      card.addEventListener('mouseenter', () => focusSuggestionMarker(idx, true));
      card.addEventListener('mouseleave', () => focusSuggestionMarker(idx, false));
    });

    scrollPanelToBottom();
  }

  // Compute 3 positions inside the drawn polygon's bounding box
  function getSuggestionPositions(count) {
    if (!drawnPoints.length) return [];

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    drawnPoints.forEach(p => {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
      if (p.lng < minLng) minLng = p.lng;
      if (p.lng > maxLng) maxLng = p.lng;
    });

    const cLat = (minLat + maxLat) / 2;
    const cLng = (minLng + maxLng) / 2;
    const rLat = Math.max((maxLat - minLat) / 3, 0.001);
    const rLng = Math.max((maxLng - minLng) / 3, 0.001);

    // Spread points around the centroid in a small triangle pattern
    const offsets = [
      { dLat:  0.6,  dLng: -0.5 },
      { dLat: -0.4,  dLng:  0.7 },
      { dLat:  0.2,  dLng:  0.3 }
    ];

    return offsets.slice(0, count).map(o => ({
      lat: cLat + o.dLat * rLat,
      lng: cLng + o.dLng * rLng
    }));
  }

  function clearSuggestionMarkers() {
    suggestionMarkers.forEach(m => m.setMap(null));
    suggestionMarkers = [];
  }

  function placeSuggestionMarkers(spots) {
    clearSuggestionMarkers();
    if (!map) return;

    const positions = getSuggestionPositions(spots.length);

    spots.forEach((spot, i) => {
      const pos = positions[i];
      if (!pos) return;
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: spot.name,
        zIndex: 200,
        label: {
          text: String(i + 1),
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: '700',
          fontFamily: 'Google Sans, Arial, sans-serif'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#1a73e8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });
      suggestionMarkers.push(marker);
    });
  }

  function focusSuggestionMarker(idx, on) {
    const m = suggestionMarkers[idx];
    if (!m) return;
    m.setIcon({
      path: google.maps.SymbolPath.CIRCLE,
      scale: on ? 18 : 14,
      fillColor: on ? '#185abc' : '#1a73e8',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: on ? 4 : 3
    });
    if (on) m.setZIndex(300); else m.setZIndex(200);
  }

  function handleMapPromptSubmit() {
    const text = mapPromptInput.value.trim() || 'Plan a stop here';
    mapPromptInput.value = '';
    mapPrompt.hidden = true;

    // Reflect what the user typed in the chat thread
    switchTab('plan-ai');
    ensureConversationVisible();
    const exchange = appendUserBubble(text);
    const typing = appendTyping(exchange);

    // Turn off active draw input but keep the dashed outline + corner dots visible
    setDrawMode(false);

    const delay = 1200 + Math.random() * 800;
    setTimeout(() => {
      removeTyping(typing);
      appendSuggestionsResponse(exchange, SUGGESTED_SPOTS);
      placeSuggestionMarkers(SUGGESTED_SPOTS);
    }, delay);
  }

  mapPromptSend.addEventListener('click', handleMapPromptSubmit);
  mapPromptInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); handleMapPromptSubmit(); }
  });

  /* ─────────────────────────────────────────────
     TOOL BUTTONS
     ───────────────────────────────────────────── */

  document.querySelector('[data-action="draw"]').addEventListener('click', () => {
    setDrawMode(!drawMode);
  });

  document.querySelector('[data-action="zoom-in"]').addEventListener('click', () => {
    if (map) map.setZoom((map.getZoom() || 9) + 1);
  });

  document.querySelector('[data-action="zoom-out"]').addEventListener('click', () => {
    if (map) map.setZoom((map.getZoom() || 9) - 1);
  });

  /* ─────────────────────────────────────────────
     RAIL BUTTONS — purely visual selection
     ───────────────────────────────────────────── */

  document.querySelectorAll('.rail__btn--labeled').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.rail__btn--labeled').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  /* ─────────────────────────────────────────────
     INIT
     ───────────────────────────────────────────── */

  renderPoiGrid();

})();
