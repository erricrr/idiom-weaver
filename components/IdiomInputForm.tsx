import React, { useState } from 'react';
import { Language } from '../types';

interface IdiomInputFormProps {
  idiomInput: string;
  setIdiomInput: (value: string) => void;
  sourceLanguage: Language;
  setSourceLanguage: (language: Language) => void;
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
  const [showTargetLanguages, setShowTargetLanguages] = useState(false);

  const handleTargetLanguageChange = (language: Language) => {
    setTargetLanguages(
      targetLanguages.includes(language)
        ? targetLanguages.filter((l) => l !== language)
        : [...targetLanguages, language]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700">
      {/* Input and Source Language - Stack vertically on mobile */}
      <div className="space-y-4">
        <div>
          <label htmlFor="idiom-input" className="block text-sm font-medium text-slate-300 mb-2">
            Enter an idiom, saying, or phrase
          </label>
          <input
            id="idiom-input"
            type="text"
            value={idiomInput}
            onChange={(e) => setIdiomInput(e.target.value)}
            placeholder="e.g., Actions speak louder than words"
            className="w-full bg-slate-900 border border-slate-600 rounded-md py-3 px-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 h-[50px]"
          />
        </div>

        <div>
          <label htmlFor="language-select" className="block text-sm font-medium text-slate-300 mb-2">
            Source Language
          </label>
          <div className="relative">
            <select
              id="language-select"
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value as Language)}
              className="w-full appearance-none bg-slate-900 border border-slate-600 rounded-md py-3 pl-4 pr-10 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 h-[50px]"
            >
              {Object.values(Language).map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Target Languages Section - Collapsible on mobile */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-300">
            Target Languages ({targetLanguages.length} selected)
          </label>
          {/* Mobile toggle button */}
          <button
            type="button"
            onClick={() => setShowTargetLanguages(!showTargetLanguages)}
            className="md:hidden flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {showTargetLanguages ? 'Hide' : 'Show'} Languages
            <svg
              className={`w-4 h-4 transition-transform ${showTargetLanguages ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Target Languages Grid - Hidden on mobile unless expanded */}
        <div className={`md:block ${showTargetLanguages ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {Object.values(Language).map((lang) => (
              <div key={lang}>
                <input
                  type="checkbox"
                  id={`lang-checkbox-${lang}`}
                  name={lang}
                  value={lang}
                  checked={targetLanguages.includes(lang)}
                  onChange={() => handleTargetLanguageChange(lang)}
                  className="hidden peer"
                  aria-label={`Select ${lang} as a target language`}
                />
                <label
                  htmlFor={`lang-checkbox-${lang}`}
                  className="block cursor-pointer rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-600 peer-checked:bg-cyan-600 peer-checked:text-white peer-checked:border-cyan-500 peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-offset-slate-800 peer-checked:ring-cyan-500 text-center"
                >
                  {lang}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500"
        >
          {isLoading ? 'Weaving...' : 'Weave Idioms'}
        </button>
      </div>
    </form>
  );
};

export default IdiomInputForm;
