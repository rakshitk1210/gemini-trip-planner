# Road Trip Planning on Google Maps

## Context

Google Maps is the default tool for navigating road trips, but not for planning them. Today, planning happens *outside* Maps in TikTok saves, iMessage screenshots, Reddit tabs, and shared Google Docs, and gets stitched together manually by one person.

That one person is the **Planner Friend**: a self-appointed user in every friend group who carries the full cognitive load of turning scattered inspiration into a feasible trip. Research on US 18 to 24 year-old friend groups shows this role is load-bearing, under-supported, and a source of quiet burnout.

Ask Maps shipped a Gemini-powered conversational layer that generates plausible itineraries from a prompt. It is a strong starting point. It is not a planning workspace. The plan it produces lives inside a chat thread, is fragile when the conversation breaks, and does not hold up across multiple planning sessions.

This project focuses on the Planner Friend on Google Maps web, in the pre-trip phase. The project ends when the trip starts.

## The user

The Planner Friend.
- 18 to 24, planning a road trip for 3 to 6 friends
- Plans 1 to 2 weeks before departure, in evening sessions on web
- Has 20 to 40 places saved across Maps Lists, Instagram, TikTok, screenshots, and DMs
- Is alone in this work; the group will react but rarely contribute
- Wants control over the plan but support with the labor

## The three problems

### Problem 1. The plan has nowhere to live

Ask Maps generates a credible itinerary in a few prompts. But that itinerary lives inside a chat thread. There is no persistent, editable, shareable trip object on Google Maps web. If the chat breaks, the plan is gone. If the planner returns the next evening, they reopen a conversation, not a workspace.

The planner ends up exporting the Ask Maps output back into a Google Doc, recreating in a generic tool what should be native to Maps. The most underserved part of the planner's workflow is not the first draft. It is everything they do after the first draft, across multiple sessions, in a workspace that holds shape.

### Problem 2. External inspiration cannot get into the plan

A planner's trip is shaped by what they bring from outside Maps. The TikTok of a hidden viewpoint. The friend's text recommending a coffee shop. The Reddit thread about a stretch of highway. None of this enters Maps automatically. The planner manually decodes each saved piece of content into a structured pin, looks it up, judges if it fits the route, and adds it to the plan. This is the most invisible and tiring part of being the planner.

Ask Maps generates suggestions from Maps' own data. It does not know about the planner's external finds. As Ask Maps becomes the default starting point, the planner's outside inspiration is the thing that makes a trip *theirs* rather than generic. The gap between external inspiration and the Maps plan is now strategically more important, not less.

### Problem 3. The planner cannot see the shape of their trip

The planner has 30 to 40 candidate places and room for maybe 12. Today they eyeball the map and mentally cluster, mentally sequence, mentally pace. There is no view in Google Maps that helps them see the trip as a system. No clustering by geography. No conflict detection between nearby stops. No density warnings on overpacked days. No surface for marking some stops as anchors and others as optional.

This matters because overpacked plans fail. Our team's own road trip ran behind schedule from minute one because the plan had too many stops with too little slack. By dinner, restaurants were closing. The friction during the trip was an in-trip symptom of a pre-trip cause: the plan was optimized for completeness, not for survival. Maps has all the data to help the planner shape a trip that holds up. Today it offers none of it.

## Why Google Maps is the right surface

- Owns the data layer. Places, hours, reviews, photos, traffic, drive times.
- Owns the inspiration primitive. Saved Places and Lists already exist; they just do not *do* anything once you save.
- Owns the routing engine. Real multi-stop, real-time routing nobody else can match.
- Web is where planning happens. Mobile is for capture and navigation; web is for thinking.

## Project goals

1. Make Google Maps the natural home for a road trip plan, not just for navigating it.
2. Reduce the cognitive load on the Planner Friend during pre-trip planning.
3. Help the planner build a trip that survives contact with reality.
4. Keep the planner in control. Support their work; do not replace their judgment.

## How might we's

### For Problem 1 (the plan has nowhere to live)
- HMW make a road trip a first-class object on Google Maps web?
- HMW let the planner refine, restructure, and resume their plan across multiple sessions?
- HMW move from "Ask Maps generated a chat response" to "I am working on my trip"?

### For Problem 2 (external inspiration cannot get into the plan)
- HMW bring places and recommendations from TikTok, Instagram, Reddit, and friends into a Maps trip with minimal manual work?
- HMW preserve the texture of inspiration (who recommended it, why it was saved) inside the plan?
- HMW combine the planner's external finds with Ask Maps' suggestions in one coherent trip?

### For Problem 3 (the planner cannot see the shape of their trip)
- HMW show the planner trip-level information, pace, density, drive time, conflicts, that single-pin lookups hide today?
- HMW help the planner cut a long candidate list down to a feasible multi-day route?
- HMW let the planner express anchors vs. optional stops so the trip degrades gracefully when reality intervenes?

## Out of scope

- During-trip experience and real-time plan changes (separate project)
- In-car multi-device co-presence and driver/passenger workflows (separate project)
- Group collaboration mechanics and live multi-user editing
- Booking integrations (lodging, activities)
- Post-trip artifacts (memory, photo albums, reviews)
- Mobile-first planning experience

These are real and adjacent. The planner's pre-trip web experience is where this project will focus.
