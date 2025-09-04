
import React, { useState } from 'react';
import { IdiomTranslation } from '../types';
import { TTSService } from '../services/ttsService';

interface ResultCardProps {
  language: string;
  data: IdiomTranslation;
  borderColor: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ language, data, borderColor }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ttsService] = useState(() => new TTSService());

  const handleTextClick = async () => {
    if (isPlaying) return;

    try {
      setIsPlaying(true);
      await ttsService.playTextInLanguage(data.idiom, language);
    } catch (error) {
      console.error('Failed to play TTS:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-slate-800/60 p-4 sm:p-6 rounded-lg shadow-xl border-t-4 ${borderColor} flex flex-col h-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
      {/* Language name and main translation - always visible */}
      <div className="flex-grow">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{language}</h3>

        <div className="mb-4">
          <p
            className={`text-cyan-300 text-base sm:text-lg font-semibold underline decoration-dotted cursor-pointer ${
              isPlaying ? 'opacity-70' : 'hover:opacity-80'
            }`}
            onClick={handleTextClick}
            title={`Click to hear "${data.idiom}" in ${language}`}
          >
            {data.idiom}
          </p>
        </div>
      </div>

      {/* Learn more button - positioned at bottom, always visible */}
      <div className="mt-auto">
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-md text-slate-300 text-sm font-medium transition-all duration-200 hover:text-white group"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Show less details" : "Learn more about this translation"}
        >
          <span>{isExpanded ? "Show less" : "Learn more"}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Expandable content - positioned below the button, doesn't affect other cards */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-600/30 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Literal Translation
              </h4>
              <p className="text-slate-200 italic text-sm">"{data.literal_translation}"</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Explanation
              </h4>
              <p className="text-slate-200 text-sm leading-relaxed">{data.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
