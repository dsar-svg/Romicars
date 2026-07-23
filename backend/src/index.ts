import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import routes from './routes';
import { setupSocket } from './socket';
import { securityMiddleware, apiLimiter, requireHttps } from './middleware/security';

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
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', (req, res, next) => {
  if (req.query.filename) {
    const cleanName = encodeURIComponent(req.query.filename as string);
    res.setHeader('Content-Disposition', `inline; filename="${cleanName}"; filename*=UTF-8''${cleanName}`);
  }
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiLimiter, routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;
