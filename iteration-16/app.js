'use strict';

/* ══════════════════════════════════════════════
   DATA
══════════════════════════════════════════════ */

const SUGGESTIONS = [
  { id: 'sc1', name: 'Þingvellir',      category: 'scenic',     lat: 64.2558, lng: -21.1296, seed: 101, rating: 4.8, desc: 'UNESCO World Heritage Site where the North American and Eurasian tectonic plates meet.' },
  { id: 'sc2', name: 'Geysir',          category: 'scenic',     lat: 64.3120, lng: -20.3003, seed: 204, rating: 4.7, desc: 'Watch Strokkur erupt every 6–10 minutes, shooting water up to 30 m high.' },
  { id: 'sc3', name: 'Gullfoss',        category: 'scenic',     lat: 64.3269, lng: -20.1209, seed: 318, rating: 4.9, desc: 'Iceland\'s most iconic waterfall, a two-tiered cascade on the Hvítá river.' },
  { id: 'sc4', name: 'Seljalandsfoss',  category: 'scenic',     lat: 63.6158, lng: -19.9886, seed: 612, rating: 4.8, desc: 'Walk behind the curtain of this 60 m waterfall — magical at golden hour.' },
  { id: 'sc5', name: 'Skógafoss',       category: 'scenic',     lat: 63.5322, lng: -19.5133, seed: 503, rating: 4.9, desc: 'Climb 527 steps to the top for sweeping views along the south coast.' },
  { id: 'sc6', name: 'Reynisfjara',     category: 'scenic',     lat: 63.4063, lng: -19.0610, seed: 616, rating: 4.7, desc: 'Dramatic black sand beach with basalt columns and powerful surf. Beware sneaker waves.' },
  { id: 'r1',  name: 'Matur og Drykkur', category: 'restaurant', lat: 64.1500, lng: -21.9400, seed: 701, rating: 4.5, price: '$$$', desc: 'Modern Icelandic cuisine rooted in old recipes. Must-try: skyr-cured salmon.' },
  { id: 'r2',  name: 'Skál! Craft Bar',  category: 'restaurant', lat: 64.1467, lng: -21.9380, seed: 711, rating: 4.4, price: '$$',  desc: 'Local craft beers and small plates. Great spot for an evening wind-down.' },
  { id: 'r3',  name: 'Geysir Glima',     category: 'restaurant', lat: 64.3110, lng: -20.2980, seed: 721, rating: 4.3, price: '$$',  desc: 'Hearty Icelandic stews and lamb soup right next to the geyser area.' },
  { id: 'r4',  name: 'Pakkhús',          category: 'restaurant', lat: 63.9336, lng: -20.9973, seed: 731, rating: 4.6, price: '$$$', desc: 'Seafood by the harbour. Known for langoustine bisque and fresh catch platters.' },
  { id: 'h1',  name: 'Hótel Kría',       category: 'hotel', lat: 63.4215, lng: -19.0020, seed: 801, rating: 4.5, price: '$195', desc: 'Vík\'s newest hotel, game room, good on-site dinner. Best Day 1 endpoint.' },
  { id: 'h2',  name: 'Hótel Selfoss',    category: 'hotel', lat: 63.9343, lng: -20.9977, seed: 811, rating: 4.4, price: '$178', desc: 'Modern property with the best breakfast on the route. Central location.' },
  { id: 'h3',  name: 'Hótel Skógafoss', category: 'hotel', lat: 63.5322, lng: -19.5133, seed: 821, rating: 4.3, price: '$229', desc: 'Right at the falls. Some rooms face the waterfall. Excellent restaurant.' },
  { id: 'h4',  name: 'The Barn',         category: 'hotel', lat: 63.4120, lng: -19.0260, seed: 831, rating: 4.5, price: '$68',  desc: 'Just outside Vík. Private rooms, ocean views, great bar. Best budget pick.' },
  { id: 'h5',  name: 'Aurora Igloo South', category: 'hotel', lat: 63.8280, lng: -20.4100, seed: 841, rating: 4.3, price: '$320', desc: 'Clear igloos for aurora viewing — a novelty stay, beautiful any season.' },
];

const CAT_ICONS = { scenic: 'landscape', restaurant: 'restaurant', hotel: 'hotel' };

const SEARCH_OVERRIDES = {
  'Þingvellir':       'Thingvellir National Park Iceland',
  'Geysir':           'Strokkur Geysir Iceland',
  'Gullfoss':         'Gullfoss waterfall Iceland',
  'Seljalandsfoss':   'Seljalandsfoss waterfall Iceland',
  'Skógafoss':        'Skogafoss waterfall Iceland',
  'Reynisfjara':      'Reynisfjara black sand beach Iceland',
  'Matur og Drykkur': 'Matur og Drykkur restaurant Reykjavik',
  'Skál! Craft Bar':  'Skal Craft Bar Reykjavik Iceland',
  'Geysir Glima':     'Geysir Glima restaurant Iceland',
  'Pakkhús':          'Pakkhus restaurant Selfoss Iceland',
  'Hótel Kría':       'Hotel Kria Vik Iceland',
  'Hótel Selfoss':    'Hotel Selfoss Iceland',
  'Hótel Skógafoss':  'Hotel Skogafoss Iceland',
  'The Barn':         'The Barn hotel Vik Iceland',
  'Aurora Igloo South': 'Aurora Igloo hotel Iceland',
};

/* ══════════════════════════════════════════════
   CLAUDE AI  (via local proxy at /api/claude)
══════════════════════════════════════════════ */

const CLAUDE_PROXY  = '/api/claude';
const CLAUDE_MODEL  = 'claude-haiku-4-5-20251001';

const CLAUDE_SYSTEM = `You are a Google Maps travel planner. Given a trip description or query, return ONLY a valid JSON array of place objects — no markdown, no explanation, nothing else outside the array.

Each object must use exactly these fields:
{"id":"ai1","name":"Place Name","category":"scenic","lat":64.32,"lng":-20.12,"rating":4.7,"desc":"1-2 sentence description.","seed":101}

Rules:
- "category": exactly one of scenic | restaurant | hotel
- "lat"/"lng": accurate real-world coordinates
- "rating": 4.0–5.0
- For restaurant or hotel add "price": "$" | "$$" | "$$$"
- Return 8-12 places, mix categories to match the query
- Output the raw JSON array only — start with [ end with ]`;

function parsePlaces(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const s = clean.indexOf('['), e = clean.lastIndexOf(']');
  const places = JSON.parse(s !== -1 && e !== -1 ? clean.slice(s, e + 1) : clean);
  return places.map((p, i) => ({ ...p, id: `ai-${Date.now()}-${i}`, seed: (i + 1) * 97 + 3 }));
}

async function callClaude(history) {
  const messages = history.map(m => ({
    role:    m.role === 'model' ? 'assistant' : m.role,
    content: m.text,
  }));
  const resp = await fetch(CLAUDE_PROXY, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:      CLAUDE_MODEL,
      max_tokens: 2048,
      system:     CLAUDE_SYSTEM,
      messages,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Claude ${resp.status}: ${err?.error?.message ?? ''}`);
  }
  const data = await resp.json();
  const raw  = data.content?.[0]?.text ?? '[]';
  return parsePlaces(raw);
}

/* ══════════════════════════════════════════════
   IMAGE CACHE
══════════════════════════════════════════════ */

const placeImages  = new Map();
let   placesService = null;

function fetchPlaceImage(name) {
  if (placeImages.has(name) || !placesService) return Promise.resolve();
  const query = SEARCH_OVERRIDES[name] ?? name;

  return new Promise(resolve => {
    // Step 1: find the place_id (findPlaceFromQuery only returns ~1 photo)
    placesService.findPlaceFromQuery(
      { query, fields: ['place_id', 'photos'] },
      (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.[0]) {
          resolve(); return;
        }

        const firstResult = results[0];
        const placeId     = firstResult.place_id;

        // Step 2: getDetails gives up to 10 photos
        if (placeId) {
          placesService.getDetails(
            { placeId, fields: ['photos'] },
            (place, detailStatus) => {
              const photoSrc = (detailStatus === google.maps.places.PlacesServiceStatus.OK && place?.photos?.length)
                ? place.photos
                : firstResult.photos ?? [];

              if (photoSrc.length) {
                const entries = photoSrc.slice(0, 3).map(p => ({
                  small: p.getUrl({ maxWidth: 800 }),
                  thumb: p.getUrl({ maxWidth: 120 }),
                }));
                placeImages.set(name, { photos: entries, small: entries[0].small, thumb: entries[0].thumb });
              }
              resolve();
            }
          );
        } else {
          // No place_id — use whatever photos findPlaceFromQuery gave us
          const photoSrc = firstResult.photos ?? [];
          if (photoSrc.length) {
            const entries = photoSrc.slice(0, 3).map(p => ({
              small: p.getUrl({ maxWidth: 800 }),
              thumb: p.getUrl({ maxWidth: 120 }),
            }));
            placeImages.set(name, { photos: entries, small: entries[0].small, thumb: entries[0].thumb });
          }
          resolve();
        }
      }
    );
  });
}

function getImg(name, seed, size = 'small') {
  const dims  = size === 'thumb' ? '68/68' : '320/176';
  const entry = placeImages.get(name);
  const url   = entry && (entry[size] ?? entry.small);
  return url || `https://picsum.photos/seed/${seed}/${dims}`;
}

async function preloadImages() {
  await Promise.all(allPlaces().map(s => fetchPlaceImage(s.name)));
  refreshCardImages();
}

function refreshCardImages() {
  document.querySelectorAll('.suggestion-card-img').forEach(img => {
    const suggId = img.closest('.suggestion-card')?.dataset.id;
    if (!suggId) return;
    const sugg = SUGGESTIONS.find(s => s.id === suggId);
    if (sugg) img.src = getImg(sugg.name, sugg.seed, 'thumb');
  });
}

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */

let map           = null;
let mapReady      = false;
let routePolyline = null;
let stopMarkers   = {};      // suggId → SquarePin
let suggPinObjs   = {};      // suggId → SuggestionPin
let bookmarkPins  = {};      // suggId → BookmarkPin

let appState      = 'home';
let routeStops    = [];      // suggestions added to route (in order)
let savedPlaces   = {};      // suggId → suggestion
let activeFilter  = 'all';

let aiPlaces            = [];   // places returned by Gemini this session
let conversationHistory = [];   // { role, text }[] — full Gemini thread

function allPlaces() { return aiPlaces.length ? aiPlaces : SUGGESTIONS; }

let SquarePin     = null;
let SuggestionPin = null;
let BookmarkPin   = null;

let dragSrcIndex  = null;    // stop-list reorder source index
let draggingSuggId = null;   // suggestion being dragged from panel/map

let currentCardData = null;  // suggestion shown in place card

/* ══════════════════════════════════════════════
   STATE MACHINE
══════════════════════════════════════════════ */

function setState(s) {
  appState = s;
  document.body.dataset.state = s;
}

function goToMap() {
  if (appState !== 'home') return;

  const promptEl  = document.querySelector('.prompt-text');
  const promptText = (promptEl?.textContent || '').trim() || 'Plan me a road trip';

  const homeScreen = document.getElementById('homeScreen');
  homeScreen.style.animation = 'screenExitLeft 0.28s ease forwards';

  setTimeout(() => {
    setState('plan-ai');
    showTab('plan-ai');
    renderStopList();

    const mapView = document.getElementById('mapView');
    mapView.style.animation = 'screenEnter 0.32s ease forwards';
    setTimeout(() => { mapView.style.animation = ''; }, 320);

    setTimeout(() => animateSuggestions(promptText), 420);
  }, 240);
}

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
   CHAT THREAD — PRIMITIVES
══════════════════════════════════════════════ */

function scrollChatToBottom() {
  const content = document.getElementById('panelContent');
  if (content) content.scrollTop = content.scrollHeight;
}

function createGeminiIconEl() {
  const wrap = document.createElement('div');
  wrap.className = 'chat-gemini-icon';
  wrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 1C14 1 14.15 13.85 1 14C14.15 14.15 14 27 14 27C14 27 13.85 14.15 27 14C13.85 13.85 14 1 14 1Z" fill="url(#chatGemGrad)"/>
    <defs>
      <linearGradient id="chatGemGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#4285F4"/>
        <stop offset="40%" stop-color="#9C27B0"/>
        <stop offset="75%" stop-color="#EA4335"/>
        <stop offset="100%" stop-color="#FBBC04"/>
      </linearGradient>
    </defs>
  </svg>`;
  return wrap;
}

/* Build a card list with optional "show more" expand (bleeds to panel edges) */
function buildCardList(cards, { limit = 5, moreLabel = 'more places' } = {}) {
  const list   = document.createElement('div');
  list.className = 'chat-card-list';

  const shown  = cards.slice(0, limit);
  const hidden = cards.slice(limit);

  // Render visible cards
  shown.forEach(s => {
    const wrap = document.createElement('div');
    wrap.innerHTML = suggestionCardHTML(s);
    list.appendChild(wrap.firstElementChild);
  });

  // "Show X more" button
  if (hidden.length > 0) {
    const btn = document.createElement('button');
    btn.className = 'chat-show-more';
    btn.innerHTML = `Show ${hidden.length} ${moreLabel} <span class="material-symbols-rounded">expand_more</span>`;
    btn.addEventListener('click', () => {
      btn.remove();
      hidden.forEach((s, i) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = suggestionCardHTML(s);
        const card = wrap.firstElementChild;
        list.appendChild(card);
        setTimeout(() => card.classList.add('is-visible'), i * 55);
      });
      scrollChatToBottom();
    });
    list.appendChild(btn);
  }

  return list;
}

/* Category chip config — drives both panel cards and map filter */
const CHIP_DEFS = {
  hotel:      { label: 'Hotels', icon: 'hotel',      aiText: 'Here are the hotels along your route',          moreLabel: 'more hotels'       },
  restaurant: { label: 'Food',   icon: 'restaurant', aiText: 'Here are restaurants and cafés along your route', moreLabel: 'more restaurants' },
  scenic:     { label: 'Scenic', icon: 'landscape',  aiText: 'Here are scenic highlights for your route',      moreLabel: 'more scenic spots' },
};

/* Build quick-reply chips that switch category in both panel + map */
function buildChipRow(chips) {
  const row = document.createElement('div');
  row.className = 'chat-chips';
  chips.forEach(chipDef => {
    const btn = document.createElement('button');
    btn.className = 'chat-chip';
    btn.innerHTML = `<span class="material-symbols-rounded">${chipDef.icon}</span>${chipDef.label}`;
    btn.addEventListener('click', () => {
      // Disable all chips in this row
      row.querySelectorAll('.chat-chip').forEach(b => { b.disabled = true; });

      const filtered = allPlaces().filter(s => s.category === chipDef.filter);
      const def      = CHIP_DEFS[chipDef.filter] || {};

      appendChatTurn({
        userText:  chipDef.label,
        aiText:    def.aiText || `Here are ${filtered.length} ${chipDef.label.toLowerCase()}`,
        cards:     filtered,
        moreLabel: def.moreLabel,
        thinkDelay: 800,
      });

      // Filter map pins to match the selected category
      activeFilter = chipDef.filter;
      filterSuggestionPins();
    });
    row.appendChild(btn);
  });
  return row;
}

/**
 * appendChatTurn({ userText, aiText, cards, chips, thinkDelay })
 *
 * Appends a new turn to #paneplanai.
 * - userText  : right-aligned blue bubble (optional)
 * - aiText    : left-aligned AI bubble with Gemini icon
 * - cards     : array of suggestion objects → flat card list below the bubble
 * - chips     : array of { label, icon, filter } quick-reply chips
 * - thinkDelay: if > 0, show thinking dots for this many ms before revealing content
 */
function appendChatTurn({ userText = null, aiText = '', cards = [], chips = [], thinkDelay = 0, moreLabel = 'more places', cardLimit = 5 }) {
  const pane = document.getElementById('paneplanai');
  const turn = document.createElement('div');
  turn.className = 'chat-turn';

  // ── User bubble ──
  if (userText) {
    const ub = document.createElement('div');
    ub.className = 'chat-bubble--user';
    ub.textContent = userText;
    turn.appendChild(ub);
  }

  // ── AI bubble ──
  const aiWrap  = document.createElement('div');
  aiWrap.className = 'chat-bubble-ai-wrap';
  const aiBubble = document.createElement('div');
  aiBubble.className = 'chat-bubble--ai';
  aiWrap.appendChild(createGeminiIconEl());
  aiWrap.appendChild(aiBubble);
  turn.appendChild(aiWrap);
  pane.appendChild(turn);
  scrollChatToBottom();

  function revealContent() {
    aiBubble.innerHTML = '';
    typeInto(aiBubble, aiText, 36, () => {
      if (chips.length) {
        const chipRow = buildChipRow(chips);
        turn.appendChild(chipRow);
      }
      if (cards.length) {
        const cardList = buildCardList(cards, { limit: cardLimit, moreLabel });
        turn.appendChild(cardList);
        Array.from(cardList.querySelectorAll('.suggestion-card')).forEach((c, i) => {
          setTimeout(() => c.classList.add('is-visible'), i * 55);
        });
      }
      scrollChatToBottom();
    });
  }

  if (thinkDelay > 0) {
    aiBubble.innerHTML = `<div class="chat-thinking"><span></span><span></span><span></span></div>`;
    scrollChatToBottom();
    setTimeout(revealContent, thinkDelay);
  } else {
    revealContent();
  }
}

/* ══════════════════════════════════════════════
   ANIMATION — SUGGESTIONS REVEAL
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

/* Create a chat turn with live thinking dots; returns { resolve, error } to fill in later */
function startThinkingTurn(userText) {
  const pane = document.getElementById('paneplanai');
  const turn = document.createElement('div');
  turn.className = 'chat-turn';

  if (userText) {
    const ub = document.createElement('div');
    ub.className = 'chat-bubble--user';
    ub.textContent = userText;
    turn.appendChild(ub);
  }

  const aiWrap   = document.createElement('div');
  aiWrap.className = 'chat-bubble-ai-wrap';
  const aiBubble = document.createElement('div');
  aiBubble.className = 'chat-bubble--ai';
  aiBubble.innerHTML = `<div class="chat-thinking"><span></span><span></span><span></span></div>`;
  aiWrap.appendChild(createGeminiIconEl());
  aiWrap.appendChild(aiBubble);
  turn.appendChild(aiWrap);
  pane.appendChild(turn);
  scrollChatToBottom();

  return {
    resolve({ aiText, cards = [], chips = [], moreLabel = 'more places' }) {
      aiBubble.innerHTML = '';
      typeInto(aiBubble, aiText, 36, () => {
        if (chips.length) turn.appendChild(buildChipRow(chips));
        if (cards.length) {
          const cardList = buildCardList(cards, { limit: 5, moreLabel });
          turn.appendChild(cardList);
          Array.from(cardList.querySelectorAll('.suggestion-card')).forEach((c, i) => {
            setTimeout(() => c.classList.add('is-visible'), i * 55);
          });
        }
        scrollChatToBottom();
      });
    },
    error(msg) {
      aiBubble.innerHTML = `<span style="color:#ea4335">${msg}</span>`;
      scrollChatToBottom();
    },
  };
}

async function animateSuggestions(promptText) {
  conversationHistory = [{ role: 'user', text: promptText }];
  activeFilter = 'all';

  const thinking = startThinkingTurn(promptText);

  let places;
  try {
    places = await callClaude(conversationHistory);
  } catch (err) {
    console.error('Claude error:', err);
    thinking.error('Couldn\'t reach Claude — showing sample places.');
    places = SUGGESTIONS;
  }

  aiPlaces = places;
  conversationHistory.push({ role: 'assistant', text: JSON.stringify(places) });

  // Recentre map to fit returned places
  if (mapReady && places.length) {
    const bounds = new google.maps.LatLngBounds();
    places.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 20 });
  }

  const scenic      = places.filter(s => s.category === 'scenic');
  const hasHotel    = places.some(s => s.category === 'hotel');
  const hasFood     = places.some(s => s.category === 'restaurant');
  const mainCards   = scenic.length ? scenic : places.slice(0, 6);
  const mainLabel   = scenic.length ? 'more scenic spots' : 'more places';
  const mainText    = scenic.length
    ? `Here are the top scenic spots for your trip`
    : `Here are ${places.length} suggestions for your trip`;

  thinking.resolve({
    aiText:    mainText,
    cards:     mainCards,
    moreLabel: mainLabel,
    chips: [
      hasHotel && { label: 'Hotels', icon: 'hotel',      filter: 'hotel'      },
      hasFood  && { label: 'Food',   icon: 'restaurant', filter: 'restaurant' },
    ].filter(Boolean),
  });

  activeFilter = scenic.length ? 'scenic' : 'all';

  setTimeout(() => {
    if (mapReady) { renderSuggestionPins(); filterSuggestionPins(); }
    places.forEach(p => fetchPlaceImage(p.name));
    setTimeout(refreshCardImages, 2500);
  }, 800);
}

/* ══════════════════════════════════════════════
   MAP INIT
══════════════════════════════════════════════ */

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 63.87, lng: -20.10 },
    zoom: 8,
    disableDefaultUI: true,
    gestureHandling: 'auto',
    styles: [
      { featureType: 'poi',     elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', elementType: 'all',         stylers: [{ visibility: 'off' }] },
      { featureType: 'road',    elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    ],
  });

  /* ── SquarePin — numbered photo pin for route stops ── */
  SquarePin = class extends google.maps.OverlayView {
    constructor(sugg, number) {
      super();
      this.sugg   = sugg;
      this.number = number;
      this.el     = null;
    }

    onAdd() {
      const s  = this.sugg;
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
      el.addEventListener('click', e => { e.stopPropagation(); showSuggCard(s, el); });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.sugg.lat, this.sugg.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 57) + 'px';
    }

    onRemove() {
      if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
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

    updateNumber(n) {
      this.number = n;
      if (this.el) {
        const badge = this.el.querySelector('.square-pin-badge');
        if (badge) badge.textContent = n;
      }
    }
  };

  /* ── SuggestionPin — colored dot for AI suggestions ── */
  SuggestionPin = class extends google.maps.OverlayView {
    constructor(sugg) {
      super();
      this.sugg = sugg;
      this.el   = null;
    }

    onAdd() {
      const s  = this.sugg;
      const el = document.createElement('div');
      el.className = 'square-pin suggestion-pin';
      el.innerHTML = `
        <div class="sugg-pin-badge sugg-pin-badge--${s.category}">
          <span class="material-symbols-rounded">${CAT_ICONS[s.category]}</span>
        </div>
        <div class="square-pin-shell">
          <img class="square-pin-photo" src="${getImg(s.name, s.seed, 'thumb')}" alt="">
        </div>
        <div class="square-pin-tip"></div>
      `;
      el.style.opacity = '0';
      el.draggable = true;
      el.addEventListener('mousedown', e => e.stopPropagation());
      el.addEventListener('dragstart', e => {
        draggingSuggId = s.id;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'sugg-' + s.id);
        setTimeout(() => { if (this.el) this.el.style.opacity = '0.4'; }, 0);
      });
      el.addEventListener('dragend', () => {
        draggingSuggId = null;
        if (this.el) this.el.style.opacity = '1';
      });
      el.addEventListener('click', e => { e.stopPropagation(); showSuggCard(s, el); });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.sugg.lat, this.sugg.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 24) + 'px';
      this.el.style.top  = Math.round(pt.y - 57) + 'px';
    }

    onRemove() {
      if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
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

    setVisible(visible) {
      if (this.el) this.el.style.display = visible ? 'block' : 'none';
    }

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

  /* ── BookmarkPin — small circle for saved places ── */
  BookmarkPin = class extends google.maps.OverlayView {
    constructor(sugg) {
      super();
      this.sugg = sugg;
      this.el   = null;
    }

    onAdd() {
      const el = document.createElement('div');
      el.className = 'bookmark-pin';
      el.innerHTML = `<span class="material-symbols-rounded">bookmark</span>`;
      el.addEventListener('click', e => { e.stopPropagation(); showSuggCard(this.sugg, el); });
      this.el = el;
      this.getPanes().overlayMouseTarget.appendChild(el);
    }

    draw() {
      if (!this.el) return;
      const proj = this.getProjection();
      if (!proj) return;
      const pt = proj.fromLatLngToDivPixel(
        new google.maps.LatLng(this.sugg.lat, this.sugg.lng)
      );
      if (!pt) return;
      this.el.style.left = Math.round(pt.x - 10) + 'px';
      this.el.style.top  = Math.round(pt.y - 10) + 'px';
    }

    onRemove() {
      if (this.el?.parentNode) this.el.parentNode.removeChild(this.el);
      this.el = null;
    }
  };

  mapReady = true;
  placesService = new google.maps.places.PlacesService(map);
  preloadImages();

  // Close place card whenever the user interacts with the map background
  google.maps.event.addListener(map, 'click',        closePlaceCard);
  google.maps.event.addListener(map, 'dragstart',    closePlaceCard);
  google.maps.event.addListener(map, 'zoom_changed', closePlaceCard);

  if (appState === 'plan-ai' || appState === 'route') {
    renderSuggestionPins();
    renderPins();
    if (routeStops.length >= 2) renderPolyline();
  }
}

function zoomIn()  { if (map) map.setZoom(map.getZoom() + 1); }
function zoomOut() { if (map) map.setZoom(map.getZoom() - 1); }

/* ══════════════════════════════════════════════
   SUGGESTION MAP PINS
══════════════════════════════════════════════ */

function renderSuggestionPins() {
  clearSuggestionPins();
  allPlaces().forEach((sugg, i) => {
    if (routeStops.find(s => s.id === sugg.id)) return; // has square pin already
    setTimeout(() => {
      const pin = new SuggestionPin(sugg);
      pin.setMap(map);
      suggPinObjs[sugg.id] = pin;
      setTimeout(() => {
        pin.fadeIn();
        filterSuggestionPin(pin, sugg.category);
      }, 20);
    }, 45 * i);
  });
}

function clearSuggestionPins() {
  Object.values(suggPinObjs).forEach(p => p.setMap(null));
  suggPinObjs = {};
}

function filterSuggestionPin(pin, category) {
  const visible = activeFilter === 'all' || activeFilter === category;
  pin.setVisible(visible);
}

function filterSuggestionPins() {
  Object.keys(suggPinObjs).forEach(id => {
    const sugg = allPlaces().find(s => s.id === id);
    if (sugg) filterSuggestionPin(suggPinObjs[id], sugg.category);
  });
}

/* ══════════════════════════════════════════════
   ROUTE STOP PINS
══════════════════════════════════════════════ */

function renderPins() {
  clearPins();
  routeStops.forEach((stop, i) => {
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

function renumberPins() {
  routeStops.forEach((stop, i) => {
    if (stopMarkers[stop.id]) stopMarkers[stop.id].updateNumber(i + 1);
  });
}

/* ══════════════════════════════════════════════
   ROUTE POLYLINE
══════════════════════════════════════════════ */

function drawStraightPolyline() {
  if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  routePolyline = new google.maps.Polyline({
    path:          routeStops.map(s => ({ lat: s.lat, lng: s.lng })),
    strokeColor:   '#1a73e8',
    strokeWeight:  3,
    strokeOpacity: 0.7,
    geodesic:      true,
    map,
    zIndex: 5,
  });
}

function renderPolyline() {
  if (routePolyline) { routePolyline.setMap(null); routePolyline = null; }
  if (routeStops.length < 2) return;

  new google.maps.DirectionsService().route({
    origin:      { lat: routeStops[0].lat, lng: routeStops[0].lng },
    destination: { lat: routeStops[routeStops.length - 1].lat, lng: routeStops[routeStops.length - 1].lng },
    waypoints:   routeStops.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
    travelMode:  google.maps.TravelMode.DRIVING,
    optimizeWaypoints: false,
  }, (result, status) => {
    if (status !== 'OK') {
      console.warn('DirectionsService:', status, '— drawing straight line');
      drawStraightPolyline();
      return;
    }
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
  if (routeStops.length < 2) return;

  new google.maps.DirectionsService().route({
    origin:      { lat: routeStops[0].lat, lng: routeStops[0].lng },
    destination: { lat: routeStops[routeStops.length - 1].lat, lng: routeStops[routeStops.length - 1].lng },
    waypoints:   routeStops.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
    travelMode:  google.maps.TravelMode.DRIVING,
    optimizeWaypoints: false,
  }, (result, status) => {
    if (status !== 'OK') {
      console.warn('DirectionsService:', status, '— drawing straight line');
      drawStraightPolyline();
      return;
    }
    const fullPath = result.routes[0].overview_path;
    routePolyline = new google.maps.Polyline({
      path:          [fullPath[0]],
      strokeColor:   '#1a73e8',
      strokeWeight:  3,
      strokeOpacity: 0.9,
      map,
      zIndex: 5,
    });
    const totalFrames = 80;
    const chunkSize   = Math.max(1, Math.ceil(fullPath.length / totalFrames));
    let i = 1;
    const extendPath = () => {
      for (let j = 0; j < chunkSize && i < fullPath.length; j++, i++) {
        routePolyline.getPath().push(fullPath[i]);
      }
      if (i < fullPath.length) setTimeout(extendPath, 16);
    };
    setTimeout(extendPath, 100);
  });
}

/* ══════════════════════════════════════════════
   ROUTE OPTIMIZATION HELPERS
══════════════════════════════════════════════ */

function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Cheapest-insertion: returns the index where inserting newStop minimises total route distance.
function bestInsertIndex(newStop) {
  const n = routeStops.length;
  if (n < 2) return n;

  let bestIdx = n;
  let bestCost = Infinity;

  for (let i = 0; i <= n; i++) {
    let cost;
    if (i === 0) {
      cost = haversineKm(newStop, routeStops[0]);
    } else if (i === n) {
      cost = haversineKm(routeStops[n - 1], newStop);
    } else {
      cost = haversineKm(routeStops[i - 1], newStop)
           + haversineKm(newStop, routeStops[i])
           - haversineKm(routeStops[i - 1], routeStops[i]);
    }
    if (cost < bestCost) { bestCost = cost; bestIdx = i; }
  }
  return bestIdx;
}

/* ══════════════════════════════════════════════
   ADD TO ROUTE
══════════════════════════════════════════════ */

function addToRoute(suggId, insertAt) {
  if (routeStops.find(s => s.id === suggId)) return;
  const sugg = allPlaces().find(s => s.id === suggId);
  if (!sugg) return;

  if (insertAt !== undefined) {
    routeStops.splice(insertAt, 0, { ...sugg });
  } else {
    // Auto-insert at the position that adds the least extra distance
    const idx = bestInsertIndex(sugg);
    routeStops.splice(idx, 0, { ...sugg });
  }

  // Replace suggestion pin with numbered square pin
  if (mapReady) {
    if (suggPinObjs[suggId]) {
      suggPinObjs[suggId].setMap(null);
      delete suggPinObjs[suggId];
    }
    // Re-number and recreate all route pins cleanly
    clearPins();
    routeStops.forEach((stop, i) => {
      const pin = new SquarePin(stop, i + 1);
      pin.setMap(map);
      stopMarkers[stop.id] = pin;
      setTimeout(() => pin.fadeIn(), 20);
    });

    // Draw / update polyline
    if (routeStops.length === 2) {
      renderPolylineAnimated();
    } else if (routeStops.length > 2) {
      renderPolyline();
    }
  }

  updateSuggestionCardUI(suggId);
  updateRouteCardUI();
  renderStopList();
  updateRouteOptChip();

  if (routeStops.length >= 2) showOptimizeToast();
}

function removeStop(id) {
  routeStops = routeStops.filter(s => s.id !== id);

  if (stopMarkers[id]) {
    stopMarkers[id].setMap(null);
    delete stopMarkers[id];
  }

  // Re-add suggestion pin for this place
  if (mapReady) {
    const sugg = allPlaces().find(s => s.id === id);
    if (sugg) {
      const pin = new SuggestionPin(sugg);
      pin.setMap(map);
      suggPinObjs[id] = pin;
      setTimeout(() => {
        pin.fadeIn();
        filterSuggestionPin(pin, sugg.category);
      }, 20);
    }
    // Re-number remaining pins
    renumberPins();

    if (routeStops.length >= 2) {
      renderPolyline();
    } else if (routePolyline) {
      routePolyline.setMap(null);
      routePolyline = null;
    }
  }

  updateSuggestionCardUI(id);
  updateRouteCardUI();
  renderStopList();
  updateRouteOptChip();
}

/* ══════════════════════════════════════════════
   OPTIMIZE TOAST
══════════════════════════════════════════════ */

let toastTimer = null;

function showOptimizeToast() {
  const toast = document.getElementById('optimizeToast');
  if (!toast) return;

  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.remove('toast-out');
  toast.classList.add('toast-in');
  toast.style.opacity = '1';

  toastTimer = setTimeout(() => {
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.classList.remove('toast-out');
    }, 220);
  }, 2000);
}

/* ══════════════════════════════════════════════
   ROUTE STOP LIST
══════════════════════════════════════════════ */

function renderStopList() {
  const list        = document.getElementById('stopList');
  const emptyState  = document.getElementById('routeEmptyState');
  const routeSpacer = document.getElementById('routeSpacer');
  const infoCard    = document.getElementById('routeInfoCard');
  const spacer2     = document.getElementById('routeSpacer2');
  if (!list) return;

  const hasStops = routeStops.length > 0;
  const hasRoute = routeStops.length >= 2;

  emptyState.style.display = hasStops ? 'none' : 'flex';
  routeSpacer.style.display = hasRoute ? 'block' : 'none';
  infoCard.style.display    = hasRoute ? 'flex'  : 'none';
  spacer2.style.display     = hasRoute ? 'block' : 'none';

  list.innerHTML = '';
  routeStops.forEach((stop, i) => {
    const isLast = i === routeStops.length - 1;
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
      <button class="stop-remove-btn" onclick="removeStop('${stop.id}')">
        <span class="material-symbols-rounded">highlight_off</span>
      </button>
    `;

    li.addEventListener('dragstart',  stopDragStart);
    li.addEventListener('dragover',   stopDragOver);
    li.addEventListener('dragleave',  stopDragLeave);
    li.addEventListener('drop',       stopDrop);
    li.addEventListener('dragend',    stopDragEnd);

    list.appendChild(li);
  });

  if (hasRoute) updateRouteCardUI();
}

function updateRouteCardUI() {
  const n = routeStops.length;
  if (n < 2) return;
  const hoursRaw = 1.2 + n * 0.75;
  const wholeH   = Math.floor(hoursRaw);
  const mins     = Math.round((hoursRaw % 1) * 60 / 5) * 5;
  const timeStr  = mins > 0 ? `${wholeH} hr ${mins} min` : `${wholeH} hr`;
  const miles    = 45 + n * 26;
  const timeEl   = document.getElementById('routeTimeStat');
  const distEl   = document.getElementById('routeDistanceStat');
  if (timeEl) timeEl.textContent = timeStr;
  if (distEl) distEl.textContent = `${miles} miles`;
}

function updateRouteOptChip() {
  const chip  = document.getElementById('routeOptChip');
  const label = document.getElementById('routeOptLabel');
  if (!chip || !label) return;

  const n = routeStops.length;
  if (n === 0) {
    chip.style.display = 'none';
  } else if (n === 1) {
    chip.style.display = 'flex';
    chip.classList.add('route-optimized-chip--building');
    label.textContent = '1 stop added — add more to build a route';
  } else {
    chip.style.display = 'flex';
    chip.classList.remove('route-optimized-chip--building');
    label.textContent = `Route optimized · ${n} stops`;
  }
}

/* ══════════════════════════════════════════════
   STOP DRAG-TO-REORDER
══════════════════════════════════════════════ */

function stopDragStart(e) {
  dragSrcIndex = [...e.currentTarget.parentNode.children].indexOf(e.currentTarget);
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragSrcIndex));
  setTimeout(() => e.currentTarget.classList.add('is-dragging'), 0);
}

function stopDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = draggingSuggId !== null ? 'copy' : 'move';
  clearDropIndicators();
  const rect = e.currentTarget.getBoundingClientRect();
  if (e.clientY < rect.top + rect.height / 2) {
    e.currentTarget.classList.add('drop-above');
  } else {
    e.currentTarget.classList.add('drop-below');
  }
}

function stopDragLeave(e) {
  e.currentTarget.classList.remove('drop-above', 'drop-below');
}

function stopDrop(e) {
  e.preventDefault();
  const target = e.currentTarget;
  let dropIndex = [...target.parentNode.children].indexOf(target);
  const rect = target.getBoundingClientRect();
  if (e.clientY >= rect.top + rect.height / 2) dropIndex += 1;
  clearDropIndicators();

  // Suggestion card / suggestion pin dropped onto stop list
  if (draggingSuggId !== null) {
    const id = draggingSuggId;
    draggingSuggId = null;
    if (!routeStops.find(s => s.id === id)) {
      addToRoute(id, Math.min(dropIndex, routeStops.length));
    }
    return;
  }

  // Stop-to-stop reorder
  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
  const insertAt = dropIndex > dragSrcIndex ? dropIndex - 1 : dropIndex;
  const [moved]  = routeStops.splice(dragSrcIndex, 1);
  routeStops.splice(insertAt, 0, moved);
  dragSrcIndex = null;

  renumberPins();
  renderStopList();
  if (mapReady && routeStops.length >= 2) renderPolyline();
}

function stopDragEnd(e) {
  e.currentTarget.classList.remove('is-dragging');
  clearDropIndicators();
  dragSrcIndex = null;
}

function clearDropIndicators() {
  document.querySelectorAll('.stop-item').forEach(el =>
    el.classList.remove('drop-above', 'drop-below')
  );
}

/* ══════════════════════════════════════════════
   DRAG — SUGGESTION CARD → ROUTE TAB
══════════════════════════════════════════════ */

function suggCardDragStart(e, suggId) {
  draggingSuggId = suggId;
  e.dataTransfer.effectAllowed = 'copy';
  e.dataTransfer.setData('text/plain', 'sugg-' + suggId);
  const card = e.currentTarget;
  setTimeout(() => card.classList.add('is-dragging'), 0);
}

function suggCardDragEnd(e) {
  draggingSuggId = null;
  e.currentTarget.classList.remove('is-dragging');
}

function routeTabDragOver(e) {
  e.preventDefault();
  if (draggingSuggId !== null && appState !== 'route') {
    showTab('route');
  }
}

function emptyStateDrop(e) {
  e.preventDefault();
  const el = document.getElementById('routeEmptyState');
  if (el) el.classList.remove('drag-over');
  if (draggingSuggId !== null) {
    const id = draggingSuggId;
    draggingSuggId = null;
    addToRoute(id);
  }
}

/* ══════════════════════════════════════════════
   CATEGORY FILTER (pins only — cards now live in chat turns)
══════════════════════════════════════════════ */

function setFilter(cat) {
  activeFilter = cat;
  filterSuggestionPins();
}

function suggestionCardHTML(sugg) {
  const inRoute = !!routeStops.find(s => s.id === sugg.id);
  const isSaved = !!savedPlaces[sugg.id];
  const reviews = Math.floor((sugg.seed % 97) * 8 + 45);

  return `
    <div class="suggestion-card" data-id="${sugg.id}" draggable="true"
         ondragstart="suggCardDragStart(event, '${sugg.id}')"
         ondragend="suggCardDragEnd(event)">
      <div class="sugg-thumb-wrap">
        <img class="sugg-thumb suggestion-card-img" src="${getImg(sugg.name, sugg.seed, 'thumb')}" alt="${sugg.name}">
      </div>
      <div class="suggestion-card-body">
        <div class="suggestion-card-name">${sugg.name}</div>
        <div class="suggestion-card-meta">
          <span class="material-symbols-rounded sugg-star">star</span>
          <span>${sugg.rating}</span>
          <span class="sugg-sep">·</span>
          <span>${reviews} reviews</span>
        </div>
      </div>
      <div class="sugg-card-actions">
        <button class="sugg-icon-btn sugg-save-btn ${isSaved ? 'sugg-save-btn--saved' : ''}"
                onclick="saveSuggestion('${sugg.id}')" title="${isSaved ? 'Saved' : 'Save place'}">
          <span class="material-symbols-rounded">${isSaved ? 'bookmark' : 'bookmark_border'}</span>
        </button>
        <button class="sugg-icon-btn sugg-route-btn ${inRoute ? 'sugg-route-btn--added' : ''}"
                onclick="addToRoute('${sugg.id}')" ${inRoute ? 'disabled' : ''}
                title="${inRoute ? 'Added to route' : 'Add to route'}">
          <span class="material-symbols-rounded">${inRoute ? 'check' : 'add'}</span>
        </button>
      </div>
    </div>
  `;
}

function updateSuggestionCardUI(suggId) {
  const inRoute = !!routeStops.find(s => s.id === suggId);
  const isSaved = !!savedPlaces[suggId];

  // Update ALL card instances across every chat turn
  document.querySelectorAll(`.suggestion-card[data-id="${suggId}"]`).forEach(card => {
    const routeBtn = card.querySelector('.sugg-route-btn');
    const saveBtn  = card.querySelector('.sugg-save-btn');
    if (routeBtn) {
      routeBtn.innerHTML = `<span class="material-symbols-rounded">${inRoute ? 'check' : 'add'}</span>`;
      routeBtn.title = inRoute ? 'Added to route' : 'Add to route';
      routeBtn.classList.toggle('sugg-route-btn--added', inRoute);
      routeBtn.disabled = inRoute;
    }
    if (saveBtn) {
      saveBtn.innerHTML = `<span class="material-symbols-rounded">${isSaved ? 'bookmark' : 'bookmark_border'}</span>`;
      saveBtn.title = isSaved ? 'Saved' : 'Save place';
      saveBtn.classList.toggle('sugg-save-btn--saved', isSaved);
    }
  });
}

/* ══════════════════════════════════════════════
   SAVE / UNSAVE
══════════════════════════════════════════════ */

function saveSuggestion(suggId) {
  const sugg = allPlaces().find(s => s.id === suggId);
  if (!sugg) return;

  if (savedPlaces[suggId]) {
    // Unsave
    delete savedPlaces[suggId];
    if (bookmarkPins[suggId]) {
      bookmarkPins[suggId].setMap(null);
      delete bookmarkPins[suggId];
    }
  } else {
    // Save
    savedPlaces[suggId] = { ...sugg };
    if (mapReady) {
      const pin = new BookmarkPin(sugg);
      pin.setMap(map);
      bookmarkPins[suggId] = pin;
    }
  }

  updateSuggestionCardUI(suggId);
  renderSavedList();
  updateBookmarkBtn();
}

function unsaveSuggestion(suggId) {
  delete savedPlaces[suggId];
  if (bookmarkPins[suggId]) {
    bookmarkPins[suggId].setMap(null);
    delete bookmarkPins[suggId];
  }
  updateSuggestionCardUI(suggId);
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
        <img class="saved-thumb" src="${getImg(p.name, p.seed, 'thumb')}" alt="">
      </div>
      <div class="saved-info">
        <div class="saved-name">${p.name}</div>
        <div class="saved-meta">
          ${p.price ? `<span>${p.price}</span><span class="saved-sep"> · </span>` : ''}
          <span class="material-symbols-rounded saved-star">star</span>
          <span>${p.rating}</span>
        </div>
      </div>
      <button class="saved-remove-btn" onclick="unsaveSuggestion('${p.id}')">
        <span class="material-symbols-rounded">highlight_off</span>
      </button>
    </li>
  `).join('');
}

/* ══════════════════════════════════════════════
   PLACE CARD (on pin click)
══════════════════════════════════════════════ */

let currentCardPhotos = [];
let currentPhotoIndex = 0;

function showCardPhoto(index) {
  const count = currentCardPhotos.length;
  if (!count) return;
  currentPhotoIndex = ((index % count) + count) % count;

  document.getElementById('placeCardImg').src = currentCardPhotos[currentPhotoIndex];

  const dots = document.querySelectorAll('.place-card-dot');
  dots.forEach((d, i) => {
    d.style.display = i < count ? '' : 'none';
    d.classList.toggle('place-card-dot--active', i === currentPhotoIndex);
  });

  // Hide nav arrows when there's only one photo
  document.querySelector('.place-card-nav--prev').style.display = count > 1 ? '' : 'none';
  document.querySelector('.place-card-nav--next').style.display = count > 1 ? '' : 'none';
}

function prevPhoto(e) { e.stopPropagation(); showCardPhoto(currentPhotoIndex - 1); }
function nextPhoto(e) { e.stopPropagation(); showCardPhoto(currentPhotoIndex + 1); }

function showSuggCard(sugg, fromEl) {
  const card    = document.getElementById('placeCard');
  const mapArea = document.querySelector('.map-area');
  const mapW    = mapArea.offsetWidth;
  const mapH    = mapArea.offsetHeight;
  const cardW   = 320;
  const cardH   = 248;
  const gap     = 12;

  let left, top;

  if (fromEl) {
    const pinRect = fromEl.getBoundingClientRect();
    const mapRect = mapArea.getBoundingClientRect();
    const pinCX   = pinRect.left - mapRect.left + pinRect.width / 2;
    const pinTopY = pinRect.top  - mapRect.top;

    left = pinCX - cardW / 2;
    top  = pinTopY - cardH - gap;
    if (top < 8) top = pinTopY + pinRect.height + gap;
  } else {
    left = mapW - cardW - 16;
    top  = 72;
  }

  left = Math.max(8, Math.min(left, mapW - cardW - 8));
  top  = Math.max(8, Math.min(top,  mapH - cardH - 8));

  card.style.left = left + 'px';
  card.style.top  = top  + 'px';

  // Build photo array: use all fetched photos, fall back to single picsum image
  const entry = placeImages.get(sugg.name);
  currentCardPhotos = entry?.photos?.map(p => p.small) ?? [getImg(sugg.name, sugg.seed)];
  currentPhotoIndex = 0;
  showCardPhoto(0);

  document.getElementById('placeCardName').textContent   = sugg.name;
  document.getElementById('placeCardRating').textContent = sugg.rating;

  // Highlight suggestion pin
  Object.values(suggPinObjs).forEach(p => p.setActive(false));
  if (suggPinObjs[sugg.id]) suggPinObjs[sugg.id].setActive(true);

  currentCardData = { ...sugg };
  updateBookmarkBtn();
  updateRouteBtn();
  card.classList.add('is-visible');

  // If photos aren't loaded yet (or only 1 came back), fetch now and refresh carousel
  const existingEntry = placeImages.get(sugg.name);
  if (!existingEntry || existingEntry.photos.length < 2) {
    placeImages.delete(sugg.name); // clear so fetchPlaceImage re-runs
    fetchPlaceImage(sugg.name).then(() => {
      if (currentCardData?.id !== sugg.id) return; // card was closed/changed
      const fresh = placeImages.get(sugg.name);
      if (fresh?.photos?.length > currentCardPhotos.length) {
        currentCardPhotos = fresh.photos.map(p => p.small);
        showCardPhoto(0);
        // Update thumbnail in any open chat cards too
        refreshCardImages();
      }
    });
  }
}

function closePlaceCard() {
  document.getElementById('placeCard').classList.remove('is-visible');
  Object.values(suggPinObjs).forEach(p => p.setActive(false));
  currentCardPhotos = [];
}

function updateBookmarkBtn() {
  const icon = document.getElementById('placeCardBookmarkIcon');
  if (!icon || !currentCardData) return;
  const saved = !!savedPlaces[currentCardData.id];
  icon.textContent = saved ? 'bookmark' : 'bookmark_border';
  icon.style.color = saved ? '#1a73e8' : '';
}

function updateRouteBtn() {
  const btn  = document.getElementById('placeCardRouteBtn');
  const icon = document.getElementById('placeCardRouteIcon');
  if (!btn || !icon || !currentCardData) return;
  const inRoute = !!routeStops.find(s => s.id === currentCardData.id);
  icon.textContent = inRoute ? 'check' : 'add_location';
  btn.className = `place-card-action-btn ${inRoute ? 'place-card-action-btn--green' : 'place-card-action-btn--blue'}`;
}

function toggleSave() {
  if (!currentCardData) return;
  saveSuggestion(currentCardData.id);
}

function addToRouteFromCard() {
  if (!currentCardData) return;
  addToRoute(currentCardData.id);
  updateRouteBtn();
}

/* ══════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════ */

async function submitFooter() {
  const input = document.getElementById('footerInput');
  const text  = input?.value.trim();
  if (!text && !activeCircle) return;
  if (input) input.value = '';

  if (activeCircle) {
    doAreaSearch(text || 'Find things in this area');
    return;
  }

  const thinking = startThinkingTurn(text);
  conversationHistory.push({ role: 'user', text });

  let places;
  try {
    places = await callClaude(conversationHistory);
  } catch (err) {
    console.error('Claude error:', err);
    thinking.error('Couldn\'t reach Claude — try again.');
    conversationHistory.pop();
    return;
  }

  // Merge new places in; preserve existing so route/save still works
  aiPlaces = [...aiPlaces, ...places];
  conversationHistory.push({ role: 'assistant', text: JSON.stringify(places) });

  // Add new suggestion pins
  if (mapReady) {
    activeFilter = 'all';
    places.forEach((sugg, i) => {
      if (suggPinObjs[sugg.id] || routeStops.find(s => s.id === sugg.id)) return;
      setTimeout(() => {
        const pin = new SuggestionPin(sugg);
        pin.setMap(map);
        suggPinObjs[sugg.id] = pin;
        setTimeout(() => pin.fadeIn(), 20);
      }, 45 * i);
    });
    filterSuggestionPins();
  }

  places.forEach(p => fetchPlaceImage(p.name));

  thinking.resolve({
    aiText:    `Here are ${places.length} places for you`,
    cards:     places,
    moreLabel: 'more places',
  });

  setTimeout(refreshCardImages, 2500);
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
  document.querySelectorAll('.vehicle-radio').forEach(r =>
    r.classList.remove('vehicle-radio--selected')
  );
  optionEl.querySelector('.vehicle-radio').classList.add('vehicle-radio--selected');
  document.getElementById('vehicleDropdown').classList.remove('is-open');
  document.getElementById('vehicleChipChevron').textContent = 'expand_more';
}

document.addEventListener('click', () => {
  const dropdown = document.getElementById('vehicleDropdown');
  if (dropdown?.classList.contains('is-open')) {
    dropdown.classList.remove('is-open');
    document.getElementById('vehicleChipChevron').textContent = 'expand_more';
  }
});

/* ══════════════════════════════════════════════
   AREA RESULTS DATA
══════════════════════════════════════════════ */

const AREA_RESULTS = [
  { id: 'ar1', name: 'Frostfjord Mountain View', category: 'scenic',     lat: 64.168, lng: -21.832, seed: 901, rating: 4.7 },
  { id: 'ar2', name: 'Glacier Peak Bistro',      category: 'restaurant', lat: 64.112, lng: -21.703, seed: 902, rating: 4.5, price: '$$' },
  { id: 'ar3', name: 'Aurora Mountain Lodge',    category: 'hotel',      lat: 64.182, lng: -22.014, seed: 903, rating: 4.6, price: '$220' },
  { id: 'ar4', name: 'Hellisheiði Overlook',     category: 'scenic',     lat: 64.025, lng: -21.385, seed: 904, rating: 4.8 },
  { id: 'ar5', name: 'Mosfellsbær Kitchen',      category: 'restaurant', lat: 64.167, lng: -21.697, seed: 905, rating: 4.4, price: '$$' },
  { id: 'ar6', name: 'Reykjanes Guesthouse',     category: 'hotel',      lat: 63.994, lng: -22.556, seed: 906, rating: 4.3, price: '$145' },
];

let areaResultPins = {};

/* ══════════════════════════════════════════════
   CIRCLE DRAW STATE
══════════════════════════════════════════════ */

let drawMode    = false;
let drawActive  = false;   // actively dragging during draw
let drawOrigin  = null;    // { x, y } mapArea-relative px
let drawRadius  = 0;
let activeCircle = null;   // { cx, cy, r, radiusKm } — finalized

// Handle-drag state (after finalize)
let dragTarget        = null;  // 'center' | 'edge'
let dragStart         = null;  // snapshot at drag start
let centerDotListener = null;
let edgeDotListener   = null;

/* ── Toggle draw mode on/off ── */
function toggleDrawMode() {
  drawMode = !drawMode;
  document.body.classList.toggle('draw-mode', drawMode);
  document.getElementById('drawCircleBtn').classList.toggle('toolbar-tool-btn--active', drawMode);

  const overlay = document.getElementById('circleOverlay');
  if (drawMode) {
    if (activeCircle) removeCircle();
    overlay.addEventListener('mousedown', circleMouseDown);
    overlay.addEventListener('mousemove', circleMouseMove);
    overlay.addEventListener('mouseup',   circleMouseUp);
    document.addEventListener('keydown',  circleKeyDown);
    document.getElementById('footerInput').placeholder = 'Draw a circle on the map, then ask…';
  } else {
    overlay.removeEventListener('mousedown', circleMouseDown);
    overlay.removeEventListener('mousemove', circleMouseMove);
    overlay.removeEventListener('mouseup',   circleMouseUp);
    document.removeEventListener('keydown',  circleKeyDown);
    if (!activeCircle) {
      document.getElementById('footerInput').placeholder = 'Ask about your trip...';
    }
  }
}

function circleKeyDown(e) {
  if (e.key === 'Escape') {
    if (drawActive) { drawActive = false; hideSvgCircle(); }
    else            { removeCircle(); }
  }
}

/* ── Draw mouse handlers ── */
function circleMouseDown(e) {
  e.stopPropagation();
  const rect = document.getElementById('mapArea').getBoundingClientRect();
  drawOrigin = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  drawActive = true;
  drawRadius = 0;
  updateSvgCircle(drawOrigin.x, drawOrigin.y, 0);
}

function circleMouseMove(e) {
  if (!drawActive || !drawOrigin) return;
  const rect = document.getElementById('mapArea').getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  drawRadius = Math.hypot(mx - drawOrigin.x, my - drawOrigin.y);
  updateSvgCircle(drawOrigin.x, drawOrigin.y, drawRadius);
}

function circleMouseUp(e) {
  if (!drawActive || !drawOrigin) return;
  e.stopPropagation();
  drawActive = false;
  if (drawRadius < 20) { hideSvgCircle(); return; }
  finalizeCircle(drawOrigin.x, drawOrigin.y, drawRadius);
}

/* ── SVG circle rendering (circle + radius line + dots + arc label) ── */
function updateSvgCircle(cx, cy, r) {
  // Main circle
  const circ = document.getElementById('svgCircle');
  circ.setAttribute('cx', cx);
  circ.setAttribute('cy', cy);
  circ.setAttribute('r',  r);
  circ.style.display = 'block';

  // Radius line: center → right edge
  const line = document.getElementById('svgRadiusLine');
  line.setAttribute('x1', cx);
  line.setAttribute('y1', cy);
  line.setAttribute('x2', cx + r);
  line.setAttribute('y2', cy);
  line.style.display = 'block';

  // Center handle dot
  const cDot = document.getElementById('svgCenterDot');
  cDot.setAttribute('cx', cx);
  cDot.setAttribute('cy', cy);
  cDot.style.display = 'block';

  // Edge handle dot at right side of circle
  const eDot = document.getElementById('svgEdgeDot');
  eDot.setAttribute('cx', cx + r);
  eDot.setAttribute('cy', cy);
  eDot.style.display = 'block';

  // Curved arc label along the top of the circle
  const arcLabel = document.getElementById('svgArcLabel');
  if (r >= 20) {
    // Top arc: sweep=0 (CCW in SVG y-down coords) goes left → up → right through the top
    const arcPath = document.getElementById('svgArcPath');
    arcPath.setAttribute('d', `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`);

    const radiusKm  = pixelsToKm(cx, cy, r);
    const driveMins = Math.round(radiusKm / 50 * 60);
    const distStr   = radiusKm >= 1 ? `${radiusKm.toFixed(1)} km` : `${Math.round(radiusKm * 1000)} m`;
    document.getElementById('svgArcText').textContent = `${distStr}  ·  ${driveMins} min`;
    arcLabel.style.display = 'block';
  } else {
    arcLabel.style.display = 'none';
  }
}

function hideSvgCircle() {
  ['svgCircle', 'svgRadiusLine', 'svgCenterDot', 'svgEdgeDot'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('svgArcLabel').style.display = 'none';
}

/* ── Convert pixel radius to km using map projection ── */
function pixelsToKm(cx, cy, r) {
  if (!map || !mapReady) return r * 0.3;
  try {
    const proj   = map.getProjection();
    const bounds = map.getBounds();
    if (!proj || !bounds) return r * 0.3;
    const mapDiv = document.getElementById('map');
    const w = mapDiv.offsetWidth, h = mapDiv.offsetHeight;
    const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
    const nePt = proj.fromLatLngToPoint(ne), swPt = proj.fromLatLngToPoint(sw);
    function toLatLng(px, py) {
      const wx = swPt.x + (px / w) * (nePt.x - swPt.x);
      const wy = nePt.y + (py / h) * (swPt.y - nePt.y);
      return proj.fromPointToLatLng(new google.maps.Point(wx, wy));
    }
    const center = toLatLng(cx, cy);
    const edge   = toLatLng(cx + r, cy);
    return haversineKm(
      { lat: center.lat(), lng: center.lng() },
      { lat: edge.lat(),   lng: edge.lng() }
    );
  } catch { return r * 0.3; }
}

/* ── Reposition the remove button above the circle ── */
function updateRemoveBtn() {
  if (!activeCircle) return;
  const { cx, cy, r } = activeCircle;
  const btn = document.getElementById('circleRemoveBtn');
  btn.style.left = cx + 'px';
  btn.style.top  = (cy - r - 20) + 'px';
}

/* ── Handle-dot drag (after finalize) ── */
function handleDotMouseDown(e, target) {
  e.stopPropagation();
  e.preventDefault();
  if (!activeCircle) return;
  dragTarget = target;
  dragStart  = { x: e.clientX, y: e.clientY, ...activeCircle };
  document.addEventListener('mousemove', handleDotMouseMove);
  document.addEventListener('mouseup',   handleDotMouseUp);
}

function handleDotMouseMove(e) {
  if (!dragTarget || !dragStart || !activeCircle) return;
  if (dragTarget === 'center') {
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    activeCircle = { ...activeCircle, cx: dragStart.cx + dx, cy: dragStart.cy + dy };
  } else {
    const rect = document.getElementById('mapArea').getBoundingClientRect();
    const mx   = e.clientX - rect.left;
    const my   = e.clientY - rect.top;
    const newR = Math.max(20, Math.hypot(mx - activeCircle.cx, my - activeCircle.cy));
    activeCircle = { ...activeCircle, r: newR };
  }
  updateSvgCircle(activeCircle.cx, activeCircle.cy, activeCircle.r);
  updateRemoveBtn();
}

function handleDotMouseUp() {
  if (activeCircle) {
    activeCircle.radiusKm = pixelsToKm(activeCircle.cx, activeCircle.cy, activeCircle.r);
  }
  dragTarget = null;
  dragStart  = null;
  document.removeEventListener('mousemove', handleDotMouseMove);
  document.removeEventListener('mouseup',   handleDotMouseUp);
}

/* ── Finalize circle: wire drag handles + show chip ── */
function finalizeCircle(cx, cy, r) {
  const radiusKm = pixelsToKm(cx, cy, r);
  activeCircle = { cx, cy, r, radiusKm };

  // Wire handle-dot drag listeners
  const cDot = document.getElementById('svgCenterDot');
  const eDot = document.getElementById('svgEdgeDot');
  centerDotListener = e => handleDotMouseDown(e, 'center');
  edgeDotListener   = e => handleDotMouseDown(e, 'edge');
  cDot.addEventListener('mousedown', centerDotListener);
  eDot.addEventListener('mousedown', edgeDotListener);

  // Position remove button
  updateRemoveBtn();
  document.getElementById('circleRemoveBtn').classList.add('is-visible');

  // Show area chip in footer
  document.getElementById('areaChipRow').classList.add('is-visible');
  document.getElementById('footerInput').placeholder = 'Find things in this area…';

  // Lock map
  if (map) map.setOptions({ draggable: false, scrollwheel: false, disableDoubleClickZoom: true, gestureHandling: 'none' });

  // Exit draw mode
  drawMode = false;
  document.body.classList.remove('draw-mode');
  document.getElementById('drawCircleBtn').classList.remove('toolbar-tool-btn--active');
  const overlay = document.getElementById('circleOverlay');
  overlay.removeEventListener('mousedown', circleMouseDown);
  overlay.removeEventListener('mousemove', circleMouseMove);
  overlay.removeEventListener('mouseup',   circleMouseUp);
  document.removeEventListener('keydown',  circleKeyDown);
}

/* ── Remove the drawn circle and reset all state ── */
function removeCircle() {
  // Clean up drag listeners
  if (centerDotListener) {
    document.getElementById('svgCenterDot').removeEventListener('mousedown', centerDotListener);
    centerDotListener = null;
  }
  if (edgeDotListener) {
    document.getElementById('svgEdgeDot').removeEventListener('mousedown', edgeDotListener);
    edgeDotListener = null;
  }
  document.removeEventListener('mousemove', handleDotMouseMove);
  document.removeEventListener('mouseup',   handleDotMouseUp);
  dragTarget = null; dragStart = null;

  activeCircle = null;
  hideSvgCircle();
  document.getElementById('circleRemoveBtn').classList.remove('is-visible');
  document.getElementById('areaChipRow').classList.remove('is-visible');
  document.getElementById('footerInput').placeholder = 'Ask about your trip...';

  // Unlock the map
  if (map) map.setOptions({ draggable: true, scrollwheel: true, disableDoubleClickZoom: false, gestureHandling: 'auto' });

  // Remove any area result pins
  Object.values(areaResultPins).forEach(p => p.setMap(null));
  areaResultPins = {};

  // Chat history stays — area result cards remain visible in the thread
  if (drawMode) toggleDrawMode();
}

/* ══════════════════════════════════════════════
   AI AREA SEARCH
══════════════════════════════════════════════ */

async function doAreaSearch(userPrompt) {
  const thinking = startThinkingTurn(userPrompt);

  // Convert circle centre pixels → lat/lng for Gemini context
  let locationCtx = '';
  if (activeCircle && mapReady) {
    try {
      const proj   = map.getProjection();
      const bounds = map.getBounds();
      if (proj && bounds) {
        const mapDiv = document.getElementById('map');
        const w = mapDiv.offsetWidth, h = mapDiv.offsetHeight;
        const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
        const nePt = proj.fromLatLngToPoint(ne), swPt = proj.fromLatLngToPoint(sw);
        const wx = swPt.x + (activeCircle.cx / w) * (nePt.x - swPt.x);
        const wy = nePt.y + (activeCircle.cy / h) * (swPt.y - nePt.y);
        const centre = proj.fromPointToLatLng(new google.maps.Point(wx, wy));
        locationCtx = ` The user has drawn a search circle centred at ${centre.lat().toFixed(4)}°N, ${centre.lng().toFixed(4)}°E with a radius of ${activeCircle.radiusKm.toFixed(1)} km. Return places within that circle.`;
      }
    } catch (_) {}
  }

  const fullPrompt = userPrompt + locationCtx;
  conversationHistory.push({ role: 'user', text: fullPrompt });

  let places;
  try {
    places = await callClaude(conversationHistory);
  } catch (err) {
    console.error('Claude error:', err);
    thinking.error('Couldn\'t reach Claude — try again.');
    conversationHistory.pop();
    return;
  }

  aiPlaces = [...aiPlaces, ...places];
  conversationHistory.push({ role: 'assistant', text: JSON.stringify(places) });

  const radiusStr = activeCircle ? `${activeCircle.radiusKm.toFixed(1)} km` : 'the area';
  thinking.resolve({
    aiText:    `${places.length} suggestions within ${radiusStr}`,
    cards:     places,
    moreLabel: 'more places',
  });

  places.forEach(p => fetchPlaceImage(p.name));

  setTimeout(() => {
    if (mapReady) {
      places.forEach(s => {
        if (areaResultPins[s.id]) return;
        const pin = new SuggestionPin(s);
        pin.setMap(map);
        areaResultPins[s.id] = pin;
        suggPinObjs[s.id]    = pin;
        setTimeout(() => pin.fadeIn?.(), 100);
      });
    }
    setTimeout(refreshCardImages, 2500);
  }, 100);
}
