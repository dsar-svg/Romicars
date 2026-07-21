import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import routes from './routes';
import { setupSocket } from './socket';
import { securityMiddleware, apiLimiter, requireHttps } from './middleware/security';
import { startMessageWatcher } from './services/messageWatcher';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(securityMiddleware);
app.use(requireHttps);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Remaining'],
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api', apiLimiter, routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocket(server);

startMessageWatcher();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;
