import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';
import { haversineKm } from '../constants.js';

function pixelsToKm(map, cx, cy, r) {
  try {
    const proj   = map.getProjection();
    const bounds = map.getBounds();
    if (!proj || !bounds) return r * 0.3;
    const mapDiv = document.getElementById('mapArea');
    if (!mapDiv) return r * 0.3;
    const w = mapDiv.offsetWidth, h = mapDiv.offsetHeight;
    const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
    const nePt = proj.fromLatLngToPoint(ne), swPt = proj.fromLatLngToPoint(sw);
    const toLatLng = (px, py) => {
      const wx = swPt.x + (px / w) * (nePt.x - swPt.x);
      const wy = nePt.y + (py / h) * (swPt.y - nePt.y);
      return proj.fromPointToLatLng(new google.maps.Point(wx, wy));
    };
    const center = toLatLng(cx, cy);
    const edge   = toLatLng(cx + r, cy);
    return haversineKm({ lat: center.lat(), lng: center.lng() }, { lat: edge.lat(), lng: edge.lng() });
  } catch { return r * 0.3; }
}

export default function useCircleDraw(mapAreaRef) {
  const map      = useMap();
  const drawMode = useAppStore(s => s.drawMode);

  const drawStateRef = useRef({ active: false, origin: null, radius: 0 });
  // Handle-drag state
  const handleDragRef = useRef({ target: null, start: null });

  useEffect(() => {
    if (!drawMode || !mapAreaRef.current) return;

    const el = mapAreaRef.current;

    function onMouseDown(e) {
      e.stopPropagation();
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      drawStateRef.current = {
        active: true,
        origin: { x: e.clientX - rect.left, y: e.clientY - rect.top },
        radius: 0,
      };
      updateOverlay(drawStateRef.current.origin.x, drawStateRef.current.origin.y, 0);
    }

    function onMouseMove(e) {
      const ds = drawStateRef.current;
      if (!ds.active || !ds.origin) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      ds.radius = Math.hypot(mx - ds.origin.x, my - ds.origin.y);
      updateOverlay(ds.origin.x, ds.origin.y, ds.radius);
    }

    function onMouseUp(e) {
      const ds = drawStateRef.current;
      if (!ds.active || !ds.origin) return;
      e.stopPropagation();
      ds.active = false;
      if (ds.radius < 20) { hideOverlay(); return; }
      finalizeCircle(ds.origin.x, ds.origin.y, ds.radius);
    }

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup',   onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup',   onMouseUp);
    };
  }, [drawMode, mapAreaRef]);

  function finalizeCircle(cx, cy, r) {
    const radiusKm = map ? pixelsToKm(map, cx, cy, r) : r * 0.3;
    const circle   = { cx, cy, r, radiusKm };
    useAppStore.getState().setActiveCircle(circle);
    if (map) map.setOptions({ draggable: false, scrollwheel: false, disableDoubleClickZoom: true, gestureHandling: 'none' });

    // Wire handle-dot drag
    const cDot = document.getElementById('svgCenterDot');
    const eDot = document.getElementById('svgEdgeDot');
    if (cDot) cDot.addEventListener('mousedown', e => startHandleDrag(e, 'center'));
    if (eDot) eDot.addEventListener('mousedown', e => startHandleDrag(e, 'edge'));
  }

  function startHandleDrag(e, target) {
    e.stopPropagation(); e.preventDefault();
    const { activeCircle } = useAppStore.getState();
    if (!activeCircle) return;
    handleDragRef.current = { target, start: { x: e.clientX, y: e.clientY, ...activeCircle } };
    document.addEventListener('mousemove', onHandleMove);
    document.addEventListener('mouseup',   onHandleUp);
  }

  function onHandleMove(e) {
    const hd = handleDragRef.current;
    if (!hd.target || !hd.start) return;
    const { activeCircle } = useAppStore.getState();
    if (!activeCircle) return;
    let next;
    if (hd.target === 'center') {
      next = { ...activeCircle, cx: hd.start.cx + (e.clientX - hd.start.x), cy: hd.start.cy + (e.clientY - hd.start.y) };
    } else {
      const mapArea = document.querySelector('.map-area');
      if (!mapArea) return;
      const rect = mapArea.getBoundingClientRect();
      const newR = Math.max(20, Math.hypot(e.clientX - rect.left - activeCircle.cx, e.clientY - rect.top - activeCircle.cy));
      next = { ...activeCircle, r: newR };
    }
    updateOverlay(next.cx, next.cy, next.r);
    useAppStore.setState({ activeCircle: next });
    // update remove btn position
    const btn = document.getElementById('circleRemoveBtn');
    if (btn) { btn.style.left = next.cx + 'px'; btn.style.top = (next.cy - next.r - 20) + 'px'; }
  }

  function onHandleUp() {
    const { activeCircle } = useAppStore.getState();
    if (activeCircle && map) {
      useAppStore.setState({ activeCircle: { ...activeCircle, radiusKm: pixelsToKm(map, activeCircle.cx, activeCircle.cy, activeCircle.r) } });
    }
    handleDragRef.current = { target: null, start: null };
    document.removeEventListener('mousemove', onHandleMove);
    document.removeEventListener('mouseup',   onHandleUp);
  }
}

export function updateOverlay(cx, cy, r) {
  const circ = document.getElementById('svgCircle');
  const line = document.getElementById('svgRadiusLine');
  const cDot = document.getElementById('svgCenterDot');
  const eDot = document.getElementById('svgEdgeDot');
  const arcLabel = document.getElementById('svgArcLabel');
  if (!circ) return;

  ['cx', 'cy', 'r'].forEach((a, i) => circ.setAttribute(a, [cx, cy, r][i]));
  circ.style.display = 'block';
  [['x1', cx], ['y1', cy], ['x2', cx + r], ['y2', cy]].forEach(([a, v]) => line.setAttribute(a, v));
  line.style.display = 'block';
  cDot.setAttribute('cx', cx); cDot.setAttribute('cy', cy); cDot.style.display = 'block';
  eDot.setAttribute('cx', cx + r); eDot.setAttribute('cy', cy); eDot.style.display = 'block';

  if (r >= 20) {
    const mapInst  = useAppStore.getState().mapInstance;
    const radiusKm = mapInst ? pixelsToKm(mapInst, cx, cy, r) : r * 0.3;
    const driveMins = Math.round(radiusKm / 50 * 60);
    const distStr = radiusKm >= 1 ? `${radiusKm.toFixed(1)} km` : `${Math.round(radiusKm * 1000)} m`;
    arcLabel.setAttribute('x', cx);
    arcLabel.setAttribute('y', cy + r + 20);
    arcLabel.textContent = `${distStr}  ·  ${driveMins} min`;
    arcLabel.style.display = 'block';
  } else {
    arcLabel.style.display = 'none';
  }
}

export function hideOverlay() {
  ['svgCircle', 'svgRadiusLine', 'svgCenterDot', 'svgEdgeDot'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const lbl = document.getElementById('svgArcLabel');
  if (lbl) lbl.style.display = 'none';
}
