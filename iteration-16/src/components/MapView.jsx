import React from 'react';
import Panel from './Panel.jsx';
import MapArea from './MapArea.jsx';

export default function MapView() {
  return (
    <div className="map-view" id="mapView">
      <Panel />
      <MapArea />
    </div>
  );
}
