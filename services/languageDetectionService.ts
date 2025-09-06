import { Language } from "../types";

// Robust language detection using Google Translate's language detection
export const detectLanguage = async (
  text: string,
  timeoutMs: number = 3000,
): Promise<Language | null> => {
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Language detection timeout")),
        timeoutMs,
      );
    });

    // Use Google Translate's language detection API with correct parameters
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;

    const fetchPromise = fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (!response.ok) {
      throw new Error(`Language detection failed: ${response.status}`);
    }

    const data = await response.json();

    // The Google Translate API response structure:
    // data[0] = translations
    // data[1] = null
    // data[2] = detected language code (this is what we need)
    // data[3] = null
    // data[4] = null
    // data[5] = null
    // data[6] = confidence score
    // data[7] = null
    // data[8] = alternative translations

    let detectedLanguageCode: string | null = null;

    // Try multiple ways to extract the language code for robustness
    if (data && Array.isArray(data)) {
      // Method 1: Standard position (index 2)
      if (data[2] && typeof data[2] === "string") {
        detectedLanguageCode = data[2];
      }
      // Method 2: Sometimes it's nested deeper
      else if (
        data[0] &&
        Array.isArray(data[0]) &&
        data[0][0] &&
        Array.isArray(data[0][0]) &&
        data[0][0][2]
      ) {
        detectedLanguageCode = data[0][0][2];
      }
      // Method 3: Alternative structure
      else if (
        data[8] &&
        Array.isArray(data[8]) &&
        data[8][0] &&
        Array.isArray(data[8][0]) &&
        data[8][0][0]
      ) {
        detectedLanguageCode = data[8][0][0];
      }
    }

    if (!detectedLanguageCode) {
      console.warn(
        "Could not extract language code from Google Translate response:",
        data,
      );
      return null;
    }

    console.log(`Detected language code: ${detectedLanguageCode}`);

    // Map language codes to our Language enum (expanded mapping)
    const languageCodeMap: Record<string, Language> = {
      en: Language.English,
      es: Language.Spanish,
      vi: Language.Vietnamese,
      fr: Language.French,
      de: Language.German,
      ja: Language.Japanese,
      pt: Language.Portuguese,
      nl: Language.Dutch,
      // Alternative codes that might be returned
      eng: Language.English,
      spa: Language.Spanish,
      vie: Language.Vietnamese,
      fra: Language.French,
      fre: Language.French,
      ger: Language.German,
      deu: Language.German,
      jpn: Language.Japanese,
      por: Language.Portuguese,
      dut: Language.Dutch,
      nld: Language.Dutch,
    };

    const mappedLanguage = languageCodeMap[detectedLanguageCode.toLowerCase()];

    if (mappedLanguage) {
      console.log(
        `Successfully mapped ${detectedLanguageCode} to ${mappedLanguage}`,
      );
      return mappedLanguage;
    } else {
      console.warn(
        `Unsupported language code detected: ${detectedLanguageCode}`,
      );
      return null;
    }
  } catch (error) {
    console.error("Language detection error:", error);

    // If it's a timeout error, re-throw it specifically
    if (
      error instanceof Error &&
      error.message === "Language detection timeout"
    ) {
      throw error;
    }

    return null;
  }
};

// Enhanced heuristic-based detection with better patterns and accuracy
export const detectLanguageHeuristic = (text: string): Language | null => {
  const lowerText = text.toLowerCase().trim();

  // Return null for very short text
  if (lowerText.length < 3) {
    return null;
  }

  // Create scoring system for better accuracy
  const scores: Record<Language, number> = {
    [Language.English]: 0,
    [Language.Spanish]: 0,
    [Language.Vietnamese]: 0,
    [Language.French]: 0,
    [Language.German]: 0,
    [Language.Japanese]: 0,
    [Language.Portuguese]: 0,
    [Language.Dutch]: 0,
  };

  // English patterns (common words, contractions, idioms)
  const englishPatterns = [
    /\b(the|and|or|but|in|on|at|to|for|of|with|by|a|an|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|can|may|might|must)\b/g,
    /\b(it's|don't|won't|can't|shouldn't|wouldn't|couldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't)\b/g,
    /\b(when|where|what|who|why|how|which|that|this|these|those)\b/g,
  ];

  englishPatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.English] += matches.length * 2;
  });

  // Spanish patterns (articles, prepositions, common verbs)
  const spanishPatterns = [
    /\b(el|la|los|las|un|una|de|del|al|en|con|por|para|desde|hasta)\b/g,
    /\b(que|como|cuando|donde|porque|si|pero|y|o|no|sí|es|son|está|están|ser|estar|tener|hacer)\b/g,
    /\b(muy|más|menos|todo|todos|toda|todas|este|esta|estos|estas)\b/g,
    /ñ/g, // Spanish-specific character
    /\b\w+ción\b/g, // Spanish -ción endings
  ];

  spanishPatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.Spanish] += matches.length * 2;
  });

  // French patterns (articles, prepositions, common verbs)
  const frenchPatterns = [
    /\b(le|la|les|un|une|de|du|des|au|aux|en|dans|avec|pour|sur|sous|par)\b/g,
    /\b(que|comme|quand|où|parce|si|mais|et|ou|non|oui|est|sont|être|avoir|faire|aller)\b/g,
    /\b(très|plus|moins|tout|tous|toute|toutes|ce|cette|ces)\b/g,
    /[àâäéèêëïîôöùûüÿç]/g, // French diacritics
    /\b\w+tion\b/g, // French -tion endings
  ];

  frenchPatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.French] += matches.length * 2;
  });

  // German patterns (articles, cases, compound words)
  const germanPatterns = [
    /\b(der|die|das|den|dem|des|ein|eine|einen|einem|eines|einer)\b/g,
    /\b(und|oder|aber|wenn|weil|dass|mit|für|von|zu|bei|nach|über|unter|zwischen)\b/g,
    /\b(ist|sind|war|waren|sein|haben|hat|hatte|hatten|werden|wird|wurde|wurden)\b/g,
    /[äöüß]/g, // German-specific characters
    /\b\w+ung\b/g, // German -ung endings
    /\b\w{10,}\b/g, // Long compound words typical in German
  ];

  germanPatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.German] += matches.length * 2;
  });

  // Portuguese patterns (similar to Spanish but with distinctive features)
  const portuguesePatterns = [
    /\b(o|a|os|as|um|uma|de|do|da|dos|das|em|no|na|nos|nas|com|por|para)\b/g,
    /\b(que|como|quando|onde|porque|se|mas|e|ou|não|sim|é|são|está|estão|ser|estar|ter|fazer)\b/g,
    /\b(muito|mais|menos|todo|todos|toda|todas|este|esta|estes|estas)\b/g,
    /ção\b/g, // Portuguese -ção endings
    /\bnh\b/g, // Portuguese nh combination
    /[ãõ]/g, // Portuguese-specific nasals
  ];

  portuguesePatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.Portuguese] += matches.length * 2;
  });

  // Dutch patterns
  const dutchPatterns = [
    /\b(de|het|een|van|en|in|op|met|voor|door|naar|uit|over|onder|tussen)\b/g,
    /\b(dat|die|dit|deze|zo|als|want|maar|of|niet|ja|is|zijn|was|waren|hebben|heeft|had|hadden)\b/g,
    /\b(zeer|meer|minder|alle|alles|dit|deze|die|dat)\b/g,
    /ij/g, // Dutch ij combination
    /\b\w+heid\b/g, // Dutch -heid endings
  ];

  dutchPatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.Dutch] += matches.length * 2;
  });

  // Vietnamese patterns (diacritics and common words)
  const vietnamesePatterns = [
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g,
    /\b(và|của|trong|với|để|từ|đến|về|cho|theo|như|khi|mà|có|là|được|sẽ|đã|đang|không|rất)\b/g,
    /\b(này|đó|những|các|một|hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\b/g,
  ];

  vietnamesePatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.Vietnamese] += matches.length * 3; // Higher weight for Vietnamese due to fewer common words
  });

  // Japanese patterns (hiragana, katakana, kanji, particles)
  const japanesePatterns = [
    /[\u3040-\u309F]/g, // Hiragana
    /[\u30A0-\u30FF]/g, // Katakana
    /[\u4E00-\u9FAF]/g, // Kanji
    /[はがをにでとのもか]/g, // Common particles
  ];

  japanesePatterns.forEach((pattern) => {
    const matches = lowerText.match(pattern);
    if (matches) scores[Language.Japanese] += matches.length * 4; // Higher weight due to character-based detection
  });

  // Find the language with the highest score
  const maxScore = Math.max(...Object.values(scores));

  // Require a minimum score to avoid false positives
  if (maxScore < 2) {
    return null;
  }

  // Find the language(s) with the maximum score
  const topLanguages = Object.entries(scores)
    .filter(([_, score]) => score === maxScore)
    .map(([lang, _]) => lang as Language);

  // If there's a tie, return null (ambiguous)
  if (topLanguages.length > 1) {
    console.warn("Language detection tie between:", topLanguages);
    return null;
  }

  const detectedLanguage = topLanguages[0];
  console.log(
    `Heuristic detection result: ${detectedLanguage} (score: ${maxScore})`,
  );

  return detectedLanguage;
};

// Test function for debugging (can be removed in production)
export const testLanguageDetection = async (text: string): Promise<void> => {
  console.log(`Testing language detection for: "${text}"`);

  try {
    const apiResult = await detectLanguage(text, 5000);
    console.log(`API detection result: ${apiResult}`);
  } catch (error) {
    console.log(`API detection failed: ${error}`);
  }

  const heuristicResult = detectLanguageHeuristic(text);
  console.log(`Heuristic detection result: ${heuristicResult}`);
};
