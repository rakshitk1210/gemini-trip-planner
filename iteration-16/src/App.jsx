import React, { useEffect, useRef } from 'react';
import useAppStore from './store/useAppStore.js';
import HomeScreen from './components/HomeScreen.jsx';
import MapView from './components/MapView.jsx';

function NavRail() {
  return (
    <nav className="rail">
      <div className="rail-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="14" fill="#EA4335"/>
          <path d="M14 7C10.134 7 7 10.134 7 14c0 2.556 1.351 4.796 3.374 6.046L14 25l3.626-4.954C19.649 18.796 21 16.556 21 14c0-3.866-3.134-7-7-7zm0 9.5A2.5 2.5 0 1 1 14 11.5a2.5 2.5 0 0 1 0 5z" fill="white"/>
        </svg>
      </div>
      <div className="rail-items">
        <button className="rail-item" title="Menu">
          <span className="material-symbols-rounded">menu</span>
        </button>
        <button className="rail-item" title="Road trip">
          <span className="material-symbols-rounded">directions_car</span>
          <span className="rail-label">Road trip</span>
        </button>
        <button className="rail-item" title="Saved">
          <span className="material-symbols-rounded">bookmark</span>
          <span className="rail-label">Saved</span>
        </button>
        <button className="rail-item" title="Recent">
          <span className="material-symbols-rounded">history</span>
          <span className="rail-label">Recent</span>
        </button>
      </div>
      <div className="rail-bottom">
        <button className="rail-item" title="Get app">
          <span className="material-symbols-rounded">install_mobile</span>
          <span className="rail-label">Get app</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const screen    = useAppStore(s => s.screen);
  const activeTab = useAppStore(s => s.activeTab);
  const prevScreenRef = useRef('home');

  // Keep body[data-state] in sync with animated transitions
  useEffect(() => {
    const prevScreen = prevScreenRef.current;
    prevScreenRef.current = screen;

    if (screen === 'home') {
      document.body.dataset.state = 'home';
      return;
    }

    // When switching tabs while already on map, just update instantly
    if (prevScreen !== 'home') {
      document.body.dataset.state = activeTab;
      return;
    }

    // home → map transition: animate exit then entry
    const homeEl = document.querySelector('.home-screen');
    if (homeEl) homeEl.style.animation = 'screenExitLeft 0.28s ease forwards';

    const t = setTimeout(() => {
      if (homeEl) homeEl.style.animation = '';
      document.body.dataset.state = activeTab;
      // Double rAF ensures the browser has painted the newly-visible map-view
      // before we add the enter animation
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const mapEl = document.querySelector('.map-view');
        if (mapEl) {
          mapEl.style.animation = 'screenEnter 0.32s ease forwards';
          setTimeout(() => { mapEl.style.animation = ''; }, 320);
        }
      }));
    }, 240);

    return () => clearTimeout(t);
  }, [screen, activeTab]);

  // Toggle draw-mode class on body for cursor change
  const drawMode = useAppStore(s => s.drawMode);
  useEffect(() => {
    document.body.classList.toggle('draw-mode', drawMode);
  }, [drawMode]);

  return (
    <>
      <NavRail />
      <div className="stage">
        <HomeScreen />
        <MapView />
      </div>
    </>
  );
}
