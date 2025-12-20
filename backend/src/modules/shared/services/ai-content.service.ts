import axios from 'axios';
import { TranslationService } from './translation.service';
import { LanguageService } from './language.service';

export type DestinationContentInput = {
  title: string;
};

export type BlogContentInput = {
  title: string;
};

export type LanguageContent = {
  title: string;
  short_description: string;
  description: string;
};

export type BlogLanguageContent = {
  title: string;
  content: string;
};

export type GeneratedContentResponse = {
  [languageCode: string]: LanguageContent;
};

export type GeneratedBlogContentResponse = {
  [languageCode: string]: BlogLanguageContent;
};

/**
 * AI Content Generation Service
 * Generates Turkish content using OpenAI API and translates to other languages
 */
export class AiContentService {
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  
  private static getOpenAiApiKey(): string {
    // Try to get from env config or directly from process.env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    return apiKey;
  }

  /**
   * Generate prompt for Turkish content generation
   */
  private static buildTurkishContentPrompt(title: string): string {
    return `Sen bir turizm ve destinasyon içerik uzmanısın. Aşağıdaki destinasyon başlığı için profesyonel, SEO uyumlu ve satış odaklı Türkçe içerik üret.

DESTİNASYON BAŞLIĞI: "${title}"

GEREKSİNİMLER:
1. short_description: Maksimum 160 karakter, destinasyonun öne çıkan özelliklerini vurgulayan kısa ve çekici açıklama
2. description: 2-3 paragraftan oluşan, destinasyonun tarihi, kültürel özellikleri, doğal güzellikleri, turistik aktiviteler ve neden ziyaret edilmesi gerektiğini anlatan detaylı açıklama

KURALLAR:
- Turizm/destinasyon dili kullan
- SEO uyumlu olmalı (anahtar kelimeler doğal şekilde kullanılmalı)
- Profesyonel ve satış odaklı ton
- Emoji kullanma
- Gerçekçi ve bilgilendirici olmalı
- Türkçe yazım kurallarına uygun

ÇIKTI FORMATI (JSON):
{
  "title": "${title}",
  "short_description": "...",
  "description": "..."
}

Sadece JSON döndür, başka açıklama yapma.`;
  }

  /**
   * Generate Turkish content using OpenAI
   */
  private static async generateTurkishContent(title: string): Promise<LanguageContent> {
    try {
      const prompt = this.buildTurkishContentPrompt(title);
      
      const response = await axios.post(
        this.OPENAI_API_URL,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Sen bir turizm içerik uzmanısın. Türkçe içerik üretiyorsun ve sadece JSON formatında yanıt veriyorsun.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.getOpenAiApiKey()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI API returned no content');
      }

      const parsedContent = JSON.parse(content) as LanguageContent;
      
      // Validate required fields
      if (!parsedContent.title || !parsedContent.short_description || !parsedContent.description) {
        throw new Error('OpenAI API returned incomplete content');
      }

      // Ensure short_description is max 160 characters
      if (parsedContent.short_description.length > 160) {
        parsedContent.short_description = parsedContent.short_description.substring(0, 157) + '...';
      }

      return parsedContent;
    } catch (error) {
      console.error('OpenAI content generation error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          `OpenAI API error: ${error.response?.status} - ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Translate content to multiple languages
   */
  private static async translateContent(
    turkishContent: LanguageContent,
    targetLanguageCode: string
  ): Promise<LanguageContent> {
    try {
      // Translate all three fields
      const [title, shortDescription, description] = await Promise.all([
        TranslationService.translateText({
          text: turkishContent.title,
          targetLanguageCode,
          sourceLanguageCode: 'tr',
        }),
        TranslationService.translateText({
          text: turkishContent.short_description,
          targetLanguageCode,
          sourceLanguageCode: 'tr',
        }),
        TranslationService.translateText({
          text: turkishContent.description,
          targetLanguageCode,
          sourceLanguageCode: 'tr',
        }),
      ]);

      return {
        title,
        short_description: shortDescription,
        description,
      };
    } catch (error) {
      console.error(`Translation error for language ${targetLanguageCode}:`, error);
      throw new Error(`Failed to translate content to ${targetLanguageCode}: ${(error as Error).message}`);
    }
  }

  /**
   * Generate destination content in all available languages
   * Step 1: Generate Turkish content using AI
   * Step 2: Translate to all other active languages
   */
  static async generateDestinationContent(input: DestinationContentInput): Promise<GeneratedContentResponse> {
    try {
      const { title } = input;

      if (!title || !title.trim()) {
        throw new Error('Title is required');
      }

      // Step 1: Generate Turkish content using AI
      const turkishContent = await this.generateTurkishContent(title.trim());

      // Step 2: Get all active languages from database
      const allLanguages = await LanguageService.list();
      const activeLanguages = allLanguages.filter(lang => lang.isActive && lang.code !== 'tr');

      // Step 3: Translate Turkish content to all other active languages
      const translations = await Promise.all(
        activeLanguages.map(async (language) => {
          try {
            const translatedContent = await this.translateContent(turkishContent, language.code);
            return {
              languageCode: language.code,
              content: translatedContent,
            };
          } catch (error) {
            console.error(`Failed to translate to ${language.code}:`, error);
            // Skip failed translations but continue with others
            return null;
          }
        })
      );

      // Build final response
      const result: GeneratedContentResponse = {
        tr: turkishContent,
      };

      // Add translations (filter out null results)
      translations.forEach((translation) => {
        if (translation) {
          result[translation.languageCode] = translation.content;
        }
      });

      return result;
    } catch (error) {
      console.error('Content generation error:', error);
      throw error;
    }
  }

  /**
   * Generate prompt for Turkish blog content generation
   */
  private static buildTurkishBlogPrompt(title: string): string {
    return `Sen bir blog içerik uzmanısın. Aşağıdaki blog başlığı için profesyonel, SEO uyumlu ve okunabilir Türkçe blog yazısı üret.

BLOG BAŞLIĞI: "${title}"

GEREKSİNİMLER:
1. title: Başlık (verilen başlığı kullan)
2. content: 3-5 paragraftan oluşan, konuyu detaylı şekilde anlatan, bilgilendirici ve ilgi çekici blog yazısı içeriği

KURALLAR:
- Blog dili kullan (samimi ama profesyonel ton)
- SEO uyumlu olmalı (anahtar kelimeler doğal şekilde kullanılmalı)
- Okunabilir paragraflar (her paragraf 3-5 cümle)
- İlgi çekici giriş ve sonuç paragrafı
- Bilgilendirici ve değerli içerik
- Emoji kullanma
- Türkçe yazım kurallarına uygun
- HTML etiketleri kullanma (düz metin)

ÇIKTI FORMATI (JSON):
{
  "title": "${title}",
  "content": "..."
}

Sadece JSON döndür, başka açıklama yapma.`;
  }

  /**
   * Generate Turkish blog content using OpenAI
   */
  private static async generateTurkishBlogContent(title: string): Promise<BlogLanguageContent> {
    try {
      const prompt = this.buildTurkishBlogPrompt(title);
      
      const response = await axios.post(
        this.OPENAI_API_URL,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Sen bir blog içerik uzmanısın. Türkçe blog yazısı üretiyorsun ve sadece JSON formatında yanıt veriyorsun.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.getOpenAiApiKey()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI API returned no content');
      }

      const parsedContent = JSON.parse(content) as BlogLanguageContent;
      
      // Validate required fields
      if (!parsedContent.title || !parsedContent.content) {
        throw new Error('OpenAI API returned incomplete content');
      }

      return parsedContent;
    } catch (error) {
      console.error('OpenAI blog content generation error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          `OpenAI API error: ${error.response?.status} - ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  /**
   * Translate blog content to multiple languages
   */
  private static async translateBlogContent(
    turkishContent: BlogLanguageContent,
    targetLanguageCode: string
  ): Promise<BlogLanguageContent> {
    try {
      // Translate title and content
      const [title, content] = await Promise.all([
        TranslationService.translateText({
          text: turkishContent.title,
          targetLanguageCode,
          sourceLanguageCode: 'tr',
        }),
        TranslationService.translateText({
          text: turkishContent.content,
          targetLanguageCode,
          sourceLanguageCode: 'tr',
        }),
      ]);

      return {
        title,
        content,
      };
    } catch (error) {
      console.error(`Translation error for language ${targetLanguageCode}:`, error);
      throw new Error(`Failed to translate blog content to ${targetLanguageCode}: ${(error as Error).message}`);
    }
  }

  /**
   * Generate blog content in all available languages
   * Step 1: Generate Turkish content using AI
   * Step 2: Translate to all other active languages
   */
  static async generateBlogContent(input: BlogContentInput): Promise<GeneratedBlogContentResponse> {
    try {
      const { title } = input;

      if (!title || !title.trim()) {
        throw new Error('Title is required');
      }

      // Step 1: Generate Turkish content using AI
      const turkishContent = await this.generateTurkishBlogContent(title.trim());

      // Step 2: Get all active languages from database
      const allLanguages = await LanguageService.list();
      const activeLanguages = allLanguages.filter(lang => lang.isActive && lang.code !== 'tr');

      // Step 3: Translate Turkish content to all other active languages
      const translations = await Promise.all(
        activeLanguages.map(async (language) => {
          try {
            const translatedContent = await this.translateBlogContent(turkishContent, language.code);
            return {
              languageCode: language.code,
              content: translatedContent,
            };
          } catch (error) {
            console.error(`Failed to translate to ${language.code}:`, error);
            // Skip failed translations but continue with others
            return null;
          }
        })
      );

      // Build final response
      const result: GeneratedBlogContentResponse = {
        tr: turkishContent,
      };

      // Add translations (filter out null results)
      translations.forEach((translation) => {
        if (translation) {
          result[translation.languageCode] = translation.content;
        }
      });

      return result;
    } catch (error) {
      console.error('Blog content generation error:', error);
      throw error;
    }
  }
}

