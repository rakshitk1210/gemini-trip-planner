# User Insights — Road Trip Planning Research

## Behavioral Patterns (Observed)

- Relied on Instagram/Reels for destination recommendations (e.g., Tulip farms discovered via reels)
- Got recommendations from others who had done the same road trip before
- Uses Yelp and Claude for food recommendations
- Found it difficult to compare different routes and destinations side by side
- Uses Google Maps to look up driving time & distance between locations
- Generated quick itineraries using AI, then shared them in Google Docs
- Uses Gemini Pro, Claude Pro, and GPT as a **thinking partner** — prompts cross-reference Reddit, Instagram, Twitter, weather, and venue availability simultaneously; uses multiple AI tools to cross-verify
- Relies on hyperlinked AI outputs where clicking a location opens it directly in Google Maps
- Deliberately over-plans: prepares **20+ options**, expects to execute **5–6** — intentional buffer against closures and surprises
- Stores itinerary in Apple Notes (not Docs) for easy collaborative mobile access with venue hours baked in, so day-of is triage, not research
- Multi-tool workflow: **Google Sheets** (wishlist) → **AI** (itinerary draft) → **Google Maps** (route validation) → **Google Calendar** (day-of execution with color-coded blocks)
- Manually verifies AI itineraries for business hours, geographic flow, and route efficiency — AI reduces effort but doesn't eliminate human QA
- Plans buffer time explicitly to account for different energy levels between travel partners
- **CarPlay is non-negotiable** for safety — driving with a handheld phone is a dealbreaker; uses both Apple Maps and Google Maps while driving, preferring Google Maps for its simpler 2D interface
- **Zero replanning on-trip** — all research is pre-trip; on the road it's pure execution

---

## Desires & Frustrations

- AI itineraries felt efficient but too rigid — "very stiff and minute to minute plan, not easily adaptable"
- Would like to hear recommendations from friends within the planning tool
- Wants to ask Maps conversational questions like: *"What are coffee shops along the route with both food and coffee?"*
- Heavy AI reliance creates anxiety — *"if this fails, my plan is nothing"*
- **Real-time data gap**: AI and maps can't reflect minute-by-minute conditions (e.g., a landslide closed a highway that wasn't flagged until they physically stopped and asked someone)
- **Route disruption UX**: when a destination closes mid-trip and the route resets, maps go blank — causing missed exits and stress. Wants a multi-window view showing old and new routes simultaneously
- Route efficiency (directional flow, no backtracking) is a real cognitive burden that planners solve manually — AI-generated routes miss this
- **Collaboration asymmetry**: one person takes the planning lead while the other is passive ("go with the flow"), creating a single point of failure and blame when things go wrong

---

## Research Findings — Road Trip Planning Insights

### 1. Uses Red Note as the primary research tool
Treats it like "Wikipedia but formatted better" — browses photos, text, and comments to discover destinations and activities. Specifically focuses on negative comments because "usually they're more true." Also uses it to distinguish sponsored posts from genuine reviews.

### 2. Maintains a personal wish list of destinations
Plans trips by cross-referencing visa requirements and tourism infrastructure. Costa Rica was chosen over other Central American countries because no visa was needed for American passport holders and it has a well-developed tourism system.

### 3. Pins everything in Google Maps before the trip
Creates a saved list per country, pins all desired stops, then strings them together to estimate drive times. Route order is determined visually by looking at the map and deciding what's geographically logical. (Showed lists for Switzerland, Croatia, Iceland, and Berlin — each with layered pins by city or activity type.)

### 4. Plans activities based on group profile
Tailors itineraries to the specific group — age, interests, physical ability. Museum and jazz bars for artsy friends, gentler sightseeing for older generations, no hardcore hiking for parents. *"I just consider about ages, socially, interest."*

### 5. Books accommodation across multiple platforms for best price
Compares Booking, Expedia, and Trip.com. After two fake listing experiences in Miami (discovered at 11pm), shifted preference toward chain brands like Holiday Inn as more trustworthy.

### 6. Tried dedicated trip planner apps but returned to Google Maps
Experimented with road trip planning apps but found them lacking because maps and routing weren't powerful enough. Key limitation: *"They don't know which one you want to give up"* — AI-generated routes can't account for personal priorities, so they always revert to manual pinning in Google Maps.

### 7. AI is a starting point, not a final answer
Users prompt AI with hard constraints ("I definitely want to go to X and Y") and treat the output as a first draft. But they still manually verify: business hours and closures, geographic flow to avoid backtracking, and route optimization the AI missed. Success rate is high (~80–90%), but the remaining gap creates real anxiety when trust breaks down.

### 8. The pre-built wishlist is the safety net for disruption
When plans fall apart (wrong day, closed venue), planners don't search from scratch — they pull from an **existing wishlist** to reconstruct the day. Upfront over-planning directly enables graceful recovery from on-trip chaos.

### 9. Collaboration is structurally asymmetric
One person leads planning; the other is passive until things go wrong. This creates a single point of failure, friction getting input from the passive traveler, and blame dynamics when mistakes happen (e.g., a Thursday/Friday mix-up). Planning tools are designed for symmetric collaboration that doesn't reflect how most groups actually work.

### 10. The drive itself is undervalued in planning
The most fondly remembered part of a road trip is often the **unstructured car time** — conversations, spontaneous stops, coastal views. Yet nearly all planning effort goes into destinations. There's a gap between what gets planned and what gets remembered. En-route experiences (viewpoints, pit stops, scenic detours) are consistently under-surfaced.

---

## Design Implications

**Chat feels like a search filter, not a conversation.**
Right now every message returns a grid of cards. Nothing carries forward. Fix: make responses reference the trip context. *"Since you're going through Anacortes, here are spots right off the ferry route."* Hard-code 2–3 contextual response templates that feel like they know your route. The illusion of continuity matters more than real continuity at proto stage.

**Route disruption needs continuity, not a blank slate.**
When a stop changes mid-trip, the map clears and the user loses their bearings. Show old and new routes simultaneously during a reroute so the driver can reconcile where they were headed with where they're going now.

**The AI trust gap is about real-time data, not quality.**
Users rate AI planning at ~80–90% accuracy — high enough to rely on, low enough to verify. The failure mode isn't bad suggestions; it's stale data (closed roads, changed hours). Surfacing data freshness ("last verified 3 days ago") or flagging uncertainty would do more than improving the suggestions themselves.

**Design for the lead planner, not a committee.**
Most groups have one person doing the work and one or more people who are passive until something goes wrong. Tools that optimize for symmetric collaboration (shared editing, voting, polls) miss the real dynamic. Instead: make it easy for the lead planner to share a read-only view, and for passive travelers to surface preferences without taking over the workflow.

**Surface the drive, not just the destination.**
Users plan destinations exhaustively but remember the journey most vividly. A feature that highlights en-route experiences — scenic overlooks, interesting pit stops, viewpoints along the route — would surface value that currently lives nowhere in the planning workflow.
