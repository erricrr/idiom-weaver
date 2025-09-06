import dotenv from "dotenv";
dotenv.config();
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Starting server...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI with better error handling
console.log("Checking for GEMINI_API_KEY...");
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable not set");
  console.error("Please create a .env file with GEMINI_API_KEY=your_api_key");
  process.exit(1);
}
console.log("✅ GEMINI_API_KEY loaded successfully");

let genAI;
try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("✅ GoogleGenerativeAI initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize GoogleGenerativeAI:", error.message);
  process.exit(1);
}

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Translation endpoint
app.post("/api/translate", async (req, res) => {
  console.log("Translation request received:", req.body);
  try {
    const { idiom, sourceLanguage, targetLanguages } = req.body;

    if (
      !idiom ||
      !sourceLanguage ||
      !targetLanguages ||
      !Array.isArray(targetLanguages)
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: idiom, sourceLanguage, targetLanguages",
      });
    }

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

    let model, result, response, jsonText, parsedResult;

    try {
      model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
          topP: 0.8,
          topK: 40,
        },
      });

      result = await model.generateContent(prompt);
      response = await result.response;
      jsonText = response.text();

      console.log("Raw API response received, length:", jsonText?.length || 0);

      if (!jsonText) {
        throw new Error("Empty response from Gemini API");
      }

      parsedResult = JSON.parse(jsonText);

      if (!parsedResult || typeof parsedResult !== "object") {
        throw new Error("Invalid JSON structure received from Gemini API");
      }

      console.log("✅ Translation completed successfully");
      res.json(parsedResult);
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        console.error("❌ JSON parsing failed:", parseError.message);
        console.error("Raw response that failed to parse:", jsonText);
        res.status(500).json({
          error: "Invalid response format from translation service",
          details: "The translation service returned malformed data",
        });
      } else {
        throw parseError; // Re-throw non-JSON errors to be caught by outer catch
      }
    }
  } catch (error) {
    console.error("❌ Gemini API call failed:", error);
    console.error("Error details:", error.message);
    console.error("Stack trace:", error.stack);

    // More specific error responses
    let errorMessage = "Failed to get idiom translations from the API.";
    let statusCode = 500;

    if (error.message?.includes("API key")) {
      errorMessage = "Invalid or expired API key";
      statusCode = 401;
    } else if (
      error.message?.includes("quota") ||
      error.message?.includes("limit")
    ) {
      errorMessage = "API quota exceeded. Please try again later.";
      statusCode = 429;
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("ECONNREFUSED")
    ) {
      errorMessage =
        "Network connection failed. Please check your internet connection.";
      statusCode = 503;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
    });
  }
});

// TTS proxy endpoint
app.get("/api/tts", async (req, res) => {
  try {
    const { text, lang } = req.query;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Missing 'text' query param" });
    }

    if (!lang || !lang.trim()) {
      return res.status(400).json({ error: "Missing 'lang' query param" });
    }

    // Google Translate TTS has a length limit (~200 chars). Idioms are typically short.
    const trimmed = text.trim().slice(0, 200);
    const languageCode = lang.trim();

    console.log(`🔊 TTS API: "${trimmed}" in ${languageCode}`);

    const ttsUrl = new URL("https://translate.google.com/translate_tts");
    ttsUrl.searchParams.set("ie", "UTF-8");
    ttsUrl.searchParams.set("q", trimmed);
    ttsUrl.searchParams.set("tl", languageCode);
    ttsUrl.searchParams.set("client", "tw-ob");

    console.log(`📡 Fetching from Google TTS: ${ttsUrl.toString()}`);

    const upstream = await fetch(ttsUrl.toString(), {
      method: "GET",
      headers: {
        // Spoof typical browser headers to avoid upstream blocking
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
        Referer: "https://translate.google.com/",
        "Accept-Language": "en-US,en;q=0.9",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    if (!upstream.ok) {
      console.error(
        `❌ Google TTS failed: ${upstream.status} ${upstream.statusText}`,
      );
      return res.status(upstream.status).json({
        error: "Google TTS request failed",
        status: upstream.status,
        statusText: upstream.statusText,
      });
    }

    console.log(`✅ Google TTS success: ${upstream.status}`);

    const arrayBuffer = await upstream.arrayBuffer();

    // Set appropriate headers
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'inline; filename="tts.mp3"',
      "Accept-Ranges": "bytes",
      // Absolutely disable CDN and browser caching
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
      Pragma: "no-cache",
      Expires: "0",
      // Netlify-specific header to prevent edge caching
      "Netlify-CDN-Cache-Control": "no-store",
    });

    // Send audio data
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("❌ TTS API error:", error);
    res.status(500).json({
      error: "Unexpected server error",
      details: error.message,
    });
  }
});

// Serve static files (your React app)
app.use(express.static("dist"));

// Fallback route for SPA
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

console.log(`Starting server on port ${PORT}...`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`API Health Check: http://localhost:${PORT}/api/health`);

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Frontend proxy should connect to: http://localhost:${PORT}`);
  console.log(
    `🚀 Translation API available at: http://localhost:${PORT}/api/translate`,
  );
  console.log(`🎵 TTS API available at: http://localhost:${PORT}/api/tts`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});
