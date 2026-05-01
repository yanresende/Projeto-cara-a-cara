import { CustomSocket } from '../types/socket';
import { verifyToken } from '../utils/jwt';

export function socketAuthMiddleware(socket: CustomSocket, next: (err?: Error) => void) {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error('Missing token'));
  }

  const payload = verifyToken(token as string);
  if (!payload) {
    return next(new Error('Invalid or expired token'));
  }

  socket.userId = payload.userId;
  next();
}
