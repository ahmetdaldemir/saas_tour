import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

const router = Router();

// Survey CRUD
router.get('/', SurveyController.list);
router.get('/:id', (req, res, next) => SurveyController.getById(req as AuthenticatedRequest, res).catch(next));
router.post('/', SurveyController.create);
router.put('/:id', (req, res, next) => SurveyController.update(req as AuthenticatedRequest, res).catch(next));
router.delete('/:id', (req, res, next) => SurveyController.delete(req as AuthenticatedRequest, res).catch(next));

// Question management
router.post('/:surveyId/questions', (req, res, next) => SurveyController.addQuestion(req as AuthenticatedRequest, res).catch(next));
router.put('/questions/:id', (req, res, next) => SurveyController.updateQuestion(req as AuthenticatedRequest, res).catch(next));
router.delete('/questions/:id', (req, res, next) => SurveyController.deleteQuestion(req as AuthenticatedRequest, res).catch(next));

// Response management
router.post('/responses', (req, res, next) => SurveyController.submitResponse(req as AuthenticatedRequest, res).catch(next));
router.get('/:surveyId/responses', (req, res, next) => SurveyController.getResponses(req as AuthenticatedRequest, res).catch(next));
router.get('/reservations/:reservationId/responses', (req, res, next) => SurveyController.getResponsesByReservation(req as AuthenticatedRequest, res).catch(next));

export default router;

