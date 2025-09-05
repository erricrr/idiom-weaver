import React, { useState, useRef, useEffect } from "react";
import { Language } from "../types";
import { detectLanguage, detectLanguageHeuristic } from "../services/languageDetectionService";

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
    null
  );

  // Track current step for progressive disclosure
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Track if user has completed the flow at least once
  const [hasCompletedFlow, setHasCompletedFlow] = useState<boolean>(false);
  // Track language detection state
  const [isDetectingLanguage, setIsDetectingLanguage] = useState<boolean>(false);
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(null);
  const [showLanguageOverride, setShowLanguageOverride] = useState<boolean>(false);
  const [detectionFailed, setDetectionFailed] = useState<boolean>(false);
  const lastDetectedInput = useRef<string>('');

  // Auto-detect language when idiom input changes
  useEffect(() => {
    const detectLanguageAsync = async () => {
      const trimmedInput = idiomInput.trim();

      if (!trimmedInput || trimmedInput.length < 3) {
        setDetectedLanguage(null);
        setSourceLanguage(null);
        setIsDetectingLanguage(false);
        setDetectionFailed(false);
        lastDetectedInput.current = '';
        return;
      }

      // Skip detection if we've already detected language for this exact input
      if (lastDetectedInput.current === trimmedInput && detectedLanguage) {
        return;
      }

      setIsDetectingLanguage(true);
      setDetectionFailed(false);

      try {
        // Try Google's language detection first
        let detected = await detectLanguage(trimmedInput);

        // Fallback to heuristic detection if Google detection fails
        if (!detected) {
          detected = detectLanguageHeuristic(trimmedInput);
        }

        setDetectedLanguage(detected);
        lastDetectedInput.current = trimmedInput;

        if (detected) {
          setSourceLanguage(detected);
          setDetectionFailed(false);
          // Auto-advance to target language selection
          if (currentStep === 2) {
            setCurrentStep(3);
          }
        } else {
          // Language detection failed - unsupported language
          setDetectionFailed(true);
          setSourceLanguage(null);
        }
      } catch (error) {
        console.error('Language detection failed:', error);
        // Fallback to heuristic detection
        const detected = detectLanguageHeuristic(trimmedInput);
        setDetectedLanguage(detected);
        lastDetectedInput.current = trimmedInput;
        if (detected) {
          setSourceLanguage(detected);
          setDetectionFailed(false);
          if (currentStep === 2) {
            setCurrentStep(3);
          }
        } else {
          setDetectionFailed(true);
          setSourceLanguage(null);
        }
      } finally {
        setIsDetectingLanguage(false);
      }
    };

    // Debounce the detection to avoid too many API calls
    const timeoutId = setTimeout(detectLanguageAsync, 500);
    return () => clearTimeout(timeoutId);
  }, [idiomInput, currentStep]);

  // Handle idiom input change and advance to next step
  const handleIdiomChange = (value: string) => {
    setIdiomInput(value);
    clearDuplicateNotification();
    if (value.trim() && currentStep === 1) {
      setCurrentStep(2);
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
    setSourceLanguage(lang);
    setDetectedLanguage(lang);
    setShowLanguageOverride(false);
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
          placeholder="e.g., Actions speak louder than words"
          className="w-full bg-slate-900 border border-slate-600 rounded-md py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Language Selection - Auto-detected with override option */}
      {(currentStep >= 2 || hasCompletedFlow) && (
        <div className={`space-y-6 ${!hasCompletedFlow && currentStep === 2 ? "animate-in slide-in-from-top-2 duration-300" : ""}`}>
          {/* Source Language Section - Auto-detected */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>
              Source Language
            </h4>

            {isDetectingLanguage ? (
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                <span className="text-sm">Detecting language...</span>
              </div>
            ) : detectedLanguage ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="px-4 py-2 bg-cyan-600 text-white rounded-md text-sm font-medium font-sans ring-2 ring-cyan-600 ring-offset-2 ring-offset-slate-900">
                      {detectedLanguage}
                    </div>
                    <span className="text-xs text-slate-400">Auto-detected</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLanguageOverride(!showLanguageOverride)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-sans"
                  >
                    {showLanguageOverride ? 'Hide options' : 'Change language'}
                  </button>
                </div>

                {showLanguageOverride && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 animate-in slide-in-from-top-2 duration-300">
                    {Object.values(Language).sort().map((lang) => (
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
            ) : detectionFailed ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-amber-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Language not supported</span>
                </div>
                <div className="text-sm text-slate-400">
                  We couldn't detect the language of your phrase. Please select the source language manually:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {Object.values(Language).sort().map((lang) => (
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
            <div className={!hasCompletedFlow && currentStep === 3 ? "animate-in slide-in-from-top-2 duration-300" : ""}>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>
                Target Languages ({targetLanguages.length} selected)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {Object.values(Language).sort().map((lang) => (
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
        <div className={`text-center ${!hasCompletedFlow && currentStep === 4 ? "animate-in slide-in-from-top-2 duration-300" : ""}`}>
          <div
            onClick={(e) => {
              e.preventDefault();
              if (!isLoading) {
                // Trigger form submission manually
                const form = e.currentTarget.closest('form');
                if (form) {
                  form.requestSubmit();
                }
              }
            }}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-purple-500 hover:from-cyan-700 hover:to-purple-700 transition-all duration-300 shadow-lg font-sans cursor-pointer select-none ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            role="button"
            tabIndex={0}
            aria-label={isLoading ? "Weaving idioms, please wait" : "Weave idioms"}
            aria-disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isLoading) {
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }
            }}
          >
            {isLoading ? "Weaving..." : "Weave"}
          </div>
        </div>
      )}
    </form>
  );
};

export default IdiomInputForm;
