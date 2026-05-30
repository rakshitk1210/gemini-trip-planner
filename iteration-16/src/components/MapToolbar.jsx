import React from 'react';
import useAppStore from '../store/useAppStore.js';

export default function MapToolbar() {
  const mapInstance       = useAppStore(s => s.mapInstance);
  const drawMode          = useAppStore(s => s.drawMode);
  const toggleDrawMode    = useAppStore(s => s.toggleDrawMode);
  const commentMode       = useAppStore(s => s.commentMode);
  const toggleCommentMode = useAppStore(s => s.toggleCommentMode);

  const zoomIn  = () => mapInstance?.setZoom((mapInstance.getZoom() ?? 8) + 1);
  const zoomOut = () => mapInstance?.setZoom((mapInstance.getZoom() ?? 8) - 1);

  return (
    <div className="toolbar">
      <div className="toolbar-card">
        <div className="toolbar-tip" data-tip="Zoom in">
          <button className="toolbar-zoom-btn" onClick={zoomIn}>
            <span className="material-symbols-rounded">add</span>
          </button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-tip" data-tip="Zoom out">
          <button className="toolbar-zoom-btn" onClick={zoomOut}>
            <span className="material-symbols-rounded">remove</span>
          </button>
        </div>
      </div>
      <div className="toolbar-card toolbar-card--tools">
        <div className="toolbar-tip" data-tip="Draw area">
          <button
            className={`toolbar-tool-btn${drawMode ? ' toolbar-tool-btn--active' : ''}`}
            id="drawCircleBtn"
            onClick={toggleDrawMode}
          >
            <span className="material-symbols-rounded">architecture</span>
          </button>
        </div>
        <div className="toolbar-tip" data-tip="Comments">
          <button
            className={`toolbar-tool-btn${commentMode ? ' toolbar-tool-btn--active' : ''}`}
            onClick={toggleCommentMode}
          >
            <span className="material-symbols-rounded">mode_comment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
