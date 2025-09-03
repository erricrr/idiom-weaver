
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

  return (
    <div className={`bg-slate-800/60 p-4 sm:p-6 rounded-lg shadow-xl border-t-4 ${borderColor} flex flex-col h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl`}>
      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{language}</h3>

      <div className="mb-3 sm:mb-4">
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

      <div className="space-y-3 sm:space-y-4 flex-grow">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">Literal Translation</h4>
          <p className="text-slate-200 italic text-sm sm:text-base">"{data.literal_translation}"</p>
        </div>

        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">Explanation</h4>
          <p className="text-slate-200 text-sm sm:text-base">{data.explanation}</p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
