import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const agentes = await query(
      `SELECT a.id, a.nombre, a.email, a.rol_id, r.nombre as rol_nombre, a.activo, a.ultimo_acceso, a.created_at
       FROM agentes a JOIN roles r ON r.id = a.rol_id
       ORDER BY a.created_at DESC`
    );
    res.json(agentes);
  } catch (error) {
    console.error('Error listando agentes:', error);
    res.status(500).json({ error: 'Error al listar agentes' });
  }
});

router.get('/roles', async (_req: AuthRequest, res: Response) => {
  try {
    const roles = await query('SELECT id, nombre, permisos FROM roles ORDER BY id');
    res.json(roles);
  } catch (error) {
    console.error('Error listando roles:', error);
    res.status(500).json({ error: 'Error al listar roles' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password, rol_id } = req.body;
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
      'INSERT INTO agentes (nombre, email, password_hash, rol_id) VALUES (?, ?, ?, ?)',
      [nombre, email, password_hash, rol_id || 2]
    ) as any;

    const creado = await query(
      `SELECT a.id, a.nombre, a.email, a.rol_id, r.nombre as rol_nombre
       FROM agentes a JOIN roles r ON r.id = a.rol_id WHERE a.id = ?`,
      [result.insertId]
    ) as any[];

    res.json(creado[0]);
  } catch (error) {
    console.error('Error creando agente:', error);
    res.status(500).json({ error: 'Error al crear agente' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol_id, activo } = req.body;

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await query(
        `UPDATE agentes SET
          nombre = COALESCE(?, nombre),
          email = COALESCE(?, email),
          password_hash = ?,
          rol_id = COALESCE(?, rol_id),
          activo = COALESCE(?, activo)
        WHERE id = ?`,
        [nombre, email, password_hash, rol_id, activo, id]
      );
    } else {
      await query(
        `UPDATE agentes SET
          nombre = COALESCE(?, nombre),
          email = COALESCE(?, email),
          rol_id = COALESCE(?, rol_id),
          activo = COALESCE(?, activo)
        WHERE id = ?`,
        [nombre, email, rol_id, activo, id]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando agente:', error);
    res.status(500).json({ error: 'Error al actualizar agente' });
  }
});

export default router;
