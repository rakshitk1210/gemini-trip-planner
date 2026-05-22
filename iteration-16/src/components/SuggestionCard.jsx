import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore.js';
import { getImg } from '../constants.js';

export default function SuggestionCard({ sugg }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, []);
  const routeStops  = useAppStore(s => s.routeStops);
  const savedPlaces = useAppStore(s => s.savedPlaces);
  const addToRoute  = useAppStore(s => s.addToRoute);
  const toggleSave  = useAppStore(s => s.toggleSave);
  const placeImages = useAppStore(s => s.placeImages);
  const setDragging = useAppStore(s => s.setDraggingSuggId);

  const inRoute = !!routeStops.find(s => s.id === sugg.id);
  const isSaved = !!savedPlaces[sugg.id];
  const reviews = Math.floor((sugg.seed % 97) * 8 + 45);
  const thumb   = getImg(placeImages, sugg.name, sugg.seed, 'thumb');

  return (
    <div
      className={`suggestion-card${visible ? ' is-visible' : ''}`}
      data-id={sugg.id}
      draggable
      onDragStart={e => {
        setDragging(sugg.id);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', 'sugg-' + sugg.id);
        setTimeout(() => e.currentTarget.classList.add('is-dragging'), 0);
      }}
      onDragEnd={e => {
        setDragging(null);
        e.currentTarget.classList.remove('is-dragging');
      }}
    >
      <div className="sugg-thumb-wrap">
        <img className="sugg-thumb suggestion-card-img" src={thumb} alt={sugg.name} />
      </div>
      <div className="suggestion-card-body">
        <div className="suggestion-card-name">{sugg.name}</div>
        <div className="suggestion-card-meta">
          <span className="material-symbols-rounded sugg-star">star</span>
          <span>{sugg.rating}</span>
          <span className="sugg-sep">·</span>
          <span>{reviews} reviews</span>
        </div>
      </div>
      <div className="sugg-card-actions">
        <button
          className={`sugg-icon-btn sugg-save-btn${isSaved ? ' sugg-save-btn--saved' : ''}`}
          title={isSaved ? 'Saved' : 'Save place'}
          onClick={e => { e.stopPropagation(); toggleSave(sugg); }}
        >
          <span className="material-symbols-rounded">{isSaved ? 'bookmark' : 'bookmark_border'}</span>
        </button>
        <button
          className={`sugg-icon-btn sugg-route-btn${inRoute ? ' sugg-route-btn--added' : ''}`}
          title={inRoute ? 'Added to route' : 'Add to route'}
          disabled={inRoute}
          onClick={e => { e.stopPropagation(); addToRoute(sugg.id); }}
        >
          <span className="material-symbols-rounded">{inRoute ? 'check' : 'add'}</span>
        </button>
      </div>
    </div>
  );
}
