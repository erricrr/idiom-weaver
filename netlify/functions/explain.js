import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event, context) => {
  console.log("Explanation request received:", event.body);

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
    const { phrase, sourceLanguage } = requestBody;

    // Validate input
    if (!phrase || !sourceLanguage) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required fields: phrase, sourceLanguage",
        }),
      };
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const prompt = `You are Professor Polyglot, an expert linguist and cultural specialist with deep knowledge of idioms across cultures. Provide a detailed explanation of the phrase "${phrase}" from ${sourceLanguage}.

CRITICAL REQUIREMENTS:

1. CULTURAL CONTEXT: Explain the cultural origins, historical background, and social context of this phrase
2. LITERAL MEANING: Provide the word-for-word translation if it's an idiom or has non-literal meaning
3. USAGE CONTEXT: Explain when and how this phrase is typically used in ${sourceLanguage} culture
4. HISTORICAL ORIGINS: Include any historical events, literary sources, or cultural traditions that gave rise to this expression
5. CULTURAL SIGNIFICANCE: Explain why this phrase is meaningful in ${sourceLanguage} culture
6. RICH CONTEXT: Make explanations engaging with historical context and cultural significance

FORMAT REQUIREMENTS:
- Write 100-150 words
- Use clear, accessible language
- Include specific cultural details and historical context
- Focus on the cultural richness and depth of the expression
- Maintain a scholarly yet accessible tone

OUTPUT FORMAT:
Return only the explanation text, no JSON formatting, no quotes, just the pure explanation text.`;

    console.log("Calling Gemini API for explanation...");
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text().trim();

    console.log("Explanation generated successfully");

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ explanation }),
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
        error: "Failed to get phrase explanation from the API.",
        details: error.message,
      }),
    };
  }
};
