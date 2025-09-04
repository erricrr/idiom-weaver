import React, { useState, useEffect } from 'react';
import { IdiomTranslation } from '../types';
import { TTSService } from '../services/ttsService';

interface ResultCardProps {
  language: string;
  data: IdiomTranslation;
  borderColor: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ language, data, borderColor }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ttsService] = useState(() => new TTSService());

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="relative">
        {/* Main card with fixed height structure */}
        <div className={`bg-slate-800/60 p-4 sm:p-6 rounded-lg shadow-xl border-t-4 ${borderColor} flex flex-col h-full transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
          {/* Language name and main translation - always visible */}
          <div className="flex-grow">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{language}</h3>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <p
                  className={`text-cyan-300 text-base sm:text-lg font-semibold underline decoration-dotted cursor-pointer ${
                    isPlaying ? 'opacity-70' : 'hover:opacity-80'
                  }`}
                  onClick={handleTextClick}
                  title={`Click to hear "${data.idiom}" in ${language}`}
                >
                  {data.idiom}
                </p>
                <button
                  onClick={handleTextClick}
                  disabled={isPlaying}
                  className="p-1 text-cyan-300 hover:text-cyan-200 hover:bg-slate-700/50 rounded transition-all duration-200 disabled:opacity-50"
                  title="Play audio"
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    )}
                </button>
              </div>
            </div>
          </div>

          {/* Info button - positioned at bottom, always visible */}
          <div className="mt-auto">
            <button
              onClick={openModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-md text-slate-300 text-sm font-medium transition-all duration-200 hover:text-white group"
              aria-label="View detailed information about this translation"
            >
              <span>View Details</span>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800/95 rounded-xl shadow-2xl border border-slate-600/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`p-6 border-b border-slate-600/30 ${borderColor} bg-slate-700/30 rounded-t-xl`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{language}</h2>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-white transition-colors duration-200 p-2 hover:bg-slate-700/50 rounded-lg"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Main Idiom with TTS */}
              <div className="text-center">

                <div className="flex items-center justify-center gap-3">
                  <p
                    className={`text-2xl sm:text-3xl font-bold text-cyan-300 underline decoration-dotted cursor-pointer ${
                      isPlaying ? 'opacity-70' : 'hover:opacity-80'
                    }`}
                    onClick={handleTextClick}
                    title={`Click to hear "${data.idiom}" in ${language}`}
                  >
                    {data.idiom}
                  </p>
                  <button
                    onClick={handleTextClick}
                    disabled={isPlaying}
                    className="p-2 text-cyan-300 hover:text-cyan-200 hover:bg-slate-700/50 rounded-lg transition-all duration-200 disabled:opacity-50"
                    title="Play audio"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Literal Translation */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Literal Translation
                </h4>
                <p className="text-slate-200 italic text-lg">"{data.literal_translation}"</p>
              </div>

              {/* Explanation */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Explanation
                </h4>
                <p className="text-slate-200 text-base leading-relaxed">{data.explanation}</p>
              </div>

              {/* Usage Context */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Usage Context
                </h4>
                <p className="text-slate-300 text-sm">
                  This idiom is commonly used in {language} culture and can be applied in various situations
                  where you want to express the same sentiment as the original English phrase.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-600/30 bg-slate-700/20 rounded-b-xl">
              <button
                onClick={closeModal}
                className="w-full py-3 px-4 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg text-white font-medium transition-all duration-200 hover:bg-slate-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResultCard;
