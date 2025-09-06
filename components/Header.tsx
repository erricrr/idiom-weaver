import React, { useState } from "react";
import HelpModal from "./HelpModal";

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
      stroke="#23d0f1"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left-to-right lines (originally horizontal) */}
      <path d="M4 8 H20" />
      <path d="M4 12 H20" />
      <path d="M4 16 H20" stroke="#9b62f6" strokeWidth="2.5" />
      {/* Right-to-left lines (originally vertical) */}
      <path d="M8 4 V20" />
      <path d="M12 4 V20" />
      <path d="M16 4 V20" stroke="#9b62f6" strokeWidth="2.5" />
    </g>
  </svg>
);

const Header: React.FC = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <header className="text-center mx-auto px-4 pt-8 sm:pt-9 relative">
        {/* Help Icon - Upper Right */}
        <button
          onClick={() => setIsHelpOpen(true)}
          className="absolute top-0 right-0 p-2 text-slate-500 hover:text-slate-300 transition-colors opacity-60 hover:opacity-100"
          aria-label="Help and Information"
          title="Help and Information"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
          </svg>
        </button>

        <div className="flex justify-center items-center mb-3 sm:mb-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center font-varela">
            Idiom Wea
            <WeaverIcon className="w-10 sm:h-10 md:w-12 md:h-12 text-cyan-400" />
            er
          </h1>
        </div>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
        Discover how the world weaves the same ideas into different words. Enter an idiom, saying, or phrase, and explore its cross-cultural equivalents.
        </p>
        </header>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

export default Header;
