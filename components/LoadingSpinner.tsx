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
                    .weave-line {
                        animation: weave 2.5s ease-in-out infinite;
                        transform-origin: center;
                    }
                    .weave-line-1 { animation-delay: 0.1s; }
                    .weave-line-2 { animation-delay: 0.3s; }
                    .weave-line-3 { animation-delay: 0.5s; }
                    .weave-line-4 { animation: weave-reverse 2.5s ease-in-out infinite; animation-delay: 0.2s; }
                    .weave-line-5 { animation: weave-reverse 2.5s ease-in-out infinite; animation-delay: 0.4s; }
                    .weave-line-6 { animation: weave-reverse 2.5s ease-in-out infinite; animation-delay: 0.6s; }
                    @keyframes weave {
                        0%, 100% {
                            transform: translateY(0) scaleY(1);
                        }
                        20% {
                            transform: translateY(-3px) scaleY(1.05);
                        }
                        40% {
                            transform: translateY(0) scaleY(1);
                        }
                        60% {
                            transform: translateY(3px) scaleY(0.95);
                        }
                        80% {
                            transform: translateY(0) scaleY(1);
                        }
                    }
                    @keyframes weave-reverse {
                        0%, 100% {
                            transform: translateY(0) scaleY(1);
                        }
                        20% {
                            transform: translateY(3px) scaleY(0.95);
                        }
                        40% {
                            transform: translateY(0) scaleY(1);
                        }
                        60% {
                            transform: translateY(-3px) scaleY(1.05);
                        }
                        80% {
                            transform: translateY(0) scaleY(1);
                        }
                    }
                `}
            </style>
        </defs>
        <g
            transform="rotate(45 12 12)"
            fill="none"
            stroke="#23d0f1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Left-to-right lines (originally horizontal) */}
            <path d="M4 8 H20" className="weave-line weave-line-1" />
            <path d="M4 12 H20" className="weave-line weave-line-2" />
            <path d="M4 16 H20" stroke="#9b62f6" strokeWidth="2.5" />
            {/* Right-to-left lines (originally vertical) */}
            <path d="M8 4 V20" className="weave-line weave-line-4" />
            <path d="M12 4 V20" className="weave-line weave-line-5" />
            <path d="M16 4 V20" stroke="#9b62f6" strokeWidth="2.5"/>
        </g>
    </svg>
);

interface LoadingSpinnerProps {
  isEntering?: boolean;
  isPartialReweave?: boolean;
  isVisible?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isEntering = false, isPartialReweave = false, isVisible = true }) => {
    return (
        <div
            className="flex flex-col items-center justify-center py-2 mb-2 transition-all duration-300 ease-out"
            style={{
                opacity: isVisible ? (isEntering ? 1 : 0.3) : 0,
                transform: isVisible ? (isEntering ? 'translateY(0)' : 'translateY(4px)') : 'translateY(-10px)',
                height: isVisible ? 'auto' : '0px',
                overflow: 'hidden'
            }}
        >
            <div className="relative">
                <WeaverIcon className="w-12 h-12 text-cyan-400" />
            </div>
        </div>
    );
};

export default LoadingSpinner;
