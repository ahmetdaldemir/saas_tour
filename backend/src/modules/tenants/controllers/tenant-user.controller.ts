import { Request, Response } from 'express';
import { TenantUserService } from '../services/tenant-user.service';
import { TenantUserRole } from '../entities/tenant-user.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class TenantUserController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const users = await TenantUserService.list(tenantId);
      
      // Password hash'i response'dan çıkar
      const usersWithoutPassword = users.map(user => ({
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      res.json(usersWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const user = await TenantUserService.getById(id, tenantId);
      if (!user) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }

      // Password hash'i response'dan çıkar
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { tenantId, name, email, password, role } = req.body;

      if (!tenantId || !name || !email || !password) {
        return res.status(400).json({ message: 'tenantId, name, email ve password gereklidir' });
      }

      // Role validation
      if (role && !Object.values(TenantUserRole).includes(role)) {
        return res.status(400).json({ message: 'Geçersiz rol' });
      }

      // Password validation
      if (password.length < 6) {
        return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır' });
      }

      const user = await TenantUserService.create({
        tenantId,
        name,
        email,
        password,
        role,
      });

      // Password hash'i response'dan çıkar
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      const { name, email, password, role } = req.body;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      // Role validation
      if (role && !Object.values(TenantUserRole).includes(role)) {
        return res.status(400).json({ message: 'Geçersiz rol' });
      }

      // Password validation
      if (password && password.length < 6) {
        return res.status(400).json({ message: 'Şifre en az 6 karakter olmalıdır' });
      }

      const user = await TenantUserService.update(id, tenantId, {
        name,
        email,
        password,
        role,
      });

      // Password hash'i response'dan çıkar
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      await TenantUserService.delete(id, tenantId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

