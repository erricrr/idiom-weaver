export const handler = async (event, context) => {
  const startTime = Date.now();
  console.log("TTS request received:", {
    method: event.httpMethod,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
    timestamp: new Date().toISOString(),
  });

  // Handle CORS preflight requests
  if (event.httpMethod === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Cache-Control",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
      body: "",
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    console.warn(`Method not allowed: ${event.httpMethod}`);
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Method not allowed",
        allowed_methods: ["GET"],
      }),
    };
  }

  try {
    const { text, lang, t } = event.queryStringParameters || {};

    // Validate required parameters
    if (!text || !lang) {
      console.warn("Missing required parameters:", {
        text: !!text,
        lang: !!lang,
      });
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required parameters",
          required: ["text", "lang"],
          received: { text: !!text, lang: !!lang },
        }),
      };
    }

    // Validate text length (Google TTS has limits)
    if (text.length > 200) {
      console.warn(`Text too long: ${text.length} characters`);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Text too long",
          max_length: 200,
          received_length: text.length,
        }),
      };
    }

    // Validate language code
    const validLanguageCodes = [
      "en",
      "es",
      "vi",
      "fr",
      "de",
      "ja",
      "pt",
      "nl",
      "it",
      "ru",
      "zh",
      "ko",
      "ar",
      "hi",
    ];

    if (!validLanguageCodes.includes(lang)) {
      console.warn(`Invalid language code: ${lang}`);
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid language code",
          supported_languages: validLanguageCodes,
          received: lang,
        }),
      };
    }

    console.log(
      `Processing TTS request: "${text.substring(0, 50)}${text.length > 50 ? "..." : ""}" in language "${lang}"`,
    );

    // Construct Google Translate TTS URL with additional parameters for reliability
    const ttsUrl = new URL("https://translate.google.com/translate_tts");
    ttsUrl.searchParams.set("ie", "UTF-8");
    ttsUrl.searchParams.set("q", text.trim());
    ttsUrl.searchParams.set("tl", lang);
    ttsUrl.searchParams.set("client", "tw-ob");
    ttsUrl.searchParams.set("idx", "0");
    ttsUrl.searchParams.set("textlen", text.length.toString());

    console.log(`Fetching audio from Google TTS: ${ttsUrl.toString()}`);

    // Fetch audio from Google Translate with timeout and retries
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn("Google TTS request timeout");
      controller.abort();
    }, 15000); // 15 second timeout

    let response;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`TTS fetch attempt ${attempt}/${maxAttempts}`);

        response = await fetch(ttsUrl.toString(), {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "audio/mpeg,audio/mp3,audio/*;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Referer: "https://translate.google.com/",
            Origin: "https://translate.google.com",
            "Sec-Fetch-Dest": "audio",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
          },
          signal: controller.signal,
        });

        if (response.ok) {
          break; // Success, exit retry loop
        }

        if (attempt === maxAttempts) {
          console.error(`Google TTS API error after ${maxAttempts} attempts:`, {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
          });
        } else {
          console.warn(
            `TTS attempt ${attempt} failed with status ${response.status}, retrying...`,
          );
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      } catch (fetchError) {
        if (attempt === maxAttempts) {
          clearTimeout(timeoutId);
          console.error("Google TTS fetch error:", fetchError);

          if (fetchError.name === "AbortError") {
            return {
              statusCode: 408,
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                error: "Request timeout",
                message: "The TTS service took too long to respond",
              }),
            };
          }

          return {
            statusCode: 502,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              error: "TTS service unavailable",
              message: "Unable to connect to the text-to-speech service",
            }),
          };
        }
      }
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        "Google TTS API final error:",
        response.status,
        response.statusText,
      );
      return {
        statusCode: response.status >= 500 ? 502 : response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "TTS generation failed",
          upstream_status: response.status,
          upstream_message: response.statusText,
        }),
      };
    }

    console.log("Successfully received TTS response from Google");

    // Validate response content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("audio/")) {
      console.error("Invalid content type from Google TTS:", contentType);
      return {
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid audio response",
          received_content_type: contentType,
        }),
      };
    }

    // Get audio data with size validation
    let audioBuffer;
    try {
      audioBuffer = await response.arrayBuffer();
      console.log(`Received audio buffer: ${audioBuffer.byteLength} bytes`);

      // Basic validation - audio should be at least a few hundred bytes
      if (audioBuffer.byteLength < 100) {
        console.error("Audio buffer too small:", audioBuffer.byteLength);
        return {
          statusCode: 502,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Invalid audio data",
            message: "Received audio file is too small",
          }),
        };
      }

      // Check if buffer is too large (Netlify Functions have response size limits)
      if (audioBuffer.byteLength > 5 * 1024 * 1024) {
        // 5MB limit
        console.error("Audio buffer too large:", audioBuffer.byteLength);
        return {
          statusCode: 413,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            error: "Audio file too large",
            message: "The generated audio exceeds size limits",
          }),
        };
      }
    } catch (bufferError) {
      console.error("Error reading audio buffer:", bufferError);
      return {
        statusCode: 502,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Audio processing failed",
          message: "Could not process the audio response",
        }),
      };
    }

    // Convert ArrayBuffer to base64 string for Netlify Functions
    let base64Audio;
    try {
      base64Audio = Buffer.from(audioBuffer).toString("base64");
      console.log(`Converted to base64: ${base64Audio.length} characters`);
    } catch (encodeError) {
      console.error("Error encoding audio to base64:", encodeError);
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Audio encoding failed",
          message: "Could not encode audio for transmission",
        }),
      };
    }

    const duration = Date.now() - startTime;
    console.log(`TTS request completed successfully in ${duration}ms`);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "X-Response-Time": `${duration}ms`,
        "X-Audio-Size": `${audioBuffer.byteLength}`,
        "X-Attempts": attempt.toString(),
      },
      body: base64Audio,
      isBase64Encoded: true,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("TTS proxy unexpected error:", {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "X-Response-Time": `${duration}ms`,
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
        request_id: context.awsRequestId || "unknown",
      }),
    };
  }
};
