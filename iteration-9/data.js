'use strict';

/* ═══════════════════════════════════════════════
   IMAGE REPOSITORY
   Seed pools for picsum.photos — always loads, no auth needed.
   URL format: https://picsum.photos/seed/{seed}/400/280
   Each category uses its own number range so images look distinct.
   Seeds are stable (same seed = same image) but generationSeed
   rotates them each new user query.
═══════════════════════════════════════════════ */
const IMAGE_DB = {

  /* Seeds 1–60: interiors, architecture, warm lighting → reads as hotel-like */
  hotels: [
     2,  3,  5,  6, 10, 12, 15, 17, 20, 22,
    25, 27, 30, 33, 36, 39, 41, 44, 47, 50,
    52, 55, 57, 60, 63, 66, 68, 70, 72, 74,
  ],

  /* Seeds 75–140: food, warm tones, close-ups → reads as restaurant-like */
  restaurants: [
    76, 78, 80, 82, 84, 86, 88, 90, 92, 94,
    96, 98,100,102,104,106,108,110,112,114,
   116,118,120,122,124,126,128,130,132,134,
  ],

  /* Seeds 141–240: landscapes, nature, cityscapes → reads as scenic */
  scenic: [
   142,144,146,148,150,152,154,156,158,160,
   162,164,166,168,170,172,174,176,178,180,
   182,184,186,188,190,192,194,196,198,200,
  ],

  /* Seattle scenic: cooler, greener, forested palette */
  scenic_seattle: [
   201,203,205,207,209,211,213,215,217,219,
   221,223,225,227,229,231,233,235,237,239,
  ],

  /* Chicago scenic: urban, architectural, lakefront palette */
  scenic_chicago: [
   241,243,245,247,249,251,253,255,257,259,
   261,263,265,267,269,271,273,275,277,279,
  ],

};

/* ── Place Repository ── */
const PLACE_DB = {

  /* ── Seattle ── */
  seattle: {
    hotels: [
      { id: 'sh1',  name: 'Four Seasons Seattle',      rating: 4.9, reviews: 1204, price: '$$$$', lat: 47.6070, lng: -122.3387, keywords: 'hotel,luxury,lobby,chandelier,seattle' },
      { id: 'sh2',  name: 'The Edgewater Hotel',       rating: 4.7, reviews: 892,  price: '$$$',  lat: 47.6084, lng: -122.3446, keywords: 'hotel,waterfront,view,seattle,bay' },
      { id: 'sh3',  name: 'Hotel Andra',               rating: 4.6, reviews: 734,  price: '$$$',  lat: 47.6132, lng: -122.3401, keywords: 'boutique,hotel,modern,room,seattle' },
      { id: 'sh4',  name: 'Kimpton Palladian Hotel',   rating: 4.5, reviews: 623,  price: '$$$',  lat: 47.6126, lng: -122.3382, keywords: 'hotel,elegant,interior,downtown,seattle' },
      { id: 'sh5',  name: 'The Westin Seattle',        rating: 4.4, reviews: 1567, price: '$$',   lat: 47.6110, lng: -122.3358, keywords: 'hotel,highrise,city,room,tower' },
      { id: 'sh6',  name: 'Inn at the Market',         rating: 4.8, reviews: 445,  price: '$$$',  lat: 47.6087, lng: -122.3418, keywords: 'inn,market,cozy,hotel,pike,place' },
      { id: 'sh7',  name: 'Motif Seattle',             rating: 4.3, reviews: 891,  price: '$$',   lat: 47.6104, lng: -122.3367, keywords: 'hotel,design,modern,seattle,urban' },
      { id: 'sh8',  name: 'Silver Cloud Hotel',        rating: 4.2, reviews: 512,  price: '$$',   lat: 47.6170, lng: -122.3501, keywords: 'hotel,lake,union,cozy,room' },
      { id: 'sh9',  name: 'Thompson Seattle',          rating: 4.7, reviews: 678,  price: '$$$',  lat: 47.6064, lng: -122.3365, keywords: 'hotel,rooftop,view,luxury,seattle' },
      { id: 'sh10', name: 'CitizenM Seattle',          rating: 4.5, reviews: 934,  price: '$$',   lat: 47.6082, lng: -122.3349, keywords: 'hotel,smart,modern,tech,minimalist' },
    ],
    restaurants: [
      { id: 'sr1',  name: 'Canlis',                         rating: 4.9, reviews: 2341,  price: '$$$$', lat: 47.6456, lng: -122.3501, keywords: 'fine,dining,restaurant,elegant,food' },
      { id: 'sr2',  name: 'Pike Place Chowder',             rating: 4.8, reviews: 3204,  price: '$',    lat: 47.6088, lng: -122.3418, keywords: 'seafood,chowder,bowl,market,soup' },
      { id: 'sr3',  name: 'The Walrus and the Carpenter',  rating: 4.7, reviews: 1892,  price: '$$$',  lat: 47.6554, lng: -122.3713, keywords: 'oyster,bar,seafood,restaurant,raw' },
      { id: 'sr4',  name: "Shiro's Sushi",                 rating: 4.8, reviews: 1123,  price: '$$$',  lat: 47.6138, lng: -122.3482, keywords: 'sushi,japanese,omakase,restaurant' },
      { id: 'sr5',  name: "Ivar's Acres of Clams",         rating: 4.5, reviews: 2134,  price: '$$',   lat: 47.6025, lng: -122.3394, keywords: 'seafood,waterfront,restaurant,clam,fish' },
      { id: 'sr6',  name: 'Salumi Artisan Cured Meats',    rating: 4.8, reviews: 891,   price: '$$',   lat: 47.6019, lng: -122.3293, keywords: 'deli,italian,charcuterie,artisan,food' },
      { id: 'sr7',  name: 'Momiji',                         rating: 4.6, reviews: 734,   price: '$$',   lat: 47.6255, lng: -122.3196, keywords: 'japanese,sushi,bar,restaurant,sake' },
      { id: 'sr8',  name: 'Toulouse Petit Kitchen',         rating: 4.5, reviews: 1045,  price: '$$',   lat: 47.6354, lng: -122.3647, keywords: 'cajun,brunch,restaurant,southern,food' },
      { id: 'sr9',  name: 'Serious Pie',                   rating: 4.7, reviews: 2567,  price: '$$',   lat: 47.6126, lng: -122.3398, keywords: 'pizza,artisan,wood,fired,restaurant' },
      { id: 'sr10', name: 'Delancey',                      rating: 4.8, reviews: 1234,  price: '$$',   lat: 47.6623, lng: -122.3787, keywords: 'pizza,wood,fired,seasonal,restaurant' },
    ],
    scenic: [
      { id: 'ss1',  name: 'Kerry Park',                 rating: 4.9, reviews: 5621,  lat: 47.6295, lng: -122.3602, keywords: 'viewpoint,skyline,city,panorama,seattle' },
      { id: 'ss2',  name: 'Discovery Park',             rating: 4.8, reviews: 4312,  lat: 47.6576, lng: -122.4034, keywords: 'nature,park,forest,lighthouse,trail' },
      { id: 'ss3',  name: 'Chihuly Garden and Glass',  rating: 4.7, reviews: 3891,  lat: 47.6205, lng: -122.3509, keywords: 'glass,art,colorful,museum,sculpture' },
      { id: 'ss4',  name: 'Alki Beach',                 rating: 4.7, reviews: 3102,  lat: 47.5774, lng: -122.4188, keywords: 'beach,waterfront,sunset,ocean,coast' },
      { id: 'ss5',  name: 'Gas Works Park',             rating: 4.6, reviews: 2894,  lat: 47.6456, lng: -122.3344, keywords: 'park,lake,urban,industrial,seattle' },
      { id: 'ss6',  name: 'Snoqualmie Falls',           rating: 4.9, reviews: 7234,  lat: 47.5422, lng: -121.8370, keywords: 'waterfall,nature,mist,forest,washington' },
      { id: 'ss7',  name: 'Pike Place Market',          rating: 4.9, reviews: 9123,  lat: 47.6085, lng: -122.3396, keywords: 'market,fish,pike,seattle,vendors' },
      { id: 'ss8',  name: 'Mount Rainier Vista',        rating: 4.9, reviews: 6234,  lat: 47.4697, lng: -121.7269, keywords: 'mountain,snow,volcano,nature,rainier' },
      { id: 'ss9',  name: 'Lake Union Seaplane Tour',  rating: 4.8, reviews: 892,   lat: 47.6253, lng: -122.3361, keywords: 'seaplane,lake,aerial,scenic,float' },
      { id: 'ss10', name: 'Olympic Sculpture Park',    rating: 4.6, reviews: 2341,  lat: 47.6166, lng: -122.3560, keywords: 'sculpture,park,waterfront,outdoor,art' },
    ],
  },

  /* ── Chicago ── */
  chicago: {
    hotels: [
      { id: 'ch1',  name: 'The Peninsula Chicago',   rating: 4.9, reviews: 1456, price: '$$$$', lat: 41.8964, lng: -87.6268, keywords: 'luxury,hotel,chicago,grand,elegant' },
      { id: 'ch2',  name: 'The Langham Chicago',     rating: 4.8, reviews: 1123, price: '$$$$', lat: 41.8862, lng: -87.6273, keywords: 'luxury,hotel,river,view,suite' },
      { id: 'ch3',  name: 'Kimpton Gray Hotel',      rating: 4.7, reviews: 891,  price: '$$$',  lat: 41.8820, lng: -87.6282, keywords: 'boutique,hotel,chicago,downtown,stylish' },
      { id: 'ch4',  name: 'Hotel Lincoln',           rating: 4.5, reviews: 734,  price: '$$',   lat: 41.9225, lng: -87.6365, keywords: 'hotel,lincoln,park,chicago,cozy' },
      { id: 'ch5',  name: 'Loews Chicago Hotel',     rating: 4.4, reviews: 1234, price: '$$$',  lat: 41.8852, lng: -87.6224, keywords: 'hotel,lakeview,chicago,modern,room' },
      { id: 'ch6',  name: 'The Godfrey Hotel',       rating: 4.6, reviews: 892,  price: '$$$',  lat: 41.8975, lng: -87.6302, keywords: 'hotel,rooftop,chicago,pool,modern' },
      { id: 'ch7',  name: 'Virgin Hotels Chicago',   rating: 4.5, reviews: 623,  price: '$$',   lat: 41.8849, lng: -87.6321, keywords: 'hotel,hip,modern,chicago,vibrant' },
      { id: 'ch8',  name: 'Freehand Chicago',        rating: 4.3, reviews: 512,  price: '$',    lat: 41.9008, lng: -87.6328, keywords: 'hotel,social,chicago,bar,hostel' },
      { id: 'ch9',  name: 'Ace Hotel Chicago',       rating: 4.6, reviews: 734,  price: '$$$',  lat: 41.8843, lng: -87.6540, keywords: 'boutique,hotel,chicago,design,art' },
      { id: 'ch10', name: 'Hotel Julian',            rating: 4.7, reviews: 567,  price: '$$$',  lat: 41.8838, lng: -87.6306, keywords: 'hotel,elegant,chicago,classic,lobby' },
    ],
    restaurants: [
      { id: 'cr1',  name: 'Alinea',                      rating: 5.0, reviews: 3421,  price: '$$$$', lat: 41.9138, lng: -87.6479, keywords: 'molecular,gastronomy,chef,tasting,menu' },
      { id: 'cr2',  name: 'Girl & the Goat',             rating: 4.8, reviews: 4512,  price: '$$$',  lat: 41.8836, lng: -87.6511, keywords: 'american,restaurant,trendy,shared,plates' },
      { id: 'cr3',  name: "Lou Malnati's Pizzeria",      rating: 4.7, reviews: 8921,  price: '$',    lat: 41.8912, lng: -87.6340, keywords: 'pizza,deep,dish,chicago,cheese' },
      { id: 'cr4',  name: 'The Purple Pig',              rating: 4.6, reviews: 3234,  price: '$$',   lat: 41.8963, lng: -87.6257, keywords: 'mediterranean,wine,food,charcuterie' },
      { id: 'cr5',  name: 'Chicago Cut Steakhouse',      rating: 4.7, reviews: 2123,  price: '$$$$', lat: 41.8866, lng: -87.6280, keywords: 'steakhouse,steak,dining,chicago,beef' },
      { id: 'cr6',  name: 'Avec',                        rating: 4.7, reviews: 1891,  price: '$$$',  lat: 41.8837, lng: -87.6508, keywords: 'mediterranean,wine,restaurant,cozy' },
      { id: "cr7",  name: "Portillo's",                  rating: 4.6, reviews: 5623,  price: '$',    lat: 41.8840, lng: -87.6453, keywords: 'hot,dog,chicago,beef,classic' },
      { id: 'cr8',  name: 'Spiaggia',                    rating: 4.7, reviews: 1234,  price: '$$$$', lat: 41.9006, lng: -87.6247, keywords: 'italian,fine,dining,chicago,lakefront' },
      { id: 'cr9',  name: "Mindy's Bakery",              rating: 4.8, reviews: 2341,  price: '$$',   lat: 41.8858, lng: -87.6523, keywords: 'bakery,pastry,dessert,sweets,cafe' },
      { id: 'cr10', name: 'Three Dots and a Dash',       rating: 4.6, reviews: 3456,  price: '$$',   lat: 41.8951, lng: -87.6307, keywords: 'cocktail,bar,tropical,tiki,drinks' },
    ],
    scenic: [
      { id: 'cs1',  name: 'Millennium Park',               rating: 4.9, reviews: 12341, lat: 41.8827, lng: -87.6233, keywords: 'park,bean,sculpture,chicago,reflection' },
      { id: 'cs2',  name: 'Navy Pier',                     rating: 4.7, reviews: 8923,  lat: 41.8919, lng: -87.6051, keywords: 'pier,lake,michigan,ferriswheel,chicago' },
      { id: 'cs3',  name: 'Chicago Riverwalk',             rating: 4.8, reviews: 7234,  lat: 41.8880, lng: -87.6269, keywords: 'riverwalk,chicago,river,skyline,downtown' },
      { id: 'cs4',  name: 'Lincoln Park Zoo',              rating: 4.8, reviews: 6123,  lat: 41.9217, lng: -87.6368, keywords: 'zoo,animals,park,lincoln,nature' },
      { id: 'cs5',  name: 'Art Institute of Chicago',      rating: 4.9, reviews: 9456,  lat: 41.8796, lng: -87.6237, keywords: 'museum,art,institute,culture,paintings' },
      { id: 'cs6',  name: 'Architecture River Cruise',     rating: 4.9, reviews: 5234,  lat: 41.8876, lng: -87.6272, keywords: 'architecture,boat,river,cruise,buildings' },
      { id: 'cs7',  name: 'The 606 Trail',                rating: 4.7, reviews: 3456,  lat: 41.9099, lng: -87.6707, keywords: 'trail,park,cycling,walking,urban' },
      { id: 'cs8',  name: 'Wrigley Field',                rating: 4.8, reviews: 8934,  lat: 41.9484, lng: -87.6553, keywords: 'baseball,stadium,cubs,wrigley,sport' },
      { id: 'cs9',  name: 'Skydeck Chicago',              rating: 4.8, reviews: 10234, lat: 41.8789, lng: -87.6359, keywords: 'skydeck,view,skyscraper,city,height' },
      { id: 'cs10', name: 'Garfield Park Conservatory',   rating: 4.8, reviews: 2341,  lat: 41.8843, lng: -87.7170, keywords: 'conservatory,plants,garden,greenhouse,nature' },
    ],
  },

};

/* ── Generic pool (lat/lng = 0 → scattered near route by app.js) ── */
PLACE_DB.generic = {
  hotels: [
    { id: 'gh1', name: 'Grand Luxury Hotel',      rating: 4.8, reviews: 2341, price: '$$$$', lat: 0, lng: 0, keywords: 'luxury,hotel,grand,lobby,chandelier' },
    { id: 'gh2', name: 'Boutique City Inn',        rating: 4.7, reviews: 891,  price: '$$$',  lat: 0, lng: 0, keywords: 'boutique,hotel,charming,inn,cozy' },
    { id: 'gh3', name: 'The Waterfront Hotel',     rating: 4.6, reviews: 1234, price: '$$$',  lat: 0, lng: 0, keywords: 'hotel,waterfront,view,harbor,room' },
    { id: 'gh4', name: 'Countryside Retreat',      rating: 4.7, reviews: 567,  price: '$$$',  lat: 0, lng: 0, keywords: 'hotel,countryside,nature,cozy,retreat' },
    { id: 'gh5', name: 'Hilltop Lodge',            rating: 4.5, reviews: 423,  price: '$$',   lat: 0, lng: 0, keywords: 'lodge,mountain,hilltop,view,nature' },
    { id: 'gh6', name: 'Urban Stay Hotel',         rating: 4.4, reviews: 1678, price: '$$',   lat: 0, lng: 0, keywords: 'hotel,urban,city,modern,downtown' },
    { id: 'gh7', name: 'The Historic Inn',         rating: 4.8, reviews: 345,  price: '$$$',  lat: 0, lng: 0, keywords: 'historic,inn,classic,architecture,vintage' },
    { id: 'gh8', name: 'Harbor View Hotel',        rating: 4.6, reviews: 789,  price: '$$$',  lat: 0, lng: 0, keywords: 'harbor,view,hotel,marina,ocean' },
  ],
  restaurants: [
    { id: 'gr1', name: 'The Local Bistro',         rating: 4.7, reviews: 1234, price: '$$',  lat: 0, lng: 0, keywords: 'bistro,local,food,cozy,restaurant' },
    { id: 'gr2', name: 'Farm to Table Kitchen',    rating: 4.8, reviews: 892,  price: '$$$', lat: 0, lng: 0, keywords: 'farm,organic,restaurant,fresh,food' },
    { id: 'gr3', name: 'Seaside Grille',           rating: 4.6, reviews: 2134, price: '$$',  lat: 0, lng: 0, keywords: 'seafood,grill,restaurant,ocean,fish' },
    { id: 'gr4', name: 'Spice & Fire',             rating: 4.5, reviews: 1567, price: '$$',  lat: 0, lng: 0, keywords: 'spice,ethnic,curry,restaurant,bold' },
    { id: 'gr5', name: 'The Chophouse',            rating: 4.7, reviews: 2341, price: '$$$', lat: 0, lng: 0, keywords: 'steakhouse,steak,restaurant,meat,grill' },
    { id: 'gr6', name: 'Café Lumière',             rating: 4.6, reviews: 891,  price: '$',   lat: 0, lng: 0, keywords: 'cafe,coffee,breakfast,pastry,brunch' },
    { id: 'gr7', name: 'Harbor Fish & Chips',      rating: 4.5, reviews: 1345, price: '$',   lat: 0, lng: 0, keywords: 'fish,chips,seafood,casual,pub' },
    { id: 'gr8', name: 'Terrazzo Rooftop Bar',     rating: 4.8, reviews: 678,  price: '$$$', lat: 0, lng: 0, keywords: 'rooftop,bar,cocktails,view,city' },
  ],
  scenic: [
    { id: 'gsc1', name: 'City Skyline Viewpoint',  rating: 4.7, reviews: 3421, lat: 0, lng: 0, keywords: 'viewpoint,skyline,city,panorama,overlook' },
    { id: 'gsc2', name: 'Botanical Gardens',       rating: 4.8, reviews: 2134, lat: 0, lng: 0, keywords: 'botanical,garden,flowers,nature,greenery' },
    { id: 'gsc3', name: 'Waterfront Promenade',    rating: 4.6, reviews: 4512, lat: 0, lng: 0, keywords: 'waterfront,promenade,walking,ocean,pier' },
    { id: 'gsc4', name: 'Historic Old Town',       rating: 4.5, reviews: 3234, lat: 0, lng: 0, keywords: 'historic,old,town,cobblestone,architecture' },
    { id: 'gsc5', name: 'Natural History Museum',  rating: 4.8, reviews: 5123, lat: 0, lng: 0, keywords: 'museum,nature,history,culture,exhibits' },
    { id: 'gsc6', name: 'City Park & Lake',        rating: 4.7, reviews: 6234, lat: 0, lng: 0, keywords: 'park,lake,nature,relaxing,rowing' },
    { id: 'gsc7', name: 'Coastal Cliffs Walk',     rating: 4.9, reviews: 4567, lat: 0, lng: 0, keywords: 'coastal,cliffs,ocean,walk,scenic' },
    { id: 'gsc8', name: 'Mountain Summit Trail',   rating: 4.8, reviews: 3456, lat: 0, lng: 0, keywords: 'mountain,summit,trail,hiking,view' },
  ],
};
