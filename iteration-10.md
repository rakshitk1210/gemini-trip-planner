# Iteration 10 — Route Editing & Personalized Home

Figma source: https://www.figma.com/design/HgIFkJsMoBgjTOrCEmWkb0/Google-Maps-%E2%80%A2-Rakshit?node-id=236-7412

---

## What this iteration solves

Iteration 9's core problem: the prompt goes in, the same hardcoded route comes out, and the AI never felt generative. Iteration 10 attacks this with two things:

1. A **real home screen** that feels like a product, not a prototype entry point
2. A **direct map route editing model** — user draws connections between spots, deletes segments by clicking, and taps "Auto complete" to finish — instead of drag-to-route-list

It also introduces the **red/yellow pin system**: red = on the route, yellow = AI recommendation not yet connected. This single visual distinction makes the map readable as a live planning tool.

---

## Screen Flow

```
[Screen 1] Landing
     ↓ submit prompt
[Screen 2] Generating (map loads, AI working)
     ↓ response ready
[Screen 3] Route Generated (route + pins on map, plan in panel)
     ↓ click blue route line → select segment → delete
[Screen 4] Segment Removed (disconnected spot turns yellow)
     ↓ drag from spot to next spot
[Screen 5] New Connection Drawn (spot turns red, Compare button appears)
     ↓ keep editing or tap Auto Complete
[Screen 6] More Edits (another removal → yellow)
     ↓ tap Auto Complete
[Screen 7] Route Completed (all spots connected, lasso visible)
```

---

## Screen 1 — Landing / Home

**What it is:** Full-viewport centered layout. No map visible yet. First screen the user sees.

**Layout:**
- Left sidebar: 64px wide, full height, white background
  - Icons (top, stacked with labels below each): Road trip, Saved, Recent
  - Divider line after the group
  - Bottom: Get app icon + label
- Center content area: vertically centered in remaining viewport
  - Gemini sparkle/AI icon (~32px) at top
  - Heading: `Hey Rakshit, where do you want to go today?` — large, ~32px, bold, centered
  - Search input box (~600px wide):
    - Placeholder text: "Explore Seattle on a 2-day road trip, discovering iconic landmarks, vibrant neighborhoods, and scenic views along the way."
    - Left: `+` icon button (add attachment / files)
    - Right: `Gemini 1.1 Pro` text label + blue filled send button (circle with arrow)
    - Border: 1px rounded, subtle shadow
  - `Planned roadtrips` section label below (~24px from input)
  - Trip card grid: 2 columns, cards ~295px wide each
    - Each card: map thumbnail image (full bleed, ~160px tall, rounded corners), then title + timestamp below, and overlapping friend avatar stack (2 avatars, 26px circles) at bottom right
    - Cards: "Seattle day trip · 2hrs ago", "Chicago weekend trip · 2hrs ago"
- Bottom center: `Gemini can make mistakes` disclaimer text, small, muted

**Key design decisions:**
- Map is NOT visible yet — this is a clean planning context, not navigation context
- Personalized greeting uses the user's name
- Friend avatars on saved trips = social proof signal (solves the trust problem without a real social graph)
- Gemini model label in input = shows AI is powering this, not just a search box

---

## Screen 2 — Generating State

**What it is:** Prompt submitted. Map loads immediately behind the panel. AI "thinking" state.

**Layout:**
- Full map fills the viewport (Google Maps, same style as iteration 9)
- Left panel (360px wide, overlays map) slides in from left:
  - **Tabs row** (48px tall): `Plan AI` | `Route` | `Itinerary` — Plan AI active
  - Divider
  - Panel body:
    - User's prompt text shown as a message (same text they typed)
    - Below it: `Generating a road trip for you...` — muted, italic or lighter weight
  - **Chat input** pinned to panel bottom (same as iteration 9)
- Left sidebar (64px) still visible at far left

**Behavior:**
- Map pans/loads to region relevant to the prompt (Seattle)
- No route drawn yet — plain map
- ~900ms delay then transitions to Screen 3

---

## Screen 3 — Route Generated (Plan AI view)

**What it is:** AI response is ready. Route drawn on map. Plan details in panel.

### Map layer
- **Blue polyline** connecting all stops in sequence
- **Numbered route stops**: red filled circles with white number labels (same as iteration 9 pin style)
- **Category recommendation pins** scattered along/near the route:
  - `H` (purple) = hotels
  - `R` (orange/red) = restaurants  
  - `S` (green) = scenic spots
- **Pin color rule** (new in iteration 10):
  - **Red pin** = stop is part of the active route
  - **Yellow pin** = AI-recommended spot, not yet connected to route

### Top-right map controls
- `Share` button (outlined, ~97px wide, 40px tall) — top right corner of map
- Circular avatar thumbnail (40px) right of Share button

### Right-side floating toolbar (NEW)
Position: right edge of map, vertically centered (~y=410, x=1576 from panel edge)
Two clusters separated by a divider line:
- **Top cluster:**
  - `highlight_alt` icon = lasso/select mode
  - Divider
  - `edit` icon = route edit mode
- **Bottom cluster:**
  - `add` (+) icon = zoom in / add stop
  - Divider
  - `remove` (−) icon = zoom out / remove stop

### Left panel — Plan AI tab
- **Trip description paragraph**: contextual narrative about the route. References specific stop names. Not generic. E.g. "Explore the scenic routes around Seattle on a 2-day road trip. Discover charming waterfront towns, lush mountain retreats, and sweeping waterfront views. Perfect for a quick getaway filled with adventure and relaxation."
- **Photo strip**: 3 square/landscape images (~95px wide each, 80px tall), pulled from Unsplash seeds. Shows scenic highlights.
- **"Plan Created" card** (new):
  - Background: white card, rounded corners, subtle border
  - Header row: `Plan Created` label (small, muted) + `>` chevron (links to Itinerary tab)
  - Image row below header: 3 thumbnails (~95px wide, 80px tall each), representing stops
- **Chat input** pinned at bottom

---

## Screen 4 — Route Editing: Removing a Segment

**What it is:** User clicks on a segment of the blue route line. That connection is deleted. The now-disconnected stop turns yellow.

**Interaction:**
1. User clicks/taps directly on the blue polyline between two stops
2. That segment is highlighted (selection state — thicker stroke or dashed)
3. User hits Delete or a delete button appears near the selection
4. Segment is removed
5. The stop that is no longer connected to the route **turns from red to yellow** — it's now a "recommendation" not a route stop

**Visual:**
- Disconnected stop: yellow pin instead of red
- Rest of route: blue polyline unchanged
- Panel shows same content (no change to panel on map interaction)

**Sticky note:** "If a place is part of the route it is marked as red. If a place is interesting and is recommended it is marked as yellow."

---

## Screen 5 — Route Editing: Drawing a New Connection

**What it is:** User drags from one spot to another to draw a new route connection.

**Interaction:**
1. User selects/hovers a spot pin
2. Drags outward — a "pen" line follows the cursor/finger
3. User releases on another spot pin
4. A new route connection is drawn between the two spots
5. Both spots are now on the route → turn/stay red

**"Auto Complete" button** (NEW):
- Appears floating at bottom center of the map area after editing begins
- Blue filled button, ~112px wide, 32px tall
- Label: `Auto complete` (or `Compare` in some frames — use "Auto complete" per sticky notes)
- Tapping it: AI fills in all remaining unconnected yellow spots into the route automatically, draws connections, all pins turn red

**Sticky note:** "User can select a spot and drag a route like a pen to the next spot that they want to go to. In the above case user connected two spots which make it a part of the route. Then user can either connect the other spots to finish the route or hit the auto complete button which completes the route."

---

## Screen 6 — Another Removal

**What it is:** Same route editing — user removes another connection, another spot turns yellow.

**Visual:** Two yellow (disconnected) spots visible on map. Auto complete button still present. Reinforces that yellow = "in AI suggestions, not on your route."

**Sticky note:** "Here the user removed another connection and then since it is not connected to any blue line it turns to yellow."

---

## Screen 7 — Auto Complete Tapped

**What it is:** User taps Auto complete. Route fills in all connections. All spots turn red.

**Visual:**
- All route stops now connected with blue polyline
- A lasso/freehand drawn shape visible on map (from the draw tool used earlier)
- All pins are red
- Auto complete button disappears
- Map shows complete route

**Sticky note:** "Finally user taps on auto complete button and the route gets completed as you can see above."

---

## Component Specs

### Left Sidebar (persistent across all screens after landing)
```
Width: 64px
Background: white
Icons with labels below (8px text):
  - directions_car or map icon → "Road trip"
  - bookmark icon → "Saved"  
  - history icon → "Recent"
  [divider]
  - smartphone icon → "Get app" (bottom)

Icon button: 52×48px
Label: 52×16px, centered, 10px, #5F6368
```

### Tab Bar
```
Height: 48px (47px content + 1px divider)
3 tabs, equal width (120px each): Plan AI | Route | Itinerary
Active tab: blue underline indicator, blue text
Inactive: gray text, no indicator
Font: Google Sans, 14px medium
```

### Trip Cards (landing screen)
```
Width: ~295px (2 cols in 600px container, 10px gap)
Image: 271×160px, border-radius 8px, full-bleed map screenshot
Title: 14px medium, #202124
Subtitle: 12px, #5F6368 (e.g. "2hrs ago")
Avatar stack: 2×26px circles, -13px overlap, bottom right of card
```

### Plan Created Card
```
Background: white, border 1px #E8EAED, border-radius 8px
Padding: 12px
Header: "Plan Created" 12px #5F6368 + chevron_right 16px icon
Image row: 3 images, ~95×80px each, ~9px gap, border-radius 4px
Links to Itinerary tab on click
```

### Auto Complete Button
```
Position: floating, bottom center of map (above chat input level)
y: ~977px from top of map container
Width: 112px, Height: 32px
Style: blue filled (#1a73e8), white text, border-radius 16px
Label: "Auto complete"
Appears: when any route segment has been manually edited
Disappears: after tap (route completes)
```

### Right Floating Toolbar
```
Position: right edge of map, ~409px from top
Width: 88px, Height: 215px
Background: white card, border-radius 8px, shadow
Two clusters:
  Top (y=24): highlight_alt icon + divider line + edit icon (40×80px total)
  Bottom (y=111): add icon + divider line + remove icon (40×80px total)
Icon size: 24×24px, padding 8px
```

### Pin States
```
On-route stop (red):    #EA4335 filled circle, white number
Recommendation (yellow): #FBBC04 filled circle, white dot or number
Category pins (H/R/S):  same as iteration 9 (purple/orange/green)
```

---

## State Machine

```
'landing'     → user submits prompt → 'generating'
'generating'  → ~900ms → 'plan' (tab: plan-ai)
'plan'        → click route segment → segment highlighted
              → delete segment → spot turns yellow, 'editing'
'editing'     → drag spot to spot → new connection drawn
              → spot turns red
              → tap Auto Complete → all yellow → red, 'plan'
              → tab switch → normal tab content
```

---

## What to Carry Forward from Iteration 9

Keep everything that works:
- `selectPlaces()` / `PLACE_DB` / `IMAGE_DB` data layer
- Chat input + `handleChatSend()` interaction
- Bookmark system (simplified — keep add-to-bookmarks but remove drag-to-route since routing is now direct on map)
- Draw mode / lasso tool (reuse for the "drag to connect" pen gesture)
- `populateRouteStopsUI()` for Route tab
- Generating animation

---

## What Changes from Iteration 9

| Feature | Iteration 9 | Iteration 10 |
|---|---|---|
| Entry point | Prompt input overlay on map | Full landing screen, no map |
| Saved trips | Sidebar cards | Card grid with avatars |
| Tab 3 | "Saved" | "Itinerary" |
| Route editing | Drag bookmark → route list | Click segment to delete, drag spot-to-spot to connect |
| Pin states | Single style (blue) | Red = on route, Yellow = recommendation |
| Auto complete | None | Floating button, fills gaps |
| Plan AI content | Cards list | Trip narrative + photo strip + Plan Created card |
| Share | None | Top-right Share button + avatar |
| Right toolbar | None | highlight_alt + edit + add + remove |

---

## Implementation Order

1. **Landing screen** — new `body[data-state="landing"]` layout, trip cards, greeting, search input
2. **Pin state system** — red vs yellow pin rendering, state tracking per stop
3. **Route segment selection** — click polyline → highlight segment → delete on keypress/button
4. **Drag-to-connect** — drag from pin → pen line → release on target pin → new polyline segment
5. **Auto complete button** — appears on first edit, fills remaining connections on tap
6. **Plan AI panel updates** — trip narrative text, photo strip, Plan Created card
7. **Itinerary tab** — replace Saved tab, show day-by-day breakdown of route stops
8. **Share button + avatar** — top right of map, static for prototype
9. **Right toolbar** — wire highlight_alt to existing lasso mode, edit to route edit mode
