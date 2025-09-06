export class TTSService {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly TIMEOUT_DURATION = 10000; // 10 seconds
  private audioCache = new Map<string, string>(); // Cache successful audio URLs

  // Initialize audio context on first user interaction (required for mobile browsers)
  private initializeAudioContext(): void {
    if (this.isInitialized) return;

    try {
      // Create audio context if not already created
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended (common on mobile)
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn("Audio context initialization failed:", error);
    }
  }

  // Create a unique cache key for the text and language combination
  private getCacheKey(text: string, languageCode: string): string {
    return `${languageCode}:${text.substring(0, 100)}`;
  }

  // Add delay utility for retries
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Validate audio URL by making a HEAD request
  private async validateAudioUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          Accept: "audio/*,*/*;q=0.1",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `Audio URL validation failed: ${response.status} ${response.statusText}`,
        );
        return false;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.startsWith("audio/")) {
        console.warn(`Invalid content type: ${contentType}`);
        return false;
      }

      return true;
    } catch (error) {
      console.warn("Audio URL validation error:", error);
      return false;
    }
  }

  // Create audio element with robust error handling and timeout
  private createAudioElement(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const timeoutId = setTimeout(() => {
        audio.src = "";
        reject(new Error("Audio loading timeout"));
      }, this.TIMEOUT_DURATION);

      let isResolved = false;

      const cleanup = () => {
        clearTimeout(timeoutId);
        audio.removeEventListener("canplaythrough", onSuccess);
        audio.removeEventListener("error", onError);
        audio.removeEventListener("loadstart", onLoadStart);
      };

      const onSuccess = () => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        resolve(audio);
      };

      const onError = (event: Event) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();

        const error = audio.error;
        let errorMessage = "Unknown audio loading error";

        if (error) {
          switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
              errorMessage = "Audio loading was aborted";
              break;
            case error.MEDIA_ERR_NETWORK:
              errorMessage = "Network error while loading audio";
              break;
            case error.MEDIA_ERR_DECODE:
              errorMessage = "Audio decoding error";
              break;
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMessage = "Audio format not supported";
              break;
          }
        }

        reject(new Error(errorMessage));
      };

      const onLoadStart = () => {
        console.log("Audio loading started for:", url);
      };

      // Set up event listeners
      audio.addEventListener("canplaythrough", onSuccess, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("loadstart", onLoadStart, { once: true });

      // Configure audio element
      audio.preload = "auto";
      audio.volume = 1.0;
      audio.crossOrigin = "anonymous";

      // Start loading
      audio.src = url;
    });
  }

  // Play audio with retry logic
  private async playAudioWithRetry(
    audio: HTMLAudioElement,
    retryCount = 0,
  ): Promise<void> {
    try {
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        console.warn(
          `Audio play attempt ${retryCount + 1} failed, retrying...`,
          error,
        );
        await this.delay(this.RETRY_DELAY * (retryCount + 1)); // Exponential backoff
        return this.playAudioWithRetry(audio, retryCount + 1);
      }

      // Handle specific play errors
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          throw new Error(
            "Audio playback was blocked by the browser. Please interact with the page first and try again.",
          );
        } else if (error.name === "NotSupportedError") {
          throw new Error("Audio format is not supported by your browser.");
        } else if (error.name === "AbortError") {
          throw new Error("Audio playback was interrupted.");
        }
      }

      throw new Error(
        `Failed to play audio after ${this.MAX_RETRIES + 1} attempts: ${error}`,
      );
    }
  }

  // Get TTS audio URL with retry logic
  private async getTTSUrlWithRetry(
    text: string,
    languageCode: string,
    retryCount = 0,
  ): Promise<string> {
    const cacheKey = this.getCacheKey(text, languageCode);

    // Check cache first
    if (this.audioCache.has(cacheKey)) {
      const cachedUrl = this.audioCache.get(cacheKey)!;

      // Validate cached URL is still good
      if (await this.validateAudioUrl(cachedUrl)) {
        return cachedUrl;
      } else {
        // Remove invalid cached URL
        this.audioCache.delete(cacheKey);
      }
    }

    try {
      const encodedText = encodeURIComponent(text.trim());
      const apiUrl = `/api/tts?text=${encodedText}&lang=${languageCode}&t=${Date.now()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.TIMEOUT_DURATION,
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "audio/mpeg,audio/mp3,audio/*;q=0.9,*/*;q=0.1",
          "Cache-Control": "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `TTS API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      // Validate the response contains audio data
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("audio/")) {
        throw new Error(
          `Invalid response content type: ${contentType || "unknown"}`,
        );
      }

      // Cache the successful URL
      this.audioCache.set(cacheKey, apiUrl);

      return apiUrl;
    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        console.warn(
          `TTS URL fetch attempt ${retryCount + 1} failed, retrying...`,
          error,
        );
        await this.delay(this.RETRY_DELAY * (retryCount + 1));
        return this.getTTSUrlWithRetry(text, languageCode, retryCount + 1);
      }

      throw new Error(
        `Failed to get TTS audio URL after ${this.MAX_RETRIES + 1} attempts: ${error}`,
      );
    }
  }

  async playText(text: string, languageCode: string): Promise<void> {
    if (!text || !text.trim()) {
      throw new Error("No text provided for TTS");
    }

    if (!languageCode) {
      throw new Error("No language code provided for TTS");
    }

    try {
      // Initialize audio context on first play attempt
      this.initializeAudioContext();

      // Get the TTS URL with retry logic
      const audioUrl = await this.getTTSUrlWithRetry(text.trim(), languageCode);

      // Create and configure audio element
      const audio = await this.createAudioElement(audioUrl);

      // Play the audio with retry logic
      await this.playAudioWithRetry(audio);
    } catch (error) {
      console.error("Error playing TTS audio:", error);
      throw error; // Re-throw to maintain error chain
    }
  }

  private getLanguageCode(language: string): string {
    // Map language names to Google Translate language codes
    const languageMap: Record<string, string> = {
      English: "en",
      Spanish: "es",
      Vietnamese: "vi",
      French: "fr",
      German: "de",
      Japanese: "ja",
      Portuguese: "pt",
      Dutch: "nl",
      Italian: "it",
      Russian: "ru",
      Chinese: "zh",
      Korean: "ko",
      Arabic: "ar",
      Hindi: "hi",
    };

    return languageMap[language] || "en";
  }

  // Public method to play text in a specific language
  async playTextInLanguage(text: string, language: string): Promise<void> {
    const languageCode = this.getLanguageCode(language);
    await this.playText(text, languageCode);
  }

  // Method to preload audio for better performance (non-blocking)
  async preloadAudio(text: string, language: string): Promise<void> {
    try {
      const languageCode = this.getLanguageCode(language);
      await this.getTTSUrlWithRetry(text.trim(), languageCode);
      console.log(`Audio preloaded for: ${text} (${language})`);
    } catch (error) {
      console.warn("Audio preload failed:", error);
      // Don't throw error for preload failures - this is optional
    }
  }

  // Clear the audio cache (useful for memory management)
  clearCache(): void {
    this.audioCache.clear();
  }

  // Get cache status for debugging
  getCacheInfo(): { size: number; keys: string[] } {
    return {
      size: this.audioCache.size,
      keys: Array.from(this.audioCache.keys()),
    };
  }
}
