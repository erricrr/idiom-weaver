
import React from 'react';
import { IdiomTranslation } from '../types';

interface ResultCardProps {
  language: string;
  data: IdiomTranslation;
  borderColor: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ language, data, borderColor }) => {
  return (
    <div className={`bg-slate-800/60 p-6 rounded-lg shadow-xl border-t-4 ${borderColor} flex flex-col h-full transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl`}>
      <h3 className="text-2xl font-bold text-white mb-2">{language}</h3>
      
      <div className="mb-4">
        <p className="text-cyan-300 text-lg font-semibold">"{data.idiom}"</p>
      </div>
      
      <div className="space-y-4 flex-grow">
        <div>
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Literal Translation</h4>
          <p className="text-slate-200 italic">"{data.literal_translation}"</p>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Explanation</h4>
          <p className="text-slate-200">{data.explanation}</p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
