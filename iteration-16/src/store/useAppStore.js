import { create } from 'zustand';
import { callClaude } from '../api/gemini.js';
import { SUGGESTIONS, haversineKm } from '../constants.js';

let turnIdCounter = 0;
const nextId = () => `turn-${++turnIdCounter}`;

function toTitleCase(str) {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

// Extract a short "Explore X" title from whatever the user typed.
// Handles: "Explore Seattle on a 2-day...", "Trip to Bhopal", "Iceland road trip", etc.
function extractDestination(text) {
  const t = text.trim();

  // "Explore X ..." — grab X before the first preposition / comma
  let m = t.match(/^explore\s+(.+?)(?:\s+on\b|\s+in\b|\s+for\b|\s+with\b|\s+–|,|$)/i);
  if (m) return 'Explore ' + toTitleCase(m[1].trim());

  // "... trip to X" / "travel to X" / "visit X"
  m = t.match(/(?:trip|travel|journey|visit)\s+to\s+(.+?)(?:\s+on\b|\s+in\b|\s+for\b|,|$)/i);
  if (m) return 'Explore ' + toTitleCase(m[1].trim());

  // "road trip along/through/around/in the X [in Y]" — e.g. "Plan a road trip along the Amalfi Coast in Italy"
  m = t.match(/road\s+trip\s+(?:along|through|around|in|to)\s+(?:the\s+)?([^,]+)/i);
  if (m) {
    const dest = m[1].replace(/\s+in\s+[\w\s]+$/i, '').trim();
    return 'Explore ' + toTitleCase(dest);
  }

  // "X road trip" / "X trip"
  m = t.match(/^(.+?)\s+(?:road\s+)?trip\b/i);
  if (m) return 'Explore ' + toTitleCase(m[1].trim());

  // Fallback: first 2 words
  const words = t.split(/\s+/);
  return 'Explore ' + toTitleCase(words.slice(0, 2).join(' '));
}

function allPlaces(aiPlaces) {
  return aiPlaces.length ? aiPlaces : SUGGESTIONS;
}

// Derive map pins from all turns that are currently visible on the map.
// Uses allPlaces (the full set returned by Claude/Places) when available,
// falling back to the display cards for turns that don't carry a separate allPlaces field.
function derivedPlaces(turns) {
  return turns.flatMap(t => t.visibleOnMap ? (t.allPlaces ?? t.cards ?? []) : []);
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

// 2-opt: repeatedly reverse segments that reduce total open-path distance.
// Eliminates crossing edges that greedy insertion can introduce.
function twoOpt(stops) {
  if (stops.length < 4) return stops;
  let route = [...stops];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < route.length - 2; i++) {
      for (let k = i + 2; k < route.length; k++) {
        const d1 = haversineKm(route[i], route[i + 1])
                 + (k + 1 < route.length ? haversineKm(route[k], route[k + 1]) : 0);
        const d2 = haversineKm(route[i], route[k])
                 + (k + 1 < route.length ? haversineKm(route[i + 1], route[k + 1]) : 0);
        if (d2 < d1 - 0.001) {
          route = [
            ...route.slice(0, i + 1),
            ...route.slice(i + 1, k + 1).reverse(),
            ...route.slice(k + 1),
          ];
          improved = true;
        }
      }
    }
  }
  return route;
}

function circleCenter(circle, mapInstance) {
  if (!circle || !mapInstance) return null;
  try {
    const proj   = mapInstance.getProjection();
    const bounds = mapInstance.getBounds();
    if (!proj || !bounds) return null;
    const mapDiv = document.getElementById('mapArea');
    if (!mapDiv) return null;
    const w = mapDiv.offsetWidth, h = mapDiv.offsetHeight;
    const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
    const nePt = proj.fromLatLngToPoint(ne), swPt = proj.fromLatLngToPoint(sw);
    const wx = swPt.x + (circle.cx / w) * (nePt.x - swPt.x);
    const wy = nePt.y + (circle.cy / h) * (swPt.y - nePt.y);
    const ll  = proj.fromPointToLatLng(new google.maps.Point(wx, wy));
    return { lat: ll.lat(), lng: ll.lng() };
  } catch { return null; }
}

// Returns a human-readable anchor name for the circle center.
// Tries reverse geocoding first, then falls back to nearest existing pin.
async function getAnchorName(center, routeStops, aiPlaces) {
  if (!center) return null;

  try {
    const response = await new google.maps.Geocoder().geocode({ location: center });
    const components = response.results?.[0]?.address_components ?? [];
    for (const type of ['locality', 'sublocality_level_1', 'administrative_area_level_2', 'administrative_area_level_1']) {
      const comp = components.find(c => c.types.includes(type));
      if (comp) {
        const country = components.find(c => c.types.includes('country'));
        return country ? `${comp.long_name}, ${country.long_name}` : comp.long_name;
      }
    }
  } catch { /* fall through to pin fallback */ }

  const allPins = [...routeStops, ...aiPlaces];
  if (!allPins.length) return null;
  let nearest = null, minDist = Infinity;
  for (const pin of allPins) {
    const d = haversineKm(center, pin);
    if (d < minDist) { minDist = d; nearest = pin; }
  }
  return nearest?.name ?? null;
}

// ── Google Places nearbySearch (area search) ──────────────────────────────
function placesNearbySearch(mapInstance, location, radiusM, keyword) {
  return new Promise((resolve) => {
    const svc = new google.maps.places.PlacesService(mapInstance);
    svc.nearbySearch(
      { location, radius: Math.min(radiusM, 50000), keyword: keyword || undefined },
      (results, status) => {
        const ok = [
          google.maps.places.PlacesServiceStatus.OK,
          google.maps.places.PlacesServiceStatus.ZERO_RESULTS,
        ];
        resolve(ok.includes(status) ? (results ?? []) : []);
      }
    );
  });
}

function mapGooglePlace(r, i) {
  const types = r.types ?? [];
  let category = 'scenic';
  if (types.some(t => ['restaurant', 'food', 'cafe', 'bar', 'meal_takeaway', 'meal_delivery'].includes(t))) category = 'restaurant';
  else if (types.some(t => ['lodging'].includes(t))) category = 'hotel';
  return {
    id:       `places-${r.place_id}`,
    name:     r.name,
    category,
    lat:      r.geometry.location.lat(),
    lng:      r.geometry.location.lng(),
    rating:   r.rating ?? 4.2,
    desc:     r.vicinity ?? '',
    seed:     (i + 1) * 73 + 17,
  };
}

const useAppStore = create((set, get) => ({
  // ── Screen
  screen:    'home',
  activeTab: 'plan-ai',
  tripName:  '',

  showTab(tab) {
    set({ activeTab: tab });
  },

  goHome() {
    set({ screen: 'home' });
  },

  async goToMap(promptText) {
    const text = promptText || 'Plan me a road trip';
    set({ screen: 'map', activeTab: 'plan-ai', tripName: extractDestination(text) });

    const turnId = nextId();
    set(s => ({
      chatTurns: [...s.chatTurns.map(t => ({ ...t, visibleOnMap: false })), {
        id: turnId, userText: text, aiText: '', cards: [], chips: [],
        moreLabel: 'more places', isThinking: true, error: null, visibleOnMap: true,
      }],
      conversationHistory: [{ role: 'user', text }],
      aiPlaces: [],
      activeFilter: 'all',
    }));

    let places;
    try {
      places = await callClaude([{ role: 'user', text }]);
    } catch (err) {
      console.error('Claude error:', err);
      set(s => ({
        chatTurns: s.chatTurns.map(t => t.id === turnId
          ? { ...t, isThinking: false, error: "Couldn't reach Claude — showing sample places." }
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

    set(s => {
      const turns = s.chatTurns.map(t => t.id === turnId
        ? { ...t, isThinking: false, aiText: mainText, cards: mainCards, allPlaces: places, chips, moreLabel: scenic.length ? 'more scenic spots' : 'more places' }
        : t);
      return {
        aiPlaces:            derivedPlaces(turns),
        activeFilter:        scenic.length ? 'scenic' : 'all',
        conversationHistory: [...s.conversationHistory, { role: 'assistant', text: JSON.stringify(places) }],
        chatTurns:           turns,
      };
    });
  },

  // ── Chat
  chatTurns:           [],
  conversationHistory: [],
  isThinking:          false,

  async submitFooter(text) {
    const { activeCircle, mapInstance, replyContext } = get();

    // Build the display text (shown in chat) and the Claude prompt (includes location)
    let displayText = text.trim();
    let locationNote = '';

    if (replyContext) {
      displayText = displayText
        ? `"${replyContext.text}" — ${displayText}`
        : replyContext.text;
      // Append lat/lng so Claude returns geographically anchored results
      if (replyContext.lat != null && replyContext.lng != null) {
        locationNote = ` [near ${replyContext.lat.toFixed(4)}, ${replyContext.lng.toFixed(4)}]`;
      }
      get().clearReplyContext();
    }

    if (!displayText && !activeCircle) return;
    const prompt = displayText || 'Find things in this area';
    // Claude gets location context; UI shows clean text
    const claudePrompt = prompt + locationNote;

    if (activeCircle) {
      get().doAreaSearch(prompt);
      return;
    }

    const turnId = nextId();
    set(s => ({
      chatTurns: [...s.chatTurns.map(t => ({ ...t, visibleOnMap: false })), {
        id: turnId, userText: prompt, aiText: '', cards: [], chips: [],
        moreLabel: 'more places', isThinking: true, error: null, visibleOnMap: true,
      }],
      conversationHistory: [...s.conversationHistory, { role: 'user', text: claudePrompt }],
      isThinking: true,
    }));

    let places;
    try {
      places = await callClaude(get().conversationHistory);
    } catch (err) {
      console.error('Claude error:', err);
      set(s => ({
        isThinking: false,
        conversationHistory: s.conversationHistory.slice(0, -1),
        chatTurns: s.chatTurns.map(t => t.id === turnId
          ? { ...t, isThinking: false, error: "Couldn't reach Claude — try again." }
          : t),
      }));
      return;
    }

    set(s => {
      const turns = s.chatTurns.map(t => t.id === turnId
        ? { ...t, isThinking: false, aiText: `Here are ${places.length} places for you`, cards: places, moreLabel: 'more places' }
        : t);
      return {
        isThinking:          false,
        aiPlaces:            derivedPlaces(turns),
        activeFilter:        'all',
        conversationHistory: [...s.conversationHistory, { role: 'assistant', text: JSON.stringify(places) }],
        chatTurns:           turns,
      };
    });
  },

  async doAreaSearch(userPrompt) {
    const { activeCircle, mapInstance } = get();
    const center  = circleCenter(activeCircle, mapInstance);
    const r       = activeCircle?.radiusKm ?? 0;
    const rLabel  = `${r.toFixed(1)} km`;
    const radiusM = r * 1000;

    const turnId = nextId();
    set(s => ({
      chatTurns: [...s.chatTurns.map(t => ({ ...t, visibleOnMap: false })), {
        id: turnId, userText: userPrompt, aiText: '', cards: [], chips: [],
        moreLabel: 'more places', isThinking: true, error: null, visibleOnMap: true,
      }],
      isThinking: true,
    }));

    let places = [];
    try {
      // Use Google Places nearbySearch — guaranteed geographic accuracy,
      // results are always within the drawn radius.
      const raw = await placesNearbySearch(mapInstance, center, radiusM, userPrompt);
      places = raw.slice(0, 10).map(mapGooglePlace);
    } catch (err) {
      console.error('Places nearby search error:', err);
    }

    const resultLabel = places.length
      ? `${places.length} suggestion${places.length !== 1 ? 's' : ''} within ${rLabel}`
      : `No places found in this area`;

    set(s => {
      const turns = s.chatTurns.map(t => t.id === turnId
        ? { ...t, isThinking: false, aiText: resultLabel, cards: places, moreLabel: 'more places' }
        : t);
      return {
        isThinking:   false,
        aiPlaces:     derivedPlaces(turns),
        activeFilter: 'all',
        chatTurns:    turns,
      };
    });
  },

  appendChipTurn(chipDef) {
    const { aiPlaces: ap } = get();
    const places   = allPlaces(ap).filter(s => s.category === chipDef.filter);
    const def      = { hotel: { aiText: 'Here are the hotels along your route', moreLabel: 'more hotels' }, restaurant: { aiText: 'Here are restaurants and cafés along your route', moreLabel: 'more restaurants' }, scenic: { aiText: 'Here are scenic highlights for your route', moreLabel: 'more scenic spots' } }[chipDef.filter] || {};
    const turnId   = nextId();
    set(s => {
      const turns = [...s.chatTurns.map(t => ({ ...t, visibleOnMap: false })), {
        id: turnId, userText: chipDef.label,
        aiText: def.aiText || `Here are ${places.length} ${chipDef.label.toLowerCase()}`,
        cards: places, chips: [], moreLabel: def.moreLabel || 'more places',
        isThinking: false, error: null, visibleOnMap: true,
      }];
      return {
        activeFilter: chipDef.filter,
        chatTurns:    turns,
        aiPlaces:     derivedPlaces(turns),
      };
    });
  },

  toggleTurnVisibility(turnId) {
    set(s => {
      const turns = s.chatTurns.map(t =>
        t.id === turnId ? { ...t, visibleOnMap: !t.visibleOnMap } : t
      );
      return { chatTurns: turns, aiPlaces: derivedPlaces(turns) };
    });
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
    const { routeStops, aiPlaces, chatTurns } = get();
    if (routeStops.find(s => s.id === suggId)) return;
    // Search current AI places first; fall back to any card from previous chat turns
    // (needed because aiPlaces is replaced on each new query but old chat cards stay visible)
    const pool = [...allPlaces(aiPlaces), ...chatTurns.flatMap(t => t.cards ?? [])];
    const sugg = pool.find(s => s.id === suggId);
    if (!sugg) return;
    const idx = insertAt !== undefined ? Math.min(insertAt, routeStops.length) : bestInsertIndex(routeStops, sugg);
    const next = [...routeStops];
    next.splice(idx, 0, { ...sugg });
    set({ routeStops: twoOpt(next) });
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

  // Stores Google-verified lat/lng for a place name. Read inside useMapOverlays via
  // getState() (not as a React dep) so it doesn't trigger extra overlay rebuilds.
  coordPatches: {},
  setCoordPatch(name, lat, lng) {
    set(s => ({ coordPatches: { ...s.coordPatches, [name]: { lat, lng } } }));
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

  focusPlace(sugg) {
    const { mapInstance, openCard, suggPinEls } = get();
    if (!mapInstance || !sugg.lat || !sugg.lng) { openCard(sugg, null); return; }
    const pinEl = suggPinEls[sugg.id] || null;
    if (mapInstance.getZoom() < 12) mapInstance.setZoom(12);
    mapInstance.panTo({ lat: sugg.lat, lng: sugg.lng });
    // Wait for pan animation to settle so the pin is at its final screen position
    google.maps.event.addListenerOnce(mapInstance, 'idle', () => openCard(sugg, pinEl));
  },

  // ── Comments
  commentMode:     false,
  comments:        [],   // [{ id, text, lat, lng }]
  pendingComment:  null, // { lat, lng } — position waiting for text input
  activeCommentId: null, // id of the dot whose detail popup is open
  editingCommentId: null, // id of comment being edited (re-opens input card)

  toggleCommentMode() {
    set(s => ({ commentMode: !s.commentMode, pendingComment: null, activeCommentId: null, editingCommentId: null }));
  },
  setPendingComment(latLng) {
    set({ pendingComment: latLng, activeCommentId: null, editingCommentId: null });
  },
  submitComment(text, editId) {
    if (editId) {
      set(s => ({
        comments: s.comments.map(c => c.id === editId ? { ...c, text: text.trim() } : c),
        pendingComment: null,
        editingCommentId: null,
        activeCommentId: null,
        commentMode: false,   // exit comment mode after editing
      }));
      return;
    }
    const { pendingComment } = get();
    if (!pendingComment || !text.trim()) return;
    const id = `comment-${Date.now()}`;
    set(s => ({
      comments: [...s.comments, { id, text: text.trim(), lat: pendingComment.lat, lng: pendingComment.lng, createdAt: Date.now() }],
      pendingComment: null,
      commentMode: false,     // exit comment mode after posting
    }));
  },
  cancelPendingComment() {
    set({ pendingComment: null, editingCommentId: null });
  },
  deleteComment(id) {
    set(s => ({
      comments: s.comments.filter(c => c.id !== id),
      activeCommentId: s.activeCommentId === id ? null : s.activeCommentId,
    }));
  },
  startEditComment(id) {
    const comment = get().comments.find(c => c.id === id);
    if (!comment) return;
    set({ editingCommentId: id, pendingComment: { lat: comment.lat, lng: comment.lng }, activeCommentId: null });
  },
  setActiveCommentId(id) {
    set({ activeCommentId: id });
  },

  addCommentAsStop(comment) {
    const stop = {
      id:       `comment-stop-${comment.id}`,
      name:     comment.text.length > 40 ? comment.text.slice(0, 40) + '…' : comment.text,
      category: 'scenic',
      lat:      comment.lat,
      lng:      comment.lng,
      rating:   null,
      desc:     'Comment location',
      seed:     42,
    };
    set(s => {
      if (s.routeStops.find(r => r.id === stop.id)) return {};
      const idx = bestInsertIndex(s.routeStops, stop);
      const next = [...s.routeStops];
      next.splice(idx, 0, stop);
      return { routeStops: twoOpt(next) };
    });
  },

  // ── Reply context
  replyContext: null, // { id, text, lat, lng } — comment being replied to

  setReplyContext(comment) {
    set({ replyContext: comment, activeCommentId: null, commentMode: false });
  },
  clearReplyContext() {
    set({ replyContext: null });
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

  // ── Suggestion pin element registry (id → DOM el, for focusPlace anchoring)
  suggPinEls: {},
  setSuggPinEl(id, el) {
    set(s => ({ suggPinEls: { ...s.suggPinEls, [id]: el } }));
  },
  clearSuggPinEls() {
    set({ suggPinEls: {} });
  },

  // ── Map
  mapInstance: null,
  mapReady:    false,

  setMapInstance(map) {
    set({ mapInstance: map, mapReady: true });
    google.maps.event.addListener(map, 'click', (e) => {
      const { commentMode, setPendingComment, closeCard } = get();
      if (commentMode) {
        setPendingComment({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      } else {
        closeCard();
      }
    });
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
