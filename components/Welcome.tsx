
import React from 'react';

const Welcome: React.FC = () => {
  return (
    <div className="text-center p-8 bg-slate-800/30 border border-slate-700 rounded-xl animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-200 mb-4">Welcome to Idiom Weaver!</h2>
      <p className="text-slate-400 max-w-lg mx-auto">
        Start by typing an idiom, saying, or phrase into the search box above, select its original language, choose your target languages, and click "Weave Idioms" to see how the same concept is expressed in other cultures.
      </p>
      <div className="mt-6 text-slate-500 text-sm">
        <p><span className="font-semibold">Example:</span> Try "break a leg" in English.</p>
      </div>
    </div>
  );
};

export default Welcome;