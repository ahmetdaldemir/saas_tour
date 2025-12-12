import { Request, Response } from 'express';
import { SurveyService } from '../services/survey.service';
import { SurveyStatus } from '../entities/survey.entity';
import { QuestionType } from '../entities/survey-question.entity';

export class SurveyController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const surveys = await SurveyService.list(tenantId);
      res.json(surveys);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const survey = await SurveyService.getById(id);
      if (!survey) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      res.json(survey);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const {
        tenantId,
        title,
        description,
        status,
        isActive,
        autoSend,
        sendAfterDays,
        emailSubject,
        emailTemplate,
        questions,
      } = req.body;

      if (!tenantId || !title) {
        return res.status(400).json({ message: 'tenantId and title are required' });
      }

      const survey = await SurveyService.create({
        tenantId,
        title,
        description,
        status,
        isActive,
        autoSend,
        sendAfterDays,
        emailSubject,
        emailTemplate,
        questions,
      });

      res.status(201).json(survey);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        status,
        isActive,
        autoSend,
        sendAfterDays,
        emailSubject,
        emailTemplate,
      } = req.body;

      const survey = await SurveyService.update(id, {
        title,
        description,
        status,
        isActive,
        autoSend,
        sendAfterDays,
        emailSubject,
        emailTemplate,
      });

      res.json(survey);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await SurveyService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Question endpoints
  static async addQuestion(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const { type, question, description, options, isRequired, sortOrder } = req.body;

      if (!type || !question) {
        return res.status(400).json({ message: 'type and question are required' });
      }

      const questionResult = await SurveyService.addQuestion(surveyId, {
        type,
        question,
        description,
        options,
        isRequired,
        sortOrder,
      });

      res.status(201).json(questionResult);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type, question, description, options, isRequired, sortOrder } = req.body;

      const questionResult = await SurveyService.updateQuestion(id, {
        type,
        question,
        description,
        options,
        isRequired,
        sortOrder,
      });

      res.json(questionResult);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async deleteQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await SurveyService.deleteQuestion(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  // Response endpoints
  static async submitResponse(req: Request, res: Response) {
    try {
      const {
        surveyId,
        reservationId,
        questionId,
        answer,
        answerNumber,
        answerArray,
        customerEmail,
        customerName,
      } = req.body;

      if (!surveyId || !questionId) {
        return res.status(400).json({ message: 'surveyId and questionId are required' });
      }

      const response = await SurveyService.submitResponse({
        surveyId,
        reservationId,
        questionId,
        answer,
        answerNumber,
        answerArray,
        customerEmail,
        customerName,
      });

      res.status(201).json(response);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getResponses(req: Request, res: Response) {
    try {
      const { surveyId } = req.params;
      const responses = await SurveyService.getResponses(surveyId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getResponsesByReservation(req: Request, res: Response) {
    try {
      const { reservationId } = req.params;
      const responses = await SurveyService.getResponsesByReservation(reservationId);
      res.json(responses);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

