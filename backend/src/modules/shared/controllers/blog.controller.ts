import { Response } from 'express';
import { BlogService } from '../services/blog.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler, ValidationError, NotFoundError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class BlogController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.query.tenantId as string;
    const locationId = req.query.locationId as string | undefined;

    if (!tenantId) {
      throw new ValidationError('tenantId query parameter is required');
    }

    const blogs = await BlogService.list(tenantId, locationId);
    logger.info(`Listed blogs for tenant ${tenantId}`, { tenantId, locationId, count: blogs.length });
    res.json({ success: true, data: blogs });
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const blog = await BlogService.getById(id);
    
    if (!blog) {
      throw new NotFoundError('Blog', id);
    }

    logger.info(`Retrieved blog ${id}`);
    res.json({ success: true, data: blog });
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const blog = await BlogService.create(req.body);
    logger.info(`Created blog ${blog.id}`, { blogId: blog.id, tenantId: blog.tenantId });
    res.status(201).json({ success: true, data: blog });
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const blog = await BlogService.update(id, req.body);
    logger.info(`Updated blog ${id}`);
    res.json({ success: true, data: blog });
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    await BlogService.remove(id);
    logger.info(`Deleted blog ${id}`);
    res.status(204).send();
  });
}

