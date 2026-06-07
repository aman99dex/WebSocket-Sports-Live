import React from 'react';
import './MatchList.css';

const STATUS_LABEL = { live: 'LIVE', scheduled: 'Soon', finished: 'FT' };
const STATUS_CLASS = { live: 'live', scheduled: 'scheduled', finished: 'finished' };

export default function MatchList({ matches, selectedId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="match-list">
        <div className="list-header"><h2>Matches</h2></div>
        <div className="list-empty">Loading…</div>
      </div>
    );
  }

  return (
    <div className="match-list">
      <div className="list-header"><h2>Matches</h2></div>
      {matches.length === 0 && <div className="list-empty">No matches found.</div>}
      {matches.map((m) => (
        <button
          key={m.id}
          className={`match-card${selectedId === m.id ? ' selected' : ''}`}
          onClick={() => onSelect(m)}
        >
          <div className="match-sport">{m.sport}</div>
          <div className="match-teams">
            <span>{m.homeTeam}</span>
            <span className="score">{m.homeScore ?? 0} – {m.awayScore ?? 0}</span>
            <span>{m.awayTeam}</span>
          </div>
          <span className={`status-badge ${STATUS_CLASS[m.status] ?? 'finished'}`}>
            {STATUS_LABEL[m.status] ?? m.status}
          </span>
        </button>
      ))}
    </div>
  );
}
