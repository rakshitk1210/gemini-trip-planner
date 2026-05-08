(function () {
  "use strict";

  // ── Sample place data ──
  const PLACES = [
    { id: 1, name: "Golden Gate Bridge", category: "Landmark", rating: 4.8, reviews: 98432, lat: 37.8199, lng: -122.4783, address: "Golden Gate Bridge, San Francisco, CA" },
    { id: 2, name: "Fisherman's Wharf", category: "Tourist attraction", rating: 4.4, reviews: 52100, lat: 37.8080, lng: -122.4177, address: "Fisherman's Wharf, San Francisco, CA" },
    { id: 3, name: "Alcatraz Island", category: "Historical landmark", rating: 4.7, reviews: 41200, lat: 37.8267, lng: -122.4230, address: "Alcatraz Island, San Francisco, CA" },
    { id: 4, name: "Chinatown", category: "Neighborhood", rating: 4.3, reviews: 12400, lat: 37.7941, lng: -122.4078, address: "Chinatown, San Francisco, CA" },
    { id: 5, name: "Lombard Street", category: "Landmark", rating: 4.5, reviews: 23100, lat: 37.8021, lng: -122.4187, address: "Lombard Street, San Francisco, CA" },
    { id: 6, name: "Palace of Fine Arts", category: "Museum", rating: 4.6, reviews: 18300, lat: 37.8029, lng: -122.4484, address: "3601 Lyon St, San Francisco, CA" },
    { id: 7, name: "Twin Peaks", category: "Park", rating: 4.5, reviews: 9800, lat: 37.7544, lng: -122.4477, address: "Twin Peaks, San Francisco, CA" },
    { id: 8, name: "Pier 39", category: "Shopping center", rating: 4.4, reviews: 67200, lat: 37.8087, lng: -122.4098, address: "Pier 39, San Francisco, CA" },
    { id: 9, name: "Coit Tower", category: "Observation tower", rating: 4.5, reviews: 11200, lat: 37.8024, lng: -122.4058, address: "1 Telegraph Hill Blvd, San Francisco, CA" },
    { id: 10, name: "Golden Gate Park", category: "Park", rating: 4.8, reviews: 34100, lat: 37.7694, lng: -122.4862, address: "Golden Gate Park, San Francisco, CA" },
    { id: 11, name: "SFMOMA", category: "Art museum", rating: 4.5, reviews: 14500, lat: 37.7857, lng: -122.4011, address: "151 3rd St, San Francisco, CA" },
    { id: 12, name: "Union Square", category: "Plaza", rating: 4.2, reviews: 16700, lat: 37.7879, lng: -122.4074, address: "Union Square, San Francisco, CA" },
  ];

  // ── Map Init ──
  const map = L.map("map", {
    center: [37.7749, -122.4194],
    zoom: 13,
    zoomControl: false,
  });

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map);

  // Custom red pin icon
  const pinIcon = L.divIcon({
    className: "custom-pin",
    html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#ea4335"/>
      <circle cx="14" cy="14" r="6" fill="#b31412"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });

  const selectedPinIcon = L.divIcon({
    className: "custom-pin custom-pin--selected",
    html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="#1a73e8"/>
      <circle cx="14" cy="14" r="6" fill="#1558b0"/>
    </svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });

  // ── Place Markers ──
  const markers = {};
  PLACES.forEach((place) => {
    const marker = L.marker([place.lat, place.lng], { icon: pinIcon })
      .addTo(map)
      .bindPopup(
        `<div class="map-popup__name">${place.name}</div><div class="map-popup__category">${place.category}</div>`,
        { closeButton: false }
      );

    marker.on("click", () => selectPlace(place));
    markers[place.id] = marker;
  });

  // ── DOM refs ──
  const searchInput = document.querySelector(".search-bar__input");
  const searchBar = document.querySelector(".search-bar");
  const searchContainer = document.querySelector(".search-container");
  const clearBtn = document.querySelector(".search-bar__clear");
  const suggestionsEl = document.getElementById("search-suggestions");
  const sidePanel = document.querySelector(".side-panel");
  const sidePanelClose = document.querySelector(".side-panel__close");
  const sidePanelTitle = document.querySelector(".side-panel__title");
  const resultsList = document.querySelector(".results-list");
  const placeCard = document.querySelector(".place-card");
  const placeCardClose = document.querySelector(".place-card__close");
  const categoryChips = document.querySelector(".category-chips");
  const navItems = document.querySelectorAll(".nav-rail__item[data-nav]");
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const locateBtn = document.getElementById("btn-locate");

  let selectedPlaceId = null;
  let activeSuggestionIdx = -1;

  // ── Stars helper ──
  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty) + " " + rating.toFixed(1);
  }

  function formatReviews(count) {
    if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K reviews";
    return count + " reviews";
  }

  // ── Search ──
  function filterPlaces(query) {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return PLACES.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );
  }

  function showSuggestions(results) {
    suggestionsEl.innerHTML = "";
    activeSuggestionIdx = -1;

    if (results.length === 0) {
      suggestionsEl.hidden = true;
      searchBar.closest("[role=combobox]").setAttribute("aria-expanded", "false");
      return;
    }

    results.forEach((place, i) => {
      const li = document.createElement("li");
      li.className = "search-suggestion";
      li.setAttribute("role", "option");
      li.id = "suggestion-" + i;
      li.innerHTML = `
        <span class="search-suggestion__icon"><span class="material-symbols-rounded">location_on</span></span>
        <span class="search-suggestion__text">${place.name} — ${place.category}</span>
      `;
      li.addEventListener("click", () => {
        searchInput.value = place.name;
        suggestionsEl.hidden = true;
        searchBar.closest("[role=combobox]").setAttribute("aria-expanded", "false");
        selectPlace(place);
      });
      suggestionsEl.appendChild(li);
    });

    suggestionsEl.hidden = false;
    searchBar.closest("[role=combobox]").setAttribute("aria-expanded", "true");
  }

  searchInput.addEventListener("input", () => {
    const val = searchInput.value;
    clearBtn.hidden = !val;
    showSuggestions(filterPlaces(val));
  });

  searchInput.addEventListener("focus", () => {
    const val = searchInput.value;
    if (val) showSuggestions(filterPlaces(val));
  });

  searchInput.addEventListener("keydown", (e) => {
    const items = suggestionsEl.querySelectorAll(".search-suggestion");
    if (!items.length) {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch(searchInput.value);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionIdx = Math.min(activeSuggestionIdx + 1, items.length - 1);
      updateActiveSuggestion(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestionIdx = Math.max(activeSuggestionIdx - 1, 0);
      updateActiveSuggestion(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIdx >= 0) {
        items[activeSuggestionIdx].click();
      } else {
        performSearch(searchInput.value);
      }
    } else if (e.key === "Escape") {
      suggestionsEl.hidden = true;
      searchBar.closest("[role=combobox]").setAttribute("aria-expanded", "false");
    }
  });

  function updateActiveSuggestion(items) {
    items.forEach((el, i) => {
      el.setAttribute("aria-selected", i === activeSuggestionIdx ? "true" : "false");
    });
    if (activeSuggestionIdx >= 0) {
      searchInput.setAttribute("aria-activedescendant", items[activeSuggestionIdx].id);
    }
  }

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.hidden = true;
    suggestionsEl.hidden = true;
    searchBar.closest("[role=combobox]").setAttribute("aria-expanded", "false");
    closePanels();
    searchInput.focus();
  });

  document.addEventListener("click", (e) => {
    if (!searchContainer.contains(e.target)) {
      suggestionsEl.hidden = true;
      searchBar.closest("[role=combobox]").setAttribute("aria-expanded", "false");
    }
  });

  // ── Search execution ──
  function performSearch(query) {
    suggestionsEl.hidden = true;
    searchBar.closest("[role=combobox]").setAttribute("aria-expanded", "false");

    const results = filterPlaces(query);
    if (results.length === 1) {
      selectPlace(results[0]);
      return;
    }

    showResultsPanel(results, query);
  }

  function showResultsPanel(results, query) {
    placeCard.hidden = true;
    sidePanel.hidden = false;
    categoryChips.style.display = "none";
    sidePanelTitle.textContent = results.length ? `Results for "${query}"` : "No results found";

    resultsList.innerHTML = "";
    results.forEach((place) => {
      const li = document.createElement("li");
      li.className = "results-list__item";
      li.innerHTML = `
        <div class="results-list__icon"><span class="material-symbols-rounded">location_on</span></div>
        <div class="results-list__info">
          <div class="results-list__name">${place.name}</div>
          <div class="results-list__detail">
            <span class="results-list__rating">${renderStars(place.rating)}</span> · ${place.category}
          </div>
        </div>
      `;
      li.addEventListener("click", () => selectPlace(place));
      resultsList.appendChild(li);
    });

    // Fit map to results
    if (results.length) {
      const group = L.featureGroup(results.map((p) => markers[p.id]));
      map.fitBounds(group.getBounds().pad(0.2));
    }
  }

  // ── Place selection ──
  function selectPlace(place) {
    // Reset old selection
    if (selectedPlaceId && markers[selectedPlaceId]) {
      markers[selectedPlaceId].setIcon(pinIcon);
    }

    selectedPlaceId = place.id;
    markers[place.id].setIcon(selectedPinIcon);
    markers[place.id].openPopup();

    map.setView([place.lat, place.lng], 15, { animate: true });

    // Show place card
    sidePanel.hidden = true;
    placeCard.hidden = false;
    categoryChips.style.display = "none";

    placeCard.querySelector(".place-card__name").textContent = place.name;
    placeCard.querySelector(".place-card__stars").textContent = renderStars(place.rating);
    placeCard.querySelector(".place-card__review-count").textContent = formatReviews(place.reviews);
    placeCard.querySelector(".place-card__category").textContent = place.category;
    placeCard.querySelector(".place-card__address").textContent = place.address;

    searchInput.value = place.name;
    clearBtn.hidden = false;
  }

  function closePanels() {
    sidePanel.hidden = true;
    placeCard.hidden = true;
    categoryChips.style.display = "";

    if (selectedPlaceId && markers[selectedPlaceId]) {
      markers[selectedPlaceId].setIcon(pinIcon);
      markers[selectedPlaceId].closePopup();
    }
    selectedPlaceId = null;
  }

  sidePanelClose.addEventListener("click", closePanels);
  placeCardClose.addEventListener("click", closePanels);

  // ── Category chips ──
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const category = chip.textContent.trim();
      searchInput.value = category;
      clearBtn.hidden = false;
      performSearch(category);
    });
  });

  // ── Nav rail ──
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

  // ── Map controls ──
  zoomInBtn.addEventListener("click", () => map.zoomIn());
  zoomOutBtn.addEventListener("click", () => map.zoomOut());

  locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) return;
    locateBtn.classList.add("fab-locate--active");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 15, { animate: true });
        setTimeout(() => locateBtn.classList.remove("fab-locate--active"), 2000);
      },
      () => {
        locateBtn.classList.remove("fab-locate--active");
      }
    );
  });

  // ── Keyboard: map pan ──
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    const panAmount = 100;
    switch (e.key) {
      case "+":
      case "=":
        map.zoomIn();
        break;
      case "-":
        map.zoomOut();
        break;
      case "ArrowUp":
        map.panBy([0, -panAmount]);
        break;
      case "ArrowDown":
        map.panBy([0, panAmount]);
        break;
      case "ArrowLeft":
        map.panBy([-panAmount, 0]);
        break;
      case "ArrowRight":
        map.panBy([panAmount, 0]);
        break;
    }
  });
})();
