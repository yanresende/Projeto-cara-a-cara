import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index';

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
}
