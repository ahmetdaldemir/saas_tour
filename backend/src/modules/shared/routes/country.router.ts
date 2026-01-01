import { Router } from 'express';
import { CountryController } from '../controllers/country.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Public route - no authentication required
router.get('/', (req, res, next) => 
  CountryController.list(req as AuthenticatedRequest, res).catch(next)
);

// All other routes require authentication
router.use(authenticate);

// Get country by ID
router.get('/:id', authorize(Permission.SETTINGS_VIEW), (req, res, next) => 
  CountryController.getById(req as AuthenticatedRequest, res).catch(next)
);

// Create country (update permission required)
router.post('/', authorize(Permission.SETTINGS_UPDATE), (req, res, next) => 
  CountryController.create(req as AuthenticatedRequest, res).catch(next)
);

// Update country
router.put('/:id', authorize(Permission.SETTINGS_UPDATE), (req, res, next) => 
  CountryController.update(req as AuthenticatedRequest, res).catch(next)
);

// Delete country
router.delete('/:id', authorize(Permission.SETTINGS_UPDATE), (req, res, next) => 
  CountryController.delete(req as AuthenticatedRequest, res).catch(next)
);

// Toggle active status
router.patch('/:id/toggle-active', authorize(Permission.SETTINGS_UPDATE), (req, res, next) => 
  CountryController.toggleActive(req as AuthenticatedRequest, res).catch(next)
);

// Sync countries from external API
router.post('/sync', authorize(Permission.SETTINGS_UPDATE), (req, res, next) => 
  CountryController.sync(req as AuthenticatedRequest, res).catch(next)
);

export default router;

