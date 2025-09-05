import React, { useEffect, useRef } from 'react';
import { ApiResult } from '../types';
import ResultCard from './ResultCard';

interface ResultsDisplayProps {
  results: ApiResult;
  isExiting?: boolean;
}

const languageColors: Record<string, string> = {
  english: 'border-purple-500', // USA -> Purple
  spanish: 'border-pink-500', // Spain -> Pink
  vietnamese: 'border-red-600', // Vietnam -> Red
  french: 'border-blue-500', // France -> Blue
  german: 'border-yellow-400', // Germany -> Gold
  japanese: 'border-gray-200', // Japan -> White
  portuguese: 'border-green-500', // Portugal/Brazil -> Green
  dutch: 'border-orange-500', // Netherlands -> Orange
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, isExiting = false }) => {
  const resultEntries = Object.entries(results).sort(([a], [b]) => a.localeCompare(b));
  const culturalEquivalentsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to Cultural Equivalents section when results appear
  useEffect(() => {
    if (culturalEquivalentsRef.current) {
      culturalEquivalentsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  }, [results]);

  if (resultEntries.length === 0) {
    return null;
  }

  return (
    <div className={`transition-all duration-500 ease-in-out ${
      isExiting
        ? 'transform translate-y-full opacity-0'
        : 'transform translate-y-0 opacity-100 animate-fade-in'
    }`}>
        <h2
          ref={culturalEquivalentsRef}
          id="cultural-equivalents"
          className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-400"
        >
          Cultural Equivalents
        </h2>
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
            {resultEntries.map(([langKey, data]) => (
                <div className="w-full sm:w-80 lg:w-96">
                    <ResultCard
                        key={langKey}
                        language={langKey.charAt(0).toUpperCase() + langKey.slice(1)}
                        data={data}
                        borderColor={languageColors[langKey.toLowerCase()] || 'border-slate-500'}
                    />
                </div>
            ))}
        </div>
    </div>
  );
};

export default ResultsDisplay;
