import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';
import { CAT_ICONS, getImg } from '../constants.js';

// Lazily-initialized OverlayView subclasses (require Maps SDK)
let _SquarePin = null, _SuggestionPin = null, _BookmarkPin = null;

function initClasses() {
  if (_SquarePin) return;

  _SquarePin = class extends google.maps.OverlayView {
    constructor(sugg, number, placeImages) {
      super();
      this.sugg = sugg; this.number = number; this.placeImages = placeImages;
    }
    onAdd() {
      const s  = this.sugg;
      const el = document.createElement('div');
      el.className = 'square-pin';
      el.innerHTML = `
        <div class="square-pin-badge">${this.number}</div>
        <div class="square-pin-shell">
          <img class="square-pin-photo" src="${getImg(this.placeImages, s.name, s.seed, 'thumb')}" alt="">
        </div>
        <div class="square-pin-tip"></div>`;
      el.style.opacity = '0';
      el.addEventListener('click', e => {
        e.stopPropagation();
        useAppStore.getState().openCard(s, el);
      });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }
    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.sugg.lat, this.sugg.lng));
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 57) + 'px';
    }
    onRemove() { this.el?.parentNode?.removeChild(this.el); this.el = null; }
    fadeIn() {
      if (!this.el) return;
      let op = 0;
      const tick = setInterval(() => {
        op = Math.min(1, op + 0.1);
        if (this.el) this.el.style.opacity = op;
        if (op >= 1) clearInterval(tick);
      }, 16);
    }
    updateNumber(n) {
      this.number = n;
      const badge = this.el?.querySelector('.square-pin-badge');
      if (badge) badge.textContent = n;
    }
  };

  _SuggestionPin = class extends google.maps.OverlayView {
    constructor(sugg, placeImages) {
      super();
      this.sugg = sugg; this.placeImages = placeImages;
    }
    onAdd() {
      const s  = this.sugg;
      const el = document.createElement('div');
      el.className = 'square-pin suggestion-pin';
      el.innerHTML = `
        <div class="square-pin-shell">
          <img class="square-pin-photo" src="${getImg(this.placeImages, s.name, s.seed, 'thumb')}" alt="">
        </div>
        <div class="square-pin-tip"></div>`;
      el.style.opacity = '0';
      el.draggable = true;
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('dragstart', e => {
        useAppStore.getState().setDraggingSuggId(s.id);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'sugg-' + s.id);
        setTimeout(() => { if (this.el) this.el.style.opacity = '0.4'; }, 0);
      });
      el.addEventListener('dragend', () => {
        useAppStore.getState().setDraggingSuggId(null);
        if (this.el) this.el.style.opacity = '1';
      });
      el.addEventListener('click', e => {
        e.stopPropagation();
        useAppStore.getState().openCard(s, el);
      });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
      // Register element now that it's guaranteed to exist
      useAppStore.getState().setSuggPinEl(s.id, el);
    }
    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.sugg.lat, this.sugg.lng));
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 57) + 'px';
    }
    onRemove() { this.el?.parentNode?.removeChild(this.el); this.el = null; }
    fadeIn() {
      if (!this.el) return;
      let op = 0;
      const tick = setInterval(() => {
        op = Math.min(1, op + 0.12);
        if (this.el) this.el.style.opacity = op;
        if (op >= 1) clearInterval(tick);
      }, 16);
    }
    setVisible(v) { if (this.el) this.el.style.display = v ? 'block' : 'none'; }
    setActive(active) {
      if (!this.el) return;
      const shell = this.el.querySelector('.square-pin-shell');
      if (active) {
        this.el.style.transform = 'scale(1.1)';
        if (shell) shell.style.boxShadow = '0 0 0 2.5px white, 0 0 0 4px #1a73e8, 0 4px 8px 3px rgba(0,0,0,0.2)';
      } else {
        this.el.style.transform = '';
        if (shell) shell.style.boxShadow = '';
      }
    }
  };

  _BookmarkPin = class extends google.maps.OverlayView {
    constructor(sugg) { super(); this.sugg = sugg; }
    onAdd() {
      const el = document.createElement('div');
      el.className = 'bookmark-pin';
      el.innerHTML = `<span class="material-symbols-rounded">bookmark</span>`;
      el.addEventListener('click', e => {
        e.stopPropagation();
        useAppStore.getState().openCard(this.sugg, el);
      });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }
    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(new google.maps.LatLng(this.sugg.lat, this.sugg.lng));
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 10) + 'px';
      this.el.style.top  = Math.round(pt.y - 10) + 'px';
    }
    onRemove() { this.el?.parentNode?.removeChild(this.el); this.el = null; }
  };
}

export default function useMapOverlays() {
  const map         = useMap();
  const aiPlaces    = useAppStore(s => s.aiPlaces);
  const routeStops  = useAppStore(s => s.routeStops);
  const savedPlaces = useAppStore(s => s.savedPlaces);
  const activeFilter= useAppStore(s => s.activeFilter);
  const placeImages = useAppStore(s => s.placeImages);
  const activeCard  = useAppStore(s => s.activeCard);

  const suggPinsRef     = useRef({});
  const stopPinsRef     = useRef({});
  const bookmarkPinsRef = useRef({});
  const prevAiLenRef    = useRef(0);
  const timerIdsRef     = useRef([]);

  // Rebuild pins when key state changes
  useEffect(() => {
    if (!map) return;
    initClasses();

    // Cancel any staggered timers from a previous run that haven't fired yet
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current = [];

    // Clear existing suggestion pins
    Object.values(suggPinsRef.current).forEach(p => p.setMap(null));
    suggPinsRef.current = {};
    useAppStore.getState().clearSuggPinEls();

    // Apply any Google-verified coordinate corrections without adding them as deps
    // (avoids cancelling fadeIn timers on every photo load).
    const applyPatch = (sugg) => {
      const patch = useAppStore.getState().coordPatches[sugg.name];
      return patch ? { ...sugg, ...patch } : sugg;
    };

    // Suggestion pins for AI places not in route
    aiPlaces.forEach((sugg, i) => {
      if (routeStops.find(s => s.id === sugg.id)) return;
      const t = setTimeout(() => {
        if (!map) return;
        const imgs = useAppStore.getState().placeImages; // read fresh — not a dep so image loads don't rebuild
        const pin = new _SuggestionPin(applyPatch(sugg), imgs);
        pin.setMap(map);
        suggPinsRef.current[sugg.id] = pin;
        setTimeout(() => {
          pin.fadeIn();
          pin.setVisible(activeFilter === 'all' || activeFilter === sugg.category);
        }, 20);
      }, 45 * i);
      timerIdsRef.current.push(t);
    });

    // Route stop pins (skip comment-derived stops — their avatar dot already marks the spot)
    Object.values(stopPinsRef.current).forEach(p => p.setMap(null));
    stopPinsRef.current = {};
    let pinNumber = 0;
    routeStops.forEach((stop) => {
      if (stop.id.startsWith('comment-stop-')) return;
      pinNumber++;
      const imgs = useAppStore.getState().placeImages;
      const pin = new _SquarePin(applyPatch(stop), pinNumber, imgs);
      pin.setMap(map);
      stopPinsRef.current[stop.id] = pin;
      setTimeout(() => pin.fadeIn(), 20);
    });

    // Bookmark pins
    Object.values(bookmarkPinsRef.current).forEach(p => p.setMap(null));
    bookmarkPinsRef.current = {};
    Object.values(savedPlaces).forEach(sugg => {
      const pin = new _BookmarkPin(applyPatch(sugg));
      pin.setMap(map);
      bookmarkPinsRef.current[sugg.id] = pin;
    });

    // fitBounds only on initial AI places load
    if (aiPlaces.length > 0 && prevAiLenRef.current === 0) {
      const bounds = new google.maps.LatLngBounds();
      aiPlaces.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 20 });
    }
    prevAiLenRef.current = aiPlaces.length;

    return () => {
      timerIdsRef.current.forEach(clearTimeout);
      timerIdsRef.current = [];
      Object.values(suggPinsRef.current).forEach(p => p.setMap(null));
      Object.values(stopPinsRef.current).forEach(p => p.setMap(null));
      Object.values(bookmarkPinsRef.current).forEach(p => p.setMap(null));
    };
  }, [map, aiPlaces, routeStops, savedPlaces, activeFilter]);

  // When a photo loads, surgically update the img.src on the existing pin —
  // no full rebuild, no timer cancellation.
  useEffect(() => {
    const allPins = [
      ...Object.values(suggPinsRef.current),
      ...Object.values(stopPinsRef.current),
    ];
    allPins.forEach(pin => {
      if (!pin.el) return;
      const img   = pin.el.querySelector('.square-pin-photo');
      const entry = placeImages[pin.sugg.name];
      if (img && entry?.thumb) img.src = entry.thumb;
    });
  }, [placeImages]);

  // Apply active-card highlight on suggestion pins
  useEffect(() => {
    Object.values(suggPinsRef.current).forEach(p => p.setActive?.(false));
    if (activeCard) suggPinsRef.current[activeCard.sugg.id]?.setActive?.(true);
  }, [activeCard]);
}
