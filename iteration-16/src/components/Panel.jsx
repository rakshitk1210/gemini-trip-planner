import React from 'react';
import useAppStore from '../store/useAppStore.js';
import PlanAIPane from './PlanAIPane.jsx';
import RoutePane from './RoutePane.jsx';
import PanelFooter from './PanelFooter.jsx';

export default function Panel() {
  const activeTab      = useAppStore(s => s.activeTab);
  const showTab        = useAppStore(s => s.showTab);
  const draggingSuggId = useAppStore(s => s.draggingSuggId);
  const addToRoute     = useAppStore(s => s.addToRoute);

  function onRouteTabDragOver(e) {
    e.preventDefault();
    if (draggingSuggId !== null && activeTab !== 'route') showTab('route');
  }

  return (
    <div className="panel">
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'plan-ai' ? ' tab-btn--active' : ''}`}
          id="tabPlanAiBtn"
          onClick={() => showTab('plan-ai')}
        >
          Plan AI
        </button>
        <button
          className={`tab-btn${activeTab === 'route' ? ' tab-btn--active' : ''}`}
          id="tabRouteBtn"
          onClick={() => showTab('route')}
          onDragOver={onRouteTabDragOver}
        >
          Route
        </button>
      </div>

      <div className="panel-content" id="panelContent">
        <PlanAIPane />
        <RoutePane />
      </div>

      <PanelFooter />
    </div>
  );
}
