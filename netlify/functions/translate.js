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
