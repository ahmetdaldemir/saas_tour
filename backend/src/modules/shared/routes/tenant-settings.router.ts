import { Router } from 'express';
import { TenantSettingsController } from '../controllers/tenant-settings.controller';
import { FileUploadController, upload } from '../controllers/file-upload.controller';

const router = Router();

router.post('/upload', upload.single('file'), FileUploadController.uploadFile);
router.get('/', TenantSettingsController.getAll);
router.get('/site', TenantSettingsController.getSite);
router.get('/mail', TenantSettingsController.getMail);
router.get('/payment', TenantSettingsController.getPayment);
router.put('/site', TenantSettingsController.updateSite);
router.put('/mail', TenantSettingsController.updateMail);
router.put('/payment', TenantSettingsController.updatePayment);

export default router;

