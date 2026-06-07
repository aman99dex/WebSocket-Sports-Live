# ⚡ Sports Tracker

A real-time sports commentary platform built with Node.js, WebSockets, and PostgreSQL. Watch live match events stream in as they happen.

**Live API:** https://websocket-sports-live.onrender.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ (ES Modules) |
| Framework | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Real-time | WebSockets (`ws`) |
| Validation | Zod |
| Security | Arcjet (bot detection, rate limiting, shield) |
| Frontend | React + Vite |

---

## Project Structure

```
Sports_Tracker/
├── src/
│   ├── index.js              # Entry point — Express + HTTP server
│   ├── arcjet.js             # Security middleware (HTTP + WS)
│   ├── routes/
│   │   ├── matches.js        # GET /matches, POST /matches, PATCH /:id/score
│   │   └── commentary.js     # GET /matches/:id/commentary, POST /matches/:id/commentary
│   ├── validation/
│   │   ├── matches.js        # Zod schemas for matches
│   │   └── commentary.js     # Zod schemas for commentary
│   ├── ws/
│   │   └── server.js         # WebSocket server — subscribe/unsubscribe/broadcast
│   ├── utils/
│   │   └── match-status.js   # Derive match status from timestamps
│   ├── db/
│   │   ├── db.js             # Drizzle client + pg pool
│   │   └── schema.js         # Table definitions
│   ├── seed/
│   │   └── seed.js           # REST-based seeder with live match support
│   └── data/
│       └── data.json         # Seed data (matches + commentary feed)
├── frontend/                 # React + Vite frontend
├── drizzle/                  # Migration files
└── drizzle.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (local or hosted)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
ARCJET_KEY=your_arcjet_key
ARCJET_MODE=DRY_RUN        # Use LIVE in production
PORT=8000
HOST=0.0.0.0
ALLOWED_ORIGINS=http://localhost:5173  # Comma-separated, optional
```

### 3. Run database migrations

```bash
npm run db:generate   # Generate migration files from schema
npm run db:migrate    # Apply migrations to the database
```

### 4. Start the server

```bash
npm run dev     # Development (auto-restart on file changes)
npm start       # Production
```

Server runs at `http://localhost:8000`  
WebSocket at `ws://localhost:8000/ws`

### 5. Seed the database

```bash
API_URL=http://localhost:8000 npm run seed
```

---

## API Reference

### Matches

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/matches` | List matches |
| `POST` | `/matches` | Create a match |
| `PATCH` | `/matches/:id/score` | Update score |

#### GET /matches

```
GET /matches?limit=50
```

```json
{
  "data": [
    {
      "id": 1,
      "sport": "football",
      "homeTeam": "FC Neon",
      "awayTeam": "Drizzle United",
      "status": "live",
      "homeScore": 2,
      "awayScore": 1,
      "startTime": "2026-06-07T10:00:00.000Z",
      "endTime": "2026-06-07T12:00:00.000Z",
      "createdAt": "2026-06-07T09:55:00.000Z"
    }
  ]
}
```

#### POST /matches

```json
{
  "sport": "football",
  "homeTeam": "FC Neon",
  "awayTeam": "Drizzle United",
  "startTime": "2026-06-07T10:00:00.000Z",
  "endTime": "2026-06-07T12:00:00.000Z",
  "homeScore": 0,
  "awayScore": 0
}
```

#### PATCH /matches/:id/score

```json
{
  "homeScore": 2,
  "awayScore": 1
}
```

---

### Commentary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/matches/:id/commentary` | List commentary for a match |
| `POST` | `/matches/:id/commentary` | Add a commentary entry |

#### GET /matches/:id/commentary

```
GET /matches/1/commentary?limit=100
```

#### POST /matches/:id/commentary

```json
{
  "minute": 42,
  "sequence": 120,
  "period": "2nd half",
  "eventType": "goal",
  "actor": "Alex Morgan",
  "team": "FC Neon",
  "message": "GOAL! Powerful finish from the edge of the box.",
  "metadata": { "assist": "Sam Kerr" },
  "tags": ["goal", "shot"]
}
```

---

## WebSocket

Connect to `ws://localhost:8000/ws` (or `wss://` in production).

### Messages you can send

**Subscribe to a match:**
```json
{ "type": "subscribe", "matchId": 1 }
```

**Unsubscribe from a match:**
```json
{ "type": "unsubscribe", "matchId": 1 }
```

### Events you receive

| Type | When |
|---|---|
| `welcome` | On connect |
| `subscribed` | After subscribing to a match |
| `unsubscribed` | After unsubscribing from a match |
| `commentary` | New commentary entry posted to a subscribed match |
| `match_created` | A new match is created (broadcast to all) |

### Example

```js
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'subscribe', matchId: 1 }));
};

ws.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  if (type === 'commentary') {
    console.log(`[${data.minute}'] ${data.message}`);
  }
};
```

---

## Database Schema

### `matches`

| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `sport` | text | e.g. `"football"`, `"cricket"` |
| `home_team` | text | |
| `away_team` | text | |
| `status` | enum | `scheduled` / `live` / `finished` |
| `start_time` | timestamp | |
| `end_time` | timestamp | |
| `home_score` | integer | Default 0 |
| `away_score` | integer | Default 0 |
| `created_at` | timestamp | Auto |

### `commentary`

| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `match_id` | integer | FK → matches (cascade delete) |
| `minute` | integer | Match minute |
| `sequence` | integer | Order within the minute |
| `period` | text | e.g. `"1st half"`, `"2nd innings"` |
| `event_type` | text | e.g. `"goal"`, `"wicket"`, `"foul"` |
| `actor` | text | Player name |
| `team` | text | Team name |
| `message` | text | Commentary text |
| `metadata` | jsonb | Extra data (assists, etc.) |
| `tags` | text[] | e.g. `["goal", "shot"]` |
| `created_at` | timestamp | Auto |

---

## Frontend

A React + Vite frontend is included in the `frontend/` directory.

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`

- Browse matches in the sidebar
- Click a match to view its commentary feed
- Live events stream in real-time via WebSocket

---

## Security

Powered by [Arcjet](https://arcjet.com):

- **Shield** — protects against common web attacks
- **Bot detection** — blocks malicious bots on HTTP and WebSocket
- **Rate limiting** — sliding window (50 req/10s on HTTP, 5 req/2s on WS)

Set `ARCJET_MODE=DRY_RUN` during development to log decisions without blocking.

---

## Deployment

The backend is deployed on **Render** as a Web Service.

| Setting | Value |
|---|---|
| Build command | `npm install` |
| Start command | `node src/index.js` |
| Node version | 20+ |

Required environment variables on Render:

```
DATABASE_URL
ARCJET_KEY
ARCJET_MODE=LIVE
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```
