[![Netlify Status](https://api.netlify.com/api/v1/badges/ef0e8454-aabd-4dfc-bf50-7ef8622fd174/deploy-status)](https://app.netlify.com/projects/idiom-weaver/deploys)

# Idiom Weaver

Discover how different cultures express the same ideas. Enter an idiom, saying, or common phrase, choose your languages, and find its cross-cultural equivalents.


## Features

- **Cross-Cultural Translation**: Find authentic cultural equivalents, not literal translations
- **Language Detection**: Automatically detects the language of your input phrase
- **Text-to-Speech**: Hear how idioms sound in their native languages
- **8+ Supported Languages**: English, Spanish, French, German, Japanese, Portuguese, Vietnamese, Dutch
- **Progressive UI**: Intuitive step-by-step interface
- **Powered by Gemini AI**: Intelligent and accurate cultural context

## Quick Setup

### Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Netlify CLI (for local development with functions)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd idiom-weaver
   npm install
   ```

2. **Install dependencies for Netlify functions**
   ```bash
   cd netlify/functions
   npm install
   cd ../..
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in the root directory
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
   ```

4. **Install Netlify CLI (if not already installed)**
   ```bash
   npm install -g netlify-cli
   ```

5. **Start the development server**
   ```bash
   # This will start both the Vite dev server and Netlify functions
   npm run netlify:dev
   ```

   **Alternative: Start just the frontend (without backend functions)**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Full app with functions: http://localhost:8888
   - Frontend only: http://localhost:5173

## Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Scripts

- `npm run dev` - Start frontend development server only
- `npm run netlify:dev` - Start both frontend and Netlify functions (recommended)
- `npm run build` - Build for production
- `npm run netlify:build` - Build for Netlify deployment
- `npm run setup` - Install dependencies and show setup instructions

## Troubleshooting

### Common Issues

#### 1. "500 Internal Server Error" when translating

**Symptoms**: API calls to `/api/translate` fail with 500 status

**Solutions**:
- ✅ Ensure your `.env` file exists with a valid `GEMINI_API_KEY`
- ✅ Make sure you're running `npm run netlify:dev` (not just `npm run dev`)
- ✅ Verify your Gemini API key is valid at [Google AI Studio](https://makersuite.google.com/)
- ✅ Check Netlify function logs in the terminal for detailed error messages
- ✅ Try restarting the Netlify dev server

#### 2. "Tailwind CSS should not be used in production" warning

**Status**: ✅ **FIXED** - Now using proper Tailwind installation

#### 3. Components not found errors

**Status**: ✅ **FIXED** - Removed duplicate component directories

#### 4. Audio/TTS not working

**Possible causes**:
- Browser autoplay policies (click somewhere first)
- Network connectivity issues
- Google Translate TTS service availability

#### 5. Language detection slow or failing

**Behavior**: This is expected - the app has fallbacks:
- Primary: Google Translate API (fast but may timeout)
- Fallback: Heuristic detection (based on character patterns)
- Manual: User can always select language manually

### Debug Mode

To enable detailed logging:

1. **Netlify function logs**: Check the terminal where `netlify dev` is running
2. **Frontend logs**: Open browser dev tools → Console tab
3. **Network issues**: Check browser dev tools → Network tab

### Port Conflicts

If you get port conflicts:

```bash
# Netlify dev uses port 8888 by default
# To change it, use:
netlify dev --port 9999

# Or kill existing processes
lsof -ti:8888 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Key Files

- **`netlify/functions/translate.js`** - Serverless function for Gemini API translation
- **`netlify/functions/tts.js`** - Serverless function for TTS proxy
- **`services/geminiDirectService.ts`** - Frontend service for API calls
- **`services/ttsService.ts`** - Text-to-speech functionality
- **`services/languageDetectionService.ts`** - Language detection logic

## Supported Languages

| Language | Code | TTS Support |
|----------|------|-------------|
| English | en | ✅ |
| Spanish | es | ✅ |
| French | fr | ✅ |
| German | de | ✅ |
| Japanese | ja | ✅ |
| Portuguese | pt | ✅ |
| Vietnamese | vi | ✅ |
| Dutch | nl | ✅ |
| Swedish | sv | ✅ |

## Security Notes

- API keys are server-side only (not exposed to frontend)
- TTS requests are proxied through Netlify functions to avoid CORS issues
- No user data is stored or logged
- Netlify functions run in secure, isolated environments

## Deployment

### Netlify Deployment (Recommended)

1. **Connect your repository to Netlify**
2. **Build settings:**
   - Build command: `npm run netlify:build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

3. **Environment variables in Netlify:**
   ```env
   GEMINI_API_KEY=your_production_api_key
   ```

## Acknowledgments

- **Google Gemini AI** - For intelligent cultural translations
- **Google Translate TTS** - For text-to-speech functionality
- **Tailwind CSS** - For beautiful UI styling
- **React** - For the frontend framework
