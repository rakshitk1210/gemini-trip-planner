import React, { useState, useEffect, useRef, memo } from 'react';
import SuggestionCard from './SuggestionCard.jsx';
import useAppStore from '../store/useAppStore.js';

const WORDS_PER_MS = 36;

function CardList({ cards }) {
  const [expanded, setExpanded] = useState(false);
  const limit   = 4;
  const shown   = expanded ? cards : cards.slice(0, limit);
  const hasMore = cards.length > limit;

  return (
    <div className="chat-card-list">
      {shown.map(c => <SuggestionCard key={c.id} sugg={c} />)}
      {hasMore && (
        <button className="chat-show-more" onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Show less' : 'Show all'}
          <span className="material-symbols-rounded">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      )}
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
    if (prevThinkingRef.current && !isThinking && (aiText || error)) {
      prevThinkingRef.current = false;
      if (error) { setDisplayedText(''); setTextDone(true); return; }
      const words = aiText.split(' ');
      let i = 0;
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
      {/* User prompt → gray rounded info card */}
      {userText && (
        <div className="trip-info-card">
          <p className="trip-info-text">{userText}</p>
        </div>
      )}

      {/* AI response → plain summary text */}
      {isThinking ? (
        <div className="chat-thinking-wrap">
          <div className="chat-thinking"><span /><span /><span /></div>
        </div>
      ) : error ? (
        <p className="trip-summary-text" style={{ color: '#ea4335' }}>{error}</p>
      ) : displayedText ? (
        <p className={`trip-summary-text${!textDone ? ' is-typing' : ''}`}>
          {displayedText}
        </p>
      ) : null}

      {/* Suggestion cards — bleed to panel edges */}
      {textDone && cards?.length > 0 && <CardList cards={cards} />}
    </div>
  );
});

export default ChatTurn;
