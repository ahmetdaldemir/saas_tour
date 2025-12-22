import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Survey CRUD
router.get('/', SurveyController.list); // Public - for submitting responses
router.get('/:id', (req, res, next) => SurveyController.getById(req as AuthenticatedRequest, res).catch(next));
router.post('/', authenticate, authorize(Permission.SURVEY_CREATE), SurveyController.create);
router.put('/:id', authenticate, authorize(Permission.SURVEY_UPDATE), (req, res, next) => SurveyController.update(req as AuthenticatedRequest, res).catch(next));
router.delete('/:id', authenticate, authorize(Permission.SURVEY_DELETE), (req, res, next) => SurveyController.delete(req as AuthenticatedRequest, res).catch(next));

// Question management
router.post('/:surveyId/questions', authenticate, authorize(Permission.SURVEY_UPDATE), (req, res, next) => SurveyController.addQuestion(req as AuthenticatedRequest, res).catch(next));
router.put('/questions/:id', authenticate, authorize(Permission.SURVEY_UPDATE), (req, res, next) => SurveyController.updateQuestion(req as AuthenticatedRequest, res).catch(next));
router.delete('/questions/:id', authenticate, authorize(Permission.SURVEY_UPDATE), (req, res, next) => SurveyController.deleteQuestion(req as AuthenticatedRequest, res).catch(next));

// Response management
router.post('/responses', SurveyController.submitResponse); // Public - for submitting responses
router.get('/:surveyId/responses', authenticate, authorize(Permission.SURVEY_VIEW), (req, res, next) => SurveyController.getResponses(req as AuthenticatedRequest, res).catch(next));
router.get('/reservations/:reservationId/responses', authenticate, authorize(Permission.SURVEY_VIEW), (req, res, next) => SurveyController.getResponsesByReservation(req as AuthenticatedRequest, res).catch(next));

export default router;

