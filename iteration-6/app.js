(function () {
  'use strict';

  const STOPS = [
    { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { name: 'Everett', lat: 47.9790, lng: -122.2021 },
    { name: 'Bellingham', lat: 48.7519, lng: -122.4787 },
    { name: 'Portland', lat: 45.5152, lng: -122.6784 }
  ];

  const FIRST_RESPONSE_TEMPLATES = [
    'Explore the scenic routes around {place}. Discover charming towns, lush forests, and stunning waterfront views. Perfect for a quick getaway filled with adventure and relaxation.',
    'I\'ve planned an amazing trip through {place}. You\'ll find beautiful landscapes, local eateries, and hidden gems along the way.',
    'Great pick! {place} has so much to offer. I\'ve mapped out the best stops including viewpoints, cafés, and nature trails.'
  ];

  const UPDATE_RESPONSE_TEMPLATES = [
    'Updating your route to include {place}. The detour adds a scenic stretch with some beautiful views along the way.',
    'Added {place} to your trip! I\'ve optimized the route so you\'ll pass through during the best time of day.',
    'Done — {place} is now on your route. Traffic looks clear on that stretch, so it should be a smooth drive.',
    'Route updated with {place}! There\'s a great viewpoint nearby that\'s worth a quick stop.',
    '{place} is a wonderful addition. I\'ve adjusted the route to keep the driving time efficient.'
  ];

  const MAP_POINTS_OF_INTEREST = [
    { lat: 47.6205, lng: -122.3493, name: 'Space Needle' },
    { lat: 47.6097, lng: -122.3425, name: 'Pike Place Market' },
    { lat: 47.6516, lng: -122.3509, name: 'Woodland Park Zoo' },
    { lat: 47.6280, lng: -122.2420, name: 'Bellevue Downtown' },
    { lat: 47.5480, lng: -122.3179, name: 'Museum of Flight' },
    { lat: 48.4200, lng: -122.3375, name: 'Skagit Valley' },
    { lat: 47.6588, lng: -122.4009, name: 'Ballard Locks' },
    { lat: 47.6615, lng: -122.3425, name: 'Gas Works Park' },
    { lat: 47.6294, lng: -122.3422, name: 'Kerry Park' },
    { lat: 47.5852, lng: -122.3284, name: 'Georgetown' }
  ];

  let map = null;
  let routePath = null;
  let routeMarkers = [];
  let routePlotted = false;
  let generatingTimer = null;
  let responseIndex = 0;
  let poiIndex = 0;

  function setState(newState) {
    document.body.setAttribute('data-state', newState);

    if (map && newState === 'split') {
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
        fitMapToBounds();
      }, 350);
    }
  }

  function getState() {
    return document.body.getAttribute('data-state');
  }

  // ─── Panel Tab Switching ────────────────────────────────────
  const leftPanel = document.querySelector('.left-panel');

  function switchToTab(target) {
    leftPanel.dataset.tab = target;
    document.querySelectorAll('[data-panel-tab]').forEach(t =>
      t.classList.toggle('active', t.dataset.panelTab === target));
    document.querySelectorAll('[data-content]').forEach(c =>
      c.classList.toggle('active', c.dataset.content === target));
  }

  document.querySelectorAll('[data-panel-tab]').forEach(tab => {
    tab.addEventListener('click', function () {
      switchToTab(this.dataset.panelTab);
    });
  });

  // ─── Chat Message Handling ──────────────────────────────────
  const messagesContainer = document.querySelector('.plan-ai-messages');
  const footerInput = document.querySelector('.panel-footer__input');
  const footerSend = document.querySelector('.panel-footer__send');
  const footerInputWrap = document.querySelector('.panel-footer__input-wrap');
  const footerLoading = document.querySelector('.panel-footer__loading');

  function addUserBubble(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble--user chat-animate-in';
    bubble.innerHTML = '<span class="chat-bubble__text">' + escapeHTML(text) + '</span>';
    messagesContainer.appendChild(bubble);
    scrollMessagesToBottom();
  }

  function addTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'chat-typing chat-animate-in';
    typing.innerHTML =
      '<span class="chat-typing__dot"></span>' +
      '<span class="chat-typing__dot"></span>' +
      '<span class="chat-typing__dot"></span>';
    typing.id = 'chat-typing';
    messagesContainer.appendChild(typing);
    scrollMessagesToBottom();
  }

  function removeTypingIndicator() {
    const el = document.getElementById('chat-typing');
    if (el) el.remove();
  }

  function addAIResponse(response) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-response chat-animate-in';

    let html = '<p class="chat-response__text">' + escapeHTML(response.text) + '</p>';

    if (response.type === 'created' && response.images) {
      html += '<div class="chat-response__plan">' +
        '<div class="chat-response__plan-header">' +
          '<span>Plan created</span>' +
          '<span class="material-symbols-rounded">chevron_right</span>' +
        '</div>' +
        '<div class="chat-response__images">';
      response.images.forEach(function(src) {
        html += '<div class="chat-response__img"><img src="' + src + '" alt="Route image" loading="lazy"></div>';
      });
      html += '</div></div>';
    } else {
      html += '<div class="chat-response__plan chat-response__plan--done">' +
        '<span>Plan updated</span>' +
        '<span class="material-symbols-rounded">task_alt</span>' +
      '</div>';
    }

    wrapper.innerHTML = html;
    messagesContainer.appendChild(wrapper);
    scrollMessagesToBottom();
  }

  function scrollMessagesToBottom() {
    const content = document.querySelector('[data-content="plan-ai"]');
    requestAnimationFrame(function() {
      content.scrollTop = content.scrollHeight;
    });
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function buildResponse(userText) {
    var place = userText.length > 60 ? userText.substring(0, 60) : userText;
    var isFirst = responseIndex === 0;
    var templates = isFirst ? FIRST_RESPONSE_TEMPLATES : UPDATE_RESPONSE_TEMPLATES;
    var idx = isFirst ? 0 : (responseIndex - 1) % UPDATE_RESPONSE_TEMPLATES.length;
    var text = templates[idx].replace(/\{place\}/g, place);

    responseIndex++;

    if (isFirst) {
      return {
        text: text,
        type: 'created',
        images: [
          'https://picsum.photos/seed/' + encodeURIComponent(place) + '1/200/160',
          'https://picsum.photos/seed/' + encodeURIComponent(place) + '2/200/160',
          'https://picsum.photos/seed/' + encodeURIComponent(place) + '3/200/160'
        ]
      };
    }

    return { text: text, type: 'updated', images: null };
  }

  // ─── Map Reaction Effects ───────────────────────────────────

  function triggerMapReaction(responseDelay) {
    if (!map) return;
    var mapEl = document.querySelector('.map-container');

    mapEl.classList.add('map-container--thinking');

    var poi = MAP_POINTS_OF_INTEREST[poiIndex % MAP_POINTS_OF_INTEREST.length];
    poiIndex++;

    map.panTo({ lat: poi.lat, lng: poi.lng });
    map.setZoom(12);

    setTimeout(function() {
      mapEl.classList.remove('map-container--thinking');
      fitMapToBounds();
    }, responseDelay + 400);
  }

  // ─── Send Message Flow ──────────────────────────────────────

  function revealChat() {
    var empty = document.querySelector('.plan-ai-empty');
    var messages = document.querySelector('.plan-ai-messages');
    if (empty) empty.hidden = true;
    if (messages) messages.removeAttribute('hidden');
  }

  function plotRoute() {
    if (routePlotted || !map) return;
    routePlotted = true;

    var routeCoords = [
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

    STOPS.forEach(function(stop, i) {
      var isLast = i === STOPS.length - 1;
      var marker = new google.maps.Marker({
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
      routeMarkers.push(marker);
    });

    fitMapToBounds();
  }

  function handleSendMessage() {
    var text = footerInput.value.trim();
    if (!text) return;

    revealChat();

    if (getState() === 'map-fullscreen') {
      setState('split');
    }

    switchToTab('plan-ai');

    footerInput.value = '';

    addUserBubble(text);

    var response = buildResponse(text);
    var delay = 1500 + Math.random() * 1500;

    setTimeout(function() {
      addTypingIndicator();
      triggerMapReaction(delay);
    }, 300);

    setTimeout(function() {
      removeTypingIndicator();
      addAIResponse(response);
      plotRoute();
    }, 300 + delay);
  }

  footerSend.addEventListener('click', handleSendMessage);

  footerInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  });

  // ─── Nav Rail ──────────────────────────────────────────────
  document.querySelectorAll('.nav-rail__btn').forEach(function(btn) {
    btn.addEventListener('click', function () {
      var action = this.dataset.action;
      if (action === 'home') {
        if (generatingTimer) {
          clearTimeout(generatingTimer);
          generatingTimer = null;
        }
        setState('map-fullscreen');
      } else if (action === 'road-trip') {
        if (getState() === 'map-fullscreen') {
          setState('split');
        }
      }
    });
  });

  // ─── Draw on Map Feature ──────────────────────────────────
  const SUGGESTED_SPOTS = [
    { name: "Ludwig's Fish and Chips", img: 'https://picsum.photos/seed/fish-chips/304/136' },
    { name: 'Casa de Tacos', img: 'https://picsum.photos/seed/tacos-spot/304/136' },
    { name: 'The Grilled Oak', img: 'https://picsum.photos/seed/grilled-oak/304/136' }
  ];

  const CLOSE_THRESHOLD_PX = 32;

  let drawMode = false;
  let drawnPoints = [];
  let drawMarkers = [];
  let drawPolyline = null;
  let drawOverlay = null;
  let shapeClosed = false;

  var drawFab = document.querySelector('[data-action="draw-mode"]');
  var mapDrawInput = document.querySelector('.map-draw-input');
  var mapDrawField = document.querySelector('.map-draw-input__field');
  var mapDrawSend = document.querySelector('.map-draw-input__send');

  function toggleDrawMode() {
    drawMode = !drawMode;
    document.body.classList.toggle('draw-mode-active', drawMode);
    drawFab.classList.toggle('draw-active', drawMode);

    if (drawMode) {
      shapeClosed = false;
      drawnPoints = [];
      drawMarkers.forEach(function(m) { m.setMap(null); });
      drawMarkers = [];
      if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
      // Prime the overlay so projection is ready when user first clicks
      if (!drawOverlay) {
        drawOverlay = new google.maps.OverlayView();
        drawOverlay.draw = function() {};
        drawOverlay.setMap(map);
      }
    } else {
      mapDrawInput.hidden = true;
    }
  }

  function makeDotIcon(filled) {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: filled ? '#1a73e8' : '#ffffff',
      fillOpacity: 1,
      strokeColor: filled ? '#ffffff' : '#1a73e8',
      strokeWeight: 2
    };
  }

  function makeFirstDotIcon() {
    // Slightly larger ring on the first dot to hint it's the close-target
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#1a73e8',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2.5
    };
  }

  function updateDrawPolyline(closePath) {
    var pts = drawnPoints.map(function(p) { return { lat: p.lat, lng: p.lng }; });
    if (closePath) pts.push(pts[0]); // close the loop

    if (drawPolyline) {
      drawPolyline.setPath(pts);
    } else {
      drawPolyline = new google.maps.Polyline({
        path: pts,
        geodesic: true,
        strokeColor: '#1a73e8',
        strokeOpacity: 0,
        strokeWeight: 3,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.8, scale: 3 },
          offset: '0',
          repeat: '12px'
        }],
        map: map
      });
    }
  }

  function getCentroid(points) {
    var latSum = 0, lngSum = 0;
    points.forEach(function(p) { latSum += p.lat; lngSum += p.lng; });
    return new google.maps.LatLng(latSum / points.length, lngSum / points.length);
  }

  function positionMapInput(latLng) {
    var proj = drawOverlay && drawOverlay.getProjection();
    if (!proj) {
      mapDrawInput.style.bottom = '100px';
      mapDrawInput.style.right = '120px';
      mapDrawInput.style.left = 'auto';
      mapDrawInput.style.top = 'auto';
      mapDrawInput.hidden = false;
      return;
    }

    var px = proj.fromLatLngToContainerPixel(latLng);
    var mapEl = document.getElementById('map');
    var rect = mapEl.getBoundingClientRect();
    var mainArea = document.querySelector('.main-area');
    var mainRect = mainArea.getBoundingClientRect();

    var left = px.x + (rect.left - mainRect.left) - 176; // centre the 352px-wide box
    var top  = px.y + (rect.top  - mainRect.top)  + 24;

    var maxLeft = mainRect.width - 392;
    var maxTop  = mainRect.height - 100;
    if (left > maxLeft) left = maxLeft;
    if (top  > maxTop)  top  = maxTop;
    if (left < 0) left = 0;
    if (top  < 0) top  = 0;

    mapDrawInput.style.left   = left + 'px';
    mapDrawInput.style.top    = top  + 'px';
    mapDrawInput.style.right  = 'auto';
    mapDrawInput.style.bottom = 'auto';
    mapDrawInput.hidden = false;
  }

  function closeShape() {
    shapeClosed = true;
    // Update first marker to show it's closed
    if (drawMarkers[0]) drawMarkers[0].setIcon(makeFirstDotIcon());

    // Close the polyline loop
    updateDrawPolyline(true);

    // Show input box centred on the polygon
    var centroid = getCentroid(drawnPoints);
    mapDrawField.placeholder = 'Find places inside this area…';
    positionMapInput(centroid);
  }

  function isNearFirstPoint(latLng) {
    if (drawnPoints.length < 3) return false;
    var proj = drawOverlay && drawOverlay.getProjection();
    if (!proj) return false;
    var firstPx = proj.fromLatLngToContainerPixel(
      new google.maps.LatLng(drawnPoints[0].lat, drawnPoints[0].lng)
    );
    var clickPx = proj.fromLatLngToContainerPixel(latLng);
    var dx = firstPx.x - clickPx.x;
    var dy = firstPx.y - clickPx.y;
    return Math.sqrt(dx * dx + dy * dy) < CLOSE_THRESHOLD_PX;
  }

  function handleMapClick(latLng) {
    if (!drawMode || shapeClosed) return;

    // Close the shape when clicking near the first dot (3+ points already placed)
    if (isNearFirstPoint(latLng)) {
      closeShape();
      return;
    }

    var point = { lat: latLng.lat(), lng: latLng.lng() };
    drawnPoints.push(point);

    var icon = drawnPoints.length === 1 ? makeFirstDotIcon() : makeDotIcon(true);
    var marker = new google.maps.Marker({
      position: point,
      map: map,
      icon: icon,
      zIndex: 100
    });
    drawMarkers.push(marker);

    if (drawnPoints.length > 1) {
      updateDrawPolyline(false);
    }
    // Input box stays hidden until the shape is closed
  }


  function clearDrawState() {
    drawnPoints = [];
    drawMarkers.forEach(function(m) { m.setMap(null); });
    drawMarkers = [];
    if (drawPolyline) { drawPolyline.setMap(null); drawPolyline = null; }
    shapeClosed = false;
  }

  function addAreaSpotsResponse() {
    var wrapper = document.createElement('div');
    wrapper.className = 'chat-response chat-animate-in';

    var html =
      '<p class="chat-response__text">Here are a few spots in that area that might interest you:</p>' +
      '<div class="chat-response__spots">';

    SUGGESTED_SPOTS.forEach(function(spot, i) {
      html +=
        '<div class="chat-spot-card">' +
          '<img class="chat-spot-card__img" src="' + spot.img + '" alt="' + escapeHTML(spot.name) + '" loading="lazy">' +
          '<div class="chat-spot-card__footer">' +
            '<span class="chat-spot-card__name">' + (i + 1) + '. ' + escapeHTML(spot.name) + '</span>' +
            '<button class="chat-spot-card__add" aria-label="Add stop">' +
              '<span class="material-symbols-rounded">add</span>' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    html += '</div>';
    wrapper.innerHTML = html;
    messagesContainer.appendChild(wrapper);

    wrapper.querySelectorAll('.chat-spot-card__add').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var isDone = btn.classList.contains('chat-spot-card__add--done');
        if (isDone) {
          btn.classList.remove('chat-spot-card__add--done');
          btn.querySelector('.material-symbols-rounded').textContent = 'add';
        } else {
          btn.classList.add('chat-spot-card__add--done');
          btn.querySelector('.material-symbols-rounded').textContent = 'check';
        }
      });
    });

    scrollMessagesToBottom();
  }

  function handleDrawSubmit() {
    var text = mapDrawField.value.trim() || 'Find places in this area';
    mapDrawInput.hidden = true;
    mapDrawField.value = '';

    if (drawMode) toggleDrawMode();

    // Fade markers to hollow while the AI "thinks" — cleared after response
    drawMarkers.forEach(function(m) { m.setIcon(makeDotIcon(false)); });

    // Flow directly into the AI chat conversation
    revealChat();
    switchToTab('plan-ai');
    addUserBubble(text);

    var delay = 1200 + Math.random() * 800;

    setTimeout(function() { addTypingIndicator(); }, 300);

    setTimeout(function() {
      removeTypingIndicator();
      addAreaSpotsResponse();
      clearDrawState();
    }, 300 + delay);
  }

  drawFab.addEventListener('click', toggleDrawMode);

  mapDrawSend.addEventListener('click', handleDrawSubmit);

  mapDrawField.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDrawSubmit();
    }
  });

  // ─── Google Maps ───────────────────────────────────────────
  function fitMapToBounds() {
    if (!map) return;
    var bounds = new google.maps.LatLngBounds();
    STOPS.forEach(function(stop) { bounds.extend({ lat: stop.lat, lng: stop.lng }); });
    map.fitBounds(bounds, { top: 80, right: 120, bottom: 120, left: 40 });
  }

  window.initMap = function () {
    var mapEl = document.getElementById('map');

    map = new google.maps.Map(mapEl, {
      center: { lat: 47.6062, lng: -122.3321 },
      zoom: 8,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
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

    map.addListener('click', function(e) {
      handleMapClick(e.latLng);
    });
  };
})();
