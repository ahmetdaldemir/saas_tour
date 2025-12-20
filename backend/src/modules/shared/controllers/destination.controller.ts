import { Response } from 'express';
import { DestinationService } from '../services/destination.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { DestinationImportService } from '../services/destination-import.service';
import { TenantRequest } from '../../../middleware/tenant.middleware';
import { LanguageService } from '../services/language.service';

export class DestinationController {
  static async list(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      // Get languageId from query param or use tenant's default language
      let languageId: string | undefined = req.query.languageId as string | undefined;
      
      // If no languageId provided and tenant exists, use tenant's default language
      if (!languageId && req.tenant?.defaultLanguage) {
        const defaultLanguage = await LanguageService.getByCode(req.tenant.defaultLanguage);
        if (defaultLanguage) {
          languageId = defaultLanguage.id;
        }
      }
      
      // If still no languageId, get system default language
      if (!languageId) {
        const systemDefaultLanguage = await LanguageService.getDefault();
        if (systemDefaultLanguage) {
          languageId = systemDefaultLanguage.id;
        }
      }

      const destinations = await DestinationService.list(languageId);
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

  static async getById(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // Get languageId from query param or use tenant's default language
      let languageId: string | undefined = req.query.languageId as string | undefined;
      
      // If no languageId provided and tenant exists, use tenant's default language
      if (!languageId && req.tenant?.defaultLanguage) {
        const defaultLanguage = await LanguageService.getByCode(req.tenant.defaultLanguage);
        if (defaultLanguage) {
          languageId = defaultLanguage.id;
        }
      }
      
      // If still no languageId, get system default language
      if (!languageId) {
        const systemDefaultLanguage = await LanguageService.getDefault();
        if (systemDefaultLanguage) {
          languageId = systemDefaultLanguage.id;
        }
      }

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

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
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

  static async importFromApi(req: AuthenticatedRequest, res: Response) {
    try {
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
}
