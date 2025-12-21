import { Request, Response } from 'express';
import { DestinationService } from '../services/destination.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { DestinationImportService } from '../services/destination-import.service';
import { TenantRequest } from '../../../middleware/tenant.middleware';
import { LanguageService } from '../services/language.service';
import { AiContentService } from '../services/ai-content.service';

export class DestinationController {
  static async list(req: Request & TenantRequest, res: Response) {
    try {
      // Get tenantId from query parameter or tenant middleware (no authentication required)
      const tenantId = (req.query.tenantId as string | undefined) || (req as any).tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'tenantId is required',
          },
        });
      }

      // Get languageId from query parameter
      const languageId: string | undefined = req.query.languageId as string | undefined;

      const destinations = await DestinationService.list(tenantId, languageId);
      res.json({
        success: true,
        data: destinations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message,
        },
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Get languageId from query parameter
      const languageId: string | undefined = req.query.languageId as string | undefined;

      const destination = await DestinationService.getById(id, languageId);

      if (!destination) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Destination not found',
          },
        });
      }

      res.json({
        success: true,
        data: destination,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message,
        },
      });
    }
  }

  static async create(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      // Get tenantId from authenticated user's token (security: prevent tenant spoofing)
      const tenantId = req.auth?.tenantId;
      
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const { image, isFeatured, translations } = req.body;

      if (!translations || !Array.isArray(translations) || translations.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one translation is required',
          },
        });
      }

      // Validate each translation
      for (const translation of translations) {
        if (!translation.languageId || !translation.title) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Each translation must have languageId and title',
            },
          });
        }
      }

      const destination = await DestinationService.create({
        tenantId,
        image,
        isFeatured,
        translations,
      });

      res.status(201).json({
        success: true,
        data: destination,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: (error as Error).message,
        },
      });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { image, isFeatured, translations } = req.body;

      // Validate translations if provided
      if (translations !== undefined) {
        if (!Array.isArray(translations)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Translations must be an array',
            },
          });
        }

        for (const translation of translations) {
          if (!translation.languageId || !translation.title) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Each translation must have languageId and title',
              },
            });
          }
        }
      }

      const destination = await DestinationService.update(id, {
        image,
        isFeatured,
        translations,
      });

      res.json({
        success: true,
        data: destination,
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: errorMessage,
          },
        });
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errorMessage,
        },
      });
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await DestinationService.remove(id);
      res.status(204).send();
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: errorMessage,
          },
        });
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: errorMessage,
        },
      });
    }
  }

  static async importFromApi(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      // Get tenantId from req.tenant (from Host header)
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tenant is required',
          },
        });
      }

      const { city, radius, limit } = req.body;
      if (!city) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'city is required',
          },
        });
      }

      const result = await DestinationImportService.importGlobal({
        tenantId,
        city,
        radius,
        limit,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: (error as Error).message,
        },
      });
    }
  }

  /**
   * POST /api/destinations/generate-content
   * Generate AI content for destination (Turkish + auto-translations)
   * Returns JSON with content in all languages (no DB write)
   */
  static async generateContent(req: AuthenticatedRequest, res: Response) {
    try {
      const { title } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'title is required',
          },
        });
      }

      const result = await AiContentService.generateDestinationContent({
        title: title.trim(),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Content generation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (error as Error).message,
        },
      });
    }
  }
}
