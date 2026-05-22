import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';
import useMapOverlays from '../hooks/useMapOverlays.js';
import useDirections from '../hooks/useDirections.js';
import usePlaceImages from '../hooks/usePlaceImages.js';

export default function MapCanvas() {
  const map           = useMap();
  const setMapInstance= useAppStore(s => s.setMapInstance);
  const aiPlaces      = useAppStore(s => s.aiPlaces);
  const activeCircle  = useAppStore(s => s.activeCircle);

  // Register map instance in store; also locks/unlocks map when circle is active
  useEffect(() => {
    if (!map) return;
    setMapInstance(map);
  }, [map]);

  useEffect(() => {
    if (!map) return;
    map.setOptions(activeCircle
      ? { draggable: false, scrollwheel: false, disableDoubleClickZoom: true,  gestureHandling: 'none' }
      : { draggable: true,  scrollwheel: true,  disableDoubleClickZoom: false, gestureHandling: 'auto' }
    );
  }, [map, activeCircle]);

  // Hooks that manage map overlays, directions, and place images
  useMapOverlays();
  useDirections();
  usePlaceImages(aiPlaces.map(p => p.name));

  return null;
}
