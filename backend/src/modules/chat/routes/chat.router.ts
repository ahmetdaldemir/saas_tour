import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/rooms', ChatController.listRooms);
router.post('/rooms', ChatController.createRoom);
router.get('/rooms/:id', ChatController.getRoom);
router.post('/rooms/:id/messages', ChatController.sendMessage);
router.post('/rooms/:id/read', ChatController.markAsRead);

router.get('/widget-token', ChatController.getWidgetToken);
router.post('/widget-token/regenerate', ChatController.regenerateWidgetToken);

export default router;

