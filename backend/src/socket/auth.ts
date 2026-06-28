import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
  };
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: any) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    socket.user = { id: decoded.id };
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
};
