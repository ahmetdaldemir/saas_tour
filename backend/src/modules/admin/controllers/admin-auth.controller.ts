import { Request, Response } from 'express';
import { AdminAuthService } from '../services/admin-auth.service';

export class AdminAuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
      }

      const result = await AdminAuthService.login({ username, password });

      return res.json(result);
    } catch (error) {
      return res.status(401).json({ message: (error as Error).message });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const auth = (req as any).auth;
      if (!auth || auth.type !== 'admin') {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await AdminAuthService.getProfile(auth.sub);

      return res.json(result);
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }
}

