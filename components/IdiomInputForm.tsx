import React, { useState, useRef } from "react";
import { Language } from "../types";

interface IdiomInputFormProps {
  idiomInput: string;
  setIdiomInput: (value: string) => void;
  sourceLanguage: Language | null;
  setSourceLanguage: (language: Language | null) => void;
  targetLanguages: Language[];
  setTargetLanguages: (languages: Language[]) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
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
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null
  );

  // Track current step for progressive disclosure
  const [currentStep, setCurrentStep] = useState<number>(1);
  // Track if user has completed the flow at least once
  const [hasCompletedFlow, setHasCompletedFlow] = useState<boolean>(false);



  // Handle idiom input change and advance to next step
  const handleIdiomChange = (value: string) => {
    setIdiomInput(value);
    if (value.trim() && currentStep === 1) {
      setCurrentStep(2);
    }
  };

  // Handle source language selection and advance to next step
  const handleSourceLanguageSelect = (lang: Language) => {
    setSourceLanguage(lang);
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

  // Reset to previous step if user deselects source language
  const handleSourceLanguageClick = (lang: Language) => {
    if (sourceLanguage === lang) {
      setSourceLanguage(null);
      if (currentStep > 2) {
        setCurrentStep(2);
      }
    } else {
      handleSourceLanguageSelect(lang);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className=" p-6 rounded-xl space-y-6"
    >
      {/* Step 1: Idiom Input - Always visible */}
      <div>
        <label
          htmlFor="idiom-input"
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          Enter an idiom, saying, or phrase
        </label>
        <input
          id="idiom-input"
          type="text"
          value={idiomInput}
          onChange={handleIdiomInputChange}
          placeholder="e.g., Actions speak louder than words"
          className="w-full bg-cyan-400 border border-slate-600 rounded-md py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Step 2: Source Language - Only visible after idiom is entered */}
      {(currentStep >= 2 || hasCompletedFlow) && (
        <div className={!hasCompletedFlow && currentStep === 2 ? "animate-in slide-in-from-top-2 duration-300" : ""}>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Source Language
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.values(Language).sort().map((lang) => (
              <button
                type="button"
                key={lang}
                onClick={() => handleSourceLanguageClick(lang)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${
                    sourceLanguage === lang
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Target Languages - Only visible after source language is selected */}
      {(currentStep >= 3 || hasCompletedFlow) && (
        <div className={!hasCompletedFlow && currentStep === 3 ? "animate-in slide-in-from-top-2 duration-300" : ""}>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Target Languages ({targetLanguages.length} selected)
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.values(Language).sort().map((lang) => (
              <button
                type="button"
                key={lang}
                onClick={() => handleTargetLanguageToggle(lang)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${
                    targetLanguages.includes(lang)
                      ? "bg-purple-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Submit Button - Only visible after target languages are selected */}
      {(currentStep >= 4 || hasCompletedFlow) && (
        <div className={`text-center ${!hasCompletedFlow && currentStep === 4 ? "animate-in slide-in-from-top-2 duration-300" : ""}`}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 shadow-lg"
          >
            {isLoading ? "Weaving..." : "Weave Idioms"}
          </button>
        </div>
      )}
    </form>
  );
};

export default IdiomInputForm;
