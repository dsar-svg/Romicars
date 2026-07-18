import { Router } from 'express';
import clientesRouter from './clientes';
import mensajesRouter from './mensajes';
import authRouter from './auth';
import webhooksRouter from './webhooks';
import analyticsRouter from './analytics';
import campaniasRouter from './campanias';
import agentesRouter from './agentes';

const router = Router();

router.use('/auth', authRouter);
router.use('/clientes', clientesRouter);
router.use('/mensajes', mensajesRouter);
router.use('/webhook', webhooksRouter);
router.use('/analytics', analyticsRouter);
router.use('/campanias', campaniasRouter);
router.use('/agentes', agentesRouter);

export default router;
