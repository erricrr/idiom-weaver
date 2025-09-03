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

interface SelectedLanguage {
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
  const [selectedLanguage, setSelectedLanguage] = useState<SelectedLanguage | null>(null);
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

  const handleLanguageClick = (language: Language, source: 'pool' | 'source' | 'target', index?: number) => {
    // If no language is selected, select this one
    if (!selectedLanguage) {
      setSelectedLanguage({ language, source, index });
      return;
    }

    // If clicking the same language, deselect it
    if (selectedLanguage.language === language && selectedLanguage.source === source) {
      setSelectedLanguage(null);
      return;
    }

    // If clicking a different language, select the new one
    if (selectedLanguage.language !== language || selectedLanguage.source !== source) {
      setSelectedLanguage({ language, source, index });
      return;
    }
  };

  const handleDropZoneClick = (target: 'source' | 'target') => {
    if (!selectedLanguage) return;

    if (target === 'source') {
      // Moving to source language
      if (selectedLanguage.source === 'target') {
        // Remove from target languages
        const newTargets = targetLanguages.filter((_, i) => i !== selectedLanguage.index);
        setTargetLanguages(newTargets);
      }
      setSourceLanguage(selectedLanguage.language);
    } else if (target === 'target') {
      // Moving to target languages
      if (selectedLanguage.source === 'source') {
        // Moving from source to target
        setSourceLanguage(Language.English); // Reset source to default
      }

      if (!targetLanguages.includes(selectedLanguage.language)) {
        setTargetLanguages([...targetLanguages, selectedLanguage.language]);
      }
    }

    setSelectedLanguage(null);
  };

  const isLanguageInTarget = (language: Language) => targetLanguages.includes(language);
  const isLanguageSource = (language: Language) => sourceLanguage === language;

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg border border-slate-700">
      {/* Input Field */}
      <div className="mb-4">
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

      {/* Source Language Section - Now directly below input */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Source Language</h4>
        <div
          ref={sourceBoxRef}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'source')}
          onClick={() => {
            if (selectedLanguage) {
              handleDropZoneClick('source');
            } else if (!sourceLanguage) {
              // Show language picker when clicking empty source box
              const availableLang = Object.values(Language).find(lang => !targetLanguages.includes(lang));
              if (availableLang) {
                setSourceLanguage(availableLang);
              }
            }
          }}
          className={`
            w-full h-12 border-2 border-dashed rounded-lg p-2 flex items-center justify-center cursor-pointer transition-all duration-200
            ${selectedLanguage
              ? 'border-yellow-400 bg-yellow-400/10 hover:border-yellow-300 hover:bg-yellow-400/20'
              : sourceLanguage
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
                handleLanguageClick(sourceLanguage, 'source');
              }}
              className={`cursor-pointer px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
                selectedLanguage?.language === sourceLanguage && selectedLanguage?.source === 'source'
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700'
              }`}
              title="Click to select this language, then click where to move it"
            >
              {sourceLanguage}
            </div>
          ) : selectedLanguage ? (
            <p className="text-yellow-400 text-xs text-center font-medium">Drop {selectedLanguage.language} here</p>
          ) : (
            <p className="text-slate-500 text-xs text-center">Click or drag</p>
          )}
        </div>
      </div>

      {/* Language Selection Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-slate-300">
            Language Selection
          </label>
        </div>

        {/* Reorganized Layout - Available Languages and Target Languages side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Available Languages */}
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
                  onClick={() => handleLanguageClick(lang, 'pool')}
                  className={`
                    cursor-pointer rounded-lg border-2 border-dashed p-2 text-center text-xs font-medium transition-all duration-200
                    ${isLanguageSource(lang)
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                      : isLanguageInTarget(lang)
                      ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                      : selectedLanguage?.language === lang && selectedLanguage?.source === 'pool'
                      ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300 ring-2 ring-yellow-400/50'
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

          {/* Target Languages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Target Languages ({targetLanguages.length} selected)
              </h4>
              <div className="w-6 h-6 flex items-center justify-center">
                {targetLanguages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTargetLanguages([])}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center p-1.5 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 focus:ring-offset-slate-800"
                    title="Clear all target languages"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div
              ref={targetBoxRef}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'target')}
              onClick={() => {
                if (selectedLanguage) {
                  handleDropZoneClick('target');
                } else if (targetLanguages.length === 0) {
                  // Show language picker when clicking empty target box
                  const availableLang = Object.values(Language).find(lang => lang !== sourceLanguage);
                  if (availableLang) {
                    setTargetLanguages([availableLang]);
                  }
                }
              }}
              className={`
                min-h-[60px] border-2 border-dashed rounded-lg p-2 transition-all duration-200 cursor-pointer
                ${selectedLanguage
                  ? 'border-yellow-400 bg-yellow-400/10 hover:border-yellow-300 hover:bg-yellow-400/20'
                  : targetLanguages.length > 0
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
                        handleLanguageClick(lang, 'target', index);
                      }}
                      className={`cursor-pointer px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 transform hover:scale-105 ${
                        selectedLanguage?.language === lang && selectedLanguage?.source === 'target' && selectedLanguage?.index === index
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-purple-600 text-white'
                      }`}
                      title="Click to select this language, then click where to move it"
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              ) : selectedLanguage ? (
                <p className="text-yellow-400 text-xs text-center font-medium">Click or drop {selectedLanguage.language} here</p>
              ) : (
                <p className="text-slate-500 text-xs text-center">Click or drag languages here</p>
              )}
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
