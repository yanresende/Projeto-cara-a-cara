import jwt from 'jsonwebtoken';
import { AuthPayload } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export function generateToken(userId: string, isAdmin = false): string {
  const payload: AuthPayload = { userId, isAdmin };
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRY } as any);
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET as string);
    if (typeof decoded === 'object' && 'userId' in decoded) {
      return { userId: decoded.userId as string, isAdmin: decoded.isAdmin === true };
    }
    return null;
  } catch {
    return null;
  }
}
