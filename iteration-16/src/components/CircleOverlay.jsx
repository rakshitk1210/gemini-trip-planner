import React, { useEffect } from 'react';
import useAppStore from '../store/useAppStore.js';
import useCircleDraw, { hideOverlay, updateOverlay } from '../hooks/useCircleDraw.js';

export default function CircleOverlay({ mapAreaRef }) {
  const drawMode    = useAppStore(s => s.drawMode);
  const activeCircle= useAppStore(s => s.activeCircle);
  const clearCircle = useAppStore(s => s.clearCircle);

  // Attach draw event listeners when in draw mode
  useCircleDraw(mapAreaRef);

  // Keep SVG in sync with activeCircle when it changes (e.g. handle drag)
  useEffect(() => {
    if (activeCircle) {
      updateOverlay(activeCircle.cx, activeCircle.cy, activeCircle.r);
    } else {
      hideOverlay();
    }
  }, [activeCircle]);

  // Escape key removes the active circle
  useEffect(() => {
    if (!activeCircle) return;
    const onKey = (e) => { if (e.key === 'Escape') clearCircle(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activeCircle, clearCircle]);

  return (
    <>
      <svg id="circleOverlay" className="circle-overlay">
        <defs>
          <filter id="labelShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>
        <circle id="svgCircle" className="svg-circle" cx="0" cy="0" r="0" style={{ display: 'none' }} />
        <line id="svgRadiusLine" className="svg-radius-line" x1="0" y1="0" x2="0" y2="0" style={{ display: 'none' }} />
        <text id="svgArcLabel" className="svg-arc-label" textAnchor="middle" filter="url(#labelShadow)" style={{ display: 'none' }} />
        <circle id="svgCenterDot" className="svg-handle-dot" r="6" style={{ display: 'none' }} />
        <circle id="svgEdgeDot"   className="svg-handle-dot" r="6" style={{ display: 'none' }} />
      </svg>

      {activeCircle && (
        <button
          className="circle-remove-btn is-visible"
          id="circleRemoveBtn"
          style={{ left: activeCircle.cx, top: activeCircle.cy - activeCircle.r - 20 }}
          onClick={clearCircle}
        >
          <span className="material-symbols-rounded">close</span>
          Remove area
        </button>
      )}
    </>
  );
}
