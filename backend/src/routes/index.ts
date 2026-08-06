import { Router } from 'express';
import clientesRouter from './clientes';
import mensajesRouter from './mensajes';
import authRouter from './auth';
import webhooksRouter from './webhooks';
import analyticsRouter from './analytics';
import campaniasRouter from './campanias';
import agentesRouter from './agentes';
import profitRouter from './profit';
import notasRouter from './notas';
import snippetsRouter from './snippets';
import faqsRouter from './faqs';
import adminSnippetsRouter from './admin-snippets';

const router = Router();

router.use('/auth', authRouter);
router.use('/clientes', clientesRouter);
router.use('/mensajes', mensajesRouter);
router.use('/webhook', webhooksRouter);
router.use('/analytics', analyticsRouter);
router.use('/campanias', campaniasRouter);
router.use('/agentes', agentesRouter);
router.use('/profit', profitRouter);
router.use('/notas', notasRouter);
router.use('/snippets', snippetsRouter);
router.use('/faqs', faqsRouter);
router.use('/admin/snippets', adminSnippetsRouter);

export default router;
