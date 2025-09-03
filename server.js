import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
