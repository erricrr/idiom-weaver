import { Language, ApiResult } from "../types";

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

  console.log(`🚀 Translation via Netlify function: "${idiom}" (${sourceLanguage}) → [${targetLanguages.join(", ")}]`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Translation attempt ${attempt}/${MAX_RETRIES}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idiom,
          sourceLanguage,
          targetLanguages,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // If parsing fails, use the raw text
          errorMessage = errorText || errorMessage;
        }

        if (response.status >= 500 && attempt < MAX_RETRIES) {
          console.warn(
            `⚠️ Server error (${response.status}), retrying in ${RETRY_DELAY}ms...`,
          );
          await sleep(RETRY_DELAY * attempt);
          continue;
        }

        throw new Error(errorMessage);
      }

      const result: ApiResult = await response.json();

      if (!result || typeof result !== "object") {
        throw new Error("Invalid response format from server");
      }

      console.log("✅ Translation successful");
      return result;

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Translation attempt ${attempt} failed:`, error);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          lastError = new Error(
            "Translation request timed out. Please try again.",
          );
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError")
        ) {
          lastError = new Error(
            "Network connection failed. Please check your internet connection and try again.",
          );
        }
      }

      if (attempt < MAX_RETRIES && !error.message.includes("400")) {
        console.log(`⏳ Retrying in ${RETRY_DELAY * attempt}ms...`);
        await sleep(RETRY_DELAY * attempt);
        continue;
      }

      break;
    }
  }

  console.error("❌ All translation attempts failed:", lastError);
  throw (
    lastError || new Error("Failed to get idiom translations from the API.")
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

// Simple function to check if the API endpoint is available
export const checkGeminiSetup = (): { isConfigured: boolean; message: string } => {
  // Since we're using Netlify functions, we just check if we're in a browser environment
  if (typeof window !== 'undefined') {
    return {
      isConfigured: true,
      message: "Translation service is ready."
    };
  } else {
    return {
      isConfigured: false,
      message: "Translation service is not available in this environment."
    };
  }
};
