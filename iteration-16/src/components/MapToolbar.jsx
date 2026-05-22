import React from 'react';
import useAppStore from '../store/useAppStore.js';

export default function MapToolbar() {
  const mapInstance    = useAppStore(s => s.mapInstance);
  const drawMode       = useAppStore(s => s.drawMode);
  const toggleDrawMode = useAppStore(s => s.toggleDrawMode);

  const zoomIn  = () => mapInstance?.setZoom((mapInstance.getZoom() ?? 8) + 1);
  const zoomOut = () => mapInstance?.setZoom((mapInstance.getZoom() ?? 8) - 1);

  return (
    <div className="toolbar">
      <div className="toolbar-card">
        <button className="toolbar-zoom-btn" onClick={zoomIn}>
          <span className="material-symbols-rounded">add</span>
        </button>
        <div className="toolbar-divider" />
        <button className="toolbar-zoom-btn" onClick={zoomOut}>
          <span className="material-symbols-rounded">remove</span>
        </button>
      </div>
      <div className="toolbar-card toolbar-card--tools">
        <button
          className={`toolbar-tool-btn${drawMode ? ' toolbar-tool-btn--active' : ''}`}
          id="drawCircleBtn"
          onClick={toggleDrawMode}
          title="Draw area circle"
        >
          <span className="material-symbols-rounded">architecture</span>
        </button>
        <button className="toolbar-tool-btn">
          <span className="material-symbols-rounded">wrap_text</span>
        </button>
        <button className="toolbar-tool-btn">
          <span className="material-symbols-rounded">mode_comment</span>
        </button>
      </div>
    </div>
  );
}
