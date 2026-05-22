import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore.js';
import { getImg } from '../constants.js';

export default function PlaceCard() {
  const activeCard  = useAppStore(s => s.activeCard);
  const closeCard   = useAppStore(s => s.closeCard);
  const savedPlaces = useAppStore(s => s.savedPlaces);
  const routeStops  = useAppStore(s => s.routeStops);
  const toggleSave  = useAppStore(s => s.toggleSave);
  const addToRoute  = useAppStore(s => s.addToRoute);
  const placeImages = useAppStore(s => s.placeImages);

  const [photoIndex, setPhotoIndex] = useState(0);

  // Reset carousel when card changes
  useEffect(() => { setPhotoIndex(0); }, [activeCard?.sugg?.id]);

  if (!activeCard) return null;

  const { sugg, left, top } = activeCard;
  const entry   = placeImages[sugg.name];
  const photos  = entry?.photos?.length
    ? entry.photos.map(p => p.small)
    : [getImg(placeImages, sugg.name, sugg.seed)];

  const count    = photos.length;
  const idx      = ((photoIndex % count) + count) % count;
  const isSaved  = !!savedPlaces[sugg.id];
  const inRoute  = !!routeStops.find(s => s.id === sugg.id);

  return (
    <div
      className="place-card is-visible"
      style={{ left, top }}
      onClick={e => e.stopPropagation()}
    >
      <div className="place-card-img-wrap">
        <img className="place-card-img" src={photos[idx]} alt={sugg.name} />
        <button className="place-card-close" onClick={closeCard}>
          <span className="material-symbols-rounded">close</span>
        </button>
        {count > 1 && (
          <>
            <button className="place-card-nav place-card-nav--prev" onClick={e => { e.stopPropagation(); setPhotoIndex(i => i - 1); }}>
              <span className="material-symbols-rounded">chevron_left</span>
            </button>
            <button className="place-card-nav place-card-nav--next" onClick={e => { e.stopPropagation(); setPhotoIndex(i => i + 1); }}>
              <span className="material-symbols-rounded">chevron_right</span>
            </button>
          </>
        )}
        <div className="place-card-dots">
          {photos.map((_, i) => (
            <span key={i} className={`place-card-dot${i === idx ? ' place-card-dot--active' : ''}`} />
          ))}
        </div>
      </div>
      <div className="place-card-info">
        <div className="place-card-text">
          <div className="place-card-name">{sugg.name}</div>
          <div className="place-card-rating">
            <span className="place-card-rating-score">{sugg.rating}</span>
            <span className="material-symbols-rounded place-card-star">star</span>
            <span className="place-card-rating-count">(234)</span>
          </div>
        </div>
        <div className="place-card-actions">
          <button
            className="place-card-action-btn place-card-action-btn--ghost"
            onClick={() => toggleSave(sugg)}
          >
            <div className="place-card-btn-circle">
              <span className="material-symbols-rounded" style={{ color: isSaved ? '#1a73e8' : '' }}>
                {isSaved ? 'bookmark' : 'bookmark_border'}
              </span>
            </div>
          </button>
          <button
            className={`place-card-action-btn ${inRoute ? 'place-card-action-btn--green' : 'place-card-action-btn--blue'}`}
            onClick={() => { addToRoute(sugg.id); }}
          >
            <div className="place-card-btn-circle">
              <span className="material-symbols-rounded">{inRoute ? 'check' : 'add_location'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
