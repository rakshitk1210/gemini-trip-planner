import React, { useState } from 'react';
import useAppStore from '../store/useAppStore.js';

export default function PanelFooter() {
  const submitFooter  = useAppStore(s => s.submitFooter);
  const activeCircle  = useAppStore(s => s.activeCircle);
  const clearCircle   = useAppStore(s => s.clearCircle);
  const isThinking    = useAppStore(s => s.isThinking);
  const [text, setText] = useState('');

  const placeholder = activeCircle
    ? 'Find things in this area…'
    : 'Show me hotels along my route';

  function handleSend() {
    if (!text.trim() && !activeCircle) return;
    submitFooter(text.trim());
    setText('');
  }

  return (
    <div className="panel-footer">
      <div className={`area-chip-row${activeCircle ? ' is-visible' : ''}`} id="areaChipRow">
        <div className="area-chip" id="areaChip">
          <span className="material-symbols-rounded area-chip-icon">radio_button_checked</span>
          <span className="area-chip-label">Area 1</span>
          <button className="area-chip-remove" onClick={clearCircle}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      </div>
      <div className="footer-input-row">
        <div className="footer-input-wrap">
          <input
            type="text"
            className="footer-input"
            id="footerInput"
            placeholder={placeholder}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          />
          <button className="footer-send-btn" onClick={handleSend} disabled={isThinking}>
            <span className="material-symbols-rounded">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
