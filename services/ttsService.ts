export class TTSService {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  // Initialize audio context on first user interaction (required for mobile browsers)
  private initializeAudioContext(): void {
    if (this.isInitialized) return;

    try {
      // Create audio context if not already created
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume audio context if it's suspended (common on mobile)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }

  async playText(text: string, languageCode: string): Promise<void> {
    try {
      // Initialize audio context on first play attempt
      this.initializeAudioContext();

      // Use our local API proxy to Google Translate TTS (avoids CORS issues)
      const encodedText = encodeURIComponent(text);
      const apiUrl = `/api/tts?text=${encodedText}&lang=${languageCode}`;

      const audio = new Audio(apiUrl);

      // Set audio properties for better mobile compatibility
      audio.preload = 'auto';
      audio.volume = 1.0;

      // Add error handling for audio loading
      audio.addEventListener('error', (e) => {
        console.error('Audio loading error:', e);
        throw new Error('Failed to load audio');
      });

      // Add timeout for audio loading
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (error) {
      console.error('Error playing TTS audio:', error);

      // Provide user-friendly error message for common issues
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Audio playback blocked. Please interact with the page first.');
        } else if (error.name === 'NotSupportedError') {
          throw new Error('Audio format not supported by your browser.');
        }
      }

      throw error;
    }
  }

  private getLanguageCode(language: string): string {
    // Map language names to Google Translate language codes
    const languageMap: Record<string, string> = {
      'English': 'en',
      'Spanish': 'es',
      'Vietnamese': 'vi',
      'French': 'fr',
      'German': 'de',
      'Japanese': 'ja',
      'Portuguese': 'pt',
      'Dutch': 'nl'
    };

    return languageMap[language] || 'en';
  }

  // Public method to play text in a specific language
  async playTextInLanguage(text: string, language: string): Promise<void> {
    const languageCode = this.getLanguageCode(language);
    await this.playText(text, languageCode);
  }

  // Method to preload audio for better performance
  async preloadAudio(text: string, language: string): Promise<void> {
    try {
      const languageCode = this.getLanguageCode(language);
      const encodedText = encodeURIComponent(text);
      const apiUrl = `/api/tts?text=${encodedText}&lang=${languageCode}`;

      const audio = new Audio(apiUrl);
      audio.preload = 'auto';

      // Wait for audio to be ready
      return new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        audio.addEventListener('error', (e) => reject(e), { once: true });

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Audio preload timeout')), 5000);
      });
    } catch (error) {
      console.warn('Audio preload failed:', error);
      // Don't throw error for preload failures
    }
  }
}
