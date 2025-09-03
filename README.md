# Cross-Cultural Idiom Translator

A web application that translates idioms across different languages using AI and provides text-to-speech functionality.

## Features

- Translate idioms between multiple languages
- Text-to-speech for translated text (Google Translate TTS)
- Modern, responsive UI
- No API keys required for TTS functionality

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

## Development

### Option 1: Development mode with Vite (Frontend only)
```bash
npm run dev
```
This runs only the frontend. TTS functionality will not work in this mode.

### Option 2: Full development with TTS support (Recommended)
```bash
npm run dev:full
```
This runs both the frontend (Vite dev server) and backend (Express TTS server) simultaneously. Vite automatically proxies TTS API requests to the Express server.

### Option 3: Manual development setup
```bash
# Terminal 1: Start the TTS server
npm run server

# Terminal 2: Start the frontend dev server
npm run dev
```

**Note:** With the new Vite proxy configuration, the frontend automatically forwards TTS requests to the Express server, so you don't need to worry about different ports.

## Production

```bash
npm run start
```

This builds the app and starts the server on port 3001 (or the PORT environment variable).

## TTS Implementation

The app uses Google Translate TTS through a local Express server proxy to avoid CORS issues. The TTS service:

- Proxies requests to Google Translate TTS
- Handles proper headers and authentication
- Serves audio files without CORS restrictions
- Works without requiring any API keys
- Uses Vite proxy for seamless development experience

## Technologies

- React + TypeScript
- Vite for build tooling (with proxy configuration)
- Express.js for TTS proxy server
- Google Translate TTS (free, no API key required)
- Gemini AI for translations
