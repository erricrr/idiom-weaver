import { Language } from '../types';

// Simple language detection using Google Translate's language detection
export const detectLanguage = async (text: string): Promise<Language | null> => {
  try {
    // Use Google Translate's language detection API
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);

    if (!response.ok) {
      throw new Error('Language detection failed');
    }

    const data = await response.json();
    const detectedLanguageCode = data[2]; // The detected language code is in the third element

    // Map language codes to our Language enum
    const languageCodeMap: Record<string, Language> = {
      'en': Language.English,
      'es': Language.Spanish,
      'vi': Language.Vietnamese,
      'fr': Language.French,
      'de': Language.German,
      'ja': Language.Japanese,
      'pt': Language.Portuguese,
      'nl': Language.Dutch,
    };

    return languageCodeMap[detectedLanguageCode] || null;
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
};

// Fallback: Simple heuristic-based detection for common patterns
export const detectLanguageHeuristic = (text: string): Language | null => {
  const lowerText = text.toLowerCase();

  // Common English patterns
  if (/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/.test(lowerText)) {
    return Language.English;
  }

  // Common Spanish patterns
  if (/\b(el|la|los|las|de|del|en|con|por|para|que|es|son|un|una)\b/.test(lowerText)) {
    return Language.Spanish;
  }

  // Common French patterns
  if (/\b(le|la|les|de|du|des|en|avec|pour|que|est|sont|un|une)\b/.test(lowerText)) {
    return Language.French;
  }

  // Common German patterns
  if (/\b(der|die|das|und|oder|aber|in|auf|mit|für|von|ist|sind|ein|eine)\b/.test(lowerText)) {
    return Language.German;
  }

  // Common Portuguese patterns
  if (/\b(o|a|os|as|de|do|da|em|com|por|para|que|é|são|um|uma)\b/.test(lowerText)) {
    return Language.Portuguese;
  }

  // Common Dutch patterns
  if (/\b(de|het|en|of|maar|in|op|met|voor|van|is|zijn|een)\b/.test(lowerText)) {
    return Language.Dutch;
  }

  // Vietnamese patterns (using diacritics and common words)
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) {
    return Language.Vietnamese;
  }

  // Japanese patterns (hiragana, katakana, kanji)
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
    return Language.Japanese;
  }

  return null;
};
