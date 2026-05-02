import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index';
import { verifyToken } from '../utils/jwt';

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = { id: payload.userId, isAdmin: payload.isAdmin === true };
  next();
}
