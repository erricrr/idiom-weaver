
import { Language, ApiResult } from '../types';

export const translateIdiom = async (idiom: string, sourceLanguage: Language, targetLanguages: Language[]): Promise<ApiResult> => {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idiom,
        sourceLanguage,
        targetLanguages
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResult = await response.json();
    return result;
  } catch (error) {
    console.error("Translation API call failed:", error);
    throw new Error("Failed to get idiom translations from the API.");
  }
};

export const translateIdiomPartial = async (
  idiom: string,
  sourceLanguage: Language,
  newTargetLanguages: Language[],
  existingResults: ApiResult
): Promise<ApiResult> => {
  // If no new languages to translate, return existing results
  if (newTargetLanguages.length === 0) {
    return existingResults;
  }

  console.log(`🔄 Partial re-weaving: Translating only ${newTargetLanguages.length} new language(s): ${newTargetLanguages.join(', ')}`);
  console.log(`💰 API call savings: Skipping ${Object.keys(existingResults).length} already-translated language(s)`);

  // Get translations for only the new languages
  const newTranslations = await translateIdiom(idiom, sourceLanguage, newTargetLanguages);

  // Merge new translations with existing results
  return {
    ...existingResults,
    ...newTranslations
  };
};
