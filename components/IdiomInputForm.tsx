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

  const toggleTarget = (lang: Language) => {
    if (targetLanguages.includes(lang)) {
      setTargetLanguages(targetLanguages.filter((l) => l !== lang));
    } else {
      setTargetLanguages([...targetLanguages, lang]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 space-y-6"
    >
      {/* Idiom Input */}
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
          onChange={(e) => setIdiomInput(e.target.value)}
          placeholder="e.g., Actions speak louder than words"
          className="w-full bg-slate-900 border border-slate-600 rounded-md py-3 px-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200"
        />
      </div>

      {/* Source Language */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Source Language
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.values(Language).map((lang) => (
            <button
              type="button"
              key={lang}
              onClick={() => setSourceLanguage(lang)}
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

      {/* Target Languages */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Target Languages ({targetLanguages.length} selected)
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.values(Language).map((lang) => (
            <button
              type="button"
              key={lang}
              onClick={() => toggleTarget(lang)}
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

      {/* Submit Button */}
      <div className="text-center">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 shadow-lg"
        >
          {isLoading ? "Weaving..." : "Weave Idioms"}
        </button>
      </div>
    </form>
  );
};

export default IdiomInputForm;
