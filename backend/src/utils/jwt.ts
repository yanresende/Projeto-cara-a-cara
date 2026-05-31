import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types/index';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export function generateToken(userId: string, isAdmin = false): string {
  const payload: AuthPayload = { userId, isAdmin };
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: JWT_EXPIRY } as any);
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'object' && 'userId' in decoded) {
      return { userId: decoded.userId as string, isAdmin: decoded.isAdmin === true };
    }
    return null;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn('Token inválido:', error.message);
    }
    return null;
  }
}
