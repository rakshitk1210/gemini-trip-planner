import React, { useState } from 'react';
import useAppStore from '../store/useAppStore.js';
import imgRakshit from '../assets/rakshit.png';

export default function PanelFooter() {
  const submitFooter      = useAppStore(s => s.submitFooter);
  const activeCircle      = useAppStore(s => s.activeCircle);
  const clearCircle       = useAppStore(s => s.clearCircle);
  const isThinking        = useAppStore(s => s.isThinking);
  const replyContext      = useAppStore(s => s.replyContext);
  const clearReplyContext = useAppStore(s => s.clearReplyContext);
  const [text, setText] = useState('');

  const placeholder = activeCircle
    ? 'Find things in this area…'
    : replyContext
    ? 'Add more context… (or just hit send)'
    : 'Show me hotels along my route';

  function handleSend() {
    if (!text.trim() && !activeCircle && !replyContext) return;
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

      {replyContext && (
        <div className="reply-context-chip">
          <img className="reply-chip-avatar" src={imgRakshit} alt="" />
          <span className="reply-chip-label">Comment</span>
          <span className="reply-chip-text">{replyContext.text}</span>
          <button className="reply-chip-close" onClick={clearReplyContext}>
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

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
