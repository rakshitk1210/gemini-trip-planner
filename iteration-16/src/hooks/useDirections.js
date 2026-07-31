import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';

const ROUTE_COLOR = '#1a73e8';

function animatePolyline(map, fullPath, polyRef) {
  polyRef.current = new google.maps.Polyline({
    path: [fullPath[0]], strokeColor: ROUTE_COLOR, strokeWeight: 3, strokeOpacity: 0.9, map, zIndex: 5,
  });
  const chunkSize = Math.max(1, Math.ceil(fullPath.length / 80));
  let i = 1;
  const extend = () => {
    if (!polyRef.current) return;
    for (let j = 0; j < chunkSize && i < fullPath.length; j++, i++) {
      polyRef.current.getPath().push(fullPath[i]);
    }
    if (i < fullPath.length) setTimeout(extend, 16);
  };
  setTimeout(extend, 100);
}

// One DirectionsService call. Resolves with the road-following path (array of
// LatLng) on success, or null if this request can't be routed.
function routeRequest(svc, request) {
  return new Promise(resolve => {
    svc.route(request, (result, status) => {
      resolve(status === 'OK' ? result.routes[0].overview_path : null);
    });
  });
}

const latLng = s => new google.maps.LatLng(s.lat, s.lng);

// Route a single leg between two stops: DRIVING, then WALKING, then null.
async function routeLeg(svc, a, b) {
  const base = { origin: latLng(a), destination: latLng(b) };
  return (
    await routeRequest(svc, { ...base, travelMode: google.maps.TravelMode.DRIVING }) ||
    await routeRequest(svc, { ...base, travelMode: google.maps.TravelMode.WALKING })
  );
}

export default function useDirections() {
  const map        = useMap();
  const routeStops = useAppStore(s => s.routeStops);
  const polyRef    = useRef(null);

  useEffect(() => {
    if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
    // Exclude comment-derived stops from the polyline — they are waypoints in the list
    // but have no road-routable location and the comment dot already marks the spot visually.
    const visibleStops = routeStops.filter(s => !s.id.startsWith('comment-stop-'));
    if (!map || visibleStops.length < 2) return;

    let cancelled = false;
    const svc = new google.maps.DirectionsService();

    (async () => {
      // Fast path: one multi-waypoint DRIVING request for the whole route.
      const waypoints = visibleStops.slice(1, -1).map(s => ({ location: latLng(s), stopover: true }));
      const full = await routeRequest(svc, {
        origin:            latLng(visibleStops[0]),
        destination:       latLng(visibleStops[visibleStops.length - 1]),
        waypoints,
        optimizeWaypoints: false,
        travelMode:        google.maps.TravelMode.DRIVING,
      });
      if (cancelled) return;
      if (full) { animatePolyline(map, full, polyRef); return; }

      // Robust path: the combined request failed (typically ZERO_RESULTS because
      // one AI-supplied coordinate is off-road — a glacier, park interior, etc.).
      // Route each leg independently so a single unroutable stop only degrades its
      // own segment instead of collapsing the entire route to straight lines.
      const fullPath = [];
      for (let k = 0; k < visibleStops.length - 1; k++) {
        const a = visibleStops[k], b = visibleStops[k + 1];
        const leg = await routeLeg(svc, a, b);
        if (cancelled) return;
        if (!leg) console.warn(`Route segment unroutable, drawing straight line: ${a.name} → ${b.name}`);
        const segPath = leg ? leg.slice() : [latLng(a), latLng(b)];
        // Drop the shared endpoint so consecutive legs don't duplicate a vertex.
        if (k > 0) segPath.shift();
        fullPath.push(...segPath);
      }
      if (cancelled || fullPath.length < 2) return;
      animatePolyline(map, fullPath, polyRef);
    })();

    return () => { cancelled = true; polyRef.current?.setMap(null); polyRef.current = null; };
  }, [map, routeStops]);
}
