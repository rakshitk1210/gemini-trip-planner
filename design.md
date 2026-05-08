# Google Maps — Design System Guidelines

## 1. Context & Goals

### Product
Google Maps web and mobile-web surfaces, focused on the map canvas, search, navigation, place details, and overlay UI (sheets, cards, controls).

### Audience
Consumers using Maps to search places, plan routes, navigate, and explore locations.

> **Note on brief inference:** The source brief flagged "e-commerce storefront" with low confidence. Maps is not a storefront product. This document treats the surface as **Maps consumer UI**. If commerce surfaces (e.g., Reserve with Google, hotel booking) are in scope, extend with a dedicated `commerce-*` token namespace rather than reshaping core tokens.

### Design intent
Deliver a calm, dense, map-first interface where chrome recedes, content is scannable, and every interactive element is reachable by keyboard, pointer, and touch with no ambiguity.

### Goals
- Consistency across surfaces with semantic tokens only — no raw hex in component code.
- WCAG 2.2 AA compliance, verifiable in implementation.
- Predictable component states, motion, and density.
- Implementation-ready specs that ship without designer-developer back-and-forth.

---

## 2. Design Tokens & Foundations

All component code **must** consume semantic tokens. Raw hex, raw px, and one-off values are prohibited outside this section.

### 2.1 Color — primitives

Primitives are the palette source of truth. Components **must not** reference primitives directly; use semantic tokens (§2.2).

| Token | Value |
|---|---|
| `palette.blue.50` | `#e8f0fe` |
| `palette.blue.500` | `#1a73e8` |
| `palette.blue.600` | `#1967d2` |
| `palette.blue.700` | `#185abc` |
| `palette.green.500` | `#34a853` |
| `palette.green.700` | `#188038` |
| `palette.yellow.500` | `#fbbc04` |
| `palette.yellow.700` | `#b06000` |
| `palette.red.500` | `#ea4335` |
| `palette.red.700` | `#c5221f` |
| `palette.neutral.0` | `#ffffff` |
| `palette.neutral.50` | `#f8f9fa` |
| `palette.neutral.100` | `#f1f3f4` |
| `palette.neutral.200` | `#e8eaed` |
| `palette.neutral.300` | `#dadce0` |
| `palette.neutral.500` | `#9aa0a6` |
| `palette.neutral.700` | `#5f6368` |
| `palette.neutral.800` | `#3c4043` |
| `palette.neutral.900` | `#202124` |
| `palette.neutral.1000` | `#000000` |

### 2.2 Color — semantic

Components **must** consume only semantic tokens.

**Surface**
| Token | Light | Dark |
|---|---|---|
| `color.surface.canvas` | `palette.neutral.50` | `palette.neutral.900` |
| `color.surface.raised` | `palette.neutral.0` | `palette.neutral.800` |
| `color.surface.overlay` | `palette.neutral.0` | `palette.neutral.800` |
| `color.surface.sunken` | `palette.neutral.100` | `palette.neutral.1000` |
| `color.surface.scrim` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` |

**Text** (all pairs verified ≥ 4.5:1 against their default surface)
| Token | Light | Dark | On |
|---|---|---|---|
| `color.text.primary` | `palette.neutral.900` | `palette.neutral.0` | `surface.raised` / `surface.canvas` |
| `color.text.secondary` | `palette.neutral.700` | `palette.neutral.300` | `surface.raised` / `surface.canvas` |
| `color.text.tertiary` | `palette.neutral.500` | `palette.neutral.500` | use only ≥ 18px or bold ≥ 14px |
| `color.text.disabled` | `palette.neutral.500` | `palette.neutral.500` | non-text decorative only |
| `color.text.onAccent` | `palette.neutral.0` | `palette.neutral.0` | `action.primary` |
| `color.text.link` | `palette.blue.700` | `palette.blue.500` | `surface.raised` |

**Action**
| Token | Light | Dark |
|---|---|---|
| `color.action.primary` | `palette.blue.500` | `palette.blue.500` |
| `color.action.primaryHover` | `palette.blue.600` | `palette.blue.500` (with state layer) |
| `color.action.primaryPressed` | `palette.blue.700` | `palette.blue.600` |
| `color.action.primaryDisabled` | `palette.neutral.200` | `palette.neutral.700` |
| `color.action.stateLayerHover` | `rgba(26,115,232,0.08)` | `rgba(138,180,248,0.08)` |
| `color.action.stateLayerPressed` | `rgba(26,115,232,0.12)` | `rgba(138,180,248,0.12)` |

**Border**
| Token | Light | Dark |
|---|---|---|
| `color.border.subtle` | `palette.neutral.200` | `palette.neutral.700` |
| `color.border.default` | `palette.neutral.300` | `palette.neutral.700` |
| `color.border.strong` | `palette.neutral.500` | `palette.neutral.500` |
| `color.border.focus` | `palette.blue.500` | `palette.blue.500` |

**Feedback**
| Token | Light | Dark |
|---|---|---|
| `color.feedback.success` | `palette.green.700` | `palette.green.500` |
| `color.feedback.warning` | `palette.yellow.700` | `palette.yellow.500` |
| `color.feedback.error` | `palette.red.700` | `palette.red.500` |
| `color.feedback.info` | `palette.blue.700` | `palette.blue.500` |
| `color.feedback.errorSurface` | `#fce8e6` | `#3c1815` |

**Map-specific** (overlays atop the map canvas)
| Token | Value |
|---|---|
| `color.map.routeDriving` | `palette.blue.500` |
| `color.map.routeWalking` | `palette.blue.500` (dashed) |
| `color.map.routeTransit` | `palette.green.500` |
| `color.map.trafficLight` | `palette.green.500` |
| `color.map.trafficModerate` | `palette.yellow.500` |
| `color.map.trafficHeavy` | `palette.red.500` |
| `color.map.pinDefault` | `palette.red.500` |
| `color.map.pinSelected` | `palette.blue.500` |

### 2.3 Typography

**Family**
- `font.family.primary`: `"Google Sans Text", Roboto, Arial, sans-serif`
- `font.family.display`: `"Google Sans", Roboto, Arial, sans-serif` (headings, brand moments only)
- `font.family.mono`: `"Google Sans Mono", "Roboto Mono", Menlo, Consolas, monospace`

**Scale** — perceptible steps; do not introduce intermediate sizes.
| Token | Size | Line height | Use |
|---|---|---|---|
| `font.size.xs` / `font.lineHeight.xs` | `12px` | `16px` | metadata, captions, legal |
| `font.size.sm` / `font.lineHeight.sm` | `14px` | `20px` | secondary text, dense lists |
| `font.size.md` / `font.lineHeight.md` | `16px` | `24px` | **base body** |
| `font.size.lg` / `font.lineHeight.lg` | `18px` | `26px` | emphasis body, place name in card |
| `font.size.xl` / `font.lineHeight.xl` | `22px` | `28px` | section headers, place detail title |
| `font.size.2xl` / `font.lineHeight.2xl` | `28px` | `36px` | page title |
| `font.size.3xl` / `font.lineHeight.3xl` | `36px` | `44px` | hero / empty-state headline |

**Weight**
- `font.weight.regular`: `400`
- `font.weight.medium`: `500` (buttons, tabs, active nav)
- `font.weight.bold`: `700` (rare; reserve for headings or strong emphasis)

**Base defaults**
- `font.size.base`: `font.size.md` (16px)
- `font.weight.base`: `font.weight.regular`
- `font.lineHeight.base`: `font.lineHeight.md`
- Letter spacing: `0` for body; `0.0125em` for buttons and tabs ≤ 14px.

### 2.4 Spacing

Linear scale, 4px base. Components **must not** use values outside this scale.

| Token | Value |
|---|---|
| `space.0` | `0` |
| `space.1` | `2px` |
| `space.2` | `4px` |
| `space.3` | `8px` |
| `space.4` | `12px` |
| `space.5` | `16px` |
| `space.6` | `20px` |
| `space.7` | `24px` |
| `space.8` | `32px` |
| `space.9` | `40px` |
| `space.10` | `48px` |
| `space.11` | `64px` |

### 2.5 Radius

| Token | Value | Use |
|---|---|---|
| `radius.none` | `0` | edge-to-edge surfaces |
| `radius.xs` | `4px` | inputs, small chips |
| `radius.sm` | `8px` | cards, menus, toasts |
| `radius.md` | `12px` | sheets, modals |
| `radius.lg` | `20px` | bottom sheets (top corners only) |
| `radius.pill` | `9999px` | search bar, FAB, filter chips |
| `radius.circle` | `50%` | avatars, icon buttons, map controls |

### 2.6 Shadow / Elevation

| Token | Value | Use |
|---|---|---|
| `shadow.0` | none | flat |
| `shadow.1` | `0 1px 2px rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)` | cards, search bar |
| `shadow.2` | `0 1px 2px rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)` | menus, raised buttons |
| `shadow.3` | `0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px rgba(60,64,67,0.3)` | modals, sheets |
| `shadow.4` | `0 6px 10px 4px rgba(60,64,67,0.15), 0 2px 3px rgba(60,64,67,0.3)` | popovers, dialogs |

In dark mode, shadows **must** be paired with a 1px `color.border.subtle` outline; elevation alone is insufficient on dark surfaces.

### 2.7 Z-index

| Token | Value | Use |
|---|---|---|
| `z.base` | `0` | map canvas |
| `z.raised` | `10` | map controls, attribution |
| `z.overlay` | `100` | search bar, FAB |
| `z.sheet` | `200` | bottom sheet, side panel |
| `z.scrim` | `300` | modal scrim |
| `z.modal` | `400` | dialogs |
| `z.popover` | `500` | tooltips, menus |
| `z.toast` | `600` | toasts, snackbars |
| `z.max` | `9999` | reserved for system errors only |

### 2.8 Motion

**Duration**
| Token | Value | Use |
|---|---|---|
| `motion.duration.instant` | `100ms` | state changes (hover, focus) |
| `motion.duration.fast` | `200ms` | small transitions, tooltips |
| `motion.duration.normal` | `300ms` | sheets, cards entering |
| `motion.duration.slow` | `500ms` | route drawing, map fly-to |

**Easing**
- `motion.easing.standard`: `cubic-bezier(0.2, 0, 0, 1)` — most transitions
- `motion.easing.decelerate`: `cubic-bezier(0, 0, 0, 1)` — entering elements
- `motion.easing.accelerate`: `cubic-bezier(0.3, 0, 1, 1)` — exiting elements
- `motion.easing.emphasized`: `cubic-bezier(0.2, 0, 0, 1)` — large surfaces (sheets)

**Reduced motion** — required.
When `prefers-reduced-motion: reduce`, components **must**:
- Replace transforms and translations with opacity changes only.
- Cap any remaining duration at `motion.duration.instant`.
- Disable parallax, auto-play, and decorative looping animation.
- Map fly-to animations **must** snap to destination instead of animating.

### 2.9 Breakpoints

| Token | Min width | Surface |
|---|---|---|
| `breakpoint.compact` | `0` | phone portrait |
| `breakpoint.medium` | `600px` | phone landscape, small tablet |
| `breakpoint.expanded` | `905px` | tablet, small laptop |
| `breakpoint.large` | `1240px` | desktop |
| `breakpoint.xlarge` | `1440px` | large desktop |

Layout **must** use mobile-first media queries (`min-width`).

### 2.10 Focus ring

A single focus ring system applies to **all** interactive elements.

- `focus.ring.color`: `color.border.focus` (`palette.blue.500`)
- `focus.ring.width`: `2px`
- `focus.ring.offset`: `2px`
- `focus.ring.radius`: matches the host element's radius
- `focus.ring.style`: `solid`

Focus rings **must** maintain ≥ 3:1 contrast against both the component background and the surrounding surface (WCAG 2.2 SC 1.4.11). On the map canvas, components **must** add a 1px `palette.neutral.0` outer halo to preserve contrast over varied imagery.

### 2.11 Touch targets

- Minimum hit area: **44×44 CSS px** (visual target may be smaller; expand with padding or `::before` pseudo-element).
- Minimum spacing between adjacent targets: `space.3` (8px).
- WCAG 2.2 SC 2.5.8 minimum (24×24) is treated as a hard floor; production **must** meet 44×44.

### 2.12 Iconography

- Source: Material Symbols Rounded.
- `icon.size.sm`: `16px`
- `icon.size.md`: `20px` (default)
- `icon.size.lg`: `24px`
- `icon.size.xl`: `32px` (FAB, hero)
- Stroke weight: `400` (regular).
- Icons used as the only label **must** carry an `aria-label`.

---

## 3. Component Rules

Every component **must** define: anatomy, variants, states (default, hover, focus-visible, active, disabled, loading, error where applicable), keyboard / pointer / touch behavior, responsive behavior, long-content and empty-state handling.

Density expectations from the source surface: ~69 buttons, 7 lists, 2 links, 1 input, 1 navigation region per main view. Specs below are tuned for that density.

### 3.1 Button

**Anatomy**: container, optional leading icon, label, optional trailing icon.

**Variants**
- `primary` — filled, `color.action.primary` background, `color.text.onAccent` label.
- `secondary` — outlined, `color.border.default` border, `color.text.primary` label.
- `tertiary` — text only, `color.text.link` label.
- `iconOnly` — circular (`radius.circle`), `space.3` padding, **must** include `aria-label`.
- `fab` — floating action button, `radius.circle`, `shadow.2`, used for primary map actions (e.g., recenter).

**Sizing**
| Size | Height | Padding x | Font | Icon |
|---|---|---|---|---|
| `sm` | `32px` | `space.4` | `font.size.sm` / `medium` | `icon.size.sm` |
| `md` | `40px` | `space.5` | `font.size.sm` / `medium` | `icon.size.md` |
| `lg` | `48px` | `space.6` | `font.size.md` / `medium` | `icon.size.md` |

Hit area **must** reach 44×44 even when visual height is 32 or 40.

**States**
| State | Treatment |
|---|---|
| default | tokens above |
| hover | overlay `color.action.stateLayerHover`, `motion.duration.instant` |
| focus-visible | focus ring per §2.10; **must not** rely on color change alone |
| active | overlay `color.action.stateLayerPressed` |
| disabled | `color.action.primaryDisabled` background, `color.text.disabled` label, `cursor: not-allowed`, `aria-disabled="true"`, **not** `disabled` for buttons that should remain in the tab order with explanatory tooltips |
| loading | label replaced or accompanied by spinner; `aria-busy="true"`; container width **must not** change |
| error | not a button state — use form field error or toast |

**Interaction**
- Keyboard: `Enter` and `Space` activate. `Tab` reaches; `Shift+Tab` retreats.
- Pointer: hover state on `:hover`; active state on `:active`.
- Touch: no hover state; pressed state on `touchstart`, released on `touchend` or `touchcancel`.

**Responsive / overflow**
- Labels **must not** wrap. If the label would wrap, switch to `iconOnly` at the next breakpoint down or truncate with ellipsis after a minimum of 8 characters.
- In toolbars under `breakpoint.medium`, secondary buttons **should** collapse into an overflow menu.

### 3.2 Search bar

The single dominant input on the surface.

**Anatomy**: leading menu icon, search field, trailing voice / clear / avatar icons, suggestions panel.

**Tokens**
- Height: `48px` (mobile), `44px` (desktop).
- Background: `color.surface.raised`.
- Radius: `radius.pill`.
- Shadow: `shadow.1` resting; `shadow.2` on focus.
- Padding: `space.5` horizontal.
- Font: `font.size.md` / `font.weight.regular`.

**States**
| State | Treatment |
|---|---|
| default | placeholder `color.text.secondary` |
| hover | `shadow.2` |
| focus-visible | focus ring §2.10; suggestions panel opens after `motion.duration.fast` |
| filled | clear (`×`) icon visible |
| loading | trailing spinner replaces voice icon; `aria-busy="true"` on the listbox |
| error | inline message below bar in `color.feedback.error`, `font.size.sm`; **must** be linked via `aria-describedby` |
| empty results | suggestions panel shows empty state (§3.6) |

**Interaction**
- Keyboard: `↓` moves focus into suggestions; `Esc` closes panel and returns focus to input; `Enter` submits the query or activates the highlighted suggestion.
- Pointer: clicking outside closes the panel.
- Touch: tapping the field opens the keyboard and the suggestions panel together; the panel **must not** be obscured by the on-screen keyboard.
- Implementation **must** use ARIA combobox pattern (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`).

**Long content**
- Long queries scroll horizontally within the input; **must not** wrap.
- Suggestion rows truncate with ellipsis at one line; full text **must** be available via `title` and screen-reader text.

### 3.3 List (place results, suggestions, recent searches)

**Anatomy**: row container, leading icon or thumbnail, primary text, secondary text, optional metadata, optional trailing action.

**Tokens**
- Row height: `56px` minimum (single-line), `72px` (two-line), `88px` (three-line with thumbnail).
- Padding: `space.5` horizontal, `space.4` vertical.
- Divider: `1px solid color.border.subtle` between rows; **must not** appear above the first or below the last row.
- Primary text: `font.size.md` / `medium`, `color.text.primary`.
- Secondary text: `font.size.sm` / `regular`, `color.text.secondary`.
- Metadata (distance, rating): `font.size.sm` / `regular`, `color.text.secondary`.

**States**
| State | Treatment |
|---|---|
| default | `color.surface.raised` |
| hover | overlay `color.action.stateLayerHover` |
| focus-visible | focus ring inset by `2px` to avoid clipping |
| active | overlay `color.action.stateLayerPressed` |
| selected | `color.surface.sunken` background, `font.weight.medium` primary text |
| disabled | `color.text.disabled`, `cursor: not-allowed`, `aria-disabled="true"` |
| loading | skeleton rows matching final row height; `aria-busy="true"` on the list |
| empty | see §3.6 |
| error | inline error row with retry; **must** preserve list scroll position |

**Interaction**
- Keyboard: `↑` / `↓` traverse rows; `Home` / `End` jump to first / last; `Enter` activates.
- Pointer: full row is the click target — **never** make only the title clickable.
- Touch: 44×44 minimum; long-press **may** open contextual actions but **must** also be reachable via a visible trailing action button.

**Long content**
- Primary text: 1 line, ellipsis. Full text **must** be in DOM for screen readers.
- Secondary text: up to 2 lines, ellipsis.
- Lists **must** virtualize beyond 50 rows.

**Empty state**: §3.6.

### 3.4 Link

**Tokens**
- Color: `color.text.link`.
- Text decoration: `underline` on hover and focus-visible; **may** be undecorated at rest only when the link sits in a list row context where the row itself is the activation target.
- Visited: `color.text.link` (Maps does not differentiate visited; **must not** introduce a new color).

**States**
| State | Treatment |
|---|---|
| default | underline only on hover/focus |
| hover | underline + `color.action.primaryHover` |
| focus-visible | focus ring + underline |
| active | `color.action.primaryPressed` |
| disabled | links **must not** be disabled — remove the link instead |

External links **must** carry an icon and `aria-label` suffix indicating "opens in new tab". `rel="noopener noreferrer"` is required.

### 3.5 Navigation (primary nav region)

A single primary navigation region per surface (tab bar on mobile, side rail on desktop).

**Anatomy**: container, nav items (icon + label), active indicator.

**Tokens**
- Mobile (bottom): height `56px`, `color.surface.raised`, top border `1px color.border.subtle`.
- Desktop (side rail): width `80px`, `color.surface.raised`, right border `1px color.border.subtle`.
- Item: icon `icon.size.lg`, label `font.size.xs` / `medium`.
- Active indicator: `color.action.primary` pill behind icon, `radius.pill`, height `32px`, width `64px`.

**States**
| State | Treatment |
|---|---|
| default | `color.text.secondary` icon and label |
| hover | overlay `color.action.stateLayerHover` |
| focus-visible | focus ring around the entire item |
| active (selected) | `color.action.primary` indicator behind icon, `color.text.primary` label |
| disabled | navigation items **must not** be disabled |

**Interaction**
- Keyboard: `Tab` enters the nav region; `←` / `→` (mobile) or `↑` / `↓` (desktop) move between items; `Enter` activates. Implementation **must** use `role="tablist"` only when items control a single content region; otherwise use `<nav>` with `aria-current="page"`.
- Touch: full item is the target, 44×44 minimum.

**Responsive**
- `< breakpoint.medium`: bottom tab bar.
- `≥ breakpoint.medium`: side rail.
- Maximum 5 items in the bottom bar; overflow **must** collapse into a "More" item, never wrap.

### 3.6 Empty state

Used by lists and panels when there is no content.

**Anatomy**: optional illustration or icon (`icon.size.xl`), headline (`font.size.lg` / `medium`), supporting text (`font.size.sm` / `color.text.secondary`), optional primary action.

**Rules**
- **Must** explain *why* the state is empty and *what to do next*.
- **Must not** use generic "No results" without a follow-up action or suggestion.
- Illustrations **should** be monochrome line art; no photographic imagery.

### 3.7 Loading state

- Skeleton placeholders **must** match the final element's dimensions to prevent layout shift (CLS = 0).
- Spinners **must** carry `aria-label="Loading"` (or localized equivalent) and the parent **must** set `aria-busy="true"`.
- Loading states **must not** block all interaction; cancellation paths (e.g., back, dismiss) **must** remain reachable.

### 3.8 Error state

- Inline errors **must** appear adjacent to the source of the error.
- Errors **must** describe the problem and a recovery action ("Try again", "Check your connection").
- Errors **must not** rely on color alone — pair with an icon and text (WCAG 2.2 SC 1.4.1).
- Toasts **must** auto-dismiss only for non-critical errors; persistent errors **must** require user dismissal.

---

## 4. Accessibility — Acceptance Criteria

Every criterion below **must** be testable. A component fails acceptance if any criterion below applies and is not met.

### 4.1 Contrast
- Body text ≥ 4.5:1 against its surface. **Test:** computed-style contrast check.
- Large text (≥ 18px or ≥ 14px bold) ≥ 3:1.
- Non-text UI (icons conveying meaning, focus rings, input borders) ≥ 3:1.
- Disabled elements are exempt but **must** still be perceivable.

### 4.2 Keyboard
- All interactive elements reachable via `Tab` in a logical order. **Test:** tab through page; verify order matches visual order.
- Focus never trapped except in modal dialogs, which **must** trap focus and return it to the invoking element on close.
- All actions available via mouse **must** be available via keyboard (WCAG 2.1.1).
- No keyboard shortcut **may** consist of a single character without a modifier or a way to remap (WCAG 2.1.4).

### 4.3 Focus visibility
- Focus indicator visible at all times when a component has keyboard focus. **Test:** screenshot diff between focused and unfocused; ≥ 3:1 contrast change.
- Focus indicator **must not** be obscured by adjacent content (WCAG 2.4.11).

### 4.4 Touch
- All interactive targets ≥ 44×44 CSS px. **Test:** automated bounding-box measurement.
- Adjacent targets separated by ≥ 8px or have non-overlapping hit areas.
- Pointer gestures requiring path-based input **must** have a single-point alternative (WCAG 2.5.1).

### 4.5 Semantics
- Every form field **must** have a programmatically associated label.
- Icon-only buttons **must** carry `aria-label`.
- Live regions **must** be used for status messages (`role="status"` or `aria-live="polite"`).
- Headings **must** form a logical outline (no skipped levels).

### 4.6 Motion
- `prefers-reduced-motion: reduce` honored per §2.8. **Test:** toggle OS setting; verify no transforms or auto-play.
- No content flashes more than 3 times per second (WCAG 2.3.1).

### 4.7 Resize and zoom
- Layout **must** remain usable at 200% browser zoom and 320 CSS px width (WCAG 1.4.10).
- Text **must** remain readable when user sets line-height to 1.5×, letter-spacing to 0.12×, word-spacing to 0.16× (WCAG 1.4.12).

### 4.8 Map-specific
- Map canvas **must** expose an alternative text or list view of visible places (WCAG 1.1.1).
- Markers and route lines **must not** rely on color alone — pair with shape, label, or pattern.
- Pan and zoom **must** be operable via keyboard (`+`, `−`, arrow keys) with focus on the map.

---

## 5. Content & Tone

### Voice
Concise, confident, implementation-focused. No marketing language. No second-person plural ("we"). Speak to the user directly, in plain language.

### Rules
- Buttons **must** start with a verb. ✅ "Get directions" ❌ "Directions for this place".
- Errors **must** describe the problem and the next step. ✅ "We can't find that place. Try a different name." ❌ "An error occurred."
- Empty states **must** suggest an action. ✅ "No saved places yet. Tap the bookmark icon on any place to save it." ❌ "Nothing here."
- Distance and time **must** localize. Use the user's locale for units (km / mi) and 12 / 24-hour clock.
- Place names **must** preserve original-language capitalization.
- Numbers **must** use locale-appropriate separators (`1,234` vs `1.234`).

### Examples
| Context | ✅ Use | ❌ Avoid |
|---|---|---|
| Search empty | "Search for a place, address, or category." | "What are you looking for?" |
| No GPS | "Turn on location to see places near you." | "Location unavailable." |
| Save action | "Save" | "Add to saved" |
| Loading directions | "Finding the fastest route…" | "Please wait." |

---

## 6. Anti-patterns and prohibited implementations

- **Must not** use raw hex, raw px, or one-off values in component code. All values come from §2.
- **Must not** ship components without focus-visible styles. Removing the default outline without a replacement is a hard fail.
- **Must not** rely on color alone to convey meaning (status, selection, error).
- **Must not** introduce new font sizes between scale steps. If a design needs `15px`, the answer is `14px` or `16px`.
- **Must not** use `radius.pill` or `radius.circle` on rectangular containers wider than `space.10` × 4 — the radius collapses visually.
- **Must not** disable links. Remove them.
- **Must not** use placeholder text as a label substitute.
- **Must not** auto-play media or animation longer than 5 seconds without a pause control.
- **Must not** use `outline: none` without a replacement focus indicator.
- **Must not** lock zoom (`user-scalable=no`) — violates WCAG 1.4.4.
- **Should not** introduce per-page typography or color exceptions; consistency outranks local visual ambition.

### Migration notes
- Surfaces still using `surface.base = #000000` from earlier drafts **must** migrate to `surface.canvas` (light) or `surface.canvas` (dark mode) and stop treating "base" as a single color.
- Surfaces using `text.inverse = #007b8b` (4.43:1 on white — fails AA) **must** migrate to `color.text.onAccent` for text on filled actions, or `color.text.link` for hyperlinks.
- The 1px / 3px / 9px / 10px / 15px spacing values from earlier drafts **must** snap to the nearest token in §2.4.

---

## 7. QA Checklist

Run before merging any component PR. Every box **must** check.

**Tokens**
- [ ] No raw hex, no raw px, no one-off motion or radius values in component source.
- [ ] All colors reference semantic tokens (§2.2), not primitives (§2.1).
- [ ] Light and dark mode both verified.

**States**
- [ ] Default, hover, focus-visible, active, disabled, loading, error all implemented or explicitly marked N/A.
- [ ] Loading does not change container dimensions.
- [ ] Disabled state preserves discoverability (tooltip or adjacent text).

**Interaction**
- [ ] Keyboard: full operation without a pointer.
- [ ] Pointer: hover and active states distinguishable.
- [ ] Touch: 44×44 minimum, no hover dependence.

**Accessibility**
- [ ] Contrast checked against §4.1.
- [ ] Focus ring visible and ≥ 3:1 against all adjacent surfaces.
- [ ] Reduced motion honored.
- [ ] Tested with screen reader (VoiceOver, NVDA, or TalkBack).
- [ ] Tested at 200% zoom and 320px viewport width.

**Content**
- [ ] All strings localizable; no concatenation of user-facing fragments.
- [ ] Verb-first button labels.
- [ ] Errors describe problem and recovery.

**Responsive**
- [ ] Behavior defined at every breakpoint (§2.9).
- [ ] Long-content, overflow, and empty states handled.

**Consistency**
- [ ] No new spacing, typography, or color values introduced.
- [ ] Component matches density expectations (button-heavy surfaces tolerate `sm` and `md`; reserve `lg` for primary CTAs).
