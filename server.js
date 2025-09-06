import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenAI, Type } from "@google/genai";

console.log("Starting server...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
console.log("Checking for GEMINI_API_KEY...");
console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable not set");
  process.exit(1);
}
console.log("GEMINI_API_KEY loaded successfully");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Translation endpoint
app.post('/api/translate', async (req, res) => {
  console.log("Translation request received:", req.body);
  try {
    const { idiom, sourceLanguage, targetLanguages } = req.body;

    if (!idiom || !sourceLanguage || !targetLanguages || !Array.isArray(targetLanguages)) {
      return res.status(400).json({ error: 'Missing required fields: idiom, sourceLanguage, targetLanguages' });
    }

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
    }, {});

    const responseSchema = {
      type: Type.OBJECT,
      properties,
      required: targetLanguages.map(lang => lang.toLowerCase())
    };

    console.log("Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText);

    console.log("Translation completed successfully");
    res.json(parsedResult);
  } catch (error) {
    console.error("Gemini API call failed:", error);
    res.status(500).json({ error: "Failed to get idiom translations from the API." });
  }
});

// TTS proxy endpoint
app.get('/api/tts', async (req, res) => {
  try {
    const { text, lang } = req.query;

    if (!text || !lang) {
      return res.status(400).json({ error: 'Missing text or lang parameter' });
    }

    // Construct Google Translate TTS URL
    const ttsUrl = new URL('https://translate.google.com/translate_tts');
    ttsUrl.searchParams.set('ie', 'UTF-8');
    ttsUrl.searchParams.set('q', text);
    ttsUrl.searchParams.set('tl', lang);
    ttsUrl.searchParams.set('client', 'tw-ob');

    // Fetch audio from Google Translate
    const response = await fetch(ttsUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'TTS request failed' });
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();

    // Set appropriate headers
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Send audio data
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve static files (your React app)
app.use(express.static('dist'));

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

console.log(`Starting server on port ${PORT}...`);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
