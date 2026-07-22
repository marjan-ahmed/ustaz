import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = { id: string; role: 'STUDENT' | 'TEACHER' | 'ADMIN' };

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const token = header.slice('Bearer '.length);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string; role: AuthUser['role'] };
    req.authUser = { id: decoded.sub, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles: AuthUser['role'][]): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    if (!req.authUser) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.authUser.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

