# Sports Tracker Frontend

Backend API: https://websocket-sports-live.onrender.com  
WebSocket:   wss://websocket-sports-live.onrender.com/ws

## API Reference

### Matches
- `GET  /matches`               — list matches (`?limit=50`)
- `POST /matches`               — create a match
- `PATCH /matches/:id/score`    — update score `{ homeScore, awayScore }`

### Commentary
- `GET  /matches/:id/commentary` — list commentary (`?limit=100`)
- `POST /matches/:id/commentary` — add a commentary entry

## WebSocket

Connect to `wss://websocket-sports-live.onrender.com/ws`

```js
const ws = new WebSocket("wss://websocket-sports-live.onrender.com/ws");

// Subscribe to a match
ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", matchId: 1 }));

// Receive events
ws.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  // type: "welcome" | "subscribed" | "commentary" | "match_created"
};

// Unsubscribe
ws.send(JSON.stringify({ type: "unsubscribe", matchId: 1 }));
```
