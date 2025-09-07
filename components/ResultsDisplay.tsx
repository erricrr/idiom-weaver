import React, { useEffect, useRef, useState } from 'react';
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
  const previousResultKeysRef = useRef<string>('');
  const [newlyAddedCards, setNewlyAddedCards] = useState<Set<string>>(new Set());

  // Auto-scroll to Cultural Equivalents section when results first appear
  // Skip auto-scroll during partial re-weaves to prevent jerky mobile behavior
  useEffect(() => {
    const currentResultKeys = Object.keys(results).sort().join(',');
    const previousKeys = previousResultKeysRef.current.split(',').filter(k => k);
    const currentKeys = currentResultKeys.split(',').filter(k => k);
    const isPartialUpdate = previousResultKeysRef.current !== '' &&
                           currentResultKeys.includes(previousResultKeysRef.current);

    // Identify newly added cards
    if (isPartialUpdate) {
      const newCards = currentKeys.filter(key => !previousKeys.includes(key));
      if (newCards.length > 0) {
        setNewlyAddedCards(new Set(newCards));
        // Remove the "new" status after animation completes
        setTimeout(() => setNewlyAddedCards(new Set()), 500);
      }
    } else {
      // For fresh results, no cards are "newly added"
      setNewlyAddedCards(new Set());
    }

    if (culturalEquivalentsRef.current) {
      // Auto-scroll to results for both fresh results and partial updates
      // This ensures new results are always in full viewport
      culturalEquivalentsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }

    previousResultKeysRef.current = currentResultKeys;
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
          style={{fontFamily: 'Varela Round, sans-serif'}}
        >
          Cultural Equivalents
        </h2>
        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center transition-all duration-300 ease-out">
            {resultEntries.map(([langKey, data]) => {
                const isNewCard = newlyAddedCards.has(langKey);
                return (
                    <div
                        key={langKey}
                        className={`w-full sm:w-80 lg:w-96 transition-all duration-500 ease-out ${
                            isNewCard
                                ? 'transform translate-y-0 opacity-100 animate-fade-in'
                                : 'transform translate-y-0 opacity-100'
                        }`}
                        style={{
                            animation: isNewCard ? 'slideInUp 0.5s ease-out' : 'none'
                        }}
                    >
                        <ResultCard
                            language={langKey.charAt(0).toUpperCase() + langKey.slice(1)}
                            data={data}
                            borderColor={languageColors[langKey.toLowerCase()] || 'border-slate-500'}
                            isSingleResult={resultEntries.length === 1}
                        />
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default ResultsDisplay;
