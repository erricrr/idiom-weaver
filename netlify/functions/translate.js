import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
  console.log("Translation request received:", event.body);

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable not set");
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: "Server configuration error: Missing API key"
        })
      };
    }

    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { idiom, sourceLanguage, targetLanguages } = requestBody;

    // Validate input
    if (!idiom || !sourceLanguage || !targetLanguages || !Array.isArray(targetLanguages)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: "Missing required fields: idiom, sourceLanguage, targetLanguages"
        })
      };
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const targetLanguageList = targetLanguages.join(", ");
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

    console.log("Calling Gemini API...");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
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
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(parsedResult)
    };

  } catch (error) {
    console.error("Gemini API call failed:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: "Failed to get idiom translations from the API.",
        details: error.message
      })
    };
  }
};
