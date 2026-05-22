import React, { useRef } from 'react';
import VehicleSelector from './VehicleSelector.jsx';
import useAppStore from '../store/useAppStore.js';

export default function PromptCard() {
  const goToMap = useAppStore(s => s.goToMap);
  const promptRef = useRef(null);

  function handleSend() {
    const text = (promptRef.current?.textContent || '').trim();
    goToMap(text || 'Plan me a road trip');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="prompt-card">
      <div className="prompt-body">
        <p
          className="prompt-text"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          ref={promptRef}
          onKeyDown={handleKeyDown}
        >
          Iceland 2-day road trip along the Golden Circle and South Coast — geysers, waterfalls, black sand beaches, and volcanic landscapes.
        </p>
      </div>
      <div className="prompt-actions">
        <div className="prompt-actions-left">
          <span className="material-symbols-rounded prompt-add-icon">add</span>
          <VehicleSelector />
        </div>
        <div className="prompt-actions-right">
          <span className="prompt-model-label">Gemini 3.1 Pro</span>
          <button className="prompt-send-btn" onClick={handleSend}>
            <span className="material-symbols-rounded">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
