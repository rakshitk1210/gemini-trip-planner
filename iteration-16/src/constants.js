export const MAPS_API_KEY  = import.meta.env.VITE_MAPS_API_KEY  || 'AIzaSyBf8PLNhxkojFJyyNdctLE57nexC2c1a8A';
export const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY || '';

export const SUGGESTIONS = [
  { id: 'sc1', name: 'Þingvellir',       category: 'scenic',     lat: 64.2558, lng: -21.1296, seed: 101, rating: 4.8, desc: 'UNESCO World Heritage Site where the North American and Eurasian tectonic plates meet.' },
  { id: 'sc2', name: 'Geysir',           category: 'scenic',     lat: 64.3120, lng: -20.3003, seed: 204, rating: 4.7, desc: 'Watch Strokkur erupt every 6–10 minutes, shooting water up to 30 m high.' },
  { id: 'sc3', name: 'Gullfoss',         category: 'scenic',     lat: 64.3269, lng: -20.1209, seed: 318, rating: 4.9, desc: "Iceland's most iconic waterfall, a two-tiered cascade on the Hvítá river." },
  { id: 'sc4', name: 'Seljalandsfoss',   category: 'scenic',     lat: 63.6158, lng: -19.9886, seed: 612, rating: 4.8, desc: 'Walk behind the curtain of this 60 m waterfall — magical at golden hour.' },
  { id: 'sc5', name: 'Skógafoss',        category: 'scenic',     lat: 63.5322, lng: -19.5133, seed: 503, rating: 4.9, desc: 'Climb 527 steps to the top for sweeping views along the south coast.' },
  { id: 'sc6', name: 'Reynisfjara',      category: 'scenic',     lat: 63.4063, lng: -19.0610, seed: 616, rating: 4.7, desc: 'Dramatic black sand beach with basalt columns and powerful surf. Beware sneaker waves.' },
  { id: 'r1',  name: 'Matur og Drykkur', category: 'restaurant', lat: 64.1500, lng: -21.9400, seed: 701, rating: 4.5, price: '$$$', desc: 'Modern Icelandic cuisine rooted in old recipes. Must-try: skyr-cured salmon.' },
  { id: 'r2',  name: 'Skál! Craft Bar',  category: 'restaurant', lat: 64.1467, lng: -21.9380, seed: 711, rating: 4.4, price: '$$',  desc: 'Local craft beers and small plates. Great spot for an evening wind-down.' },
  { id: 'r3',  name: 'Geysir Glima',     category: 'restaurant', lat: 64.3110, lng: -20.2980, seed: 721, rating: 4.3, price: '$$',  desc: 'Hearty Icelandic stews and lamb soup right next to the geyser area.' },
  { id: 'r4',  name: 'Pakkhús',          category: 'restaurant', lat: 63.9336, lng: -20.9973, seed: 731, rating: 4.6, price: '$$$', desc: 'Seafood by the harbour. Known for langoustine bisque and fresh catch platters.' },
  { id: 'h1',  name: 'Hótel Kría',       category: 'hotel', lat: 63.4215, lng: -19.0020, seed: 801, rating: 4.5, price: '$195', desc: "Vík's newest hotel, game room, good on-site dinner. Best Day 1 endpoint." },
  { id: 'h2',  name: 'Hótel Selfoss',    category: 'hotel', lat: 63.9343, lng: -20.9977, seed: 811, rating: 4.4, price: '$178', desc: 'Modern property with the best breakfast on the route. Central location.' },
  { id: 'h3',  name: 'Hótel Skógafoss', category: 'hotel',  lat: 63.5322, lng: -19.5133, seed: 821, rating: 4.3, price: '$229', desc: 'Right at the falls. Some rooms face the waterfall. Excellent restaurant.' },
  { id: 'h4',  name: 'The Barn',         category: 'hotel', lat: 63.4120, lng: -19.0260, seed: 831, rating: 4.5, price: '$68',  desc: 'Just outside Vík. Private rooms, ocean views, great bar. Best budget pick.' },
  { id: 'h5',  name: 'Aurora Igloo South', category: 'hotel', lat: 63.8280, lng: -20.4100, seed: 841, rating: 4.3, price: '$320', desc: 'Clear igloos for aurora viewing — a novelty stay, beautiful any season.' },
];

export const AREA_RESULTS = [
  { id: 'ar1', name: 'Frostfjord Mountain View', category: 'scenic',     lat: 64.168, lng: -21.832, seed: 901, rating: 4.7 },
  { id: 'ar2', name: 'Glacier Peak Bistro',      category: 'restaurant', lat: 64.112, lng: -21.703, seed: 902, rating: 4.5, price: '$$' },
  { id: 'ar3', name: 'Aurora Mountain Lodge',    category: 'hotel',      lat: 64.182, lng: -22.014, seed: 903, rating: 4.6, price: '$220' },
  { id: 'ar4', name: 'Hellisheiði Overlook',     category: 'scenic',     lat: 64.025, lng: -21.385, seed: 904, rating: 4.8 },
  { id: 'ar5', name: 'Mosfellsbær Kitchen',      category: 'restaurant', lat: 64.167, lng: -21.697, seed: 905, rating: 4.4, price: '$$' },
  { id: 'ar6', name: 'Reykjanes Guesthouse',     category: 'hotel',      lat: 63.994, lng: -22.556, seed: 906, rating: 4.3, price: '$145' },
];

export const CAT_ICONS = { scenic: 'landscape', restaurant: 'restaurant', hotel: 'hotel' };

export const SEARCH_OVERRIDES = {
  'Þingvellir':        'Thingvellir National Park Iceland',
  'Geysir':            'Strokkur Geysir Iceland',
  'Gullfoss':          'Gullfoss waterfall Iceland',
  'Seljalandsfoss':    'Seljalandsfoss waterfall Iceland',
  'Skógafoss':         'Skogafoss waterfall Iceland',
  'Reynisfjara':       'Reynisfjara black sand beach Iceland',
  'Matur og Drykkur':  'Matur og Drykkur restaurant Reykjavik',
  'Skál! Craft Bar':   'Skal Craft Bar Reykjavik Iceland',
  'Geysir Glima':      'Geysir Glima restaurant Iceland',
  'Pakkhús':           'Pakkhus restaurant Selfoss Iceland',
  'Hótel Kría':        'Hotel Kria Vik Iceland',
  'Hótel Selfoss':     'Hotel Selfoss Iceland',
  'Hótel Skógafoss':   'Hotel Skogafoss Iceland',
  'The Barn':          'The Barn hotel Vik Iceland',
  'Aurora Igloo South':'Aurora Igloo hotel Iceland',
};

export const CHIP_DEFS = {
  hotel:      { label: 'Hotels', icon: 'hotel',      aiText: 'Here are the hotels along your route',            moreLabel: 'more hotels'      },
  restaurant: { label: 'Food',   icon: 'restaurant', aiText: 'Here are restaurants and cafés along your route', moreLabel: 'more restaurants' },
  scenic:     { label: 'Scenic', icon: 'landscape',  aiText: 'Here are scenic highlights for your route',       moreLabel: 'more scenic spots' },
};

export const MAP_STYLES = [
  { featureType: 'poi',     elementType: 'all',         stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all',         stylers: [{ visibility: 'off' }] },
  { featureType: 'road',    elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

export function getImg(placeImages, name, seed, size = 'small') {
  const dims  = size === 'thumb' ? '68/68' : '320/176';
  const entry = placeImages[name];
  const url   = entry && (entry[size] ?? entry.small);
  return url || `https://picsum.photos/seed/${seed}/${dims}`;
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}
