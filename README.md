# Reimagining Road Trip Planning on Google Maps

A progressive design exploration across 16 iterations — evolving Google Maps from a navigation tool into an AI-powered road trip planning companion for the **Planner Friend**.

---

## The Problem

Google Maps is the default tool for *navigating* road trips, but not for *planning* them. Today, planning happens outside Maps — in TikTok saves, iMessage screenshots, Reddit tabs, and shared Google Docs — and gets stitched together manually by one person.

That person is the **Planner Friend**: a self-appointed user in every friend group who carries the full cognitive load of turning scattered inspiration into a feasible trip. They plan 1–2 weeks before departure, in evening sessions on the web, juggling 20–40 saved places across five different apps. They are alone in this work. The group will react, but rarely contribute.

Three concrete gaps make this hard today:

1. **The plan has nowhere to live.** Ask Maps generates a credible itinerary in a few prompts, but it lives inside a chat thread. If the chat breaks, the plan is gone. There is no persistent, editable, shareable trip object on Google Maps web.

2. **External inspiration can't get in.** A planner's trip is shaped by what they bring from outside Maps — TikToks, Reddit threads, a friend's text. None of this enters Maps automatically. The planner manually decodes each saved piece of content into a pin.

3. **The planner can't see the shape of their trip.** With 30–40 candidate places and room for maybe 12, there's no view in Maps that helps them see the trip as a system — no clustering, no pacing, no conflict detection between stops.

---

## What This Project Is

This is a personal design research project — 16 working prototypes, each one testing a different hypothesis about how road trip planning could feel inside Google Maps. Every iteration is a complete, runnable web app (no framework build step for most; React + Vite for later ones). They are meant to be opened, clicked, and broken — not read as static mockups.

The project focuses on the **pre-trip phase on Google Maps web**. It ends when the trip starts.

---

## Iteration Log

| # | Title | Key Ideas |
|---|-------|-----------|
| 1 | **Base UI** | Core map interface with search, place cards, and side panel results |
| 2 | **Itinerary Panel** | Multi-stop itinerary builder with draggable waypoints and route visualization |
| 3 | **AI Exploration** | AI-powered route suggestions with explore-along-the-route stops |
| 4 | **Mapbox Workspace** | Full planning workspace with Mapbox GL, reactive sliders, and AI trip summary |
| 5 | **Figma-Matched UI** | Pixel-perfect road trip planner — nav rail, split panel, route, POI list, itinerary |
| 6 | **AI Chat Panel** | Consolidated left panel with AI chat, route, and itinerary tabs; empty-state greeting |
| 7 | **Plan AI + Draw** | Mock Gemini chat, route polylines, POI grid, draw-polygon prompts, numbered pins |
| 8 | **Mark an Area** | Draw a region on the map to surface categorized POIs; persistent road trip list |
| 9 | **Conversational Landing** | Start on a chat screen, describe a trip to Gemini, watch map + route appear |
| 10 | **Route Editing & Saved Places** | Direct map route editing, red/yellow pin states, saved places tab, lasso draw mode |
| 11 | **Home → Map Flow** | Gemini-powered home screen, trip cards, Plan AI + Route tabs, draggable stop list |
| 12 | **Map-First, No Chat** | Floating centered prompt bar over the map; results appear as pins with no side panel |
| 13 | *(experimental)* | Internal explorations, not in main index |
| 14 | **AI Place Suggestions** | 15 curated Iceland places as colored pins; auto-building route with cheapest-insertion optimization |
| 15 | **Gemini AI Chat — Live** | Real Gemini 2.5 Flash; multi-turn chat; photo carousels; SVG circle draw for area queries |
| 16 | **React 18 + Vite** | Iteration 15 rebuilt as a proper React 18 app; Zustand global state; custom hooks; Vite |

---

## Tech Stack

| Layer | Iterations 1–15 | Iteration 16 |
|-------|----------------|--------------|
| Markup | Vanilla HTML | React 18 + JSX |
| Styling | Vanilla CSS (design tokens) | CSS Modules / Tailwind |
| Logic | Vanilla JS (no build) | React components + custom hooks |
| State | Module globals | Zustand |
| Bundler | None | Vite |
| Map | Google Maps JS API | Google Maps JS API |
| AI | Gemini 2.5 Flash (REST) | Gemini 2.5 Flash (REST) |

**Design tokens** live in [`design.md`](design.md) — colors, spacing, shadows, motion. All CSS references semantic tokens, not raw hex values.

---

## Running Locally

### Iterations 1–15 (vanilla, no build)

```bash
# Example: iteration 14 on port 3014
python3 -m http.server 3014 --directory iteration-14
```

Each folder has a `serve.sh` that starts a file server on its own port. The convention is `iteration-N → port 30N0`.

### Iteration 16 (React + Vite)

```bash
cd iteration-16
npm install
npm run dev      # starts Vite dev server (default: http://localhost:5173)
```

### Root index

The root [`index.html`](index.html) is a visual changelog of all iterations with live iframe previews. Serve it from the repo root:

```bash
python3 -m http.server 3000
```

---

## API Keys

The Google Maps JS API key is embedded inline in each `index.html` at the end of `<body>`. The Gemini API key is loaded from a `.env` file in iteration 15+ (`.env` is gitignored). To run those iterations locally, create a `.env` file:

```
VITE_GEMINI_API_KEY=your_key_here
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

---

## Repository Structure

```
/                       Root index (changelog of all iterations)
/design.md              Design token source of truth
/problem.md             User research: the Planner Friend problem space
/problem_part2.md       Extended problem research
/google_maps_apis.md    Maps Platform API reference
/iteration-N/           Each iteration — self-contained prototype
  index.html            All markup (single-page app)
  styles.css            All styles
  app.js                All JS logic
  serve.sh              One-line file server start script
/iteration-16/          React 18 + Vite rebuild
  src/                  Components, hooks, store
  public/               Static assets
  vite.config.js
```

Iterations are **copy-on-write**: each new iteration is a full copy of the previous one, then modified. Old iterations are never edited — the root index links all of them as a living changelog.

---

## Design Philosophy

- **Map first.** The map is the primary surface. Panels and chat are secondary. Everything the user does should be legible on the map.
- **Planner in control.** AI surfaces options and does the labor; the planner makes the calls. No auto-booking, no forced itineraries.
- **Survive contact with reality.** A good plan isn't the most complete plan — it's one that degrades gracefully when a restaurant is closed or a stop runs long.
- **One surface.** The planner shouldn't need to leave Maps to build a trip that is actually theirs.

---

## Context

This is a speculative design project — not affiliated with or endorsed by Google. It explores what road trip planning *could* look like if Google Maps were designed around the Planner Friend's workflow, rather than around point-to-point navigation.

The research framing, problem statements, and design tokens in this repo are original work. The Google Maps and Gemini APIs are used under their standard developer terms.
