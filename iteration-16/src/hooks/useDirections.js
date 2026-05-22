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

export default function useDirections() {
  const map        = useMap();
  const routeStops = useAppStore(s => s.routeStops);
  const polyRef    = useRef(null);

  useEffect(() => {
    if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
    if (!map || routeStops.length < 2) return;

    const svc = new google.maps.DirectionsService();
    svc.route({
      origin:      { lat: routeStops[0].lat, lng: routeStops[0].lng },
      destination: { lat: routeStops[routeStops.length - 1].lat, lng: routeStops[routeStops.length - 1].lng },
      waypoints:   routeStops.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
      travelMode:  google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    }, (result, status) => {
      if (status !== 'OK') {
        console.warn('DirectionsService:', status);
        polyRef.current = drawStraightPolyline(map, routeStops);
        return;
      }
      const fullPath = result.routes[0].overview_path;
      polyRef.current = new google.maps.Polyline({
        path: [fullPath[0]], strokeColor: '#1a73e8', strokeWeight: 3, strokeOpacity: 0.9, map, zIndex: 5,
      });
      // Animate the polyline drawing
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
    });

    return () => { polyRef.current?.setMap(null); polyRef.current = null; };
  }, [map, routeStops]);
}
