# 🚀 Quick Fix Checklist for Netlify Deployment

## Problem
- `/api/translate` returning 404 errors on Netlify 
- Express server doesn't run on Netlify (only static files)
- Font warnings from browser extensions (harmless)

## ✅ Solution Applied
Converted Express API routes to **Netlify Functions**

## 📋 What You Need To Do NOW

### 1. Set Environment Variable in Netlify
🔑 **CRITICAL**: Go to Netlify Dashboard → Site Settings → Environment Variables
- Add: `GEMINI_API_KEY` = `your_actual_gemini_api_key`

### 2. Push Code & Deploy
```bash
git add .
git commit -m "Convert to Netlify Functions"
git push origin main
```

### 3. Verify Build Settings
In Netlify dashboard:
- **Build command**: `npm run build` ✓
- **Publish directory**: `dist` ✓ 
- **Functions directory**: `netlify/functions` ✓

## 🎯 Files Added
- `netlify/functions/translate.js` - API endpoint
- `netlify/functions/tts.js` - TTS endpoint
- `netlify.toml` - Routing config
- `public/_headers` - CORS headers

## 🧪 Test After Deploy
Your API endpoints will be:
- `https://yoursite.netlify.app/api/translate` (POST)
- `https://yoursite.netlify.app/api/tts?text=hello&lang=en` (GET)

## ⚠️ About Those Font Warnings
The Adobe font errors are from a browser extension - they're harmless and don't affect your app!

## 🆘 If Still Having Issues
1. Check Netlify function logs
2. Verify `GEMINI_API_KEY` is set
3. Clear browser cache
4. Test API directly in browser dev tools

**The main fix is setting the environment variable in Netlify!** 🔥