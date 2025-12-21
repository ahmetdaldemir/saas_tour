import { Request, Response } from 'express';
import { BlogService } from '../services/blog.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { TenantRequest } from '../../../middleware/tenant.middleware';
import { asyncHandler, ValidationError, NotFoundError } from '../../../utils/errors';
import { logger } from '../../../utils/logger';
import { AiContentService } from '../services/ai-content.service';
import { LanguageService } from '../services/language.service';

export class BlogController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    // Get tenantId from query parameter (no authentication required)
    const tenantId = req.query.tenantId as string | undefined;
    const locationId = req.query.locationId as string | undefined;
    
    // Get languageId from query parameter
    const languageId: string | undefined = req.query.languageId as string | undefined;

    if (!tenantId) {
      throw new ValidationError('tenantId is required');
    }

    const blogs = await BlogService.list(tenantId, languageId, locationId);
    logger.info(`Listed blogs for tenant ${tenantId}`, { tenantId, languageId, locationId, count: blogs.length });
    res.json({ success: true, data: blogs });
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Get languageId from query parameter
    const languageId: string | undefined = req.query.languageId as string | undefined;
    
    const blog = await BlogService.getById(id, languageId);
    
    if (!blog) {
      throw new NotFoundError('Blog', id);
    }

    logger.info(`Retrieved blog ${id}`);
    res.json({ success: true, data: blog });
  });

  static create = asyncHandler(async (req: AuthenticatedRequest & TenantRequest, res: Response) => {
    // Get tenantId from authenticated user's token (security: prevent tenant spoofing)
    const tenantId = req.auth?.tenantId;
    
    if (!tenantId) {
      throw new ValidationError('Authentication required');
    }

    // Override tenantId from body to prevent security issues
    const blog = await BlogService.create({
      ...req.body,
      tenantId, // Always use authenticated user's tenantId
    });
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

  /**
   * POST /api/blogs/generate-content
   * Generate AI content for blog (Turkish + auto-translations)
   * Returns JSON with content in all languages (no DB write)
   */
  static generateContent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title } = req.body;

    if (!title || !title.trim()) {
      throw new ValidationError('title is required');
    }

    const result = await AiContentService.generateBlogContent({
      title: title.trim(),
    });

    logger.info('Generated blog content', { title });
    res.json({
      success: true,
      data: result,
    });
  });
}

