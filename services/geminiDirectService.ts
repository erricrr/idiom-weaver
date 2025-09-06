import { GoogleGenerativeAI } from "@google/generative-ai";
import { Language, ApiResult } from "../types";

// Get API key from environment variables (Vite prefix required)
const getApiKey = (): string => {
  // Try Vite environment variable first
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Fallback to process.env for Node.js compatibility
  if (!apiKey && typeof process !== 'undefined') {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey) {
    throw new Error(
      "Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file."
    );
  }

  return apiKey;
};

// Initialize Gemini AI
const initializeGemini = () => {
  try {
    const apiKey = getApiKey();
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
    throw error;
  }
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const translateIdiomDirect = async (
  idiom: string,
  sourceLanguage: Language,
  targetLanguages: Language[],
): Promise<ApiResult> => {
  let lastError: Error;

  console.log(`🚀 Direct Gemini translation: "${idiom}" (${sourceLanguage}) → [${targetLanguages.join(", ")}]`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Translation attempt ${attempt}/${MAX_RETRIES}`);

      const genAI = initializeGemini();
      const targetLanguageList = targetLanguages.join(", ");

      const prompt = `You are an expert linguist and cultural specialist. Find equivalent idioms for "${idiom}" from ${sourceLanguage} in these languages: ${targetLanguageList}.

CRITICAL: For each language, you MUST provide all 3 fields:

1. "idiom" - The culturally equivalent phrase in that language
2. "literal_translation" - MANDATORY word-for-word English translation (NEVER empty!)
3. "explanation" - Rich cultural context including origins, historical background, and why this metaphor is used

EXAMPLE for Spanish "llueve a cántaros":
- literal_translation: "it rains pitchers" (NOT empty, NOT just quotes)
- explanation: "Dating back to 16th century Spain, this idiom uses the image of water pouring from large clay vessels (cántaros) that were essential in Spanish households. The metaphor reflects the Mediterranean culture's relationship with precious water resources..."

OUTPUT FORMAT (JSON with lowercase language keys):
{
  "spanish": {
    "idiom": "llueve a cántaros",
    "literal_translation": "it rains pitchers",
    "explanation": "Dating back to 16th century Spain..."
  }
}

REQUIREMENTS:
- literal_translation field must ALWAYS contain the actual word-for-word translation
- Explanations must include cultural/historical origins (100-150 words)
- Use proper diacritics and authentic spelling
- If no exact equivalent exists, provide closest cultural match and explain the difference`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
        },
      });

      console.log("📡 Calling Gemini API directly...");

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text();

      console.log("📥 Raw API response received, length:", jsonText?.length || 0);

      if (!jsonText) {
        throw new Error("Empty response from Gemini API");
      }

      const parsedResult = JSON.parse(jsonText);

      if (!parsedResult || typeof parsedResult !== "object") {
        throw new Error("Invalid JSON structure received from Gemini API");
      }

      console.log("✅ Direct translation completed successfully");
      return parsedResult as ApiResult;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Translation attempt ${attempt} failed:`, error);

      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes("API key")) {
          lastError = new Error(
            "Invalid or expired Gemini API key. Please check your VITE_GEMINI_API_KEY in .env file."
          );
          break; // Don't retry API key errors
        } else if (
          error.message.includes("quota") ||
          error.message.includes("limit")
        ) {
          lastError = new Error(
            "Gemini API quota exceeded. Please try again later or check your API limits."
          );
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          lastError = new Error(
            "Network connection failed. Please check your internet connection and try again."
          );
        }
      }

      if (attempt < MAX_RETRIES && !error.message.includes("API key")) {
        console.log(`⏳ Retrying in ${RETRY_DELAY * attempt}ms...`);
        await sleep(RETRY_DELAY * attempt);
        continue;
      }

      break;
    }
  }

  console.error("❌ All translation attempts failed:", lastError);
  throw (
    lastError || new Error("Failed to get idiom translations from Gemini API.")
  );
};

export const translateIdiomPartialDirect = async (
  idiom: string,
  sourceLanguage: Language,
  newTargetLanguages: Language[],
  existingResults: ApiResult,
): Promise<ApiResult> => {
  // If no new languages to translate, return existing results
  if (newTargetLanguages.length === 0) {
    return existingResults;
  }

  console.log(
    `🔄 Partial re-weaving: Translating only ${newTargetLanguages.length} new language(s): ${newTargetLanguages.join(", ")}`
  );
  console.log(
    `💰 API call savings: Skipping ${Object.keys(existingResults).length} already-translated language(s)`
  );

  try {
    // Get translations for only the new languages
    const newTranslations = await translateIdiomDirect(
      idiom,
      sourceLanguage,
      newTargetLanguages,
    );

    // Validate new translations before merging
    if (!newTranslations || typeof newTranslations !== "object") {
      throw new Error("Invalid partial translation response");
    }

    // Merge new translations with existing results
    const mergedResults = {
      ...existingResults,
      ...newTranslations,
    };

    console.log(
      `✅ Partial translation completed. Total languages: ${Object.keys(mergedResults).length}`
    );
    return mergedResults;
  } catch (error) {
    console.error("❌ Partial translation failed:", error);
    throw new Error(
      `Failed to translate new languages: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};

// Environment check helper
export const checkGeminiSetup = (): { isConfigured: boolean; message: string } => {
  try {
    const apiKey = getApiKey();
    return {
      isConfigured: true,
      message: "Gemini API key found and configured correctly."
    };
  } catch (error) {
    return {
      isConfigured: false,
      message: error instanceof Error ? error.message : "Unknown configuration error."
    };
  }
};
