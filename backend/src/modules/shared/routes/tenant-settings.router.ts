import { Router } from 'express';
import { TenantSettingsController } from '../controllers/tenant-settings.controller';
import { FileUploadController, upload } from '../controllers/file-upload.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

router.post('/upload', authenticate, authorize(Permission.SETTINGS_UPDATE), upload.single('file'), FileUploadController.uploadFile);

// Public GET endpoints - no authentication required, tenantId from query parameter
router.get('/', TenantSettingsController.getAll);
router.get('/site', TenantSettingsController.getSite);
router.get('/mail', TenantSettingsController.getMail);
router.get('/payment', TenantSettingsController.getPayment);
router.get('/ai', TenantSettingsController.getAi);

// Protected PUT endpoints - authentication and authorization required
router.use(authenticate);
router.put('/site', authorize(Permission.SETTINGS_UPDATE), TenantSettingsController.updateSite);
router.put('/mail', authorize(Permission.SETTINGS_UPDATE), TenantSettingsController.updateMail);
router.put('/payment', authorize(Permission.SETTINGS_UPDATE), TenantSettingsController.updatePayment);
router.put('/ai', authorize(Permission.SETTINGS_UPDATE), TenantSettingsController.updateAi);

export default router;

