import React, { useEffect, useState, useRef } from 'react';
import { API_URL } from '../config';
import './MatchDetail.css';

const EVENT_ICONS = {
  goal: '⚽', shot: '🎯', foul: '🟨', card: '🟥', substitution: '🔄',
  corner: '🚩', offside: '🚫', penalty: '⚡', kickoff: '🏁', halftime: '⏸',
  fulltime: '🏆', injury: '🩹', save: '🧤', six: '6️⃣', four: '4️⃣',
  wicket: '🏏', run: '🏃', over: '🔢',
};

function eventIcon(type) {
  if (!type) return '📋';
  const key = Object.keys(EVENT_ICONS).find(k => type.toLowerCase().includes(k));
  return key ? EVENT_ICONS[key] : '📋';
}

export default function MatchDetail({ match, liveEvents }) {
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!match) return;
    setLoading(true);
    fetch(`${API_URL}/matches/${match.id}/commentary?limit=100`)
      .then(r => r.json())
      .then(payload => setCommentary(payload.data ?? []))
      .finally(() => setLoading(false));
  }, [match?.id]);

  useEffect(() => {
    if (liveEvents.length === 0) return;
    setCommentary(prev => [liveEvents[liveEvents.length - 1], ...prev]);
  }, [liveEvents]);

  if (!match) {
    return (
      <div className="detail-empty">
        <div className="empty-icon">🏟</div>
        <p>Select a match to see live commentary</p>
      </div>
    );
  }

  return (
    <div className="match-detail">
      <div className="detail-header">
        <div className="detail-sport">{match.sport}</div>
        <div className="detail-scoreboard">
          <div className="team-block">
            <span className="team-name">{match.homeTeam}</span>
            <span className="team-score">{match.homeScore ?? 0}</span>
          </div>
          <span className="vs">vs</span>
          <div className="team-block away">
            <span className="team-score">{match.awayScore ?? 0}</span>
            <span className="team-name">{match.awayTeam}</span>
          </div>
        </div>
        <div className="detail-meta">
          {match.status === 'live' && <span className="live-dot" />}
          <span className="detail-status">{match.status}</span>
        </div>
      </div>

      <div className="commentary-feed">
        {loading && <div className="feed-loading">Loading commentary…</div>}
        {!loading && commentary.length === 0 && (
          <div className="feed-empty">No commentary yet.</div>
        )}
        {commentary.map((c) => (
          <div key={c.id} className={`commentary-row${c._live ? ' new' : ''}`}>
            <div className="c-left">
              <span className="c-icon">{eventIcon(c.eventType)}</span>
              {c.minute != null && <span className="c-minute">{c.minute}'</span>}
            </div>
            <div className="c-right">
              {c.eventType && <span className="c-type">{c.eventType}</span>}
              <p className="c-message">{c.message}</p>
              {c.actor && <span className="c-actor">{c.actor}</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
