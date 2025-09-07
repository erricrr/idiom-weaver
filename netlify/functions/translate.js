import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
  console.log("Translation request received:", event.body);

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set");
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Server configuration error: Missing API key",
        }),
      };
    }

    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { idiom, sourceLanguage, targetLanguages } = requestBody;

    // Validate input
    if (
      !idiom ||
      !sourceLanguage ||
      !targetLanguages ||
      !Array.isArray(targetLanguages)
    ) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error:
            "Missing required fields: idiom, sourceLanguage, targetLanguages",
        }),
      };
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const targetLanguageList = targetLanguages.join(", ");
    const prompt = `You are Professor Polyglot, an expert linguist and cultural specialist with deep knowledge of idioms across cultures. Find culturally equivalent idioms for "${idiom}" from ${sourceLanguage} in these languages: ${targetLanguageList}.

CRITICAL FORMATTING RULES - STRICTLY REQUIRED:

For JAPANESE specifically, you MUST provide these four fields:
- "idiom": The Japanese characters (kanji/hiragana/katakana)
- "phonetic": The complete romaji pronunciation
- "literal_translation": Word-for-word English translation
- "explanation": Rich cultural context (100-150 words)

For ALL OTHER LANGUAGES, provide these three fields:
- "idiom": The phrase in native script with proper diacritics
- "literal_translation": MANDATORY word-for-word English translation (NEVER empty!)
- "explanation": Cultural context with origins and historical background (100-150 words)

EXAMPLE OUTPUT FORMATS:

Japanese Example - "猫に小判" (neko ni koban):
{
  "japanese": {
    "idiom": "猫に小判",
    "phonetic": "neko ni koban",
    "literal_translation": "gold coins to a cat",
    "explanation": "This Edo period idiom (1603-1868) reflects Japan's historical relationship with precious metals and the practical wisdom of merchant culture. Koban were oval gold coins used as currency, representing significant wealth. The image of offering such treasure to a cat, who cannot appreciate its value, perfectly captures the futility of giving something valuable to someone who cannot understand or use it. This metaphor resonates deeply in Japanese culture, which highly values practical wisdom and appropriate allocation of resources..."
  }
}

Spanish Example - "llueve a cántaros":
{
  "spanish": {
    "idiom": "llueve a cántaros",
    "literal_translation": "it rains pitchers",
    "explanation": "Dating back to 16th century Spain, this idiom uses the image of water pouring from large clay vessels (cántaros) that were essential in Spanish households. These wide-mouthed earthenware jugs were used for storing and transporting water, and the metaphor of rain falling as if poured from these vessels creates a vivid image of torrential downpour. The phrase reflects Mediterranean culture's intimate relationship with water as a precious resource..."
  }
}

MISSION PARAMETERS:

1. ACCURACY FIRST: Find TRUE cultural equivalents, not just literal translations
2. CULTURAL RESEARCH: Include historical origins, folk wisdom, and cultural contexts
3. AUTHENTIC LANGUAGE: Use proper native scripts, diacritics, and authentic spelling
4. NO EMPTY FIELDS: literal_translation field MUST always contain actual translations
5. JAPANESE ONLY: ALWAYS include both "idiom" AND "phonetic" for Japanese
6. RICH CONTEXT: Make explanations engaging with historical context and cultural significance
7. PERFECT JSON: Use lowercase language keys, proper escaping, valid JSON structure

VALIDATION CHECKLIST:
- Japanese entries have both "idiom" AND "phonetic" fields
- Every literal_translation field contains actual word-for-word translation
- Explanations include cultural origins and historical context
- Native scripts and proper diacritics used throughout
- JSON is perfectly formatted with lowercase language keys

If no exact cultural equivalent exists, find the CLOSEST match and explain the cultural differences with equal detail and enthusiasm.

OUTPUT FORMAT (JSON with lowercase language keys):`;

    console.log("Calling Gemini API...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    console.log("Raw API response:", jsonText);
    const parsedResult = JSON.parse(jsonText);

    console.log("Translation completed successfully");

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsedResult),
    };
  } catch (error) {
    console.error("Gemini API call failed:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to get idiom translations from the API.",
        details: error.message,
      }),
    };
  }
};
