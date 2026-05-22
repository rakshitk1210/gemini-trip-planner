import React, { useRef } from 'react';
import { Map } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';
import MapCanvas from './MapCanvas.jsx';
import PlaceCard from './PlaceCard.jsx';
import CircleOverlay from './CircleOverlay.jsx';
import MapToolbar from './MapToolbar.jsx';
import { MAP_STYLES } from '../constants.js';

function OptimizeToast() {
  const routeStops = useAppStore(s => s.routeStops);
  const [visible, setVisible] = React.useState(false);
  const prevLen = React.useRef(0);

  React.useEffect(() => {
    const n = routeStops.length;
    if (n >= 2 && n !== prevLen.current) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      prevLen.current = n;
      return () => clearTimeout(t);
    }
    prevLen.current = routeStops.length;
  }, [routeStops.length]);

  return (
    <div
      className={`optimize-toast${visible ? ' toast-in' : ''}`}
      id="optimizeToast"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span className="material-symbols-rounded">auto_awesome</span>
      Route optimized
    </div>
  );
}

export default function MapArea() {
  const mapAreaRef = useRef(null);

  return (
    <div className="map-area" id="mapArea" ref={mapAreaRef}>

      {/* Map fills the area; MapCanvas is a child so it can use useMap() */}
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultCenter={{ lat: 63.87, lng: -20.10 }}
        defaultZoom={8}
        disableDefaultUI={true}
        gestureHandling="auto"
        styles={MAP_STYLES}
      >
        <MapCanvas />
      </Map>

      {/* SVG circle drawing overlay — absolutely positioned over map */}
      <CircleOverlay mapAreaRef={mapAreaRef} />

      <OptimizeToast />

      <PlaceCard />

      <div className="map-topright">
        <button className="share-btn">
          <span className="material-symbols-rounded">share</span>
          Share
        </button>
        <img className="user-avatar" src="https://picsum.photos/seed/rakshit/40/40" alt="User" />
      </div>

      {/* Toolbar uses mapInstance from store — no need to be inside <Map> */}
      <MapToolbar />

    </div>
  );
}
