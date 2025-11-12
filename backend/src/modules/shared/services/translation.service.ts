// DeepL Translation Service
import axios from 'axios';

const DEEPL_API_KEY = '0b7f4f13-592d-422f-97de-cce89537ad27:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// Language code mapping (ISO 639-1 to DeepL codes)
const languageCodeMap: Record<string, string> = {
  'en': 'EN',
  'tr': 'TR',
  'de': 'DE',
  'fr': 'FR',
  'es': 'ES',
  'it': 'IT',
  'pt': 'PT',
  'ru': 'RU',
  'ja': 'JA',
  'zh': 'ZH',
  'pl': 'PL',
  'nl': 'NL',
  'sv': 'SV',
  'da': 'DA',
  'fi': 'FI',
  'el': 'EL',
  'cs': 'CS',
  'ro': 'RO',
  'hu': 'HU',
  'bg': 'BG',
  'sk': 'SK',
  'sl': 'SL',
  'et': 'ET',
  'lv': 'LV',
  'lt': 'LT',
  'mt': 'MT',
};

export interface DeepLTranslationResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

export type TranslateRequest = {
  text: string;
  targetLanguageCode: string;
  sourceLanguageCode?: string;
};

export type TranslateMultipleRequest = {
  texts: string[];
  targetLanguageCode: string;
  sourceLanguageCode?: string;
};

export class TranslationService {
  static async translateText(input: TranslateRequest): Promise<string> {
    try {
      const targetLang = languageCodeMap[input.targetLanguageCode.toLowerCase()] || input.targetLanguageCode.toUpperCase();
      const sourceLang = input.sourceLanguageCode ? languageCodeMap[input.sourceLanguageCode.toLowerCase()] : undefined;

      const params = new URLSearchParams({
        text: input.text,
        target_lang: targetLang,
        ...(sourceLang && { source_lang: sourceLang }),
      });

      const response = await axios.post<DeepLTranslationResponse>(
        DEEPL_API_URL,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          },
        }
      );

      if (!response.data.translations || response.data.translations.length === 0) {
        throw new Error('DeepL API returned no translations');
      }
      return response.data.translations[0]?.text || input.text;
    } catch (error) {
      console.error('DeepL translation error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`DeepL API error: ${error.response?.status} - ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  static async translateMultiple(input: TranslateMultipleRequest): Promise<string[]> {
    try {
      const targetLang = languageCodeMap[input.targetLanguageCode.toLowerCase()] || input.targetLanguageCode.toUpperCase();
      const sourceLang = input.sourceLanguageCode ? languageCodeMap[input.sourceLanguageCode.toLowerCase()] : undefined;

      const params = new URLSearchParams();
      input.texts.forEach(text => params.append('text', text));
      params.append('target_lang', targetLang);
      if (sourceLang) {
        params.append('source_lang', sourceLang);
      }

      const response = await axios.post<DeepLTranslationResponse>(
        DEEPL_API_URL,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          },
        }
      );

      return response.data.translations.map(t => t.text);
    } catch (error) {
      console.error('DeepL multiple translation error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`DeepL API error: ${error.response?.status} - ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }
}

