
import { GoogleGenAI, Type } from "@google/genai";
import { Language, ApiResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const translateIdiom = async (idiom: string, sourceLanguage: Language, targetLanguages: Language[]): Promise<ApiResult> => {
  const targetLanguageList = targetLanguages.join(', ');
  const prompt = `
    You are an expert in linguistics and cultural idioms, proverbs, and common sayings.
    The user has provided the phrase "${idiom}" from the ${sourceLanguage} language.
    Your task is to find the conceptual equivalent idioms or phrases in the following languages: ${targetLanguageList}.
    For each of the requested languages (${targetLanguageList}), you must provide:
    1. The equivalent idiom in that language.
    2. A literal translation of that idiom into English.
    3. A brief explanation of how the idiom's meaning relates to the original concept.

    If you cannot find a suitable equivalent for a specific language, provide a thoughtful explanation of why a direct equivalent may not exist.
    Provide the output in a valid JSON format according to the specified schema. The keys for each language must be in lowercase (e.g., "english", "spanish").
  `;

  const idiomTranslationProperties = {
    type: Type.OBJECT,
    properties: {
      idiom: { type: Type.STRING },
      literal_translation: { type: Type.STRING },
      explanation: { type: Type.STRING },
    },
    required: ["idiom", "literal_translation", "explanation"]
  };

  const properties = targetLanguages.reduce((acc, lang) => {
    acc[lang.toLowerCase()] = idiomTranslationProperties;
    return acc;
  }, {} as Record<string, typeof idiomTranslationProperties>);

  const responseSchema = {
    type: Type.OBJECT,
    properties,
    required: targetLanguages.map(lang => lang.toLowerCase())
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult: ApiResult = JSON.parse(jsonText);
    return parsedResult;
  } catch (error) {
    console.error("Gemini API call failed:", error);
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
