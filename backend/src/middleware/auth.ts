import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'romicars-secret-key-change-in-production';

export interface AuthRequest extends Request {
  agente?: { id: number; nombre: string; email: string; rol_id: number; rol_nombre: string };
}

export function generateToken(agente: { id: number; nombre: string; email: string; rol_id: number; rol_nombre: string }): string {
  return jwt.sign({ id: agente.id, nombre: agente.nombre, email: agente.email, rol_id: agente.rol_id, rol_nombre: agente.rol_nombre }, JWT_SECRET, { expiresIn: '24h' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; nombre: string; email: string; rol_id: number; rol_nombre: string };
    req.agente = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.agente?.rol_nombre !== 'superadmin') {
    res.status(403).json({ error: 'Acceso denegado: solo superadmin' });
    return;
  }
  next();
}
