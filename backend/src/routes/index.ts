import { Router } from 'express';
import clientesRouter from './clientes';
import mensajesRouter from './mensajes';

const router = Router();

router.use('/clientes', clientesRouter);
router.use('/mensajes', mensajesRouter);

export default router;
