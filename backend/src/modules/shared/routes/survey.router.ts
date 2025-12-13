import { Router } from 'express';
import { SurveyController } from '../controllers/survey.controller';

const router = Router();

// Survey CRUD
router.get('/', SurveyController.list);
router.get('/:id', SurveyController.getById);
router.post('/', SurveyController.create);
router.put('/:id', SurveyController.update);
router.delete('/:id', SurveyController.delete);

// Question management
router.post('/:surveyId/questions', SurveyController.addQuestion);
router.put('/questions/:id', SurveyController.updateQuestion);
router.delete('/questions/:id', SurveyController.deleteQuestion);

// Response management
router.post('/responses', SurveyController.submitResponse);
router.get('/:surveyId/responses', SurveyController.getResponses);
router.get('/reservations/:reservationId/responses', SurveyController.getResponsesByReservation);

export default router;

