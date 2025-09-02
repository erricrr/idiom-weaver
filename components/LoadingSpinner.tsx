
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-500"></div>
      <p className="text-slate-300 text-lg">Searching across cultures...</p>
    </div>
  );
};

export default LoadingSpinner;
