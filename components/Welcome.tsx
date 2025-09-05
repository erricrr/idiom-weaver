
import React from 'react';

interface WelcomeProps {
  isExiting?: boolean;
}

const Welcome: React.FC<WelcomeProps> = ({ isExiting = false }) => {
  return (
    <div className={`text-center p-4 sm:p-8 bg-slate-800/30 rounded-xl relative overflow-hidden transition-all duration-500 ease-in-out ${
      isExiting
        ? 'transform translate-y-full opacity-0'
        : 'transform translate-y-0 opacity-100 animate-fade-in'
    }`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-300 via-cyan-400 to-purple-400"></div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mb-3 sm:mb-4">Welcome to Idiom Weaver!</h2>
      <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base px-2">
        Start by typing an idiom, saying, or phrase into the search box above, select its original language, choose your target languages, and click "Weave Idioms" to see how the same concept is expressed in other cultures.
      </p>
      <div className="mt-4 sm:mt-6 text-slate-500 text-xs sm:text-sm">
        <p><span className="font-semibold">Example:</span> Try "break a leg" in English.</p>
      </div>
    </div>
  );
};

export default Welcome;
