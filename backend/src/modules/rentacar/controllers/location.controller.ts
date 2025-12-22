import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class LocationController {
  static async list(req: Request, res: Response) {
    try {
      // Get tenantId from query parameter (no authentication required)
      const tenantId = req.query.tenantId as string | undefined;
      const parentId = req.query.parentId as string | undefined;
      const languageId = req.query.languageId as string | undefined;
      const isActiveParam = req.query.isActive as string | undefined;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      // Convert isActive string to boolean or undefined
      let isActive: boolean | undefined = undefined;
      if (isActiveParam !== undefined) {
        isActive = isActiveParam === 'true' || isActiveParam === '1';
      }

      const locations = await LocationService.list(tenantId, parentId, languageId, isActive);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      // Get tenantId from authenticated user's token (security: prevent tenant spoofing)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Override tenantId from body to prevent security issues
      const location = await LocationService.create({
        ...req.body,
        tenantId, // Always use authenticated user's tenantId
      });
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const location = await LocationService.getById(id);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const location = await LocationService.update(id, req.body);
      res.json(location);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await LocationService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

