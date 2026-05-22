import { create } from 'zustand';
import { callGemini } from '../api/gemini.js';
import { SUGGESTIONS, haversineKm } from '../constants.js';

let turnIdCounter = 0;
const nextId = () => `turn-${++turnIdCounter}`;

function allPlaces(aiPlaces) {
  return aiPlaces.length ? aiPlaces : SUGGESTIONS;
}

function bestInsertIndex(stops, newStop) {
  const n = stops.length;
  if (n < 2) return n;
  let bestIdx = n, bestCost = Infinity;
  for (let i = 0; i <= n; i++) {
    let cost;
    if (i === 0)      cost = haversineKm(newStop, stops[0]);
    else if (i === n) cost = haversineKm(stops[n - 1], newStop);
    else              cost = haversineKm(stops[i - 1], newStop) + haversineKm(newStop, stops[i]) - haversineKm(stops[i - 1], stops[i]);
    if (cost < bestCost) { bestCost = cost; bestIdx = i; }
  }
  return bestIdx;
}

// Convert circle pixel coords to lat/lng context string
function circleToLocationCtx(circle, mapInstance) {
  if (!circle || !mapInstance) return '';
  try {
    const proj   = mapInstance.getProjection();
    const bounds = mapInstance.getBounds();
    if (!proj || !bounds) return '';
    const mapDiv = document.getElementById('mapArea');
    if (!mapDiv) return '';
    const w = mapDiv.offsetWidth, h = mapDiv.offsetHeight;
    const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
    const nePt = proj.fromLatLngToPoint(ne), swPt = proj.fromLatLngToPoint(sw);
    const wx = swPt.x + (circle.cx / w) * (nePt.x - swPt.x);
    const wy = nePt.y + (circle.cy / h) * (swPt.y - nePt.y);
    const centre = proj.fromPointToLatLng(new google.maps.Point(wx, wy));
    return ` The user has drawn a search circle centred at ${centre.lat().toFixed(4)}°N, ${centre.lng().toFixed(4)}°E with a radius of ${circle.radiusKm.toFixed(1)} km. Return places within that circle.`;
  } catch { return ''; }
}

const useAppStore = create((set, get) => ({
  // ── Screen
  screen:    'home',
  activeTab: 'plan-ai',

  showTab(tab) {
    set({ activeTab: tab });
  },

  async goToMap(promptText) {
    const text = promptText || 'Plan me a road trip';
    set({ screen: 'map', activeTab: 'plan-ai' });

    const turnId = nextId();
    set(s => ({
      chatTurns: [...s.chatTurns, {
        id: turnId, userText: text, aiText: '', cards: [], chips: [],
        moreLabel: 'more places', isThinking: true, error: null,
      }],
      conversationHistory: [{ role: 'user', text }],
      aiPlaces: [],
      activeFilter: 'all',
    }));

    let places;
    try {
      places = await callGemini([{ role: 'user', text }]);
    } catch (err) {
      console.error('Gemini error:', err);
      set(s => ({
        chatTurns: s.chatTurns.map(t => t.id === turnId
          ? { ...t, isThinking: false, error: "Couldn't reach Gemini — showing sample places." }
          : t),
        aiPlaces: SUGGESTIONS,
      }));
      return;
    }

    const scenic    = places.filter(p => p.category === 'scenic');
    const hasHotel  = places.some(p => p.category === 'hotel');
    const hasFood   = places.some(p => p.category === 'restaurant');
    const mainCards = scenic.length ? scenic : places.slice(0, 6);
    const mainText  = scenic.length
      ? 'Here are the top scenic spots for your trip'
      : `Here are ${places.length} suggestions for your trip`;
    const chips = [
      hasHotel && { label: 'Hotels', icon: 'hotel',      filter: 'hotel'      },
      hasFood  && { label: 'Food',   icon: 'restaurant', filter: 'restaurant' },
    ].filter(Boolean);

    set(s => ({
      aiPlaces:            places,
      activeFilter:        scenic.length ? 'scenic' : 'all',
      conversationHistory: [...s.conversationHistory, { role: 'model', text: JSON.stringify(places) }],
      chatTurns: s.chatTurns.map(t => t.id === turnId
        ? { ...t, isThinking: false, aiText: mainText, cards: mainCards, chips, moreLabel: scenic.length ? 'more scenic spots' : 'more places' }
        : t),
    }));
  },

  // ── Chat
  chatTurns:           [],
  conversationHistory: [],
  isThinking:          false,

  async submitFooter(text) {
    const { activeCircle, mapInstance } = get();
    if (!text && !activeCircle) return;
    const prompt = text || 'Find things in this area';

    if (activeCircle) {
      get().doAreaSearch(prompt);
      return;
    }

    const turnId = nextId();
    set(s => ({
      chatTurns: [...s.chatTurns, {
        id: turnId, userText: prompt, aiText: '', cards: [], chips: [],
        moreLabel: 'more places', isThinking: true, error: null,
      }],
      conversationHistory: [...s.conversationHistory, { role: 'user', text: prompt }],
      isThinking: true,
    }));

    let places;
    try {
      places = await callGemini(get().conversationHistory);
    } catch (err) {
      console.error('Gemini error:', err);
      set(s => ({
        isThinking: false,
        conversationHistory: s.conversationHistory.slice(0, -1),
        chatTurns: s.chatTurns.map(t => t.id === turnId
          ? { ...t, isThinking: false, error: "Couldn't reach Gemini — try again." }
          : t),
      }));
      return;
    }

    set(s => ({
      isThinking: false,
      aiPlaces:   [...s.aiPlaces, ...places],
      conversationHistory: [...s.conversationHistory, { role: 'model', text: JSON.stringify(places) }],
      chatTurns: s.chatTurns.map(t => t.id === turnId
        ? { ...t, isThinking: false, aiText: `Here are ${places.length} places for you`, cards: places, moreLabel: 'more places' }
        : t),
    }));
  },

  async doAreaSearch(userPrompt) {
    const { activeCircle, mapInstance } = get();
    const locationCtx = circleToLocationCtx(activeCircle, mapInstance);
    const fullPrompt  = userPrompt + locationCtx;

    const turnId = nextId();
    set(s => ({
      chatTurns: [...s.chatTurns, {
        id: turnId, userText: userPrompt, aiText: '', cards: [], chips: [],
        moreLabel: 'more places', isThinking: true, error: null,
      }],
      conversationHistory: [...s.conversationHistory, { role: 'user', text: fullPrompt }],
      isThinking: true,
    }));

    let places;
    try {
      places = await callGemini(get().conversationHistory);
    } catch (err) {
      console.error('Gemini error:', err);
      set(s => ({
        isThinking: false,
        conversationHistory: s.conversationHistory.slice(0, -1),
        chatTurns: s.chatTurns.map(t => t.id === turnId
          ? { ...t, isThinking: false, error: "Couldn't reach Gemini — try again." }
          : t),
      }));
      return;
    }

    const radiusStr = activeCircle ? `${activeCircle.radiusKm.toFixed(1)} km` : 'the area';
    set(s => ({
      isThinking: false,
      aiPlaces:   [...s.aiPlaces, ...places],
      conversationHistory: [...s.conversationHistory, { role: 'model', text: JSON.stringify(places) }],
      chatTurns: s.chatTurns.map(t => t.id === turnId
        ? { ...t, isThinking: false, aiText: `${places.length} suggestions within ${radiusStr}`, cards: places, moreLabel: 'more places' }
        : t),
    }));
  },

  appendChipTurn(chipDef) {
    const { aiPlaces: ap } = get();
    const places   = allPlaces(ap).filter(s => s.category === chipDef.filter);
    const def      = { hotel: { aiText: 'Here are the hotels along your route', moreLabel: 'more hotels' }, restaurant: { aiText: 'Here are restaurants and cafés along your route', moreLabel: 'more restaurants' }, scenic: { aiText: 'Here are scenic highlights for your route', moreLabel: 'more scenic spots' } }[chipDef.filter] || {};
    const turnId   = nextId();
    set(s => ({
      activeFilter: chipDef.filter,
      chatTurns: [...s.chatTurns, {
        id: turnId, userText: chipDef.label,
        aiText: def.aiText || `Here are ${places.length} ${chipDef.label.toLowerCase()}`,
        cards: places, chips: [], moreLabel: def.moreLabel || 'more places',
        isThinking: false, error: null,
      }],
    }));
  },

  // ── Places
  aiPlaces:     [],
  activeFilter: 'all',

  setFilter(cat) {
    set({ activeFilter: cat });
  },

  // ── Route
  routeStops: [],

  addToRoute(suggId, insertAt) {
    const { routeStops, aiPlaces } = get();
    if (routeStops.find(s => s.id === suggId)) return;
    const sugg = allPlaces(aiPlaces).find(s => s.id === suggId);
    if (!sugg) return;
    const idx = insertAt !== undefined ? Math.min(insertAt, routeStops.length) : bestInsertIndex(routeStops, sugg);
    const next = [...routeStops];
    next.splice(idx, 0, { ...sugg });
    set({ routeStops: next });
  },

  removeStop(id) {
    set(s => ({ routeStops: s.routeStops.filter(s => s.id !== id) }));
  },

  reorderStops(fromIdx, toIdx) {
    const stops = [...get().routeStops];
    const [moved] = stops.splice(fromIdx, 1);
    stops.splice(toIdx, 0, moved);
    set({ routeStops: stops });
  },

  // ── Saved places
  savedPlaces: {},

  savePlace(sugg) {
    set(s => ({ savedPlaces: { ...s.savedPlaces, [sugg.id]: { ...sugg } } }));
  },

  unsavePlace(id) {
    set(s => {
      const next = { ...s.savedPlaces };
      delete next[id];
      return { savedPlaces: next };
    });
  },

  toggleSave(sugg) {
    const { savedPlaces } = get();
    if (savedPlaces[sugg.id]) get().unsavePlace(sugg.id);
    else                      get().savePlace(sugg);
  },

  // ── Place card
  activeCard: null,

  openCard(sugg, anchorEl) {
    const mapArea = document.querySelector('.map-area');
    let left = 0, top = 72;
    if (mapArea) {
      const mapW = mapArea.offsetWidth, mapH = mapArea.offsetHeight;
      const cardW = 320, cardH = 248, gap = 12;
      if (anchorEl) {
        const pinRect = anchorEl.getBoundingClientRect();
        const mapRect = mapArea.getBoundingClientRect();
        const pinCX   = pinRect.left - mapRect.left + pinRect.width / 2;
        const pinTopY = pinRect.top  - mapRect.top;
        left = pinCX - cardW / 2;
        top  = pinTopY - cardH - gap;
        if (top < 8) top = pinTopY + pinRect.height + gap;
      } else {
        left = mapW - cardW - 16;
      }
      left = Math.max(8, Math.min(left, mapW - cardW - 8));
      top  = Math.max(8, Math.min(top,  mapH - cardH - 8));
    }
    set({ activeCard: { sugg, left, top } });
  },

  closeCard() {
    set({ activeCard: null });
  },

  // ── Circle draw
  drawMode:     false,
  activeCircle: null,
  draggingSuggId: null,

  toggleDrawMode() {
    const { drawMode, activeCircle } = get();
    if (!drawMode && activeCircle) get().clearCircle();
    set(s => ({ drawMode: !s.drawMode }));
  },

  setActiveCircle(circle) {
    set({ activeCircle: circle, drawMode: false });
  },

  clearCircle() {
    set({ activeCircle: null });
    const { mapInstance } = get();
    if (mapInstance) mapInstance.setOptions({ draggable: true, scrollwheel: true, disableDoubleClickZoom: false, gestureHandling: 'auto' });
  },

  setDraggingSuggId(id) {
    set({ draggingSuggId: id });
  },

  // ── Map
  mapInstance: null,
  mapReady:    false,

  setMapInstance(map) {
    set({ mapInstance: map, mapReady: true });
    google.maps.event.addListener(map, 'click',        () => get().closeCard());
    google.maps.event.addListener(map, 'dragstart',    () => get().closeCard());
    google.maps.event.addListener(map, 'zoom_changed', () => get().closeCard());
  },

  // ── Image cache
  placeImages: {},

  setPlaceImage(name, entry) {
    set(s => ({ placeImages: { ...s.placeImages, [name]: entry } }));
  },
}));

export default useAppStore;
