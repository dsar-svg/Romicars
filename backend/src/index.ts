import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import routes from './routes';
import { setupSocket } from './socket';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;
