# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running Prototypes

No build step. Serve any iteration as static files:

```bash
python3 -m http.server 3014 --directory iteration-14
```

Each iteration folder has its own `.claude/launch.json` pointing to a `serve.sh` that starts a file server on a unique port (iteration N → port 30N0, e.g. iteration-14 → 3014). The root `index.html` is an index of all iterations and is served from the repo root.

The Google Maps JS API key is embedded in each `index.html` at the end of the `<body>` as a `<script src="https://maps.googleapis.com/maps/api/js?key=...">` tag. No `.env` file exists — the key is inline.

## Repository Layout

```
/                    Root index listing all iterations
/design.md           Design token source of truth (colors, type, spacing, shadow, motion)
/problem.md          User research context: the Planner Friend problem space
/google_maps_apis.md API reference for Maps Platform APIs available in this project
/iteration-N/        Each iteration is a self-contained prototype
  index.html         All markup (single-page app, no component files)
  styles.css         All styles
  app.js             All JS logic (no modules, no build)
  serve.sh           Simple file server start script
```

Iterations are **copy-on-write**: when starting a new iteration, copy the previous folder and modify it. Never edit old iterations; the root index links to all of them as a changelog.

## Architecture of the Active Prototype (iteration-14)

### State machine
`body[data-state="..."]` drives CSS visibility. Two states matter:
- `home` — landing screen with a prompt card
- `plan-ai` / `route` — the map view, controlled by `setState()` in `app.js`

`goToMap()` transitions from home → plan-ai with a slide animation.

### Left panel tabs
Two panes — **Plan AI** (`#paneplanai`) and **Route** (`#paneroute`) — toggled by `showTab()`. Both live in `#panelContent` and share a sticky footer with the Gemini input (`#footerInput`).

### Custom map overlays
Three `google.maps.OverlayView` subclasses are defined inside `initMap()` after the API loads:
- `SquarePin` — added stops on the route (blue squares)
- `SuggestionPin` — AI suggestion pins (category-colored)
- `BookmarkPin` — saved places (bookmark icon)

All overlay click handlers call `e.stopPropagation()` to prevent the map's own click listener from firing (which would close the place card).

### Route optimization
`bestInsertIndex(newStop)` uses the Haversine formula to find the cheapest-insertion position. `addToRoute()` calls this automatically. `routeStops[]` is the single source of truth for stop order.

### Circle draw / area search
`activeCircle` holds finalized circle state `{ cx, cy, r, radiusKm }`. Drawing is done via an SVG overlay (`#circleOverlay`) with three phases:
1. **Draw mode** — overlay captures mousedown/move/up, draws the circle in real time
2. **Finalized** — two draggable SVG dots (center and edge) allow repositioning; map is locked (`gestureHandling: 'none'`)
3. **Removed** — `removeCircle()` resets all state and unlocks the map

`pixelsToKm()` converts the SVG pixel radius to km using `map.getProjection()`.

### Data
`SUGGESTIONS` (15 Iceland places) and `AREA_RESULTS` (6 near-Reykjavik results) are hardcoded arrays in `app.js`. Place photos come from Google Places API via `PlacesService.findPlaceFromQuery()`; Picsum seeds are used as fallback.

### Footer / AI interactions
`submitFooter()` is the entry point for all chat input. It currently branches on `activeCircle` to trigger `doAreaSearch()`. All other typed input has no response (stub). Category filter chips (`#categoryChips`) call `setFilter()` which re-renders `#suggestionsList` in-place.

## Design System

`design.md` is the single source of truth for all tokens. **Always check it before using any color, spacing, shadow, radius, or motion value.** Components must reference semantic tokens (e.g. `color.surface.raised`) not primitives (e.g. `palette.neutral.0`). Raw hex and raw px values in CSS are prohibited by design intent.

Key tokens used throughout the prototype:
- Primary blue: `#1a73e8` (`palette.blue.500`)
- Suggestion add button background: `#F4FBFC` (`palette.teal.50`, `color.action.suggestionAdd`)
- Dividers: `#e8eaed` (`palette.neutral.200`, `color.border.subtle`)
- Icons: Material Symbols Rounded (loaded via Google Fonts)

## Memory Files

`memory/` contains persisted notes across conversations:
- `project_overview.md` — iteration history and feature map
- `user_rakshit.md` — user context
