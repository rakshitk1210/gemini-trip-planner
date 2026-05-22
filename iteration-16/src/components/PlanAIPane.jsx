import React, { useEffect, useRef } from 'react';
import ChatTurn from './ChatTurn.jsx';
import useAppStore from '../store/useAppStore.js';

export default function PlanAIPane() {
  const chatTurns = useAppStore(s => s.chatTurns);
  const activeTab = useAppStore(s => s.activeTab);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatTurns]);

  return (
    <div className={`tab-pane${activeTab !== 'plan-ai' ? ' tab-pane--hidden' : ''}`} id="paneplanai">
      {chatTurns.map(turn => <ChatTurn key={turn.id} turn={turn} />)}
      <div ref={bottomRef} />
    </div>
  );
}
