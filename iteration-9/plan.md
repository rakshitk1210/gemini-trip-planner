# Iteration 9 — Gemini Trip Planner: Plan

## What this iteration is

A complete paradigm shift from iterations 1–8. Instead of starting with a map and drawing an area, the user starts on a **conversational landing screen** (no map) where they describe a trip to Gemini. Gemini generates a route and day-by-day itinerary. The map and a threaded AI chat panel appear after submission. The circle-draw tool from iteration 8 is reused here as a spatial follow-up query — drawing a circle on the map sends a "find spots in this area" message in the chat.

---

## The 9-screen flow (from Figma)

| # | Screen | State |
|---|--------|-------|
| 1 | Landing — prompt input + past trips gallery | `landing` |
| 2 | Map appears, route drawn, Plan AI chat starts | `plan-ai` |
| 3 | Same — route + stop pins visible | `plan-ai` |
| 4 | "Along the route" photo strip in chat | `plan-ai` |
| 5 | Itinerary tab — day-by-day text breakdown | `itinerary` |
| 6 | User draws a circle on map (lasso tool) | `drawing` |
| 7 | Circle finalized | `drawing-done` |
| 8 | Chat shows "Find scenic spots in this area" bubble | `area-query` |
| 9 | Gemini responds with 2 scenic spot cards + Add buttons | `area-results` |

---

## File structure

```
iteration-9/
  index.html
  tokens.css      ← copy from iteration-8, no changes needed
  styles.css      ← new
  app.js          ← new
  assets/
    seattle-trip.jpg   ← placeholder trip card thumbnail
    chicago-trip.jpg   ← placeholder trip card thumbnail
```

---

## States

The body carries a `data-state` attribute that drives all visibility:

- `landing` — landing screen, map hidden
- `generating` — 800ms typewriter/loading state between landing and map
- `plan` — map + left panel visible; `data-tab` attribute controls active panel tab
- `drawing` — lasso mode active (cursor change, map crosshair, no panel interaction)

`data-tab` values (only relevant in `plan` state): `plan-ai` | `route` | `itinerary`

---

## Layout spec

### Landing screen (state: `landing`)
- Full-viewport, `background: var(--color-surface-canvas)`, no map
- Nav rail: 64px left, same as iteration 8
- Center column: 600px wide, vertically centered
  - Gemini spark icon (SVG, 60px circle, `background: var(--color-surface-overlay)`)
  - Heading: `"Hey Rakshit, where do you want to go today?"` — 40px / medium / `--color-text-primary`, `tracking: -0.8px`
  - **Prompt input card**: `border: 1px solid var(--color-border-focus)`, `border-radius: 12px`, white bg
    - Top row: textarea pre-filled with the demo prompt text, `font-size: 16px`
    - Bottom row: `+` icon (left) / "Gemini 3.1 Pro" label + blue send button (right, `border-radius: 12px`, 32px wide)
  - "Planned roadtrips" heading: 18px / medium
  - 2-column grid of past trip cards (`border-radius: 16px`, white bg, 12px padding):
    - Thumbnail image (160px tall, `border-radius: 8px`)
    - Trip name (14px / medium) + "2hrs ago" (11px / tertiary)
    - Overlapping avatar thumbnails (26px circles)
- Footer: "Gemini can make mistakes" — 12px / tertiary / centered

### Map view (state: `plan`)
- Grid: `64px [rail] | 360px [panel] | 1fr [map]`
- Nav rail: same as iteration 8
- **Left panel** (360px, full height, white bg, `box-shadow: var(--shadow-2)`):
  - Tab bar (48px, white): "Plan AI" | "Route" | "Itinerary" — active tab has a 3px black underline indicator, `font-size: 14px / medium`
  - Content area (scrollable, `background: var(--color-surface-canvas)`)
  - **Footer** (pinned at bottom, frosted: `backdrop-filter: blur(2px)`, `border-top: 1px solid var(--color-border-subtle)`, 16px padding):
    - Input box: `border: 1px solid var(--color-border-focus)`, `border-radius: 12px`, placeholder "Tell me more …", `font-size: 14px`
    - Blue send button: 32px × 32px, `border-radius: 12px`, `background: var(--color-action-primary)`
    - "Gemini can make mistakes" — 12px / tertiary / centered below input
- **Map canvas** (remaining width, full height — Google Maps, same as iteration 8)
- **Top-right bar** (absolute, `top: 26px right: 24px`):
  - "Share" button: pill shape, white bg, `box-shadow: var(--shadow-1)`, share icon + label, 14px / medium
  - Avatar thumbnail: 40px circle, 2px white border
- **Right tool clusters** (absolute, vertically centered on right edge, 24px from edge):
  - Cluster 1 (pill container, white, border-subtle, 8px padding, 8px gap):
    - `highlight_alt` icon (24px) — lasso/draw tool
    - Divider (1px horizontal)
    - `edit` icon (24px)
  - Cluster 2 (same styling):
    - `add` icon (24px)
    - Divider
    - `remove` icon (24px)

---

## Left panel content — Plan AI tab

Chat messages render top-to-bottom, scrollable. Two types:

**User bubble** (right-aligned):
- `background: var(--color-surface-sunken)`, `border-radius: 8px`, 16px / 12px padding
- Max-width 300px
- `font-size: 14px / regular`

**Gemini response block** (left-aligned, full width):
- Plain text, `font-size: 14px / regular`, `color: var(--color-text-primary)`
- **"Plan created →"** inline link (12px, secondary, chevron_right icon) → clicking switches to Itinerary tab
- **3-photo strip**: 3 equal-width image tiles (`height: 80px`, `border-radius: 8px`) inside a `background: var(--color-surface-sunken)` container with 8px border-radius
- After circle draw, a new user bubble appears: `"Find scenic spots in this area"`, then Gemini responds with:
  - Intro text: "Here are a few 📸 spots you might be interested in:"
  - Place list (inside `background: var(--color-surface-sunken)`, `border-radius: 12px`):
    - Each item: 56px thumbnail + name (16px / medium) + "4.7 ⭐ · 123 reviews" + blue "Add" pill button (`background: var(--palette-blue-700)`, `border-radius: 100px`, 12px / 6px padding, white label 12px)

---

## Left panel content — Itinerary tab

- Trip title: "Seattle Road Trip Adventure" — 22px / medium
- Description: 12px / regular / `--color-text-secondary`
- Separator lines between sections
- Day sections (4 total):
  - Label: "Day 1: 8 AM ☀️" — 16px / medium
  - Description: 12px / regular / `--color-text-secondary`
  - Sections: Day 1 AM, Day 1 PM, Day 2 AM, Day 2 PM

---

## Left panel content — Route tab

- Numbered list of stops (static — Seattle stop names)
- Matches pin numbers on map (5 stops)

---

## Map — route visualization

Static polyline (Google Maps Polyline) connecting 5 stops:
1. Bellingham, WA — `{ lat: 48.75, lng: -122.47 }` (northernmost)
2. Anacortes, WA — `{ lat: 48.51, lng: -122.61 }`
3. Everett, WA — `{ lat: 47.98, lng: -122.20 }`
4. Kirkland, WA — `{ lat: 47.68, lng: -122.21 }`
5. Seattle, WA — `{ lat: 47.60, lng: -122.33 }` (southernmost)

Route pins: teal/blue circles (not the red teardrop pins) with white numbered labels 1–5. Use `google.maps.Marker` with a custom SVG circle.

Route polyline: `#1a73e8`, 3px, no dash.

---

## Draw mode (lasso → circle)

The `highlight_alt` button on the right tool cluster enters draw mode:
- Cursor: crosshair on map
- User clicks and drags → draws a circle (use `google.maps.Circle` centered at drag midpoint, radius from drag distance)
- On mouseup: circle is committed, draw mode exits
- **Demo shortcut**: if user just clicks without dragging, commit a default circle centered at `{ lat: 47.85, lng: -122.35 }` (roughly between stops 2 and 3) with radius 25km
- After circle commits:
  - Add user bubble: "Find scenic spots in this area"
  - After 800ms delay, add Gemini response with Deception Pass + Canon Beach cards
  - Two new red pins appear on the map at those locations with labels

---

## Static data

### Past trip cards (landing)
```
{ name: "Seattle day trip", time: "2hrs ago", img: "https://picsum.photos/seed/seattle-day/600/320" }
{ name: "Chicago weekend trip", time: "2hrs ago", img: "https://picsum.photos/seed/chicago-wknd/600/320" }
```

### Route stops
```js
const ROUTE_STOPS = [
  { num: 1, name: "Bellingham",  lat: 48.7519, lng: -122.4787 },
  { num: 2, name: "Anacortes",   lat: 48.5126, lng: -122.6124 },
  { num: 3, name: "Everett",     lat: 47.9790, lng: -122.2021 },
  { num: 4, name: "Kirkland",    lat: 47.6815, lng: -122.2087 },
  { num: 5, name: "Seattle",     lat: 47.6062, lng: -122.3321 },
];
```

### Area scenic spots
```js
const AREA_SPOTS = [
  { id: 'dp', name: "Deception Pass", rating: 4.7, reviews: 123, lat: 48.4068, lng: -122.6468, photo: "https://picsum.photos/seed/deception/300/220" },
  { id: 'cb', name: "Canon Beach",    rating: 4.7, reviews: 123, lat: 45.8918, lng: -123.9615, photo: "https://picsum.photos/seed/canon/300/220" },
];
```

### Gemini response texts (static)
```
Intro: "Explore the scenic routes around Seattle on a 2-day road trip. Discover charming towns, lush forests, and stunning waterfront views. Perfect for a quick getaway filled with adventure and relaxation."

Itinerary title: "Seattle Road Trip Adventure"
Itinerary desc: "Discover Seattle's lively streets and famous sights for an unforgettable two-day road trip."

Day 1 AM: "Begin your day with a tranquil walk in Discovery Park, catching the sunrise over Puget Sound..."
Day 1 PM: "Spend your afternoon exploring Pike Place Market, tasting local treats and browsing crafts..."
Day 2 AM: "Start your second day with a visit to the Museum of Pop Culture..."
Day 2 PM: "In the afternoon, explore the historic Fremont neighborhood..."
```

---

## Transition animation

| Trigger | Effect |
|---------|--------|
| Submit on landing | 800ms `opacity: 0 → 1` fade on map, landing fades out |
| Tab switch | `opacity: 0 → 1` on tab content, 200ms |
| Chat message appear | slide up + fade in, 200ms, 400ms delay after trigger |
| Panel entry | `translateY(-8px) → 0` + opacity, 220ms (same as iteration 8) |

---

## What's NOT in this iteration

- Live Gemini API calls (all content is static / hardcoded)
- Actual Google Maps Directions API (route is a static polyline)
- "Route" tab content (will show a placeholder "Route details coming soon")
- Responsive / mobile layout
- The `edit`, `add`, `remove` toolbar buttons (visual only, no interaction)

---

## Open questions for you

1. **Circle vs rectangle draw**: Figma shows a circle/ellipse lasso — should I implement a circle draw (radius from center) or keep the rectangle from iteration 8? 
2. **"Plan created →" link**: Should clicking this switch to the Itinerary tab, or expand inline? (Yes)
3. **Photo strip images**: Should I use `picsum.photos` placeholder images, or do you have specific photos to use? (placeholder)
