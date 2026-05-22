import React, { useState, useEffect, useRef, memo } from 'react';
import GeminiIcon from './GeminiIcon.jsx';
import SuggestionCard from './SuggestionCard.jsx';
import useAppStore from '../store/useAppStore.js';

const WORDS_PER_MS = 36;

function CardList({ cards, moreLabel = 'more places' }) {
  const [expanded, setExpanded] = useState(false);
  const limit   = 5;
  const shown   = cards.slice(0, limit);
  const hidden  = cards.slice(limit);

  return (
    <div className="chat-card-list">
      {shown.map(c => <SuggestionCard key={c.id} sugg={c} />)}
      {hidden.length > 0 && !expanded && (
        <button className="chat-show-more" onClick={() => setExpanded(true)}>
          Show {hidden.length} {moreLabel}
          <span className="material-symbols-rounded">expand_more</span>
        </button>
      )}
      {expanded && hidden.map(c => <SuggestionCard key={c.id} sugg={c} />)}
    </div>
  );
}

function ChipRow({ chips, turnId }) {
  const appendChipTurn = useAppStore(s => s.appendChipTurn);
  const [used, setUsed] = useState(false);

  return (
    <div className="chat-chips">
      {chips.map(chip => (
        <button
          key={chip.label}
          className="chat-chip"
          disabled={used}
          onClick={() => { setUsed(true); appendChipTurn(chip); }}
        >
          <span className="material-symbols-rounded">{chip.icon}</span>
          {chip.label}
        </button>
      ))}
    </div>
  );
}

const ChatTurn = memo(function ChatTurn({ turn }) {
  const { id, userText, aiText, cards, chips, moreLabel, isThinking, error } = turn;
  const [displayedText, setDisplayedText] = useState(isThinking ? '' : aiText);
  const [textDone, setTextDone]           = useState(!isThinking && aiText.length > 0);
  const prevThinkingRef = useRef(isThinking);

  useEffect(() => {
    // Kick off typewriter only when isThinking flips false → true was never the case,
    // so we fire when it goes true → false
    if (prevThinkingRef.current && !isThinking && (aiText || error)) {
      prevThinkingRef.current = false;
      if (error) { setDisplayedText(''); setTextDone(true); return; }
      const words  = aiText.split(' ');
      let   i      = 0;
      setDisplayedText('');
      const tick = () => {
        if (i < words.length) {
          setDisplayedText(prev => (prev ? prev + ' ' : '') + words[i++]);
          setTimeout(tick, WORDS_PER_MS);
        } else {
          setTextDone(true);
        }
      };
      tick();
    }
    prevThinkingRef.current = isThinking;
  }, [isThinking, aiText, error]);

  return (
    <div className="chat-turn">
      {userText && <div className="chat-bubble--user">{userText}</div>}
      <div className="chat-bubble-ai-wrap">
        <div className="chat-gemini-icon"><GeminiIcon size={20} /></div>
        <div className="chat-bubble--ai">
          {isThinking ? (
            <div className="chat-thinking"><span /><span /><span /></div>
          ) : error ? (
            <span style={{ color: '#ea4335' }}>{error}</span>
          ) : (
            displayedText
          )}
        </div>
      </div>
      {textDone && chips?.length > 0 && <ChipRow chips={chips} turnId={id} />}
      {textDone && cards?.length > 0  && <CardList cards={cards} moreLabel={moreLabel} />}
    </div>
  );
});

export default ChatTurn;
