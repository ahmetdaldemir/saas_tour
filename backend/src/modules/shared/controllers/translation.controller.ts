import { Request, Response } from 'express';
import { TranslationService, TranslateRequest, TranslateMultipleRequest } from '../services/translation.service';

export class TranslationController {
  static async translate(req: Request, res: Response) {
    try {
      const { text, targetLanguageCode, sourceLanguageCode }: TranslateRequest = req.body;
      
      if (!text || !targetLanguageCode) {
        return res.status(400).json({ message: 'text and targetLanguageCode are required' });
      }

      const translated = await TranslationService.translateText({
        text,
        targetLanguageCode,
        sourceLanguageCode,
      });

      res.json({ translated });
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async translateMultiple(req: Request, res: Response) {
    try {
      const { texts, targetLanguageCode, sourceLanguageCode }: TranslateMultipleRequest = req.body;
      
      if (!texts || !Array.isArray(texts) || texts.length === 0 || !targetLanguageCode) {
        return res.status(400).json({ message: 'texts (array) and targetLanguageCode are required' });
      }

      const translated = await TranslationService.translateMultiple({
        texts,
        targetLanguageCode,
        sourceLanguageCode,
      });

      res.json({ translated });
    } catch (error) {
      console.error('Multiple translation error:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

