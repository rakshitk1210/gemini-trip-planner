import React, { useState } from 'react';
import useAppStore from '../store/useAppStore.js';

export default function StopItem({ stop, index, isLast, totalStops }) {
  const removeStop     = useAppStore(s => s.removeStop);
  const reorderStops   = useAppStore(s => s.reorderStops);
  const addToRoute     = useAppStore(s => s.addToRoute);
  const draggingSuggId = useAppStore(s => s.draggingSuggId);

  const [dropPos, setDropPos] = useState(null); // 'above' | 'below' | null

  function onDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setTimeout(() => e.currentTarget.classList.add('is-dragging'), 0);
    // Store drag index on element for retrieval in onDrop
    e.currentTarget.dataset.dragIndex = index;
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggingSuggId !== null ? 'copy' : 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    setDropPos(e.clientY < rect.top + rect.height / 2 ? 'above' : 'below');
  }

  function onDragLeave() { setDropPos(null); }

  function onDrop(e) {
    e.preventDefault();
    setDropPos(null);
    const rect     = e.currentTarget.getBoundingClientRect();
    let dropIndex  = index;
    if (e.clientY >= rect.top + rect.height / 2) dropIndex += 1;

    // Suggestion dragged from panel/pin
    if (draggingSuggId !== null) {
      useAppStore.getState().setDraggingSuggId(null);
      if (!useAppStore.getState().routeStops.find(s => s.id === draggingSuggId)) {
        addToRoute(draggingSuggId, Math.min(dropIndex, totalStops));
      }
      return;
    }

    // Stop reorder
    const srcIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(srcIndex) || srcIndex === dropIndex) return;
    const insertAt = dropIndex > srcIndex ? dropIndex - 1 : dropIndex;
    reorderStops(srcIndex, insertAt);
  }

  function onDragEnd(e) {
    e.currentTarget.classList.remove('is-dragging');
    setDropPos(null);
  }

  return (
    <li
      className={`stop-item${dropPos === 'above' ? ' drop-above' : ''}${dropPos === 'below' ? ' drop-below' : ''}`}
      data-id={stop.id}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <span className="material-symbols-rounded stop-drag">drag_indicator</span>
      <div className="stop-dot-wrap">
        {isLast
          ? <span className="material-symbols-rounded stop-location-icon">location_on</span>
          : <div className="stop-dot" />
        }
      </div>
      <div className="stop-name-pill">{stop.name}</div>
      <button className="stop-remove-btn" onClick={() => removeStop(stop.id)}>
        <span className="material-symbols-rounded">highlight_off</span>
      </button>
    </li>
  );
}
