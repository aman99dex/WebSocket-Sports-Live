import AgentAPI from "apminsight";
AgentAPI.config();
import express from 'express';
import cors from 'cors';
import {matchRouter} from "./routes/matches.js";
import http from "http";
import {attachWebSocketServer} from "./ws/server.js";
import {securityMiddleware} from "./arcjet.js";
import {commentaryRouter} from "./routes/commentary.js";

const app = express();
const PORT = Number(process.env.PORT) || 8000 ;
const HOST = process.env.HOST || '0.0.0.0';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : null;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins) return callback(null, allowedOrigins.includes(origin));
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(securityMiddleware());
app.use(express.json());
const server = http.createServer(app);

app.get('/', (req, res) => {
  res.json({ message: 'Sports Tracker API is running.' });
});



app.use('/matches',matchRouter);
app.use('/matches/:id/commentary',commentaryRouter);
const {broadcastMatchCreated, broadcastCommentary} = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;
server.listen(PORT,HOST, () => {
  const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on  ${baseUrl}`);
  console.log(`WebSocket Server is running on  ${baseUrl.replace('http','ws')}/ws`);
});
