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
          Explore Seattle on a 2-day road trip, discovering iconic landmarks, vibrant neighborhoods, and scenic views along the way.
        </p>
      </div>
      <div className="prompt-actions">
        <div className="prompt-actions-left">
          <svg className="prompt-add-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 13H13V18C13 18.55 12.55 19 12 19C11.45 19 11 18.55 11 18V13H6C5.45 13 5 12.55 5 12C5 11.45 5.45 11 6 11H11V6C11 5.45 11.45 5 12 5C12.55 5 13 5.45 13 6V11H18C18.55 11 19 11.45 19 12C19 12.55 18.55 13 18 13Z" fill="#5F6368"/>
          </svg>
          <VehicleSelector />
        </div>
        <div className="prompt-actions-right">
          <span className="prompt-model-label">Gemini 3.1 Pro</span>
          <button className="prompt-send-btn" onClick={handleSend}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M13.4779 10.834H3.33203V9.16732H13.4779L8.8112 4.50065L9.9987 3.33398L16.6654 10.0007L9.9987 16.6673L8.8112 15.5007L13.4779 10.834Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
