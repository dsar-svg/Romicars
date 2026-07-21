import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip;
    const email = req.body?.email || 'unknown';
    return `${ip}:${email}`;
  },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const securityMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  xFrameOptions: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true,
});

export function validateLoginInput(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email requerido' });
    return;
  }

  if (!password || typeof password !== 'string') {
    res.status(400).json({ error: 'Contraseña requerida' });
    return;
  }

  const emailTrimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailTrimmed) || emailTrimmed.length > 100) {
    res.status(400).json({ error: 'Formato de email inválido' });
    return;
  }

  if (password.length < 6 || password.length > 128) {
    res.status(400).json({ error: 'Contraseña debe tener entre 6 y 128 caracteres' });
    return;
  }

  req.body.email = emailTrimmed;
  next();
}

export function requireHttps(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'production') {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      res.status(403).json({ error: 'HTTPS requerido' });
      return;
    }
  }
  next();
}
