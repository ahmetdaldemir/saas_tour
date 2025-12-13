// DeepL Translation Service - Uses backend API to avoid CORS issues
import { http } from '../modules/http';

export const translateText = async (
  text: string,
  targetLanguageCode: string,
  sourceLanguageCode?: string
): Promise<string> => {
  try {
    const { data } = await http.post<{ translated: string }>('/translation/translate', {
      text,
      targetLanguageCode,
      sourceLanguageCode,
    });
    return data.translated;
  } catch (error) {
    console.error('DeepL translation error:', error);
    throw error;
  }
};

export const translateMultiple = async (
  texts: string[],
  targetLanguageCode: string,
  sourceLanguageCode?: string
): Promise<string[]> => {
  try {
    const { data } = await http.post<{ translated: string[] }>('/translation/translate-multiple', {
      texts,
      targetLanguageCode,
      sourceLanguageCode,
    });
    return data.translated;
  } catch (error) {
    console.error('DeepL multiple translation error:', error);
    throw error;
  }
};

