import React, { useState, useRef } from 'react';
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

interface DraggedLanguage {
  language: Language;
  source: 'pool' | 'source' | 'target';
  index?: number;
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
  const [draggedLanguage, setDraggedLanguage] = useState<DraggedLanguage | null>(null);
  const [showTargetLanguages, setShowTargetLanguages] = useState(false);

  const sourceBoxRef = useRef<HTMLDivElement>(null);
  const targetBoxRef = useRef<HTMLDivElement>(null);
  const poolRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, language: Language, source: 'pool' | 'source' | 'target', index?: number) => {
    setDraggedLanguage({ language, source, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, target: 'source' | 'target') => {
    e.preventDefault();
    if (!draggedLanguage) return;

    if (target === 'source') {
      // Moving to source language
      if (draggedLanguage.source === 'target') {
        // Remove from target languages
        const newTargets = targetLanguages.filter((_, i) => i !== draggedLanguage.index);
        setTargetLanguages(newTargets);
      }
      setSourceLanguage(draggedLanguage.language);
    } else if (target === 'target') {
      // Moving to target languages
      if (draggedLanguage.source === 'source') {
        // Moving from source to target
        setSourceLanguage(Language.English); // Reset source to default
      }

      if (!targetLanguages.includes(draggedLanguage.language)) {
        setTargetLanguages([...targetLanguages, draggedLanguage.language]);
      }
    }

    setDraggedLanguage(null);
  };

  const handleLanguageClick = (language: Language, target: 'source' | 'target') => {
    if (target === 'source') {
      if (targetLanguages.includes(language)) {
        // Remove from target languages
        setTargetLanguages(targetLanguages.filter(l => l !== language));
      }
      setSourceLanguage(language);
    } else if (target === 'target') {
      if (sourceLanguage === language) {
        // Moving from source to target
        setSourceLanguage(Language.English);
      }

      if (!targetLanguages.includes(language)) {
        setTargetLanguages([...targetLanguages, language]);
      } else {
        setTargetLanguages(targetLanguages.filter(l => l !== language));
      }
    }
  };

  const isLanguageInTarget = (language: Language) => targetLanguages.includes(language);
  const isLanguageSource = (language: Language) => sourceLanguage === language;

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700">
      {/* Input Field */}
      <div className="mb-6">
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

      {/* Language Selection Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-300">
            Language Selection
          </label>
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Available Languages */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Available Languages</h4>
            <div
              ref={poolRef}
              className="grid grid-cols-2 sm:grid-cols-3 gap-1.5"
            >
              {Object.values(Language).map((lang) => (
                <div
                  key={lang}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lang, 'pool')}
                  onClick={() => handleLanguageClick(lang, 'source')}
                  className={`
                    cursor-pointer rounded-lg border-2 border-dashed p-2 text-center text-xs font-medium transition-all duration-200
                    ${isLanguageSource(lang)
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : isLanguageInTarget(lang)
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500 hover:bg-slate-600/50'
                    }
                    ${isLanguageSource(lang) ? 'ring-2 ring-cyan-500/50' : ''}
                  `}
                  title={`Click to set as source language or drag to move`}
                >
                  {lang}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Drop Zones */}
          <div className="space-y-3">
            {/* Source and Target Languages - Side by side on medium/small screens */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Source Language Box - ALWAYS compact size */}
              <div className="md:col-span-1">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Source Language</h4>
                <div
                  ref={sourceBoxRef}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'source')}
                  onClick={() => {
                    // Show language picker when clicking empty source box
                    if (!sourceLanguage) {
                      // Find first available language that's not in targets
                      const availableLang = Object.values(Language).find(lang => !targetLanguages.includes(lang));
                      if (availableLang) {
                        setSourceLanguage(availableLang);
                      }
                    }
                  }}
                  className={`
                    w-full h-12 border-2 border-dashed rounded-lg p-2 flex items-center justify-center cursor-pointer transition-all duration-200
                    ${sourceLanguage
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-500 bg-slate-800/30 hover:border-cyan-400 hover:bg-slate-700/50'
                    }
                  `}
                >
                  {sourceLanguage ? (
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, sourceLanguage, 'source')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLanguageClick(sourceLanguage, 'target');
                      }}
                      className="cursor-pointer bg-cyan-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm hover:bg-cyan-700 transition-all duration-200 transform hover:scale-105"
                      title="Click to move to target languages or drag to move"
                    >
                      {sourceLanguage}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs text-center">Click or drag</p>
                  )}
                </div>
              </div>

              {/* Target Languages Box - Takes 2/3 on medium+ screens */}
              <div className="md:col-span-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Target Languages ({targetLanguages.length} selected)
                </h4>
                <div
                  ref={targetBoxRef}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'target')}
                  onClick={() => {
                    // Show language picker when clicking empty target box
                    if (targetLanguages.length === 0) {
                      const availableLang = Object.values(Language).find(lang => lang !== sourceLanguage);
                      if (availableLang) {
                        setTargetLanguages([availableLang]);
                      }
                    }
                  }}
                  className={`
                    min-h-[60px] border-2 border-dashed rounded-lg p-2 transition-all duration-200 cursor-pointer
                    ${targetLanguages.length > 0
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-500 bg-slate-800/30 hover:border-purple-400 hover:bg-slate-700/50'
                    }
                  `}
                >
                  {targetLanguages.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {targetLanguages.map((lang, index) => (
                        <div
                          key={lang}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lang, 'target', index)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLanguageClick(lang, 'source');
                          }}
                          className="cursor-pointer bg-purple-600 text-white px-2.5 py-1.5 rounded-lg font-medium text-xs hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                          title="Click to move to source language or drag to move"
                        >
                          {lang}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs text-center">Click or drag languages here</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 shadow-lg"
        >
          {isLoading ? 'Weaving...' : 'Weave Idioms'}
        </button>
      </div>
    </form>
  );
};

export default IdiomInputForm;
