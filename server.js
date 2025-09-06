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

    let model, result, response, jsonText, parsedResult;

    try {
      model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
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

    if (!text || !lang) {
      return res.status(400).json({ error: "Missing text or lang parameter" });
    }

    // Construct Google Translate TTS URL
    const ttsUrl = new URL("https://translate.google.com/translate_tts");
    ttsUrl.searchParams.set("ie", "UTF-8");
    ttsUrl.searchParams.set("q", text);
    ttsUrl.searchParams.set("tl", lang);
    ttsUrl.searchParams.set("client", "tw-ob");

    // Fetch audio from Google Translate
    const response = await fetch(ttsUrl.toString(), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
        Referer: "https://translate.google.com/",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "TTS request failed" });
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();

    // Set appropriate headers
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Send audio data
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error("TTS proxy error:", error);
    res.status(500).json({ error: "Internal server error" });
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
