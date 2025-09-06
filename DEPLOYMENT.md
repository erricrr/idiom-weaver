# Deployment Instructions for Netlify

This guide will help you deploy the Idiom Weaver app to Netlify successfully.

## Quick Fix Summary

The console errors you experienced were due to:
1. **404 API errors**: Your Express server doesn't run on Netlify - only static files are served
2. **Font warnings**: These are from browser extensions (Adobe PDF) and can be ignored

## Solution

The app has been converted to use **Netlify Functions** instead of an Express server for the API endpoints.

## Files Created/Modified

- ✅ `netlify/functions/translate.js` - Handles `/api/translate` requests
- ✅ `netlify/functions/tts.js` - Handles `/api/tts` requests  
- ✅ `netlify.toml` - Netlify configuration
- ✅ `public/_headers` - CORS headers configuration
- ✅ `.env.example` - Environment variables template

## Deployment Steps

### 1. Set Up Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings > Environment variables**
3. Add the following variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API key

### 2. Configure Build Settings

In your Netlify site settings:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`

### 3. Deploy

#### Option A: Auto-deploy from Git
1. Connect your GitHub/GitLab repository to Netlify
2. Push your changes to the main branch
3. Netlify will auto-deploy

#### Option B: Manual deploy
1. Run `npm run build` locally
2. Drag the `dist` folder to Netlify's deploy zone

### 4. Verify Deployment

After deployment, check that these endpoints work:
- `https://your-site.netlify.app/api/translate` (POST)
- `https://your-site.netlify.app/api/tts` (GET)

## Local Development

For local development, you can still use the Express server:

```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Express server  
npm run server

# Or run both together
npm run dev:full
```

The Vite proxy will forward API calls to your local Express server.

## Troubleshooting

### API 404 Errors
- ✅ **Fixed**: Netlify Functions now handle API routes
- Ensure `GEMINI_API_KEY` is set in Netlify environment variables

### CORS Errors
- ✅ **Fixed**: Added proper CORS headers in functions and `_headers` file

### Font Warnings
- ⚠️ **Browser extension issue**: These warnings are from Adobe PDF extension
- They don't affect your app functionality
- Users can disable the extension to remove warnings

### Build Failures
- Ensure all dependencies are in `package.json`
- Check Netlify build logs for specific errors
- Verify Node.js version compatibility

## Environment Variables

Required for production:
```
GEMINI_API_KEY=your_actual_api_key_here
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

## API Endpoints

After deployment, your API will be available at:
- `POST /api/translate` - Translate idioms
- `GET /api/tts?text=hello&lang=en` - Text-to-speech

## Security Notes

- API key is stored securely in Netlify environment variables
- CORS is properly configured for cross-origin requests
- Security headers are set via `_headers` file

## Support

If you encounter issues:
1. Check Netlify function logs
2. Verify environment variables are set
3. Test API endpoints directly in browser/Postman
4. Check browser console for any remaining errors

The font warnings from browser extensions are cosmetic and don't affect functionality.