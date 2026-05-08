(function () {
  "use strict";

  // ── Road trip stops (Seattle neighborhoods, matching Figma) ──
  const STOPS = [
    { name: "Capitol Hill, Seattle", lat: 47.6253, lng: -122.3222 },
    { name: "Fremont, Seattle", lat: 47.6511, lng: -122.3502 },
    { name: "Ballard, Seattle", lat: 47.6677, lng: -122.3840 },
    { name: "Queen Anne, Seattle", lat: 47.6370, lng: -122.3570 },
    { name: "Green Lake, Seattle", lat: 47.6801, lng: -122.3286 },
    { name: "Beacon Hill, Seattle", lat: 47.5793, lng: -122.3114 },
    { name: "South Lake Union, Seattle", lat: 47.6276, lng: -122.3369 },
    { name: "Magnolia, Seattle", lat: 47.6398, lng: -122.3990 },
    { name: "Columbia City, Seattle", lat: 47.5601, lng: -122.2864 },
    { name: "West Seattle, Seattle", lat: 47.5665, lng: -122.3876, isLast: true },
  ];

  const TRIP_STATS = {
    distance: "234.5 Km",
    time: "4hr 34min",
    carType: "Gas",
  };

  // ── State machine ──
  // States: "idle" -> "loading" -> "results"
  let state = "idle";

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

  // ── Pin icons ──
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

  // ── DOM refs ──
  const promptInput = document.getElementById("prompt-input");
  const promptLoading = document.getElementById("prompt-loading");
  const promptContent = document.getElementById("prompt-content");
  const btnSend = document.getElementById("btn-send");
  const itineraryPanel = document.getElementById("itinerary-panel");
  const itineraryTitle = document.getElementById("itinerary-title");
  const itineraryDesc = document.getElementById("itinerary-desc");
  const itineraryList = document.getElementById("itinerary-list");
  const statDistance = document.getElementById("stat-distance");
  const statTime = document.getElementById("stat-time");
  const statCarType = document.getElementById("stat-cartype");
  const mainArea = document.querySelector(".main-area");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const locateBtn = document.getElementById("btn-locate");

  let routeLine = null;
  let stopMarkers = [];

  // ── Auto-resize textarea ──
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = promptInput.scrollHeight + "px";

    btnSend.disabled = !promptInput.value.trim();
  });

  // ── Send handler ──
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
      // Follow-up: just reset and re-trigger
      clearResults();
    }

    transitionToLoading();
  }

  // ── State transitions ──
  function transitionToLoading() {
    state = "loading";
    promptInput.hidden = true;
    promptLoading.hidden = false;
    btnSend.disabled = true;

    setTimeout(() => {
      transitionToResults();
    }, 2500);
  }

  function transitionToResults() {
    state = "results";

    promptInput.hidden = false;
    promptLoading.hidden = true;
    promptInput.value = "";
    promptInput.placeholder = "Are there any changes to this plan?";
    promptInput.style.height = "auto";
    btnSend.disabled = true;

    // Populate panel header
    itineraryTitle.textContent = "Seattle - Whidbey Island";
    itineraryDesc.textContent =
      "Explore the scenic road trip around Seattle, starting from the city and heading to Whidbey Island. Enjoy stunning views, charming towns, and coastal drives that showcase the Pacific Northwest's natural beauty and vibrant culture.";

    // Build stop list with connected dots
    itineraryList.innerHTML = "";
    STOPS.forEach((stop, i) => {
      const li = document.createElement("li");
      const isLast = stop.isLast || i === STOPS.length - 1;
      li.className = "itinerary-list__item" + (isLast ? " itinerary-list__item--last" : "");
      li.innerHTML = `
        <div class="itinerary-list__indicator">
          <span class="itinerary-list__dot">${isLast ? '<span class="material-symbols-rounded">location_on</span>' : ""}</span>
          ${!isLast ? '<span class="itinerary-list__line"></span>' : ""}
        </div>
        <div class="itinerary-list__field">${stop.name}</div>
      `;
      li.addEventListener("click", () => {
        map.setView([stop.lat, stop.lng], 14, { animate: true });
      });
      itineraryList.appendChild(li);
    });

    // Populate stats
    statDistance.textContent = TRIP_STATS.distance;
    statTime.textContent = TRIP_STATS.time;
    statCarType.textContent = TRIP_STATS.carType;

    itineraryPanel.hidden = false;
    mainArea.classList.add("has-itinerary");

    drawRoute();

    const coords = STOPS.map((s) => [s.lat, s.lng]);
    map.fitBounds(coords, { padding: [60, 60], maxZoom: 13 });

    // Leaflet needs a size refresh after layout shift
    setTimeout(() => map.invalidateSize(), 350);
  }

  function clearResults() {
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
    stopMarkers.forEach((m) => map.removeLayer(m));
    stopMarkers = [];

    itineraryPanel.hidden = true;
    mainArea.classList.remove("has-itinerary");
    setTimeout(() => map.invalidateSize(), 350);
  }

  function drawRoute() {
    const coords = STOPS.map((s) => [s.lat, s.lng]);

    routeLine = L.polyline(coords, {
      color: "#1a73e8",
      weight: 4,
      opacity: 0.9,
      smoothFactor: 1.5,
    }).addTo(map);

    STOPS.forEach((stop, i) => {
      const marker = L.marker([stop.lat, stop.lng], {
        icon: createPinIcon("#ea4335", i + 1),
      }).addTo(map);
      marker.bindPopup(`<strong>${stop.name}</strong>`, { closeButton: false });
      stopMarkers.push(marker);
    });
  }

  // ── Map controls ──
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
})();
