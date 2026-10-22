import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'paint-shop-saas-secure-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    uuid: string;
    serialNumber: number;
    primaryCommunication: string;
    primaryType: 'phone' | 'email';
  };
}

export function generateToken(payload: { 
  id: string; 
  uuid: string;
  serialNumber: number; 
  primaryCommunication: string; 
  primaryType: 'phone' | 'email' 
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No authorization token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      uuid: string;
      serialNumber: number;
      primaryCommunication: string;
      primaryType: 'phone' | 'email';
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
    return;
  }
}
