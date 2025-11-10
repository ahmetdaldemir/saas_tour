import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { loadEnv } from '../../../config/env';
import { AuthTokenPayload } from '../services/auth.service';

const env = loadEnv();

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.auth.jwtSecret) as AuthTokenPayload;
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
