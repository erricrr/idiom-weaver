import { Language } from "../types";

// Robust language detection with graceful timeout handling
export const detectLanguage = async (
  text: string,
  timeoutMs: number = 5000,
): Promise<Language | null> => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log(`🔍 Language detection starting - Device: ${isMobile ? 'Mobile' : 'Desktop'}, Text: "${text.trim()}"`);

  // Don't attempt API detection for very short text
  if (text.trim().length < 4) {
    console.log("Text too short for API detection, using heuristic");
    return detectLanguageHeuristic(text).language;
  }

  try {
    // Create AbortController for better timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏱️ Language detection timeout after ${timeoutMs}ms`);
      controller.abort();
    }, timeoutMs);

    // Use Google Translate's language detection API with correct parameters
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;

    console.log(`🌐 Making API request to: ${url}`);

    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors', // Explicit CORS mode for mobile compatibility
      headers: {
        // Use mobile-friendly user agent that matches the device
        "User-Agent": navigator.userAgent ||
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);
    console.log(`📡 API response status: ${response.status} ${response.statusText}`);

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
    // Enhanced error handling for mobile-specific issues
    console.error("🚨 Language detection API error:", error);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.log("⏱️ Google API timeout, using heuristic detection");
      } else if (error.message.includes("CORS") || error.message.includes("cors")) {
        console.log("🚫 CORS error on mobile browser, using heuristic detection");
      } else if (error.message.includes("fetch") || error.message.includes("network")) {
        console.log(
          "🌐 Network error with Google API (possibly mobile connectivity), using heuristic detection",
        );
      } else if (error.message.includes("Failed to fetch")) {
        console.log("📵 Mobile network issue or CORS block, using heuristic detection");
      } else {
        console.log(
          `🔄 Google API error: ${error.message}, using heuristic detection`,
        );
      }
    }

    // Always fall back to heuristic detection instead of throwing
    const fallbackResult = detectLanguageHeuristic(text).language;
    console.log(`🧠 Using heuristic fallback result: ${fallbackResult}`);
    return fallbackResult;
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

  // Enhanced English patterns (common words, contractions, idioms)
  const englishPatterns = [
    // Core English words (very high frequency)
    /\b(the|and|or|but|in|on|at|to|for|of|with|by|a|an|is|are|was|were|be|been|have|has|had|do|does|did|will|would|could|should|can|may|might|must)\b/g,
    // English contractions (very distinctive)
    /\b(it's|don't|won't|can't|shouldn't|wouldn't|couldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|he's|she's|we're|they're|I'm|I've|I'll|I'd)\b/g,
    // Question words and demonstratives
    /\b(when|where|what|who|why|how|which|that|this|these|those)\b/g,
    // Common verbs and nouns
    /\b(speak|word|time|people|make|get|take|come|go|see|know|think|say|look|use|find|give|tell|work|call|try|ask|need|feel|become|leave|put|want|like|good|bad|big|small|new|old|right|wrong)\b/g,
    // English verb endings
    /\b\w+ing\b/g, // English -ing endings are very distinctive
    /\b\w+ed\b/g, // English -ed past tense endings
    /\b\w+ly\b/g, // English -ly adverbs
    /\b\w+tion\b/g, // English -tion endings (but also exists in other languages)
    // Common English idiom patterns
    /\b(actions speak louder|break a leg|piece of cake|bite the bullet|hit the nail|spill the beans|break the ice|cost an arm|kill two birds|let the cat out)\b/g,
    // English-specific words and constructions
    /\b(than|through|though|their|there|they're|where|were|your|you're|going|doing|being|having|getting|making|taking|coming|seeing|looking|thinking|saying|working|trying|asking|feeling|wanting|liking)\b/g,
    // English articles and prepositions (more complete)
    /\b(from|into|about|over|under|up|down|out|off|away|back|here|there|now|then|before|after|during|while|since|until|because|if|unless|although|however|therefore|thus|also|only|just|even|still|yet|already|again|always|never|sometimes|often|usually|maybe|perhaps|probably|certainly|definitely)\b/g,
    // English pronouns and possessives
    /\b(I|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their|mine|yours|hers|ours|theirs|myself|yourself|himself|herself|itself|ourselves|yourselves|themselves)\b/g,
  ];

  englishPatterns.forEach((pattern, index) => {
    const matches = lowerText.match(pattern);
    if (matches) {
      // Give higher weight to more distinctive English patterns
      let weight = 2;
      if (index === 1) weight = 4; // Contractions are very distinctive
      if (index === 2) weight = 3; // Question words are distinctive
      if (index === 6) weight = 5; // Idiom patterns are very distinctive
      if (index === 11) weight = 3; // Pronouns are distinctive
      scores[Language.English] += matches.length * weight;
    }
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
    // Portuguese articles and prepositions (more specific)
    /\b(o|a|os|as|um|uma|de|do|da|dos|das|em|no|na|nos|nas|com|por|para|entre|sobre|até)\b/g,
    // Portuguese-specific words (distinctive from English)
    /\b(que|como|quando|onde|porque|se|mas|e|ou|não|sim|é|são|está|estão|ser|estar|ter|fazer|muito|mais|menos|todo|todos|toda|todas|este|esta|estes|estas)\b/g,
    // Portuguese nouns (distinctive)
    /\b(água|casa|tempo|ano|dia|pessoa|mundo|vida|homem|mulher|país|cidade|trabalho|mão|olho|cabeça|coração|amor|dinheiro|português|brasil)\b/g,
    // Portuguese-specific combinations and endings (highly distinctive)
    /\bção\b/g, // Portuguese -ção endings (more specific)
    /\bnh[aeiou]\b/g, // Portuguese nh combination with vowel
    /[ãõ]/g, // Portuguese-specific nasals (very distinctive)
    /\b\w+mente\b/g, // Portuguese -mente adverbs (specific pattern)
    /lh[aeiou]/g, // Portuguese lh combination with vowel
    /\b\w+inha\b|\b\w+inho\b/g, // Portuguese diminutives (more specific)
    // Portuguese verb conjugations (distinctive)
    /\b\w+ando\b|\b\w+endo\b|\b\w+indo\b/g, // Portuguese gerunds
    /\bestá\b|\bestão\b|\bestavam\b/g, // Portuguese estar conjugations
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
  if (maxScore >= 30) confidence = Math.min(confidence * 2.0, 1);

  // Extra boost for English if it has a clear lead (helps with mobile detection)
  if (detectedLanguage === Language.English && maxScore > 15) {
    const secondHighestScore = Math.max(...Object.entries(scores)
      .filter(([lang, _]) => lang !== Language.English)
      .map(([_, score]) => score));

    if (maxScore > secondHighestScore * 2) {
      confidence = Math.min(confidence * 1.3, 1);
      console.log(`🇺🇸 English confidence boost applied (clear lead: ${maxScore} vs ${secondHighestScore})`);
    }
  }

  // Reduce confidence for short texts
  if (textLength < 20) confidence *= 0.7;
  if (textLength < 10) confidence *= 0.5;

  console.log(
    `Heuristic detection result: ${detectedLanguage} (score: ${maxScore}, confidence: ${(confidence * 100).toFixed(1)}%)`,
  );

  // Debug: Show top 3 language scores for troubleshooting
  const topScores = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([lang, score]) => `${lang}: ${score}`)
    .join(', ');
  console.log(`🔍 Language scores - ${topScores}`);

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

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log(`🔍 Starting hybrid detection for: "${trimmedText}" (${isMobile ? 'Mobile' : 'Desktop'})`);

  // Always get heuristic result as fallback (wrap in try-catch for safety)
  let heuristicResult;
  try {
    heuristicResult = detectLanguageHeuristic(trimmedText);

    // Boost confidence on mobile since heuristic may be more reliable than API
    if (isMobile && heuristicResult.confidence > 0.5) {
      heuristicResult.confidence = Math.min(heuristicResult.confidence + 0.2, 1.0);
    }

    console.log(
      `🧠 Heuristic result: ${heuristicResult.language} (${(heuristicResult.confidence * 100).toFixed(1)}% ${isMobile ? 'mobile-boosted' : ''})`,
    );
  } catch (heuristicError) {
    console.error("Heuristic detection failed:", heuristicError);
    return {
      language: null,
      confidence: 0,
      method: "heuristic-failed",
    };
  }

  // On mobile, only skip API if heuristic has VERY high confidence AND detects a distinctive language
  // This prevents false positives while still avoiding CORS issues when we're very sure
  const isVeryConfidentAndDistinctive = heuristicResult.confidence > 0.95 &&
    (heuristicResult.language === Language.Japanese ||
     heuristicResult.language === Language.Vietnamese ||
     heuristicResult.language === Language.German ||
     heuristicResult.language === Language.Dutch);

  if (isMobile && isVeryConfidentAndDistinctive) {
    console.log(`📱 Mobile high-confidence distinctive language bypass: ${heuristicResult.language}`);
    return {
      language: heuristicResult.language,
      confidence: heuristicResult.confidence,
      method: "mobile-heuristic-priority",
    };
  }

  // Try API detection with mobile-friendly timeout
  try {
    const apiResult = await detectLanguage(trimmedText, 7000); // Longer timeout for mobile networks
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

    // If both succeeded but disagree, handle common confusion cases
    if (
      apiResult &&
      heuristicResult.language &&
      apiResult !== heuristicResult.language
    ) {
      console.log(
        `⚖️ Disagreement - API: ${apiResult}, Heuristic: ${heuristicResult.language}`,
      );

      // Special handling for English vs Portuguese confusion
      if (
        (apiResult === Language.Portuguese && heuristicResult.language === Language.English) ||
        (apiResult === Language.English && heuristicResult.language === Language.Portuguese)
      ) {
        // Check for strong English indicators to resolve the confusion
        const strongEnglishIndicators = /\b(the|and|this|that|it's|don't|can't|going|doing|being|have|has|will|would|could|should)\b/gi;
        const englishMatches = trimmedText.match(strongEnglishIndicators);

        if (englishMatches && englishMatches.length > 0) {
          console.log(`🇺🇸 Strong English indicators found, preferring English over Portuguese`);
          return {
            language: Language.English,
            confidence: 0.8,
            method: "english-portuguese-resolution",
          };
        }
      }

      // For other disagreements, prefer API but with lower confidence
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
