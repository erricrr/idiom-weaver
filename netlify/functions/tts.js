export const handler = async (event, context) => {
  console.log("TTS request received:", event.queryStringParameters);

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { text, lang } = event.queryStringParameters || {};

    if (!text || !lang) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: "Missing text or lang parameter" })
      };
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
        Referer: "https://translate.google.com/",
      },
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: "TTS request failed" })
      };
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer();

    // Convert ArrayBuffer to base64 string for Netlify Functions
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: base64Audio,
      isBase64Encoded: true
    };

  } catch (error) {
    console.error("TTS proxy error:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
