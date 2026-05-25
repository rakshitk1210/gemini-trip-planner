import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';

function drawStraightPolyline(map, stops) {
  return new google.maps.Polyline({
    path:          stops.map(s => ({ lat: s.lat, lng: s.lng })),
    strokeColor:   '#1a73e8',
    strokeWeight:  3,
    strokeOpacity: 0.7,
    geodesic:      true,
    map,
    zIndex: 5,
  });
}

function animatePolyline(map, fullPath, polyRef) {
  polyRef.current = new google.maps.Polyline({
    path: [fullPath[0]], strokeColor: '#1a73e8', strokeWeight: 3, strokeOpacity: 0.9, map, zIndex: 5,
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

export default function useDirections() {
  const map        = useMap();
  const routeStops = useAppStore(s => s.routeStops);
  const polyRef    = useRef(null);

  useEffect(() => {
    if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
    if (!map || routeStops.length < 2) return;

    const svc      = new google.maps.DirectionsService();
    const origin   = new google.maps.LatLng(routeStops[0].lat, routeStops[0].lng);
    const dest     = new google.maps.LatLng(routeStops[routeStops.length - 1].lat, routeStops[routeStops.length - 1].lng);
    const waypoints = routeStops.slice(1, -1).map(s => ({
      location: new google.maps.LatLng(s.lat, s.lng), stopover: true,
    }));

    const baseRequest = { origin, destination: dest, waypoints, optimizeWaypoints: false, avoidFerries: false };

    const tryMode = (mode, onFail) => {
      svc.route({ ...baseRequest, travelMode: mode }, (result, status) => {
        if (status === 'OK') {
          animatePolyline(map, result.routes[0].overview_path, polyRef);
        } else {
          console.warn(`DirectionsService ${mode} failed (${status}):`, routeStops.map(s => `${s.name} (${s.lat.toFixed(3)},${s.lng.toFixed(3)})`));
          onFail();
        }
      });
    };

    // Try DRIVING → fallback WALKING → fallback straight line
    tryMode(google.maps.TravelMode.DRIVING, () =>
      tryMode(google.maps.TravelMode.WALKING, () => {
        polyRef.current = drawStraightPolyline(map, routeStops);
      })
    );

    return () => { polyRef.current?.setMap(null); polyRef.current = null; };
  }, [map, routeStops]);
}
