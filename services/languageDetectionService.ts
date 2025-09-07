import { Language } from "../types";

// Robust language detection with graceful timeout handling
export const detectLanguage = async (
  text: string,
  timeoutMs: number = 5000,
): Promise<Language | null> => {
  // Don't attempt API detection for very short text
  if (text.trim().length < 4) {
    console.log("Text too short for API detection, using heuristic");
    return detectLanguageHeuristic(text).language;
  }

  try {
    // Create AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Use Google Translate's language detection API with correct parameters
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `Google API returned ${response.status}, falling back to heuristic`,
      );
      return detectLanguageHeuristic(text).language;
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
        "Could not extract language code from Google API, using heuristic fallback",
      );
      return detectLanguageHeuristic(text).language;
    }

    console.log(`Google API detected language code: ${detectedLanguageCode}`);

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
      console.log(`✅ Google API: ${detectedLanguageCode} → ${mappedLanguage}`);
      return mappedLanguage;
    } else {
      console.warn(
        `Unsupported language code: ${detectedLanguageCode}, using heuristic fallback`,
      );
      return detectLanguageHeuristic(text).language;
    }
  } catch (error) {
    // Handle different types of errors gracefully
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.log("⏱️ Google API timeout, using heuristic detection");
      } else if (error.message.includes("fetch")) {
        console.log(
          "🌐 Network error with Google API, using heuristic detection",
        );
      } else {
        console.log(
          `🔄 Google API error: ${error.message}, using heuristic detection`,
        );
      }
    }

    // Always fall back to heuristic detection instead of throwing
    return detectLanguageHeuristic(text).language;
  }
};

// Enhanced heuristic-based detection with confidence scoring
export const detectLanguageHeuristic = (
  text: string,
): { language: Language | null; confidence: number } => {
  const lowerText = text.toLowerCase().trim();

  // Return null for very short text
  if (lowerText.length < 3) {
    return { language: null, confidence: 0 };
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
    /\b(speak|word|time|people|make|get|take|come|go|see|know|think|say|look|use|find|give|tell|work|call|try|ask|need|feel|become|leave|put)\b/g,
    /\bing\b/g, // English -ing endings are very distinctive
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
    /\b(agua|casa|tiempo|año|día|persona|mundo|vida|hombre|mujer|país|ciudad|trabajo|mano|ojo|cabeza)\b/g,
    /ñ/g, // Spanish-specific character
    /\b\w+ción\b/g, // Spanish -ción endings
    /\b\w+ando\b/g, // Spanish -ando gerunds
    /\b\w+iendo\b/g, // Spanish -iendo gerunds
    /rr/g, // Spanish double-r is distinctive
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
    /\b(eau|temps|année|jour|personne|monde|vie|homme|femme|pays|ville|travail|main|œil|tête)\b/g,
    /[àâäéèêëïîôöùûüÿç]/g, // French diacritics
    /\b\w+tion\b/g, // French -tion endings
    /\b\w+ment\b/g, // French -ment adverbs
    /qu'/g, // French contractions like "qu'est-ce"
    /c'est|s'est|n'est|d'un|d'une/g, // French contractions
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
    /\b(wasser|zeit|jahr|tag|mensch|welt|leben|mann|frau|land|stadt|arbeit|hand|auge|kopf)\b/g,
    /[äöüß]/g, // German-specific characters
    /\b\w+ung\b/g, // German -ung endings
    /\b\w+heit\b/g, // German -heit endings
    /\b\w+keit\b/g, // German -keit endings
    /\b\w+lich\b/g, // German -lich endings
    /\b\w{12,}\b/g, // Very long compound words typical in German
    /sch/g, // German sch combination is common
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
    /\b(água|casa|tempo|ano|dia|pessoa|mundo|vida|homem|mulher|país|cidade|trabalho|mão|olho|cabeça)\b/g,
    /ção\b/g, // Portuguese -ção endings
    /\bnh\b/g, // Portuguese nh combination
    /[ãõ]/g, // Portuguese-specific nasals
    /\b\w+mente\b/g, // Portuguese -mente adverbs
    /lh/g, // Portuguese lh combination
    /inha\b|inho\b/g, // Portuguese diminutives
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
    /\b(water|tijd|jaar|dag|mens|wereld|leven|man|vrouw|land|stad|werk|hand|oog|hoofd)\b/g,
    /ij/g, // Dutch ij combination
    /\b\w+heid\b/g, // Dutch -heid endings
    /\b\w+lijk\b/g, // Dutch -lijk endings
    /sch\b/g, // Dutch sch endings
    /oe/g, // Dutch oe combination is common
    /ui/g, // Dutch ui diphthong
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
    /\b(nước|thời|năm|ngày|người|thế|đời|nam|nữ|nước|thành|công|tay|mắt|đầu)\b/g,
    /\bng\b/g, // Vietnamese ng combination
    /\bnh\b/g, // Vietnamese nh combination
    /\btr\b/g, // Vietnamese tr combination
    /\bkh\b/g, // Vietnamese kh combination
    /\bth\b/g, // Vietnamese th combination
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

  // Calculate confidence based on score and text length
  const textLength = text.trim().length;
  const baseConfidence = Math.min((maxScore / textLength) * 10, 1); // Normalize by text length

  // Require a minimum score to avoid false positives
  if (maxScore < 2) {
    return { language: null, confidence: 0 };
  }

  // Find the language(s) with the maximum score
  const topLanguages = Object.entries(scores)
    .filter(([_, score]) => score === maxScore)
    .map(([lang, _]) => lang as Language);

  // If there's a tie, return null (ambiguous)
  if (topLanguages.length > 1) {
    console.warn("Language detection tie between:", topLanguages);
    return { language: null, confidence: 0 };
  }

  const detectedLanguage = topLanguages[0];

  // Calculate final confidence (0-1 scale)
  let confidence = baseConfidence;

  // Boost confidence for high scores
  if (maxScore >= 10) confidence = Math.min(confidence * 1.5, 1);
  if (maxScore >= 20) confidence = Math.min(confidence * 1.8, 1);

  // Reduce confidence for short texts
  if (textLength < 20) confidence *= 0.7;
  if (textLength < 10) confidence *= 0.5;

  console.log(
    `Heuristic detection result: ${detectedLanguage} (score: ${maxScore}, confidence: ${(confidence * 100).toFixed(1)}%)`,
  );

  return { language: detectedLanguage, confidence };
};

// Hybrid detection that tries both methods and compares results with confidence
export const detectLanguageHybrid = async (
  text: string,
): Promise<{
  language: Language | null;
  confidence: number;
  method: string;
}> => {
  // Enhanced input validation for mobile robustness
  if (!text || typeof text !== "string") {
    console.warn("Invalid input provided to detectLanguageHybrid");
    return {
      language: null,
      confidence: 0,
      method: "invalid-input",
    };
  }

  const trimmedText = text.trim();

  if (trimmedText.length < 2) {
    return {
      language: null,
      confidence: 0,
      method: "text-too-short",
    };
  }

  console.log(`🔍 Starting hybrid detection for: "${trimmedText}"`);

  // Always get heuristic result as fallback (wrap in try-catch for safety)
  let heuristicResult;
  try {
    heuristicResult = detectLanguageHeuristic(trimmedText);
    console.log(
      `🧠 Heuristic result: ${heuristicResult.language} (${(heuristicResult.confidence * 100).toFixed(1)}%)`,
    );
  } catch (heuristicError) {
    console.error("Heuristic detection failed:", heuristicError);
    return {
      language: null,
      confidence: 0,
      method: "heuristic-failed",
    };
  }

  // Try API detection with shorter timeout
  try {
    const apiResult = await detectLanguage(text, 3000);
    console.log(`🌐 API result: ${apiResult}`);

    // If both methods agree, high confidence
    if (
      apiResult &&
      heuristicResult.language &&
      apiResult === heuristicResult.language
    ) {
      console.log(`✅ Both methods agree: ${apiResult}`);
      return {
        language: apiResult,
        confidence: Math.min(heuristicResult.confidence + 0.3, 1), // Boost confidence for agreement
        method: "hybrid-agreement",
      };
    }

    // If API succeeded but heuristic failed, trust API with medium confidence
    if (apiResult && !heuristicResult.language) {
      console.log(`🌐 API only: ${apiResult}`);
      return {
        language: apiResult,
        confidence: 0.8, // High confidence in API when heuristic fails
        method: "api-only",
      };
    }

    // If heuristic succeeded but API failed, trust heuristic
    if (!apiResult && heuristicResult.language) {
      console.log(`🧠 Heuristic only: ${heuristicResult.language}`);
      return {
        language: heuristicResult.language,
        confidence: heuristicResult.confidence * 0.8, // Reduce confidence when API fails
        method: "heuristic-only",
      };
    }

    // If both succeeded but disagree, prefer API but with lower confidence
    if (
      apiResult &&
      heuristicResult.language &&
      apiResult !== heuristicResult.language
    ) {
      console.log(
        `⚖️ Disagreement - API: ${apiResult}, Heuristic: ${heuristicResult.language}, preferring API`,
      );
      return {
        language: apiResult,
        confidence: 0.6, // Lower confidence due to disagreement
        method: "api-preferred",
      };
    }

    return {
      language: apiResult || heuristicResult.language,
      confidence: apiResult ? 0.8 : heuristicResult.confidence,
      method: apiResult ? "api-fallback" : "heuristic-fallback",
    };
  } catch (error) {
    console.log(`🔄 API failed, using heuristic: ${heuristicResult?.language}`, error);

    // Ensure we have valid fallback data
    if (!heuristicResult || !heuristicResult.language) {
      console.error("Both API and heuristic detection failed");
      return {
        language: null,
        confidence: 0,
        method: "all-methods-failed",
      };
    }

    return {
      language: heuristicResult.language,
      confidence: heuristicResult.confidence * 0.7, // Reduce confidence when API completely fails
      method: "heuristic-emergency",
    };
  }
};

// Test function for debugging (can be removed in production)
export const testLanguageDetection = async (text: string): Promise<void> => {
  console.log(`Testing language detection for: "${text}"`);

  const heuristicResult = detectLanguageHeuristic(text);
  console.log(
    `Heuristic detection result: ${heuristicResult.language} (${(heuristicResult.confidence * 100).toFixed(1)}%)`,
  );

  try {
    const apiResult = await detectLanguage(text, 5000);
    console.log(`API detection result: ${apiResult}`);
  } catch (error) {
    console.log(`API detection failed: ${error}`);
  }

  const hybridResult = await detectLanguageHybrid(text);
  console.log(
    `Hybrid detection result: ${hybridResult.language} (${(hybridResult.confidence * 100).toFixed(1)}%, method: ${hybridResult.method})`,
  );
};

// Debug utilities for browser console testing
if (typeof window !== "undefined") {
  (window as any).languageDetectionDebug = {
    test: testLanguageDetection,
    heuristic: detectLanguageHeuristic,
    api: detectLanguage,
    hybrid: detectLanguageHybrid,
    examples: {
      english: "The early bird catches the worm",
      spanish: "No hay mal que por bien no venga",
      french: "Petit à petit, l'oiseau fait son nid",
      german: "Aller Anfang ist schwer",
      portuguese: "Quem não tem cão caça com gato",
      dutch: "Wie het laatst lacht, lacht het best",
      vietnamese: "Có công mài sắt có ngày nên kim",
      japanese: "猿も木から落ちる",
    },
    testAll: async () => {
      const examples = (window as any).languageDetectionDebug.examples;
      for (const [lang, text] of Object.entries(examples)) {
        console.log(`\n--- Testing ${lang.toUpperCase()} ---`);
        await testLanguageDetection(text as string);
      }
    },
  };

  console.log(`
🔍 Language Detection Debug Tools Available!

Use in browser console:
• languageDetectionDebug.test("your text here") - Test specific text
• languageDetectionDebug.heuristic("text") - Heuristic only
• languageDetectionDebug.api("text") - API only
• languageDetectionDebug.hybrid("text") - Hybrid detection
• languageDetectionDebug.testAll() - Test all example languages
• languageDetectionDebug.examples - View example phrases

Example: languageDetectionDebug.test("Actions speak louder than words")
  `);
}
