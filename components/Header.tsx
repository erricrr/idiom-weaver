import React from 'react';

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
  return (
    <header className="text-center px-4 sm:px-6">
        <div className="flex justify-center items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
             <WeaverIcon className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400"/>
             <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Idiom Weaver
            </h1>
        </div>
      <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
        Discover how different cultures express the same ideas. Enter an idiom, saying, or common phrase, choose your languages, and find its cross-cultural equivalents.
      </p>
    </header>
  );
};

export default Header;
