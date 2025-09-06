# Idiom Weaver 🌐

Discover how different cultures express the same ideas. Enter an idiom, saying, or common phrase, choose your languages, and find its cross-cultural equivalents.

![Idiom Weaver Screenshot](https://via.placeholder.com/800x400/1e293b/23d0f1?text=Idiom+Weaver)

## 🚀 Features

- **Cross-Cultural Translation**: Find authentic cultural equivalents, not literal translations
- **Language Detection**: Automatically detects the language of your input phrase
- **Text-to-Speech**: Hear how idioms sound in their native languages
- **8+ Supported Languages**: English, Spanish, French, German, Japanese, Portuguese, Vietnamese, Dutch
- **Progressive UI**: Intuitive step-by-step interface
- **Powered by Gemini AI**: Intelligent and accurate cultural context

## 🛠️ Quick Setup

### Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd idiom-weaver
   npm run setup
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Start the development servers**
   ```bash
   npm run dev:full
   ```

4. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

## 📜 Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run start` - Build and start production server

## 🐛 Troubleshooting

### Common Issues

#### 1. "500 Internal Server Error" when translating

**Symptoms**: API calls to `/api/translate` fail with 500 status

**Solutions**:
- ✅ Ensure your `.env` file exists with a valid `GEMINI_API_KEY`
- ✅ Check that the backend server is running (`npm run server`)
- ✅ Verify your Gemini API key is valid at [Google AI Studio](https://makersuite.google.com/)
- ✅ Check server logs for detailed error messages

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

1. **Backend logs**: Check the server console for API errors
2. **Frontend logs**: Open browser dev tools → Console tab
3. **Network issues**: Check browser dev tools → Network tab

### Port Conflicts

If you get port conflicts:

```bash
# Change the port in .env
PORT=3002

# Or kill existing processes
lsof -ti:3001 | xargs kill -9
```

## 🏗️ Architecture

```
idiom-weaver/
├── components/          # React components
├── services/           # API services (Gemini, TTS, language detection)
├── src/               # CSS and assets
├── server.js          # Express backend
├── App.tsx            # Main React app
└── index.tsx          # App entry point
```

### Key Files

- **`server.js`** - Express server handling Gemini API and TTS proxy
- **`services/geminiService.ts`** - Frontend service for API calls
- **`services/ttsService.ts`** - Text-to-speech functionality
- **`services/languageDetectionService.ts`** - Language detection logic

## 🌍 Supported Languages

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

## 🔒 Security Notes

- API keys are server-side only (not exposed to frontend)
- TTS requests are proxied through your server to avoid CORS issues
- No user data is stored or logged

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Setup

Ensure these environment variables are set in production:

```env
GEMINI_API_KEY=your_production_api_key
PORT=3001
NODE_ENV=production
```

### Recommended Platforms

- **Netlify** - For static frontend
- **Railway** - For full-stack deployment
- **Vercel** - With serverless functions
- **Heroku** - Traditional hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

- **Email**: [voicevoz321@gmail.com](mailto:voicevoz321@gmail.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/idiom-weaver/issues)

## 🙏 Acknowledgments

- **Google Gemini AI** - For intelligent cultural translations
- **Google Translate TTS** - For text-to-speech functionality
- **Tailwind CSS** - For beautiful UI styling
- **React** - For the frontend framework