
import React from 'react';

const WeaverIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <defs>
            <style>
                {`
                    .weave-line-1 { animation: weave1 2s ease-in-out infinite; }
                    .weave-line-2 { animation: weave2 2s ease-in-out infinite; }
                    .weave-line-3 { animation: weave3 2s ease-in-out infinite; }
                    .weave-line-4 { animation: weave4 2s ease-in-out infinite; }
                    .weave-line-5 { animation: weave5 2s ease-in-out infinite; }
                    .weave-line-6 { animation: weave6 2s ease-in-out infinite; }

                    @keyframes weave1 {
                        0%, 100% { transform: translateY(0px) scaleY(1); }
                        25% { transform: translateY(-2px) scaleY(1.1); }
                        50% { transform: translateY(0px) scaleY(1); }
                        75% { transform: translateY(2px) scaleY(0.9); }
                    }

                    @keyframes weave2 {
                        0%, 100% { transform: translateY(0px) scaleY(1); }
                        25% { transform: translateY(2px) scaleY(0.9); }
                        50% { transform: translateY(0px) scaleY(1); }
                        75% { transform: translateY(-2px) scaleY(1.1); }
                    }

                    @keyframes weave3 {
                        0%, 100% { transform: translateY(0px) scaleY(1); }
                        25% { transform: translateY(-1px) scaleY(1.05); }
                        50% { transform: translateY(0px) scaleY(1); }
                        75% { transform: translateY(1px) scaleY(0.95); }
                    }

                    @keyframes weave4 {
                        0%, 100% { transform: translateY(0px) scaleY(1); }
                        25% { transform: translateY(1px) scaleY(0.95); }
                        50% { transform: translateY(0px) scaleY(1); }
                        75% { transform: translateY(-1px) scaleY(1.05); }
                    }

                    @keyframes weave5 {
                        0%, 100% { transform: translateY(0px) scaleY(1); }
                        25% { transform: translateY(-1.5px) scaleY(1.08); }
                        50% { transform: translateY(0px) scaleY(1); }
                        75% { transform: translateY(1.5px) scaleY(0.92); }
                    }

                    @keyframes weave6 {
                        0%, 100% { transform: translateY(0px) scaleY(1); }
                        25% { transform: translateY(1.5px) scaleY(0.92); }
                        50% { transform: translateY(0px) scaleY(1); }
                        75% { transform: translateY(-1.5px) scaleY(1.08); }
                    }
                `}
            </style>
        </defs>
        <g
            transform="rotate(45 12 12)"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Horizontal Lines with weaving animations */}
            <path d="M4 8 H20" className="weave-line-1" />
            <path d="M4 12 H20" className="weave-line-2" />
            <path d="M4 16 H20" className="weave-line-3" />

            {/* Vertical Lines with weaving animations */}
            <path d="M8 4 V11 M8 13 V20" className="weave-line-4" />
            <path d="M12 4 V7 M12 9 V15 M12 17 V20" className="weave-line-5" />
            <path d="M16 4 V11 M16 13 V20" className="weave-line-6" />
        </g>
    </svg>
);

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative">
        <WeaverIcon className="w-16 h-16 text-cyan-400" />
      </div>
      <p className="text-slate-300 text-lg">Searching across cultures...</p>
    </div>
  );
};

export default LoadingSpinner;
