# Iteration 11 — Draw to Discover

Figma source: https://www.figma.com/design/HgIFkJsMoBgjTOrCEmWkb0/Google-Maps-%E2%80%A2-Rakshit?node-id=263-6992

---

## What this iteration explores

Iterations 1–10 built a complete route-planning loop: prompt → route → edit → save. That loop is tested. Iteration 11 asks a different question:

**What if the user doesn't want a route yet — they just want to know what's in an area?**

Real planners (from research) spend hours before any routing happens: browsing Red Note and TikTok, pinning places to Google Maps lists, building a candidate set from friends and Instagram. That pre-route, geographic-browsing moment has no good tool. Google Maps offers search-by-place but not search-by-area. Users compensate by laboriously pinning each place individually.

This iteration prototypes one interaction: **the user draws a shape on the map, and the surface finds what's worth knowing inside it.** The shape is the query. The map is the interface. No search box needed, no neighborhood name required — just: draw here, show me what's here.

The only flow tested in this iteration is **Flow B: Draw → Discover**. Flows A (type-to-search) and C (along-route) are out of scope.

---

## The One Flow — Draw → Discover

```
[0] Landing
      Map fills viewport. A floating "Explore area" pill sits at bottom-center.
      Lasso icon in right toolbar as secondary entry.
      No route, no pins, no panel visible.

[1] Draw Mode Entry
      User taps "Explore area" pill (or lasso icon).
      Pill transforms into a "Draw on the map" hint label.
      Map gets subtle darkened overlay (draw context).
      Cursor → crosshair.
      Right toolbar: lasso icon activates (blue fill).

[2] During Draw
      Freehand stroke follows cursor/touch in real time.
      Stroke: #1a73e8, 2.5px, opacity 0.7.
      Fill accumulates as path closes: rgba(26,115,232,0.08).
      Snap ring appears when near start point (≤ 30px): 
        dashed white circle 24px, indicates "release to close."

[3] Shape Commits (mouseup / touchend)
      If < 5 points or area too small (<4000 sq pixels on screen):
        Shape dissolves (opacity fade 200ms).
        Floating error hint appears: "Draw a larger area to search" — fades in 1.5s.
        Returns to draw mode immediately (crosshair stays, user can try again).
      If valid:
        Stroke locks: rgba(26,115,232,0.5), 1.5px solid.
        Fill locks: rgba(26,115,232,0.10).
        Shape enters loading state.

[4] Loading (Gemini)
      Shape fill breathes: opacity pulses 0.10 → 0.20 → 0.10, 1s loop.
      A floating "finding" chip appears at the centroid of the shape:
        White pill, shadow-2, auto_awesome sparkle (animated), "Finding places…" 13px.
      Duration: ~900ms (hardcoded delay).

[5] Results Appear
      Breathing stops. Fill settles to rgba(26,115,232,0.10).
      "Finding" chip fades out.
      Category pins stagger in inside the shape (20ms between each):
        Scale 0.5 → 1.0, opacity 0 → 1, ease-out 140ms per pin.
      Bottom panel slides up to mid-height (45vh), 280ms ease-out.
      Panel header: "Drawn area · 24 places."
      Category chips row appears.
      Place card list populates.

[6] Browse & Filter
      Default: all 24 places shown on map (all pins visible inside shape).
      User taps a category chip (Food, Views, Activities, Hidden Gems):
        Non-matching pins fade to 0.2 opacity (not hidden — still visible, de-emphasized).
        Matching pins scale to 1.1x.
        Panel list filters to matching places only.
        Count updates: "8 food places."
      Tapping same chip again deselects it (returns to all).
      Multi-chip: allowed. Combined filter narrows further.

[7] Place Selected
      User taps a pin on the map OR a card in the panel list.
      An inline map card animates open above the tapped pin.
      Map pans slightly to keep the card fully visible.
      Corresponding panel card gets a blue left-border accent (3px, #1a73e8).

[8] Save a Place
      User taps "Save" in the inline card.
      Card closes (150ms fade).
      Pin pulses: scale 1.0 → 1.3 → 1.0, 300ms.
      Bookmark badge appears on pin (white bookmark icon, top-right of circle).
      Toast notification slides down from top of panel: "Saved · View list →" — auto-dismisses 2.5s.
      Panel: bookmark icon on that card row fills blue.

[9] Redraw (optional)
      User taps "Redraw" in panel header (or taps lasso icon again).
      Existing shape + pins fade out (200ms).
      Panel collapses to drag handle.
      Draw mode re-enters (crosshair, hint text, no overlay).
      Fresh start — no memory of previous shape.
```

---

## Screen Specs

### Screen 0 — Landing

**What it is:** Full map, no route, no panel open. The only visible affordances are the "Explore area" pill, the right toolbar, and the nav rail.

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ [nav rail 64px] │                                          │
│                 │          Google Maps                      │
│  map            │       (Seattle, zoom 12)                  │
│  saved          │                             [toolbar]     │
│  recent         │                                           │
│  ─────          │       [Explore area ↗ pill]               │
│  get app        │  [drag handle strip]                      │
└────────────────────────────────────────────────────────────┘
```

**"Explore area" pill:**
```
Position: absolute, bottom 52px, left 50% (transform -50% in map stage)
  — sits 20px above the drag handle strip
Height: 44px, width: auto (min 160px), border-radius: 22px
Background: white, box-shadow: 0 2px 12px rgba(0,0,0,0.16)
Layout: flex, align-center, gap 8px, padding 0 18px

Left icon: highlight_alt (Material Symbols Rounded), 20px, #1a73e8
Text: "Explore area" — 14px 500, #1a73e8
Hover: box-shadow: 0 4px 16px rgba(0,0,0,0.20), transform: translateY(-1px), transition 150ms
```

**Right toolbar:** Same as iter-10 — lasso icon (inactive) + divider + zoom in / zoom out icons.

**Nav rail:** Unchanged from iter-10 (map, saved, recent, divider, get app).

**Bottom drag handle strip:**
```
Height: 32px, background: white, border-top: 1px solid #E8EAED
Center: 36×4px rounded bar, background #BDC1C6
Tap: panel expands to show saved places (not part of this flow — just structural)
```

**Map state:** Standard Maps, Seattle centered, zoom ~12. No pins, no polylines, no route.

---

### Screen 1 — Draw Mode Active

**What it is:** User tapped "Explore area." The interface shifts to communicate "you're drawing now."

**"Explore area" pill → transforms to hint label:**
```
Same position. Pill fades (150ms) and re-renders as:
  Background: rgba(0,0,0,0.56) — dark pill (readable on map)
  Text: "Draw on the map to search" — 13px 400, white
  No icon
  Not interactive (pointer-events: none)
  Auto-fades after 3s if the user has started drawing
```

**Map overlay:**
```
A full-coverage div over the map, pointer-events: all (captures draw events)
Background: rgba(0,0,0,0.04) — barely-there darkening, just enough to signal mode change
cursor: crosshair
```

**Right toolbar — lasso icon:**
```
Active state: background #1a73e8, icon color #FFFFFF, border-radius 8px
(same active treatment as iter-10)
```

**Cancel affordance:**
```
Escape key → exits draw mode, overlay removed, pill returns, cursor resets
Lasso icon tap again → same as Escape
```

**No other UI changes.** The mode is communicated by the cursor, the overlay, and the pill hint — nothing else moves or appears.

---

### Screen 2 — During Draw

**What it is:** User is actively dragging to draw a shape.

**Stroke:** Real-time freehand path on a canvas overlay (or SVG overlay) laid over the map.
```
Color: #1a73e8
Opacity: 0.7
Width: 2.5px
Cap: round, join: round
```

**Fill:** As the path accumulates, a polygon fill tracks it in real time.
```
Fill color: rgba(26,115,232,0.08)
This updates every 16ms (rAF loop)
```

**Snap ring (auto-close affordance):**
When cursor is within 30px of the starting point:
```
A dashed circle appears centered on the start point:
  Diameter: 24px
  Border: 2px dashed #1a73e8
  Background: rgba(26,115,232,0.12)
  No label — the visual is the affordance
Cursor: grab (changes from crosshair to signal "release here")
```

**Minimum area feedback (not triggered yet — on release):**
No error shown during draw. Feedback only on commit.

**Hint label behavior:**
Hint label starts fading out 500ms after the first mousedown (user clearly started drawing). Fully hidden by 700ms. Never distracts during active drawing.

---

### Screen 3 — Shape Committed: Invalid (Too Small)

**What it is:** User lifted but drew too small an area. Need to retry.

**What triggers this:**
- Fewer than 5 recorded points, OR
- Bounding box area < 4,000 screen pixels (roughly: can't fit a pin inside it), OR
- Shape self-intersects to near-zero area

**Visual response:**
```
Shape dissolves: opacity 1 → 0 over 200ms, simultaneously border color #EA4335
(brief red flash on dissolve — 60ms at opacity 0.6 before dissolving)
```

**Error hint:**
```
Position: absolute, centered horizontally, 40% from top of map stage
Pill: background rgba(0,0,0,0.72), border-radius 20px, padding 8px 16px
Text: "Draw a larger area to search" — 13px 400, white
Animation: opacity 0 → 1 (150ms), stays 1.8s, opacity 1 → 0 (200ms)
```

**After hint fades:**
Draw mode remains active (crosshair cursor, overlay still present). User can try again immediately. No reset tap required.

---

### Screen 4 — Shape Committed: Valid (Loading)

**What it is:** User drew a valid shape. System is "finding places."

**Shape visual:**
```
Stroke: rgba(26,115,232,0.5), 1.5px solid (solidifies from draw stroke)
Fill: rgba(26,115,232,0.10) (settles from draw fill)
Shape is now non-interactive (pointer-events: none on shape path)
Map underneath is interactive again (cursor returns to default)
```

**Fill breathing animation:**
```
CSS keyframe: opacity pulses from 0.10 → 0.22 → 0.10
Duration: 1.2s, infinite, ease-in-out
Starts immediately on commit
```

**"Finding places" chip (floats at shape centroid):**
```
Position: absolute, computed from centroid of drawn polygon
  — placed 24px above the centroid point
  — clamped to stay within map stage bounds (never clips off screen)

Style:
  Background: white
  Border-radius: 20px
  Height: 36px
  Padding: 0 14px
  Box-shadow: 0 2px 8px rgba(0,0,0,0.14)
  Layout: flex, align-center, gap 8px

Left: auto_awesome icon, 16px, #1a73e8
  Rotation animation: 0deg → 360deg, 1.8s linear infinite
  (subtly spinning sparkle = Gemini thinking)

Text: "Finding places…" — 13px 400, #5F6368
```

**Toolbar:** Lasso icon returns to inactive state (shape is committed, not drawing).

**Bottom panel:** Still collapsed (drag handle strip visible). Does not yet slide up.

**Timing:** 900ms hardcoded delay, then transition to Screen 5.

---

### Screen 5 — Results Appear

**What it is:** Pins populate inside the shape. Panel slides up.

**Shape final state:**
```
Breathing animation stops.
Fill: rgba(26,115,232,0.10) — static.
Stroke: rgba(26,115,232,0.35), 1.5px solid — slightly more muted than loading.
Shape persists throughout browsing. It is the visual reference for "this is your search area."
```

**"Finding places" chip dissolves:**
```
Opacity 1 → 0, scale 1 → 0.85, 150ms ease-in.
```

**Pins stagger in:**
```
Order: randomized (not alphabetical, not by category) — feels more organic.
Per pin animation:
  transform: scale(0.5) → scale(1.0)
  opacity: 0 → 1
  duration: 140ms ease-out
  delay: 20ms × pin_index
Total stagger for 24 pins: ~480ms
```

**Pin specs (category colors):**
```
All pins: circle, 28px diameter
  Food:         #FA7B17 (orange),  label: fork+knife icon OR "F" 11px white
  Views:        #34A853 (green),   label: mountain icon OR "V" 11px white
  Activities:   #9334EA (purple),  label: star icon OR "A" 11px white
  Hidden Gems:  #FBBC04 (yellow),  label: ★ 12px white
  
Each pin: white border 2px, drop-shadow: 0 1px 4px rgba(0,0,0,0.25)
Z-index stacking: ordered so no two same-category pins fully overlap
  — if distance between two same-category pins < 20px, offset one by 14px vertically
```

**Bottom panel slides up:**
```
Animation: translateY(100%) → translateY(0), 280ms ease-out
Final height: 45vh (mid state)
```

**Panel initial state:**
```
┌────────────────────────────────────────────────────────────────┐
│  ══════  [drag handle]  ══════                                  │
│  Drawn area  ·  24 places           [Redraw ↺]                 │
│  ──────────────────────────────────────────────────────────────│
│  [All ✓] [🍴 Food] [🏔 Views] [⚡ Activities] [★ Hidden Gems]  │
│  ──────────────────────────────────────────────────────────────│
│  [card row 1]                                                  │
│  [card row 2]                                                  │
│  [card row 3]                                                  │
│  ... scrollable                                                │
└────────────────────────────────────────────────────────────────┘
```

**Panel header row:**
```
Height: 44px, padding: 0 16px
Flex: space-between, align-center

Left:
  "Drawn area" — 15px 500, #202124
  " · " — 15px, #9AA0A6
  "24 places" — 14px 400, #5F6368

Right:
  "Redraw" text button — 13px 500, #1a73e8
  Left of it: ↺ refresh icon, 16px, #1a73e8
  Tap: exits to draw mode (Screen 1), clears shape + pins
```

**Chip row:**
```
Padding: 8px 16px
Display: flex, gap 8px, overflow-x: auto, -ms-overflow-style: none, scrollbar-width: none

Chips: [All] [🍴 Food] [🏔 Views] [⚡ Activities] [★ Hidden Gems]
  Default: "All" chip is active

Chip spec:
  Height: 32px, border-radius: 16px, padding: 0 12px
  Gap between icon and label: 5px
  
  Inactive: background white, border 1px #DFE1E5, color #5F6368
  Active: background #E8F0FE, border: none, color #1a73e8
    Active also adds a thin blue checkmark before the label: ✓ 12px
  
  Transition: all 150ms ease
```

---

### Screen 6 — Category Filter Applied

**What it is:** User tapped one category chip (e.g., "Food"). Map and panel both narrow.

**Map:**
```
Non-food pins: opacity → 0.20, scale stays 1.0 (greyed but visible — not hidden)
  Transition: opacity 180ms ease
Food pins: opacity stays 1.0, scale: 1.0 → 1.08 (subtle emphasis)
  Transition: transform 150ms ease-out
```

**Panel:**
```
"Food" chip → active state
"All" chip → inactive
Count updates: "8 food places" (number animates: old number out, new number in, 120ms)
List: re-renders showing only food places
  Animation: list items fade out (100ms), new list fades in (150ms)
  Scrolls to top automatically
```

**Panel header update:**
```
"Drawn area" stays
Count: "8 food places"
No "Gemini sorted" text here — chips are user-controlled filters, not AI
```

**Multi-chip behavior:**
```
Tap "Views" while "Food" is already active:
  Both chips active
  Map: shows food + views pins at full opacity, others at 0.2
  Count: "12 places" (combined)
  List: shows food + views places combined
  
Tap "Food" again while active: deselects. List/map update accordingly.
Tap "All": clears all, resets to full 24.
```

---

### Screen 7 — Place Selected (Inline Map Card)

**What it is:** User taps a pin on the map OR a card row in the panel list. An inline card appears on the map.

**Trigger: tap pin on map**
```
1. Tapped pin scales to 1.3×, gets white halo ring:
     ring: 4px white border + 2px #1a73e8 outer stroke, border-radius 50%
     total diameter: ~40px (vs default 28px pin)
2. Inline map card animates open above the pin
3. Map pans (200ms ease-out) so the card + pin are fully visible with 24px margin on all sides
4. Corresponding row in panel gets blue left-border (3px, #1a73e8)
   Panel scrolls so that row is visible if needed
```

**Trigger: tap card row in panel**
```
1. Row highlights (background #EEF2FF, left-border 3px #1a73e8)
2. Map pans to corresponding pin (same as above)
3. Pin enters selected state (halo ring)
4. Inline map card opens (same as tap-on-pin flow)
```

**Inline map card:**
```
Width: 280px
Border-radius: 12px
Background: white
Box-shadow: 0 4px 20px rgba(0,0,0,0.18)
Position: absolute, computed dynamically
  — centered horizontally above the selected pin
  — offset: -140px from pin center horizontally (card center = pin center)
  — offset: -12px gap above pin top
  — clamped: if card would clip left edge (left < 76px + 12px), shift right
  — clamped: if card would clip right edge, shift left
  — clamped: if card top would clip above map top, flip to appear below pin instead

Animation open:
  transform: scale(0.88) translateY(8px) → scale(1) translateY(0)
  opacity: 0 → 1
  duration: 200ms ease-out
```

**Card layout:**
```
┌──────────────────────────────────────────┐
│ [photo 280×128px, rounded top]           │
│                               [× 20px]   │  ← close button, top-right, on photo
├──────────────────────────────────────────┤
│ Oddfellows Café + Bar          [cat tag] │
│ ★ 4.6  ·  Café  ·  Open until 11pm      │
│ "Neighborhood favorite with serious      │
│  espresso and all-day brunch."           │
├──────────────────────────────────────────┤
│  [♡ Save]          [→ Directions]        │
└──────────────────────────────────────────┘
```

**Photo:**
```
Width: 280px, height: 128px
Border-radius: 12px 12px 0 0
Object-fit: cover
Source: Unsplash seed URL keyed to place name
  e.g. https://source.unsplash.com/280x128/?cafe,seattle
```

**Close button (×):**
```
Position: absolute, top 8px, right 8px
Width/height: 28px, border-radius: 50%
Background: rgba(0,0,0,0.48)
Icon: close, 16px, white
Tap: card closes (150ms fade + scale 1→0.9), pin returns to normal state, panel accent clears
```

**Category tag:**
```
Position: next to place name, right-aligned in header row
Height: 22px, border-radius: 11px, padding: 0 8px
Background: category color at 0.15 opacity, text: category color, 11px 500
  Food → #FA7B17 background + text
  Views → #34A853 background + text
  Activities → #9334EA background + text
  Hidden Gems → #FBBC04 background + text
```

**Body:**
```
Padding: 12px 14px
Name: 15px 500, #202124
Meta row: 12px 400, #5F6368
  Format: ★ [rating]  ·  [category]  ·  [hours status]
  Hours: "Open until 11pm" (green #34A853) OR "Closed" (#EA4335) — hardcoded per place
Description: 13px 400, #5F6368, line-height 1.45
  Max 2 lines. Italic. Ellipsis if overflows.
  Margin-top: 4px
```

**Button row:**
```
Padding: 10px 14px 14px
Border-top: 1px solid #F1F3F4
Display: flex, gap: 8px

Save button:
  Flex: 1, height: 38px, border-radius: 19px
  Border: 1px solid #DFE1E5
  Background: white
  Layout: flex, align-center, justify-center, gap 6px
  Icon: bookmark_border (20px, #5F6368) — before save
        bookmark (20px, #1a73e8) — after save (filled)
  Text: "Save" — 14px 500, #202124
        "Saved" — 14px 500, #1a73e8 (after save)
  Transition: color + icon swap, 150ms

Directions button:
  Flex: 1, height: 38px, border-radius: 19px
  Border: none
  Background: transparent
  Layout: flex, align-center, justify-center, gap 6px
  Icon: arrow_forward, 20px, #1a73e8
  Text: "Directions" — 14px 500, #1a73e8
  Tap: no-op in prototype (visual only)
```

---

### Screen 8 — Place Saved

**What it is:** User tapped "Save" on the inline card.

**Card:**
```
Save button updates inline (no card close yet):
  Icon: bookmark_border → bookmark (filled, #1a73e8), swap 150ms
  Text: "Save" → "Saved" (#1a73e8), 150ms
  Button border: 1px #DFE1E5 → 1px #1a73e8, 150ms
Card remains open for 600ms (user sees confirmation), then closes.
```

**Pin:**
```
1. Scale pulse: 1.0 → 1.3 → 1.0, 320ms ease-in-out
2. After pulse: small bookmark badge appears on pin
   Badge: white filled circle, 14px diameter
          bookmark icon, 10px, #1a73e8
          Position: top-right of pin circle, offset 2px out from edge
          Animate in: scale 0 → 1, 200ms ease-out (after pulse completes)
3. Pin returns to normal state (halo ring gone), stays with bookmark badge.
```

**Toast:**
```
Appears at top of panel (inside the panel, not above it):
  — slides down from above panel header, 180ms ease-out

Height: 36px, width: calc(100% - 32px), margin: 0 16px
Border-radius: 18px
Background: #E8F0FE
Layout: flex, align-center, justify-space-between, padding 0 12px

Left: "Saved" — 13px 400, #1a73e8
Right: "View list →" — 13px 500, #1a73e8

Auto-dismiss: 2.5s, then fadeOut 250ms + translateY(-8px)
Tap "View list →": nav rail "saved" tab becomes active (no panel change in this prototype)
```

**Panel card row:**
```
Bookmark icon: outline → filled (#1a73e8), 180ms
Row does not change otherwise (no checkmark, no removal)
```

**Nav rail — Saved icon:**
```
A 6px blue dot (#1a73e8) badge appears below/on the Saved icon.
Indicates: "you have new saves." Stays for the session.
```

---

## Visual Design Language

### Color system

| Element | Hex | Note |
|---|---|---|
| Food pin | `#FA7B17` | Orange |
| Views pin | `#34A853` | Green |
| Activities pin | `#9334EA` | Purple |
| Hidden Gems pin | `#FBBC04` | Yellow |
| Area fill (active) | `rgba(26,115,232,0.10)` | |
| Area stroke (active) | `rgba(26,115,232,0.35)` | |
| Area fill (loading) | pulses `0.10 → 0.22` | |
| Area stroke (loading) | `rgba(26,115,232,0.5)` | |
| Draw stroke | `rgba(26,115,232,0.7)` | During active draw |
| Invalid flash | `#EA4335` | Brief before dissolve |
| Blue chip active bg | `#E8F0FE` | |
| Blue chip active text | `#1a73e8` | |
| Gemini chip bg | `#F0F4FF` | |
| Toast bg | `#E8F0FE` | |
| De-emphasized pins | 0.20 opacity | When filtered out |
| Selected pin halo | white 4px + #1a73e8 2px | Ring around active pin |

### Typography

| Role | Size | Weight | Color |
|---|---|---|---|
| Panel area name | 15px | 500 | #202124 |
| Panel count | 14px | 400 | #5F6368 |
| Place card name | 14px | 500 | #202124 |
| Place card meta | 12px | 400 | #5F6368 |
| Card title (map card) | 15px | 500 | #202124 |
| Card meta (map card) | 12px | 400 | #5F6368 |
| Card description | 13px | 400 | #5F6368 |
| Chip label | 13px | 500 | varies |
| Toast | 13px | 400/500 | #1a73e8 |
| Hint labels | 13px | 400 | white |
| Error hint | 13px | 400 | white |

### Animation timing reference

| Moment | Duration | Easing |
|---|---|---|
| "Explore area" pill → hint | 150ms | ease |
| Map overlay fade in | 200ms | ease |
| Shape dissolve (invalid) | 200ms | ease-in |
| Error hint appear | 150ms | ease-out |
| Shape loading settle | 100ms | ease-out |
| Fill breathing loop | 1200ms | ease-in-out |
| Sparkle spin | 1800ms | linear |
| Finding chip dissolve | 150ms | ease-in |
| Pin stagger in (each) | 140ms | ease-out |
| Panel slide up | 280ms | ease-out |
| Chip filter update | 150ms | ease |
| List re-render fade | 100ms out / 150ms in | ease |
| Card open | 200ms | ease-out |
| Card close | 150ms | ease-in |
| Pin pulse (save) | 320ms | ease-in-out |
| Bookmark badge appear | 200ms | ease-out |
| Toast slide in | 180ms | ease-out |
| Toast auto-dismiss | 250ms | ease-in |
| Panel count number swap | 120ms | ease |

---

## State Machine

```
'landing'
  → tap "Explore area" pill   → 'draw-mode'
  → tap lasso icon            → 'draw-mode'

'draw-mode'
  → mouseup (invalid shape)   → 'draw-mode' (resets inline, no state change)
  → mouseup (valid shape)     → 'loading'
  → Escape / tap lasso again  → 'landing'

'loading'
  → 900ms delay               → 'results'

'results'
  → tap category chip         → 'filtered' (chip active, count updates)
  → tap pin on map            → 'place-selected'
  → tap card row in panel     → 'place-selected'
  → tap "Redraw"              → 'draw-mode' (shape + pins cleared)

'filtered'
  → tap same chip             → 'results' (deselects)
  → tap different chip        → 'filtered' (adds to filter)
  → tap "All"                 → 'results'
  → tap pin or card           → 'place-selected'
  → tap "Redraw"              → 'draw-mode'

'place-selected'
  → tap ×                     → back to 'results' or 'filtered'
  → tap "Save"                → 'saved' (card stays briefly, then → 'results'/'filtered')
  → tap another pin/card      → 'place-selected' (previous card closes, new opens)

'saved'
  (transient — card closes after 600ms, returns to 'results'/'filtered')
  Pin now has bookmark badge. Toast visible. State is effectively 'results'/'filtered'.
```

---

## Hardcoded Place Data

All 24 places inside Capitol Hill (lat/lng verified for the neighborhood).

### Food — 8 places

| Name | Lat | Lng | Rating | Hours | Description |
|---|---|---|---|---|---|
| Oddfellows Café + Bar | 47.6228 | -122.3199 | 4.6 | Open until 11pm | Neighborhood favorite with serious espresso and all-day brunch. |
| Tacos Chukis | 47.6195 | -122.3218 | 4.7 | Open until 10pm | Cash-preferred taqueria with genuinely tiny prices and genuinely great tacos. |
| Via Tribunali | 47.6243 | -122.3224 | 4.6 | Open until 11pm | Wood-fired Neapolitan pizza in a tight, loud, candlelit room. |
| Poppy | 47.6253 | -122.3195 | 4.4 | Open until 10pm | Inventive seasonal menus from a James Beard-nominated kitchen. |
| Stateside | 47.6217 | -122.3203 | 4.5 | Open until 10pm | French-Vietnamese fusion — bánh mì + pâté en croûte side by side. |
| Nue | 47.6238 | -122.3214 | 4.4 | Open until 10pm | Global street food done with precision. Happy hour Tue–Fri 4–6pm. |
| Taylor Shellfish Farms | 47.6270 | -122.3189 | 4.5 | Open until 9pm | Fresh oysters shucked to order. Simple room, exceptional product. |
| Rachel's Ginger Beer | 47.6221 | -122.3196 | 4.6 | Open until 8pm | House-brewed ginger beer in 20+ flavors. No alcohol, no apology. |

### Views — 4 places

| Name | Lat | Lng | Rating | Hours | Description |
|---|---|---|---|---|---|
| Cal Anderson Park | 47.6165 | -122.3196 | 4.8 | Always open | Beloved reservoir park at the center of the neighborhood. Locals, dogs, bocce. |
| Volunteer Park | 47.6379 | -122.3162 | 4.7 | Open until dusk | Water tower with 360° panorama, conservatory, Seattle Asian Art Museum. |
| Broadway + Pine | 47.6228 | -122.3215 | — | Always open | The intersection everyone photographs. Capitol Hill's social center. |
| Lake View Cemetery | 47.6393 | -122.3156 | 4.6 | Open until 6pm | Bruce Lee's grave, city view, and a level of quiet rare in Seattle. |

### Activities — 6 places

| Name | Lat | Lng | Rating | Hours | Description |
|---|---|---|---|---|---|
| Neumos | 47.6222 | -122.3205 | 4.5 | Varies | The indie/alternative venue. If a show is on, don't miss it. |
| Elliott Bay Book Company | 47.6189 | -122.3210 | 4.9 | Open until 9pm | Labyrinthine independent bookstore with a serious events calendar. |
| Harvard Exit Theatre | 47.6261 | -122.3172 | 4.4 | Varies | Arthouse cinema since 1968. Programming leans foreign and independent. |
| Jai Thai | 47.6200 | -122.3213 | 4.3 | Open until 2am | Thai food + drag shows late-night. A Capitol Hill institution. |
| Wildrose | 47.6193 | -122.3204 | 4.4 | Open until 2am | Oldest lesbian bar in Seattle. Welcoming to everyone. |
| ARTS at King Street Station | 47.5984 | -122.3298 | 4.5 | Tue–Sun 11am–5pm | Rotating public art in a stunning Beaux-Arts train station. |

### Hidden Gems — 6 places

| Name | Lat | Lng | Rating | Hours | Description |
|---|---|---|---|---|---|
| Melrose Market | 47.6227 | -122.3230 | 4.6 | Open until 7pm | A tucked-away indoor food hall: butcher, wine shop, florist, café. |
| Quinn's Pub | 47.6225 | -122.3200 | 4.5 | Open until midnight | British gastropub feel, deep rotating tap list, reliably good burger. |
| Chophouse Row | 47.6235 | -122.3228 | 4.4 | Varies | Boutique retail arcade with local designers, small-batch goods, a hidden courtyard. |
| The Deluxe | 47.6221 | -122.3218 | 4.2 | Open until 2am | Old-school neighborhood bar. No pretense. Regulars know the bartender's name. |
| Nagle Place Mini Park | 47.6196 | -122.3201 | 4.5 | Always open | A pocket park most visitors walk past. Perfect for a 10-minute reset. |
| Linda's Tavern | 47.6218 | -122.3202 | 4.3 | Open until 2am | Legend has it Kurt Cobain was last seen here. Grunge artifacts on every wall. |

### Photo seeds (Unsplash)

Each inline card photo uses a seeded Unsplash URL. Format:
```
https://source.unsplash.com/280x128/?[keyword],[keyword2]
```

| Category | Keywords |
|---|---|
| Food | `cafe,seattle` / `restaurant,food` / `tacos` / `pizza` / `oysters` |
| Views | `park,seattle` / `cemetery,trees` / `viewpoint,city` |
| Activities | `bookstore` / `music,venue` / `cinema` / `bar,neon` |
| Hidden Gems | `market,indoor` / `pub,bar` / `alley,seattle` |

One stable seed per place. Same seed = same image every load (no randomness).

---

## What Carries Forward from Iteration 10

| Component | How used in iter-11 |
|---|---|
| Nav rail (64px) | Unchanged — map, saved, recent icons |
| Right toolbar | Lasso icon (primary tool), zoom in/out icons |
| Lasso draw engine | Core of this iteration — reused wholesale |
| Polygon fill + stroke style | Same base values, extended with loading animation |
| CSS variable system | Unchanged — all tokens carry over |
| Bookmark/saved state | Same state flag per place, new visual treatment on pin |
| `haversineKm()` utility | Used to check if a place's lat/lng falls within drawn polygon |
| Shadow system (`--shadow-1/2/3`) | All cards use existing shadow tokens |

---

## What Changes from Iteration 10

| Aspect | Iteration 10 | Iteration 11 |
|---|---|---|
| Primary entry | Prompt text box (full landing) | "Explore area" pill on map |
| Primary gesture | Type prompt → generate route | Draw shape → discover places |
| Map state | Polyline route + route stop pins | No route, discovery category pins |
| Left panel | 370px slide-in panel | No left panel — panel is at bottom |
| Bottom area | Fixed chat input | Bottom panel (collapsible, results-driven) |
| Pin system | Red (on-route) / Yellow (recommendation) | 4 category colors (F/V/A/★) |
| Place detail | Floating pin popup with AI summary | Inline map card anchored to pin |
| Save action | Adds to Saved tab in left panel | Pin gets bookmark badge + toast |
| AI output | Trip narrative, plan card | Centered "finding" chip during load; Gemini chip for refinements |
| Route editing | Click segment, drag-to-connect | Not present |
| Auto complete | Floating blue button | Not present |

---

## Implementation Order

1. **HTML restructure** — remove left panel, add bottom panel, place "Explore area" pill, position search bar over map
2. **Capitol Hill data** — 24 places with lat/lng, category, rating, hours, description, photo seed
3. **"Explore area" pill** — style, hover state, tap → draw mode entry
4. **Draw mode** — overlay, hint label, crosshair, Escape to cancel; reuse lasso engine from iter-10
5. **Snap ring** — detect cursor within 30px of start point, render dashed close-ring
6. **Shape commit validation** — point count + area threshold check; invalid → dissolve + error hint
7. **Loading state** — breathing animation on shape fill, "Finding places…" chip at centroid with spinning sparkle
8. **Category pin system** — 4 pin colors/icons using `google.maps.Marker` with custom SVG, point-in-polygon filter
9. **Pin stagger animation** — rAF loop or CSS transition with incremental delay
10. **Bottom panel** — structure (drag handle, header, chip row, card list), mid/expanded states, drag-to-resize
11. **Chip filter** — multi-select logic, map pin opacity update, panel list re-render
12. **Inline map card** — position computation (centered above pin, clamped), open/close animation, Unsplash photo
13. **Pin selected state** — halo ring, scale 1.3x, map pan to ensure visibility
14. **Card → panel sync** — tap pin scrolls panel to card; tap card opens pin card
15. **Save interaction** — button icon/text swap, card delay-close, pin pulse, bookmark badge, toast, nav rail dot
16. **Redraw** — "Redraw" button clears shape + pins, collapses panel, re-enters draw mode

---

## User Testing Focus — Flow B Only

The moments most worth watching during the session:

1. **Do users find the "Explore area" pill without prompting?**
   Hypothesis: the pill is more discoverable than the toolbar lasso icon alone.

2. **Do users understand that they're drawing a search query, not just marking a zone?**
   Watch for: users who draw but then look around confused, expecting a different input mechanism.

3. **Does the drawn shape feel permanent enough to trust, or do users try to redraw immediately?**
   The shape is their query frame — it should feel settled, not fragile.

4. **Do the 4 category pin colors read as distinct without a legend?**
   Watch for: "what do the colors mean?" — if asked, the design failed.

5. **Does the bottom panel position feel natural, or does it obscure the map they just drew on?**
   Mid-height (45vh) leaves the drawn shape visible above the panel. Watch if users drag up.

6. **Do users try to tap the pin first or the card first to see details?**
   Both should work identically — if users try one and it fails, there's a consistency problem.

7. **Is "Save" clearly different from "I'm adding this to my route"?**
   In this flow there is no route. Watch if users hesitate or ask what saving does.

8. **Does the "Redraw" button read as "try a different area" or "undo"?**
   It should mean "start over with a new shape" — not undo the last save.
