import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function securityMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}

export function requireHttps(req: Request, res: Response, next: NextFunction) {
  const proto = req.headers['x-forwarded-proto'];
  if (proto === 'https' || !proto) {
    next();
  } else {
    res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
  }
}

export function apiLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 100;

  let entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    requestCounts.set(ip, entry);
    next();
    return;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    res.status(429).json({ error: 'Demasiadas solicitudes, intente de nuevo más tarde' });
    return;
  }

  res.setHeader('X-RateLimit-Remaining', String(maxRequests - entry.count));
  next();
}
