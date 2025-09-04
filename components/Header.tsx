import React, { useState } from 'react';
import HelpModal from './HelpModal';

const WeaverIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <g
            transform="rotate(45 12 12)"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Horizontal Lines (drawn first, so they are in the back) */}
            <path d="M4 8 H20" />
            <path d="M4 12 H20" />
            <path d="M4 16 H20" />

            {/* Vertical Lines (drawn second, with breaks to create weaving illusion) */}
            {/* V-Line 1 (Over, Under, Over) */}
            <path d="M8 4 V11 M8 13 V20" />
            {/* V-Line 2 (Under, Over, Under) */}
            <path d="M12 4 V7 M12 9 V15 M12 17 V20" />
            {/* V-Line 3 (Over, Under, Over) */}
            <path d="M16 4 V11 M16 13 V20" />
        </g>
    </svg>
);

const Header: React.FC = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <header className="text-center px-4 sm:px-6 relative">
        {/* Help Icon - Upper Right */}
        <button
          onClick={() => setIsHelpOpen(true)}
          className="absolute top-0 right-0 p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Help and Information"
          title="Help and Information"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
          </svg>
        </button>

        <div className="flex justify-center items-center mb-3 sm:mb-4">
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center">
                Idiom Wea<WeaverIcon className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 text-cyan-400"/>er
            </h1>
        </div>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
          Discover how different cultures express the same ideas. Enter an idiom, saying, or common phrase, choose your languages, and find its cross-cultural equivalents.
        </p>
      </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default Header;
