export class TTSService {
  async playText(text: string, languageCode: string): Promise<void> {
    try {
      // Use our local API proxy to Google Translate TTS (avoids CORS issues)
      const encodedText = encodeURIComponent(text);
      const apiUrl = `/api/tts?text=${encodedText}&lang=${languageCode}`;

      const audio = new Audio(apiUrl);
      await audio.play();
    } catch (error) {
      console.error('Error playing TTS audio:', error);
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
}
