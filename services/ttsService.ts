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

  // Load voices for Web Speech API
  private async loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      let voices = speechSynthesis.getVoices();

      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Voices might not be loaded yet, wait for the event
      const handleVoicesChanged = () => {
        voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          speechSynthesis.removeEventListener(
            "voiceschanged",
            handleVoicesChanged,
          );
          resolve(voices);
        }
      };

      speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

      // Fallback timeout
      setTimeout(() => {
        speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged,
        );
        resolve(speechSynthesis.getVoices());
      }, 2000);
    });
  }

  // Web Speech API TTS with Google Translate fallback
  private async playWithWebSpeechAPI(
    text: string,
    languageCode: string,
  ): Promise<void> {
    if (!("speechSynthesis" in window)) {
      throw new Error("Web Speech API not supported");
    }

    // Load voices first
    const voices = await this.loadVoices();
    const matchingVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(languageCode.toLowerCase()),
    );

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log(
          `🗣️ Using voice: ${matchingVoice.name} (${matchingVoice.lang})`,
        );
      } else {
        console.log(
          `⚠️ No specific voice found for ${languageCode}, using default`,
        );
      }

      utterance.onend = () => {
        console.log("🗣️ Web Speech API audio finished playing");
        resolve();
      };
      utterance.onerror = (event) =>
        reject(new Error(`Speech synthesis failed: ${event.error}`));

      speechSynthesis.speak(utterance);
    });
  }

  // Google Translate TTS via backend proxy
  private async playWithGoogleTTS(
    text: string,
    languageCode: string,
  ): Promise<void> {
    console.log(
      `🌐 Attempting Google TTS via backend proxy for: "${text}" in ${languageCode}`,
    );

    const encodedText = encodeURIComponent(text.trim());
    const ttsUrl = `/api/tts?text=${encodedText}&lang=${languageCode}&t=${Date.now()}`;

    console.log(`📡 TTS Request URL: ${ttsUrl}`);

    // First validate the backend endpoint
    try {
      const testResponse = await fetch(ttsUrl, { method: "HEAD" });
      if (!testResponse.ok) {
        console.error(
          `❌ Backend TTS endpoint validation failed: ${testResponse.status} ${testResponse.statusText}`,
        );
        throw new Error(`Backend TTS endpoint failed: ${testResponse.status}`);
      }
    } catch (fetchError) {
      console.error(`❌ Cannot reach backend TTS endpoint:`, fetchError);
      throw new Error(
        `Backend TTS endpoint unavailable: ${fetchError.message}`,
      );
    }

    const audio = new Audio();

    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Google TTS timeout"));
      }, this.TIMEOUT_DURATION);

      const cleanup = () => {
        clearTimeout(timeoutId);
        audio.removeEventListener("canplaythrough", onCanPlay);
        audio.removeEventListener("error", onError);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("loadstart", onLoadStart);
      };

      const onLoadStart = () => {
        console.log("📥 Google TTS audio loading started");
      };

      const onCanPlay = async () => {
        // Clear timeout but keep other event listeners for proper completion
        clearTimeout(timeoutId);
        try {
          console.log("▶️ Playing Google TTS audio via backend proxy");
          await audio.play();
          // Don't resolve yet - wait for 'ended' event
        } catch (playError) {
          cleanup();
          reject(playError);
        }
      };

      const onError = (event: any) => {
        cleanup();
        console.error("❌ Google TTS audio error:", {
          event,
          audioSrc: audio.src,
          audioError: audio.error,
          networkState: audio.networkState,
          readyState: audio.readyState,
        });
        reject(
          new Error(
            `Google TTS failed to load: ${audio.error ? audio.error.message : "Unknown audio error"}`,
          ),
        );
      };

      const onEnded = () => {
        cleanup();
        console.log("🔊 Google TTS audio finished playing");
        resolve();
      };

      audio.addEventListener("loadstart", onLoadStart, { once: true });
      audio.addEventListener("canplaythrough", onCanPlay, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.addEventListener("ended", onEnded, { once: true });

      audio.src = ttsUrl;
      audio.load();
    });
  }

  async playText(text: string, languageCode: string): Promise<void> {
    if (!text || !text.trim()) {
      throw new Error("No text provided for TTS");
    }

    if (!languageCode) {
      throw new Error("No language code provided for TTS");
    }

    const trimmedText = text.trim();
    console.log(`🔊 Starting TTS for: "${trimmedText}" in ${languageCode}`);
    console.log(`🎯 PRIMARY METHOD: Google Translate TTS`);
    console.log(`🔄 FALLBACK METHOD: Web Speech API`);

    try {
      console.log(`🌐 Attempting Google Translate TTS via backend proxy...`);
      await this.playWithGoogleTTS(trimmedText, languageCode);
      console.log("✅ SUCCESS: Google TTS completed successfully");
    } catch (googleTTSError) {
      console.error(`❌ FAILED: Google TTS failed with error:`, {
        error: googleTTSError,
        text: trimmedText,
        languageCode: languageCode,
        message: googleTTSError.message,
      });
      console.log(`🔄 Switching to Web Speech API fallback...`);

      try {
        console.log(`🗣️ Attempting Web Speech API...`);
        await this.playWithWebSpeechAPI(trimmedText, languageCode);
        console.log(
          "✅ SUCCESS: Web Speech API fallback completed successfully",
        );
      } catch (webSpeechError) {
        console.error("❌ CRITICAL: All TTS methods failed:", {
          primaryError: googleTTSError.message,
          fallbackError: webSpeechError.message,
        });
        throw new Error(
          `All TTS methods failed. Google TTS: ${googleTTSError.message}. Web Speech API: ${webSpeechError.message}`,
        );
      }
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
