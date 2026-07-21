import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'romicars-secret-key-change-in-production';
const JWT_ISSUER = 'romicars-flow';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOGIN_BLOCK_DURATION = parseInt(process.env.LOGIN_BLOCK_DURATION || '15', 10);

export interface AuthRequest extends Request {
  agente?: {
    id: number;
    nombre: string;
    email: string;
    rol_id: number;
    rol_nombre: string;
    jti?: string;
  };
}

export function generateToken(agente: {
  id: number; nombre: string; email: string; rol_id: number; rol_nombre: string;
}): string {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    {
      id: agente.id,
      nombre: agente.nombre,
      email: agente.email,
      rol_id: agente.rol_id,
      rol_nombre: agente.rol_nombre,
      jti,
    },
    JWT_SECRET,
    {
      expiresIn: '24h',
      issuer: JWT_ISSUER,
      audience: 'romicars-flow-web',
    }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: 'romicars-flow-web',
    }) as {
      id: number; nombre: string; email: string;
      rol_id: number; rol_nombre: string; jti?: string;
    };
    req.agente = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
      return;
    }
    res.status(401).json({ error: 'Token inválido', code: 'TOKEN_INVALID' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.agente?.rol_nombre !== 'superadmin') {
    res.status(403).json({ error: 'Acceso denegado: solo superadmin' });
    return;
  }
  next();
}

export async function checkBruteForce(email: string, ip: string): Promise<{
  blocked: boolean; remainingAttempts: number; blockDurationMinutes: number;
}> {
  const windowStart = new Date(Date.now() - LOGIN_BLOCK_DURATION * 60 * 1000);

  const [recent] = await query(
    `SELECT COUNT(*) as count FROM login_audit
     WHERE email = ? AND success = FALSE AND created_at >= ?`,
    [email, windowStart]
  ) as any[];

  const attempts = Number(recent?.count || 0);

  return {
    blocked: attempts >= MAX_LOGIN_ATTEMPTS,
    remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - attempts),
    blockDurationMinutes: LOGIN_BLOCK_DURATION,
  };
}

export async function recordLoginAttempt(
  email: string, agenteId: number | null, success: boolean, ip: string, userAgent: string
): Promise<void> {
  await query(
    `INSERT INTO login_audit (email, agente_id, success, ip, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [email, agenteId, success, ip, userAgent]
  );
}
