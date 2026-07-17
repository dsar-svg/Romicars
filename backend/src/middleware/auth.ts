import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'romicars-secret-key-change-in-production';

export interface AuthRequest extends Request {
  agente?: { id: number; nombre: string; email: string };
}

export function generateToken(agente: { id: number; nombre: string; email: string }): string {
  return jwt.sign({ id: agente.id, nombre: agente.nombre, email: agente.email }, JWT_SECRET, { expiresIn: '24h' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; nombre: string; email: string };
    req.agente = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
