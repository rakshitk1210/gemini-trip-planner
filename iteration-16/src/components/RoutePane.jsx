import React from 'react';
import useAppStore from '../store/useAppStore.js';
import StopItem from './StopItem.jsx';
import { getImg } from '../constants.js';

function RouteInfoCard({ n }) {
  const hoursRaw = 1.2 + n * 0.75;
  const wholeH   = Math.floor(hoursRaw);
  const mins     = Math.round((hoursRaw % 1) * 60 / 5) * 5;
  const timeStr  = mins > 0 ? `${wholeH} hr ${mins} min` : `${wholeH} hr`;
  const miles    = 45 + n * 26;
  return (
    <div className="route-info-card" id="routeInfoCard">
      <div className="route-info-icon">
        <span className="material-symbols-rounded">directions_car</span>
      </div>
      <div className="route-info-body">
        <div className="route-name-row">
          <span className="route-name">via Hringvegur</span>
          <span className="route-time">{timeStr}</span>
        </div>
        <div className="route-stats-row">
          <span className="route-stat">Scenic route along Route 1</span>
          <span className="route-distance">{miles} miles</span>
        </div>
        <div className="route-btns">
          <button className="route-text-btn">Details</button>
          <button className="route-text-btn">Preview</button>
        </div>
      </div>
    </div>
  );
}

export default function RoutePane() {
  const routeStops  = useAppStore(s => s.routeStops);
  const savedPlaces = useAppStore(s => s.savedPlaces);
  const unsavePlace = useAppStore(s => s.unsavePlace);
  const placeImages = useAppStore(s => s.placeImages);
  const addToRoute  = useAppStore(s => s.addToRoute);
  const draggingSuggId = useAppStore(s => s.draggingSuggId);

  const hasStops = routeStops.length > 0;
  const hasRoute = routeStops.length >= 2;

  const n = routeStops.length;
  const optLabel = n === 1
    ? '1 stop added — add more to build a route'
    : `Route optimized · ${n} stops`;

  const savedItems = Object.values(savedPlaces);

  function onEmptyDrop(e) {
    e.preventDefault();
    const id = useAppStore.getState().draggingSuggId;
    if (id) { useAppStore.getState().setDraggingSuggId(null); addToRoute(id); }
  }

  const activeTab = useAppStore(s => s.activeTab);

  return (
    <div className={`tab-pane${activeTab !== 'route' ? ' tab-pane--hidden' : ''}`} id="paneroute">

      {hasStops && (
        <div className={`route-optimized-chip${n === 1 ? ' route-optimized-chip--building' : ''}`} id="routeOptChip">
          <span className="material-symbols-rounded">auto_awesome</span>
          <span>{optLabel}</span>
        </div>
      )}

      {!hasStops && (
        <div
          className="route-empty-state"
          id="routeEmptyState"
          onDragOver={e => e.preventDefault()}
          onDrop={onEmptyDrop}
        >
          <span className="material-symbols-rounded route-empty-icon">add_location_alt</span>
          <p className="route-empty-text">Add places to build your route</p>
          <p className="route-empty-sub">Use "Add to route" or drag places here</p>
        </div>
      )}

      <ul className="stop-list" id="stopList">
        {routeStops.map((stop, i) => (
          <StopItem
            key={stop.id}
            stop={stop}
            index={i}
            isLast={i === routeStops.length - 1}
            totalStops={routeStops.length}
          />
        ))}
      </ul>

      {hasRoute && (
        <>
          <div className="route-spacer" />
          <RouteInfoCard n={n} />
          <div className="route-spacer" />
        </>
      )}

      {savedItems.length > 0 && (
        <div className="saved-section">
          <div className="saved-heading">Saved</div>
          <ul className="saved-list">
            {savedItems.map(p => (
              <li key={p.id} className="saved-item">
                <div className="saved-thumb-wrap">
                  <img className="saved-thumb" src={getImg(placeImages, p.name, p.seed, 'thumb')} alt="" />
                </div>
                <div className="saved-info">
                  <div className="saved-name">{p.name}</div>
                  <div className="saved-meta">
                    {p.price && <><span>{p.price}</span><span className="saved-sep"> · </span></>}
                    <span className="material-symbols-rounded saved-star">star</span>
                    <span>{p.rating}</span>
                  </div>
                </div>
                <button className="saved-remove-btn" onClick={() => unsavePlace(p.id)}>
                  <span className="material-symbols-rounded">highlight_off</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
