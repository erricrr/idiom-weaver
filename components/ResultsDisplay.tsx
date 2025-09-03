import React from 'react';
import { ApiResult } from '../types';
import ResultCard from './ResultCard';

interface ResultsDisplayProps {
  results: ApiResult;
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

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const resultEntries = Object.entries(results);

  if (resultEntries.length === 0) {
    return null;
  }

  return (
    <div className="animate-fade-in">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-purple-400">Cultural Equivalents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {resultEntries.map(([langKey, data]) => (
                <ResultCard
                    key={langKey}
                    language={langKey.charAt(0).toUpperCase() + langKey.slice(1)}
                    data={data}
                    borderColor={languageColors[langKey.toLowerCase()] || 'border-slate-500'}
                />
            ))}
        </div>
    </div>
  );
};

export default ResultsDisplay;
