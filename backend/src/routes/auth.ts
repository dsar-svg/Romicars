import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }

    const agentes = await query('SELECT * FROM agentes WHERE email = ? AND activo = TRUE', [email]) as any[];
    const agente = agentes[0];

    if (!agente || !(await bcrypt.compare(password, agente.password_hash))) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    await query('UPDATE agentes SET ultimo_acceso = NOW() WHERE id = ?', [agente.id]);

    const token = generateToken({ id: agente.id, nombre: agente.nombre, email: agente.email });
    res.json({ token, agente: { id: agente.id, nombre: agente.nombre, email: agente.email } });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
      return;
    }

    const existente = await query('SELECT id FROM agentes WHERE email = ?', [email]) as any[];
    if (existente.length > 0) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO agentes (nombre, email, password_hash) VALUES (?, ?, ?)',
      [nombre, email, password_hash]
    ) as any;

    const token = generateToken({ id: result.insertId, nombre, email });
    res.json({ token, agente: { id: result.insertId, nombre, email } });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error al registrar agente' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const agente = await query('SELECT id, nombre, email, activo, ultimo_acceso, created_at FROM agentes WHERE id = ?', [req.agente!.id]) as any[];
  if (!agente[0]) {
    res.status(404).json({ error: 'Agente no encontrado' });
    return;
  }
  res.json(agente[0]);
});

export default router;
