import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { TenantCategory } from '../../tenants/entities/tenant.entity';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { tenantId, name, email, password, role } = req.body;
      if (!tenantId || !name || !email || !password) {
        return res.status(400).json({ message: 'tenantId, name, email and password are required' });
      }

      const user = await AuthService.register({ tenantId, name, email, password, role });
      return res.status(201).json({ id: user.id, tenantId: user.tenantId, email: user.email, role: user.role });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
      }

      const { token, user, tenant } = await AuthService.login({ email, password });
      return res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
        tenant,
      });
    } catch (error) {
      return res.status(401).json({ message: (error as Error).message });
    }
  }

  static async signup(req: Request, res: Response) {
    try {
      const {
        tenantName,
        tenantCategory,
        tenantDefaultLanguage,
        supportEmail,
        adminName,
        adminEmail,
        adminPassword,
      } = req.body;

      if (!tenantName || !tenantCategory || !adminName || !adminEmail || !adminPassword) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (!Object.values(TenantCategory).includes(tenantCategory)) {
        return res.status(400).json({ message: 'Invalid tenant category' });
      }

      const result = await AuthService.signup({
        tenantName,
        tenantCategory,
        tenantDefaultLanguage,
        supportEmail,
        adminName,
        adminEmail,
        adminPassword,
      });

      return res.status(201).json({
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          tenantId: result.user.tenantId,
        },
        tenant: result.tenant,
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { user, tenant } = await AuthService.getProfile(req.auth.sub);
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
        tenant,
      });
    } catch (error) {
      return res.status(400).json({ message: (error as Error).message });
    }
  }
}
