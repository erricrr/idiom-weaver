
import React from 'react';
import { Language } from '../types';

interface WelcomeProps {
  isExiting?: boolean;
}

const Welcome: React.FC<WelcomeProps> = ({ isExiting = false }) => {
  return (
    <div className={`text-center p-4 sm:p-8 bg-slate-800/30 rounded-xl relative overflow-hidden transition-all duration-500 ease-in-out ${
      isExiting
        ? 'transform translate-y-full opacity-0 absolute top-0 left-0 right-0 pointer-events-none'
        : 'transform translate-y-0 opacity-100 animate-fade-in'
    }`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-400"></div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mb-3 sm:mb-4" style={{fontFamily: 'Varela Round, sans-serif'}}>Welcome to Idiom Weaver!</h2>
      <p className="text-slate-400 max-w-lg mx-auto text-sm sm:text-base px-2 font-sans">
      Type an idiom or phrase into the box above&mdash;its language is detected automatically (but you can change it if needed). Then, choose the languages you&rsquo;d like to <em>weave</em> together.
      </p>
      <div className="mt-4 sm:mt-6 space-y-3">
        <div className="text-slate-500 text-xs sm:text-sm">
          <p className="font-sans"><span className="font-semibold">Example:</span> Try "break a leg" in English.</p>
        </div>
        <div className="text-slate-500 text-xs sm:text-sm">
          <p className="font-sans mb-2"><span className="font-semibold">Supported Languages:</span></p>
          <div className="flex flex-wrap gap-1 justify-center">
            {Object.values(Language).sort().map((lang, index) => (
              <span key={lang} className="px-2 py-1 bg-slate-700/50 rounded text-slate-300 text-xs font-sans">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
