# Google Maps Platform APIs — Reference Guide

> Project: My First Project | All APIs use a single API key from Keys & Credentials

---

## 🌍 Environment APIs

| API | What it does | Tier | Resolution |
|-----|-------------|------|------------|
| **Air Quality API** | Returns pollution & air quality data for a lat/lng | Essentials | 500 × 500 m grid |
| **Weather API** | Returns current weather data for a lat/lng | Essentials | Location-level |
| **Solar API** | Satellite imagery + sunlight analytics for solar proposals | Essentials | Building-level |
| **Pollen API** | Returns pollen count data for a lat/lng | Pro | 1 × 1 km grid |

---

## 🗺️ Maps Display APIs

| API | What it does | Platform | Tier |
|-----|-------------|----------|------|
| **Maps JavaScript API** | Embed interactive Google Map on a website | Web | Essentials |
| **Maps SDK for Android** | Google Maps in a native Android app | Android | Essentials |
| **Maps SDK for iOS** | Google Maps in a native iOS app | iOS | Essentials |
| **Maps Embed API** | Drop a map into a webpage with minimal code (iframe) | Web | Essentials |
| **Maps Static API** | Returns a non-interactive map as a plain PNG image | Web | Essentials |
| **Map Tiles API** | Raw 2D, 3D, and Street View tile chunks for custom map builds | Web | Essentials |
| **Maps 3D SDK for Android** | Full immersive 3D map experience in native Android apps | Android | — |
| **Maps 3D SDK for iOS** | Full immersive 3D map experience in native iOS apps | iOS | — |
| **Map Management API** | RESTful API to programmatically manage & apply custom map styles | Web | — |
| **Maps Datasets API** | Upload your own geospatial data and use it on Google Maps | Web | — |
| **Maps Grounding Lite** | Feed live Google Maps data into AI/agentic workflows | AI/Agents | — |

---

## 📸 Maps Imagery APIs

| API | What it does | Tier |
|-----|-------------|------|
| **Street View Static API** | Fetch a real-world street-level photo for any address as a static image | Essentials |
| **Street View Publish API** | Upload your own 360° photos to Google Maps with metadata | — |
| **Aerial View API** | Get 3D cinematic drone-style video of any location | Pro |
| **Maps Elevation API** | Get elevation above sea level for any coordinate on Earth | Pro |

---

## 📍 Places APIs

| API | What it does | Tier |
|-----|-------------|------|
| **Places API** | Detailed info on 100M+ places — name, address, hours, reviews, photos | — |
| **Places API (New)** | Next-gen version with 200M+ places and improved data fields | Essentials |
| **Places UI Kit** | Pre-built UI widgets to display place info on any map, a few lines of code | — |
| **Geocoding API** | Convert address → lat/lng coordinates (and reverse) | Essentials |
| **Geolocation API** | Determine device location using cell towers + WiFi nodes (no GPS needed) | Essentials |
| **Time Zone API** | Get the time zone for any lat/lng coordinate in the world | Essentials |
| **Address Validation API** | Verify whether an address is real and correctly formatted | Pro |
| **Places Aggregate API** | Analyze place distributions and density across a defined area | Pro |

---

## 🛣️ Routes APIs

| API | What it does | Tier |
|-----|-------------|------|
| **Directions API** | Get turn-by-turn directions between multiple locations (A→B or multi-stop) | Essentials |
| **Distance Matrix API** | Get travel time & distance for many origin-destination pairs simultaneously | Essentials |
| **Routes API** | Newer, faster, combined replacement for Directions + Distance Matrix | Essentials |
| **Roads API** | Snap raw GPS coordinates to the actual road network | Pro |
| **Route Optimization API** | Find the optimal stop order for multi-vehicle, multi-stop delivery routing | Pro |
| **Navigation SDK** | Full turn-by-turn navigation UI inside your own app (contract required) | Enterprise |

---

## 🔑 Key Facts

- **One API key** covers all APIs in your project — find it under `Keys & Credentials`
- Each API must be **individually enabled/disabled** — toggling is separate from the key
- **Restrict your key** — lock it to specific APIs or HTTP referrers to prevent unauthorized usage (Google strongly recommends this)
- **Tiers matter for billing** — Essentials is cheapest, Pro is mid-tier, Enterprise requires a sales contract
- **Navigation SDK** is the only API that cannot be unlocked with just a key — it requires an Enterprise agreement

---

## 📖 Quick Tier Reference

| Tier | What it means |
|------|--------------|
| **Essentials** | Standard access, pay-per-use, lowest cost |
| **Pro** | Higher data quality or advanced features, higher cost |
| **Enterprise** | Contract-based, custom pricing, SLA guarantees |
