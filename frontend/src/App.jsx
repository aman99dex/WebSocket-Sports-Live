import React, { useEffect, useState, useRef, useCallback } from 'react';
import { API_URL } from './config';
import { useWebSocket } from './hooks/useWebSocket';
import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetail';
import './App.css';

export default function App() {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const subscribedRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/matches?limit=100`)
      .then(r => r.json())
      .then(payload => setMatches(payload.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingMatches(false));
  }, []);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'welcome') setWsStatus('connected');
    if (msg.type === 'commentary') {
      setLiveEvents(prev => [...prev, { ...msg.data, _live: true }]);
      setMatches(prev => prev.map(m =>
        m.id === msg.data.matchId ? { ...m } : m
      ));
    }
    if (msg.type === 'match_created') {
      setMatches(prev => [msg.data, ...prev]);
    }
  }, []);

  const { send } = useWebSocket(handleWsMessage);

  const handleSelectMatch = useCallback((match) => {
    if (subscribedRef.current !== null) {
      send({ type: 'unsubscribe', matchId: subscribedRef.current });
    }
    setSelectedMatch(match);
    setLiveEvents([]);
    send({ type: 'subscribe', matchId: match.id });
    subscribedRef.current = match.id;
  }, [send]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⚡</span>
          <span className="app-title">Sports Tracker</span>
        </div>
        <div className={`ws-indicator ${wsStatus}`}>
          <span className="ws-dot" />
          {wsStatus === 'connected' ? 'Live' : 'Connecting…'}
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <MatchList
            matches={matches}
            selectedId={selectedMatch?.id}
            onSelect={handleSelectMatch}
            loading={loadingMatches}
          />
        </aside>

        <main className="main-content">
          <MatchDetail match={selectedMatch} liveEvents={liveEvents} />
        </main>
      </div>
    </div>
  );
}
