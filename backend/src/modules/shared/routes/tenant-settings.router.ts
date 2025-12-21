import { Router } from 'express';
import { TenantSettingsController } from '../controllers/tenant-settings.controller';
import { FileUploadController, upload } from '../controllers/file-upload.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.post('/upload', upload.single('file'), FileUploadController.uploadFile);

// Public GET endpoints - no authentication required, tenantId from query parameter
router.get('/', TenantSettingsController.getAll);
router.get('/site', TenantSettingsController.getSite);
router.get('/mail', TenantSettingsController.getMail);
router.get('/payment', TenantSettingsController.getPayment);

// Protected PUT endpoints - authentication required
router.use(authenticate);
router.put('/site', TenantSettingsController.updateSite);
router.put('/mail', TenantSettingsController.updateMail);
router.put('/payment', TenantSettingsController.updatePayment);

export default router;

