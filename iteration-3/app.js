(function () {
  "use strict";

  // ── Trip stops (matching Figma: Seattle area) ──
  const STOPS = [
    { name: "Seattle", lat: 47.6062, lng: -122.3321 },
    { name: "U-district", lat: 47.6615, lng: -122.3131 },
    { name: "Bellevue", lat: 47.6101, lng: -122.2015 },
    { name: "Redmond", lat: 47.6740, lng: -122.1215 },
    { name: "Tacoma", lat: 47.2529, lng: -122.4443 },
    { name: "Kirkland", lat: 47.6769, lng: -122.2060 },
    { name: "Everett", lat: 47.9790, lng: -122.2021, isLast: true },
  ];

  const TRIP_DESCRIPTION =
    "Here's a road trip plan around the Seattle metropolitan area! Starting from downtown Seattle, you'll head north through the U-District with its vibrant university culture, then east to Bellevue's stunning waterfront and Redmond's tech hub parks. The route swings south to Tacoma for its museums and glass art, loops back through Kirkland's charming lakeside shops, and ends in Everett where you can catch views of the Puget Sound and the naval base.\n\nThis route covers diverse terrain — urban cores, lakefront paths, and suburban nature trails — perfect for a weekend getaway.";

  const TRIP_STATS = {
    distance: "234.5 Km",
    time: "4hr 34min",
    fuel: "Gas",
    road: "Good",
  };

  // ── State ──
  let state = "idle"; // idle | loading | results
  let stopsOrder = [...STOPS];

  // ── Map Init ──
  const map = L.map("map", {
    center: [47.6062, -122.3321],
    zoom: 10,
    zoomControl: false,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);

  // ── Pin icon helper ──
  function createPinIcon(color, label) {
    return L.divIcon({
      className: "custom-pin",
      html: `<svg width="32" height="44" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 28 16 28s16-16 16-28C32 7.163 24.837 0 16 0z" fill="${color}"/>
        <circle cx="16" cy="16" r="8" fill="white"/>
        <text x="16" y="20" text-anchor="middle" font-size="11" font-weight="600" font-family="Roboto, Arial, sans-serif" fill="${color}">${label}</text>
      </svg>`,
      iconSize: [32, 44],
      iconAnchor: [16, 44],
      popupAnchor: [0, -44],
    });
  }

  // ── DOM Refs ──
  const promptInput = document.getElementById("prompt-input");
  const btnSend = document.getElementById("btn-send");
  const aiIdle = document.getElementById("ai-idle");
  const aiResult = document.getElementById("ai-result");
  const aiDescription = document.getElementById("ai-description");
  const aiTripBadge = document.getElementById("ai-trip-badge");
  const aiPlan = document.getElementById("ai-plan");
  const aiContent = document.getElementById("ai-content");
  const panelRoadtrip = document.getElementById("panel-roadtrip");
  const panelRoute = document.getElementById("panel-route");
  const locationList = document.getElementById("location-list");
  const tabs = document.querySelectorAll(".tab");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const locateBtn = document.getElementById("btn-locate");

  let routeLine = null;
  let stopMarkers = [];

  // ── Textarea auto-resize ──
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = promptInput.scrollHeight + "px";
    btnSend.disabled = !promptInput.value.trim();
  });

  // ── Send ──
  btnSend.addEventListener("click", handleSend);
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (promptInput.value.trim()) handleSend();
    }
  });

  function handleSend() {
    if (state === "loading") return;
    const query = promptInput.value.trim();
    if (!query) return;

    if (state === "results") {
      resetToIdle();
    }

    transitionToLoading();
  }

  // ── State Transitions ──
  function transitionToLoading() {
    state = "loading";
    btnSend.disabled = true;
    promptInput.value = "";
    promptInput.style.height = "auto";

    aiIdle.hidden = true;
    aiResult.hidden = false;
    aiPlan.hidden = true;

    aiTripBadge.textContent = "Seattle Metro Area • 7 stops";
    aiDescription.innerHTML = '<span class="ai-result__cursor"></span>';

    typewriterEffect(TRIP_DESCRIPTION, () => {
      transitionToResults();
    });
  }

  function typewriterEffect(text, onComplete) {
    let index = 0;
    const chunkSize = 3;
    const interval = 20;

    function tick() {
      if (index < text.length) {
        const nextChunk = text.slice(index, index + chunkSize);
        index += chunkSize;

        const currentText = text.slice(0, index);
        aiDescription.innerHTML = currentText.replace(/\n/g, "<br>") + '<span class="ai-result__cursor"></span>';

        aiContent.scrollTop = aiContent.scrollHeight;
        setTimeout(tick, interval);
      } else {
        aiDescription.innerHTML = text.replace(/\n/g, "<br>");
        if (onComplete) onComplete();
      }
    }
    tick();
  }

  function transitionToResults() {
    state = "results";
    promptInput.placeholder = "Ask to make changes to your trip...";

    aiPlan.hidden = false;

    drawRoute();
    renderLocationList();

    const coords = stopsOrder.map((s) => [s.lat, s.lng]);
    map.fitBounds(coords, { padding: [60, 60], maxZoom: 12 });
  }

  function resetToIdle() {
    clearRoute();
    state = "idle";
    aiIdle.hidden = false;
    aiResult.hidden = true;
    aiPlan.hidden = true;
    aiDescription.innerHTML = "";
    aiTripBadge.textContent = "";
    promptInput.placeholder = "Where do you want to go today?";
  }

  // ── Tabs ──
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("tab--active"));
      tab.classList.add("tab--active");

      if (target === "roadtrip") {
        panelRoadtrip.hidden = false;
        panelRoute.hidden = true;
      } else if (target === "route") {
        panelRoadtrip.hidden = true;
        panelRoute.hidden = false;
      }
    });
  });

  // ── Route Drawing ──
  function drawRoute() {
    clearRoute();
    const coords = stopsOrder.map((s) => [s.lat, s.lng]);

    routeLine = L.polyline(coords, {
      color: "#1a73e8",
      weight: 4,
      opacity: 0.9,
      smoothFactor: 1.5,
    }).addTo(map);

    stopsOrder.forEach((stop, i) => {
      const marker = L.marker([stop.lat, stop.lng], {
        icon: createPinIcon("#ea4335", i + 1),
      }).addTo(map);
      marker.bindPopup(`<strong>${stop.name}</strong>`, { closeButton: false });
      stopMarkers.push(marker);
    });
  }

  function clearRoute() {
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
    stopMarkers.forEach((m) => map.removeLayer(m));
    stopMarkers = [];
  }

  // ── Location List (Route tab) ──
  function renderLocationList() {
    locationList.innerHTML = "";

    stopsOrder.forEach((stop, i) => {
      const isLast = stop.isLast || i === stopsOrder.length - 1;
      const li = document.createElement("li");
      li.className = "location-list__item" + (isLast ? " location-list__item--last" : "");
      li.draggable = true;
      li.dataset.index = i;

      li.innerHTML = `
        <div class="location-list__indicator">
          <span class="location-list__dot">${isLast ? '<span class="material-symbols-rounded">location_on</span>' : ""}</span>
          ${!isLast ? '<span class="location-list__line"></span>' : ""}
        </div>
        <div class="location-list__name">${stop.name}</div>
      `;

      // Click to fly to location
      li.addEventListener("click", () => {
        map.setView([stop.lat, stop.lng], 14, { animate: true });
      });

      // Drag events
      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragend", handleDragEnd);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("dragenter", handleDragEnter);
      li.addEventListener("dragleave", handleDragLeave);
      li.addEventListener("drop", handleDrop);

      locationList.appendChild(li);
    });
  }

  // ── Drag & Drop ──
  let dragSrcIndex = null;

  function handleDragStart(e) {
    dragSrcIndex = parseInt(this.dataset.index);
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragSrcIndex);
  }

  function handleDragEnd() {
    this.classList.remove("dragging");
    document.querySelectorAll(".location-list__item").forEach((item) => {
      item.classList.remove("drag-over");
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add("drag-over");
  }

  function handleDragLeave() {
    this.classList.remove("drag-over");
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const dropIndex = parseInt(this.dataset.index);
    if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;

    // Reorder the stops array
    const [moved] = stopsOrder.splice(dragSrcIndex, 1);
    stopsOrder.splice(dropIndex, 0, moved);

    // Update isLast flags
    stopsOrder.forEach((s, i) => {
      s.isLast = i === stopsOrder.length - 1;
    });

    renderLocationList();
    drawRoute();

    const coords = stopsOrder.map((s) => [s.lat, s.lng]);
    map.fitBounds(coords, { padding: [60, 60], maxZoom: 12 });
  }

  // ── Map Controls ──
  zoomInBtn.addEventListener("click", () => map.zoomIn());
  zoomOutBtn.addEventListener("click", () => map.zoomOut());

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 14, { animate: true }),
      () => {}
    );
  });

  // ── Nav rail interactions ──
  const navItems = document.querySelectorAll(".nav-rail__item[data-nav]");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((n) => {
        n.classList.remove("nav-rail__item--active");
        n.removeAttribute("aria-current");
      });
      item.classList.add("nav-rail__item--active");
      item.setAttribute("aria-current", "page");
    });
  });

  // ── Keyboard: map pan/zoom ──
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
    const pan = 100;
    switch (e.key) {
      case "+": case "=": map.zoomIn(); break;
      case "-": map.zoomOut(); break;
      case "ArrowUp": map.panBy([0, -pan]); break;
      case "ArrowDown": map.panBy([0, pan]); break;
      case "ArrowLeft": map.panBy([-pan, 0]); break;
      case "ArrowRight": map.panBy([pan, 0]); break;
    }
  });

  // ═══════════════════════════════════════════════════════
  // ── Draw & Find Places Feature ──
  // ═══════════════════════════════════════════════════════

  const FAKE_PLACES = [
    { name: "Ludwig's Fish and Chips", image: "https://picsum.photos/seed/fish1/656/272" },
    { name: "Taco bell", image: "https://picsum.photos/seed/taco2/656/272" },
    { name: "Mama's Pizzeria", image: "https://picsum.photos/seed/pizza3/656/272" },
  ];

  // Draw state: idle | drawing | polygon_complete | searching | results_shown
  let drawState = "idle";
  let drawVertices = [];
  let drawPolyline = null;
  let drawPolygon = null;
  let drawVertexMarkers = [];
  let placeMarkers = [];

  const btnDraw = document.getElementById("btn-draw");
  const drawSearchDialog = document.getElementById("draw-search-dialog");
  const drawSearchInput = document.getElementById("draw-search-input");
  const drawSearchSend = document.getElementById("draw-search-send");
  const placeResults = document.getElementById("place-results");
  const placeResultsHeader = document.getElementById("place-results-header");
  const placeResultsList = document.getElementById("place-results-list");
  const mapEl = document.getElementById("map");

  // ── Enter draw mode ──
  btnDraw.addEventListener("click", () => {
    if (drawState === "idle" || drawState === "results_shown") {
      clearDrawState();
      enterDrawMode();
    } else if (drawState === "drawing") {
      exitDrawMode();
    }
  });

  function enterDrawMode() {
    drawState = "drawing";
    drawVertices = [];
    btnDraw.classList.add("draw-fab--active");
    mapEl.classList.add("map-canvas--drawing");
    map.getContainer().style.cursor = "crosshair";
    map.on("click", onDrawClick);
    map.on("dblclick", onDrawDoubleClick);
    map.doubleClickZoom.disable();
  }

  function exitDrawMode() {
    drawState = "idle";
    btnDraw.classList.remove("draw-fab--active");
    mapEl.classList.remove("map-canvas--drawing");
    map.getContainer().style.cursor = "";
    map.off("click", onDrawClick);
    map.off("dblclick", onDrawDoubleClick);
    map.doubleClickZoom.enable();
    clearDrawLayers();
  }

  function onDrawClick(e) {
    if (drawState !== "drawing") return;

    const latlng = e.latlng;
    drawVertices.push(latlng);

    // Add vertex marker
    const vertexIcon = L.divIcon({
      className: "draw-vertex",
      html: '<div class="draw-vertex__dot"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    const vm = L.marker(latlng, { icon: vertexIcon }).addTo(map);
    drawVertexMarkers.push(vm);

    // Update polyline preview
    if (drawPolyline) map.removeLayer(drawPolyline);
    if (drawVertices.length > 1) {
      drawPolyline = L.polyline(drawVertices, {
        color: "#1a73e8",
        weight: 2,
        dashArray: "6, 4",
        opacity: 0.8,
      }).addTo(map);
    }

    // If clicking near the first vertex and have at least 3 points, close polygon
    if (drawVertices.length >= 4) {
      const first = map.latLngToContainerPoint(drawVertices[0]);
      const current = map.latLngToContainerPoint(latlng);
      if (first.distanceTo(current) < 20) {
        closePolygon();
      }
    }
  }

  function onDrawDoubleClick(e) {
    if (drawState !== "drawing") return;
    if (drawVertices.length >= 3) {
      closePolygon();
    }
  }

  function closePolygon() {
    drawState = "polygon_complete";
    btnDraw.classList.remove("draw-fab--active");
    mapEl.classList.remove("map-canvas--drawing");
    map.getContainer().style.cursor = "";
    map.off("click", onDrawClick);
    map.off("dblclick", onDrawDoubleClick);
    map.doubleClickZoom.enable();

    // Remove polyline preview
    if (drawPolyline) {
      map.removeLayer(drawPolyline);
      drawPolyline = null;
    }

    // Draw filled polygon
    drawPolygon = L.polygon(drawVertices, {
      color: "#1a73e8",
      weight: 2,
      fillColor: "#1a73e8",
      fillOpacity: 0.1,
    }).addTo(map);

    // Show inline search dialog
    drawSearchDialog.hidden = false;
    drawSearchInput.value = "";
    drawSearchInput.focus();
  }

  // ── Search within drawn area ──
  drawSearchSend.addEventListener("click", handleDrawSearch);
  drawSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleDrawSearch();
    }
  });

  function handleDrawSearch() {
    const query = drawSearchInput.value.trim() || "restaurants";
    drawState = "searching";
    drawSearchDialog.hidden = true;

    // Simulate search delay
    setTimeout(() => {
      showPlaceResults(query);
    }, 800);
  }

  function showPlaceResults(query) {
    drawState = "results_shown";

    // Compute places within polygon bounds
    const bounds = drawPolygon.getBounds();
    const placesWithCoords = FAKE_PLACES.map((place, i) => {
      const lat = bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * (0.3 + Math.random() * 0.4);
      const lng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * (0.3 + Math.random() * 0.4);
      return { ...place, lat, lng };
    });

    // Add markers to map
    placesWithCoords.forEach((place, i) => {
      const icon = L.divIcon({
        className: "place-marker-label",
        html: `<div class="place-marker-label__inner">
          <div class="place-marker-label__icon">
            <span class="material-symbols-rounded">restaurant</span>
          </div>
          <span class="place-marker-label__text">${place.name}</span>
        </div>`,
        iconSize: [120, 60],
        iconAnchor: [60, 20],
      });
      const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
      placeMarkers.push(marker);
    });

    // Show results in Road trip panel
    switchToRoadtripTab();
    aiIdle.hidden = true;
    aiResult.hidden = true;
    placeResults.hidden = false;
    placeResultsHeader.textContent = `Found ${placesWithCoords.length} places for "${query}"`;
    placeResultsList.innerHTML = "";

    placesWithCoords.forEach((place, i) => {
      const li = document.createElement("li");
      li.className = "place-card";
      li.innerHTML = `
        <span class="place-card__label">${i + 1}. ${place.name}</span>
        <div class="place-card__image" style="background-image: url('${place.image}')"></div>
      `;
      li.addEventListener("click", () => {
        map.setView([place.lat, place.lng], 15, { animate: true });
      });
      placeResultsList.appendChild(li);
    });
  }

  function switchToRoadtripTab() {
    tabs.forEach((t) => t.classList.remove("tab--active"));
    tabs[0].classList.add("tab--active");
    panelRoadtrip.hidden = false;
    panelRoute.hidden = true;
  }

  function clearDrawState() {
    clearDrawLayers();
    drawSearchDialog.hidden = true;
    placeResults.hidden = true;
    placeResultsList.innerHTML = "";

    // Clear place markers from map
    placeMarkers.forEach((m) => map.removeLayer(m));
    placeMarkers = [];

    // Restore idle panel state if no trip results
    if (state === "idle") {
      aiIdle.hidden = false;
      aiResult.hidden = true;
    } else {
      aiResult.hidden = false;
    }
  }

  function clearDrawLayers() {
    if (drawPolyline) {
      map.removeLayer(drawPolyline);
      drawPolyline = null;
    }
    if (drawPolygon) {
      map.removeLayer(drawPolygon);
      drawPolygon = null;
    }
    drawVertexMarkers.forEach((m) => map.removeLayer(m));
    drawVertexMarkers = [];
    drawVertices = [];
  }

  // Escape key cancels draw mode
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (drawState === "drawing") {
        exitDrawMode();
      } else if (drawState === "polygon_complete") {
        clearDrawState();
        drawState = "idle";
      }
    }
  });
})();
