import React, { useState, useRef, useEffect } from "react";
import { Language } from "../types";
import {
  detectLanguageHybrid,
  detectLanguageHeuristic,
} from "../services/languageDetectionService";

interface IdiomInputFormProps {
  idiomInput: string;
  setIdiomInput: (value: string) => void;
  sourceLanguage: Language | null;
  setSourceLanguage: (language: Language | null) => void;
  targetLanguages: Language[];
  setTargetLanguages: (languages: Language[]) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  clearDuplicateNotification: () => void;
}

const IdiomInputForm: React.FC<IdiomInputFormProps> = ({
  idiomInput,
  setIdiomInput,
  sourceLanguage,
  setSourceLanguage,
  targetLanguages,
  setTargetLanguages,
  handleSubmit,
  isLoading,
  clearDuplicateNotification,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  );

  // Track current step for progressive disclosure
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Track if user has completed the flow at least once
  const [hasCompletedFlow, setHasCompletedFlow] = useState<boolean>(false);
  // Track language detection state
  const [isDetectingLanguage, setIsDetectingLanguage] =
    useState<boolean>(false);
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(
    null,
  );
  const [showLanguageOverride, setShowLanguageOverride] =
    useState<boolean>(false);
  const [detectionFailed, setDetectionFailed] = useState<boolean>(false);
  const [detectionTimeout, setDetectionTimeout] = useState<boolean>(false);
  const [detectionUncertain, setDetectionUncertain] = useState<boolean>(false);
  const lastDetectedInput = useRef<string>("");

  // Auto-detect language when idiom input changes (with better mobile handling)
  useEffect(() => {
    const detectLanguageAsync = async () => {
      const trimmedInput = idiomInput.trim();

      if (!trimmedInput || trimmedInput.length < 3) {
        setDetectedLanguage(null);
        setSourceLanguage(null);
        setIsDetectingLanguage(false);
        setDetectionFailed(false);
        setDetectionTimeout(false);
        setDetectionUncertain(false);
        lastDetectedInput.current = "";
        return;
      }

      // Skip detection if we've already detected language for this exact input
      if (lastDetectedInput.current === trimmedInput && detectedLanguage) {
        return;
      }

      setIsDetectingLanguage(true);
      setDetectionFailed(false);
      setDetectionTimeout(false);
      setDetectionUncertain(false);

      try {
        console.log(`🔍 Starting language detection for: "${trimmedInput}"`);

        // Use hybrid detection which handles timeouts gracefully
        const detectionResult = await detectLanguageHybrid(trimmedInput);

        // Check if component is still mounted and input hasn't changed
        if (idiomInput.trim() === trimmedInput) {
          setDetectedLanguage(detectionResult.language);
          lastDetectedInput.current = trimmedInput;

          if (detectionResult.language) {
            console.log(
              `✅ Language successfully detected as: ${detectionResult.language} (confidence: ${(detectionResult.confidence * 100).toFixed(1)}%)`,
            );
            setSourceLanguage(detectionResult.language);
            setDetectionFailed(false);
            setDetectionTimeout(false);

            // Set uncertainty based on confidence threshold
            setDetectionUncertain(detectionResult.confidence < 0.7);

            // Auto-advance to target language selection when language is detected
            if (currentStep === 2) {
              setCurrentStep(3);
            }
          } else {
            // Language detection failed - unsupported language
            console.warn(
              `❌ Language detection failed - no language detected for: "${trimmedInput}"`,
            );
            setDetectionFailed(true);
            setDetectionTimeout(false);
            setDetectionUncertain(false);
            setSourceLanguage(null);
          }
        }
      } catch (error) {
        // Robust error handling to prevent app crashes
        console.error("❌ Unexpected language detection error:", error);

        try {
          const fallbackResult = detectLanguageHeuristic(trimmedInput);
          console.log(
            `🔄 Emergency heuristic fallback: ${fallbackResult.language} (confidence: ${(fallbackResult.confidence * 100).toFixed(1)}%)`,
          );

          // Only update state if input hasn't changed
          if (idiomInput.trim() === trimmedInput) {
            setDetectedLanguage(fallbackResult.language);
            lastDetectedInput.current = trimmedInput;

            if (fallbackResult.language) {
              setSourceLanguage(fallbackResult.language);
              setDetectionFailed(false);
              setDetectionTimeout(false);
              setDetectionUncertain(true); // Mark as uncertain since this is emergency fallback
              // Don't auto-advance on emergency fallback
            } else {
              setDetectionFailed(true);
              setDetectionTimeout(false);
              setDetectionUncertain(false);
              setSourceLanguage(null);
            }
          }
        } catch (fallbackError) {
          console.error("❌ Even fallback detection failed:", fallbackError);
          // Graceful degradation - reset to initial state
          if (idiomInput.trim() === trimmedInput) {
            setDetectionFailed(true);
            setDetectionTimeout(false);
            setDetectionUncertain(false);
            setSourceLanguage(null);
          }
        }
      } finally {
        setIsDetectingLanguage(false);
      }
    };

    // Longer debounce for mobile devices (less aggressive)
    const timeoutId = setTimeout(detectLanguageAsync, 1000);
    return () => clearTimeout(timeoutId);
  }, [idiomInput]); // Removed currentStep to prevent infinite loops

  // Handle idiom input change and advance to next step
  const handleIdiomChange = (value: string) => {
    setIdiomInput(value);
    clearDuplicateNotification();
    if (value.trim() && currentStep === 1) {
      setCurrentStep(2);
    }
  };

  // Handle Enter key press on input for mobile flow
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      const trimmedInput = idiomInput.trim();
      if (!trimmedInput) return;

      // If we have a detected source language and target languages, submit the form
      if (sourceLanguage && targetLanguages.length > 0) {
        const form = e.currentTarget.closest('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
        return;
      }

      // If we have a source language but no target languages, advance to target language selection
      if (sourceLanguage && targetLanguages.length === 0) {
        setCurrentStep(3);
        return;
      }

      // If no source language detected yet, advance to language selection step
      if (!sourceLanguage && currentStep <= 2) {
        setCurrentStep(2);
        return;
      }
    }
  };

  // Handle source language selection and advance to next step
  const handleSourceLanguageSelect = (lang: Language) => {
    setSourceLanguage(lang);
    clearDuplicateNotification();
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Handle target language selection and advance to next step
  const handleTargetLanguageToggle = (lang: Language) => {
    const newTargetLanguages = targetLanguages.includes(lang)
      ? targetLanguages.filter((l) => l !== lang)
      : [...targetLanguages, lang];

    setTargetLanguages(newTargetLanguages);
    clearDuplicateNotification();

    // Advance to next step if we have at least one target language selected
    if (newTargetLanguages.length > 0 && currentStep === 3) {
      setCurrentStep(4);
      setHasCompletedFlow(true);
    }

    // Go back a step if no target languages are selected
    if (newTargetLanguages.length === 0 && currentStep === 4) {
      setCurrentStep(3);
    }
  };

  // Reset to previous step if user clears input
  const handleIdiomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.trim() && currentStep > 1) {
      setCurrentStep(1);
    }
    handleIdiomChange(value);
  };

  // Handle manual source language selection (override)
  const handleSourceLanguageClick = (lang: Language) => {
    console.log(`👤 User manually selected source language: ${lang}`);
    console.log(`📝 Overriding detection for text: "${idiomInput.trim()}"`);

    setSourceLanguage(lang);
    setDetectedLanguage(lang);
    setShowLanguageOverride(false);
    setDetectionFailed(false);
    setDetectionTimeout(false);
    setDetectionUncertain(false);
    lastDetectedInput.current = idiomInput.trim(); // Mark this input as processed
    clearDuplicateNotification();
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-xl space-y-6"
      noValidate
      autoComplete="off"
    >
      {/* Step 1: Idiom Input - Always visible */}
      <div>
        <label
          htmlFor="idiom-input"
          className="block text-sm font-medium text-slate-300 mb-2 font-sans"
        >
          Enter an idiom, saying, or phrase
        </label>
        <input
          id="idiom-input"
          type="text"
          value={idiomInput}
          onChange={handleIdiomInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="e.g., Actions speak louder than words"
          className="w-full bg-slate-900 border border-slate-600 rounded-md py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Language Selection - Auto-detected with override option */}
      {(currentStep >= 2 || hasCompletedFlow) && (
        <div
          className={`space-y-6 ${!hasCompletedFlow && currentStep === 2 ? "animate-in slide-in-from-top-2 duration-300" : ""}`}
        >
          {/* Source Language Section - Auto-detected */}
          <div>
            <h4
              className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3"
              style={{ fontFamily: "Varela Round, sans-serif" }}
            >
              Source Language
            </h4>

            {isDetectingLanguage ? (
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                <span className="text-sm">Analyzing language patterns...</span>
              </div>
            ) : detectedLanguage ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 bg-cyan-600 text-white rounded-md text-sm font-medium font-sans ring-2 ring-cyan-600 ring-offset-2 ring-offset-slate-900">
                      {detectedLanguage}
                    </div>
                    <span className="text-xs text-slate-400 flex items-center space-x-1">
                      <span>
                        {detectionUncertain ? "Not feeling confident" : "Detected"}
                      </span>
                      {!detectionUncertain && (
                        <svg
                          className="w-3 h-3 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {detectionUncertain && (
                        <svg
                          className="w-3 h-3 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      console.log(
                        `🔧 User ${showLanguageOverride ? "hiding" : "showing"} language override options`,
                      );
                      setShowLanguageOverride(!showLanguageOverride);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-sans"
                  >
                    {showLanguageOverride
                      ? "Hide options"
                      : detectionUncertain
                        ? "Select correct language"
                        : "Wrong language?"}
                  </button>
                </div>

                {showLanguageOverride && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 animate-in slide-in-from-top-2 duration-300">
                    {Object.values(Language)
                      .sort()
                      .map((lang) => (
                        <button
                          type="button"
                          key={lang}
                          onClick={() => handleSourceLanguageClick(lang)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-all font-sans text-center
                          ${
                            sourceLanguage === lang
                              ? "bg-cyan-600 text-white ring-2 ring-cyan-600 ring-offset-2 ring-offset-slate-900"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ) : detectionTimeout ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-orange-400">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Network issues detected
                  </span>
                </div>
                <div className="text-sm text-slate-400 mb-2">
                  Language detection is having network issues. Please select the
                  source language manually:
                </div>
                <div className="text-xs text-slate-500 mb-3 italic">
                  Detected text: "{idiomInput.trim()}"
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {Object.values(Language)
                    .sort()
                    .map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => handleSourceLanguageClick(lang)}
                        className="px-3 py-2 rounded-md text-sm font-medium transition-all font-sans text-center bg-slate-700 text-slate-300 hover:bg-slate-600"
                      >
                        {lang}
                      </button>
                    ))}
                </div>
              </div>
            ) : detectionUncertain ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-blue-400">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Please confirm the language
                  </span>
                </div>
                <div className="text-sm text-slate-400 mb-2">
                  Detection confidence is low for this phrase. Please confirm or
                  select the correct language:
                </div>
                <div className="text-xs text-slate-500 mb-3 italic">
                  Input text: "{idiomInput.trim()}"
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {Object.values(Language)
                    .sort()
                    .map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => handleSourceLanguageClick(lang)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all font-sans text-center
                          ${
                            sourceLanguage === lang
                              ? "bg-cyan-600 text-white ring-2 ring-cyan-600 ring-offset-2 ring-offset-slate-900"
                              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                      >
                        {lang}
                      </button>
                    ))}
                </div>
              </div>
            ) : detectionFailed ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium">
                    Language not recognized
                  </span>
                </div>
                <div className="text-sm text-slate-400 mb-2">
                  We couldn't automatically detect the language. Please select
                  the source language manually:
                </div>
                <div className="text-xs text-slate-500 mb-3 italic">
                  Input text: "{idiomInput.trim()}"
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {Object.values(Language)
                    .sort()
                    .map((lang) => (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => handleSourceLanguageClick(lang)}
                        className="px-3 py-2 rounded-md text-sm font-medium transition-all font-sans text-center bg-slate-700 text-slate-300 hover:bg-slate-600"
                      >
                        {lang}
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                Enter a phrase to auto-detect the language
              </div>
            )}
          </div>

          {/* Target Languages Section - Only visible after source language is selected */}
          {(currentStep >= 3 || hasCompletedFlow) && (
            <div
              className={
                !hasCompletedFlow && currentStep === 3
                  ? "animate-in slide-in-from-top-2 duration-300"
                  : ""
              }
            >
              <h4
                className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3"
                style={{ fontFamily: "Varela Round, sans-serif" }}
              >
                Target Languages ({targetLanguages.length} selected)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {Object.values(Language)
                  .sort()
                  .map((lang) => (
                    <button
                      type="button"
                      key={lang}
                      onClick={() => handleTargetLanguageToggle(lang)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all font-sans text-center
                      ${
                        targetLanguages.includes(lang)
                          ? "bg-purple-500 text-white ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Submit Button - Only visible after target languages are selected */}
      {(currentStep >= 4 || hasCompletedFlow) && (
        <div
          className={`text-center ${!hasCompletedFlow && currentStep === 4 ? "animate-in slide-in-from-top-2 duration-300" : ""}`}
        >
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-purple-500 hover:from-cyan-700 hover:to-purple-700 transition-all duration-300 shadow-lg font-sans ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label={
              isLoading ? "Weaving idioms, please wait" : "Weave idioms"
            }
          >
            {isLoading ? "Weaving..." : "Weave"}
          </button>
        </div>
      )}
    </form>
  );
};

export default IdiomInputForm;
