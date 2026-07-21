import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database';
import {
  generateToken, authMiddleware, AuthRequest,
  checkBruteForce, recordLoginAttempt,
} from '../middleware/auth';
import { validateLoginInput } from '../middleware/security';

const router = Router();

router.post('/login', validateLoginInput, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { blocked, remainingAttempts } = await checkBruteForce(email, ip);
    if (blocked) {
      await recordLoginAttempt(email, null, false, ip, userAgent);
      res.status(429).json({
        error: 'Demasiados intentos fallidos. Cuenta temporalmente bloqueada.',
        code: 'ACCOUNT_BLOCKED',
        remainingAttempts: 0,
      });
      return;
    }

    const agentes = await query(
      `SELECT a.*, r.nombre as rol_nombre FROM agentes a
       JOIN roles r ON r.id = a.rol_id
       WHERE a.email = ? AND a.activo = TRUE`,
      [email]
    ) as any[];
    const agente = agentes[0];

    if (!agente || !(await bcrypt.compare(password, agente.password_hash))) {
      await recordLoginAttempt(email, agente?.id || null, false, ip, userAgent);
      res.status(401).json({
        error: 'Credenciales inválidas',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts,
      });
      return;
    }

    await query('UPDATE agentes SET ultimo_acceso = NOW() WHERE id = ?', [agente.id]);
    await recordLoginAttempt(email, agente.id, true, ip, userAgent);

    const token = generateToken({
      id: agente.id, nombre: agente.nombre, email: agente.email,
      rol_id: agente.rol_id, rol_nombre: agente.rol_nombre,
    });

    res.json({
      token,
      agente: {
        id: agente.id, nombre: agente.nombre, email: agente.email,
        rol_id: agente.rol_id, rol_nombre: agente.rol_nombre,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const agente = await query(
    `SELECT a.id, a.nombre, a.email, a.rol_id, r.nombre as rol_nombre,
            a.activo, a.ultimo_acceso, a.created_at
     FROM agentes a JOIN roles r ON r.id = a.rol_id WHERE a.id = ?`,
    [req.agente!.id]
  ) as any[];
  if (!agente[0]) {
    res.status(404).json({ error: 'Agente no encontrado' });
    return;
  }
  res.json(agente[0]);
});

export default router;
