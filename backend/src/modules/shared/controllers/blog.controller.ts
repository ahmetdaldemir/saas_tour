import { Response } from 'express';
import { BlogService } from '../services/blog.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class BlogController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const locationId = req.query.locationId as string | undefined;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const blogs = await BlogService.list(tenantId, locationId);
      res.json(blogs);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const blog = await BlogService.getById(id);
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }
      res.json(blog);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const blog = await BlogService.create(req.body);
      res.status(201).json(blog);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const blog = await BlogService.update(id, req.body);
      res.json(blog);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await BlogService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

