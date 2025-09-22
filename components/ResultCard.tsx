import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IdiomTranslation } from "../types";
import { TTSService } from "../services/ttsService";

interface ResultCardProps {
  language: string;
  data: IdiomTranslation;
  borderColor: string;
  isSingleResult?: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({
  language,
  data,
  borderColor,
  isSingleResult = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [ttsService] = useState(() => new TTSService());

  // Prevent background scrolling and preserve position when modal is open
  const scrollYRef = useRef<number>(0);
  const originalBodyStyleRef = useRef<{
    position: string;
    top: string;
    width: string;
    overflow: string;
  }>({ position: '', top: '', width: '', overflow: '' });

  useEffect(() => {
    const { body, documentElement } = document;
    if (isModalOpen) {
      // Store current scroll position
      scrollYRef.current = window.scrollY || window.pageYOffset;

      // Store original body styles
      originalBodyStyleRef.current = {
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        overflow: body.style.overflow,
      };

      // Disable smooth scrolling to avoid animated jumps
      const previousScrollBehavior = documentElement.style.scrollBehavior;
      documentElement.style.scrollBehavior = 'auto';

      // Lock body position and preserve scroll
      body.style.position = 'fixed';
      body.style.top = `-${scrollYRef.current}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';

      return () => {
        // Restore original styles
        body.style.position = originalBodyStyleRef.current.position;
        body.style.top = originalBodyStyleRef.current.top;
        body.style.width = originalBodyStyleRef.current.width;
        body.style.overflow = originalBodyStyleRef.current.overflow;
        documentElement.style.scrollBehavior = previousScrollBehavior;

        // Only restore scroll position if we're still at the top (scroll position 0)
        // This prevents unwanted scrolling when the modal close doesn't actually change scroll
        requestAnimationFrame(() => {
          if (window.scrollY === 0 && scrollYRef.current > 0) {
            window.scrollTo(0, scrollYRef.current);
          }
        });
      };
    }
  }, [isModalOpen]);

  const handleTextClick = async (isRetry = false) => {
    if (isPlaying || isRetrying) return;

    try {
      if (isRetry) {
        setIsRetrying(true);
      } else {
        setIsPlaying(true);
      }

      // Clear any previous errors
      setTtsError(null);
      setShowErrorToast(false);

      await ttsService.playTextInLanguage(data.idiom, language);
    } catch (error) {
      console.error("Failed to play TTS:", error);

      let errorMessage = "Unable to play audio. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("blocked by the browser")) {
          errorMessage =
            "Audio blocked by browser. Click anywhere on the page first, then try again.";
        } else if (error.message.includes("not supported")) {
          errorMessage =
            "Audio format not supported by your browser. Try a different browser.";
        } else if (
          error.message.includes("timeout") ||
          error.message.includes("Network error")
        ) {
          errorMessage = "Network issue. Check your connection and try again.";
        } else if (error.message.includes("TTS service unavailable")) {
          errorMessage = "Text-to-speech service is temporarily unavailable.";
        }
      }

      setTtsError(errorMessage);
      setShowErrorToast(true);

      // Hide error toast after 5 seconds
      setTimeout(() => {
        setShowErrorToast(false);
      }, 5000);
    } finally {
      setIsPlaying(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    handleTextClick(true);
  };

  // Handle touch events for better mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only prevent default for specific gestures, don't block all touch events
    // This prevents double-tap zoom without breaking other touch interactions
    if (e.touches.length === 1 && e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.touchAction = 'manipulation';
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    // Don't prevent default here - let the browser handle touch events normally
    // Only trigger our action if this was a simple tap (not a scroll or gesture)
    if (e.changedTouches.length === 1) {
      await handleTextClick();
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setTimeout(() => setIsModalAnimating(true), 10);
  };

  const closeModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => setIsModalOpen(false), 200);
  };

  return (
    <>
      <div className="relative">
        {/* Main card with fixed height structure */}
        <div
          className={`bg-slate-800/60 p-4 sm:p-6 rounded-lg shadow-xl flex flex-col h-full transform transition-all duration-300 overflow-hidden relative`}
        >
          {/* Top accent bar (replaces border-top to avoid corner bleed) */}
          {(() => {
            const accentBarBackgroundClass = borderColor.replace('border-', 'bg-');
            return (
              <div className={`absolute top-0 left-0 right-0 h-1 ${accentBarBackgroundClass}`} />
            );
          })()}
          {/* Language name and main translation - always visible */}
          <div className="flex-grow">
            <h3
              className="text-xl sm:text-2xl font-bold text-white mb-3"
              style={{ fontFamily: "Varela Round, sans-serif" }}
            >
              {language}
            </h3>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <p
                  className={`text-cyan-300 text-base sm:text-lg font-semibold underline decoration-dotted cursor-pointer font-sans ${
                    isPlaying || isRetrying ? "opacity-70" : "hover:opacity-80"
                  }`}
                  onClick={() => handleTextClick(false)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  style={{ touchAction: "manipulation" }}
                  title={`Click to hear "${data.idiom}" in ${language}`}
                >
                  {data.idiom}
                </p>
                <button
                  onClick={() => handleTextClick(false)}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  disabled={isPlaying || isRetrying}
                  style={{ touchAction: "manipulation" }}
                  className="p-1 text-cyan-300 hover:text-cyan-200 hover:bg-slate-700/50 rounded transition-all duration-200 disabled:opacity-50"
                  title="Play audio"
                >
                  {isPlaying || isRetrying ? (
                    <svg
                      className="w-4 h-4 animate-pulse"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info button - positioned at bottom, always visible */}
          <div className="mt-auto">
            <button
              type="button"
              onClick={openModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-md text-slate-300 text-sm font-medium transition-all duration-200 hover:text-white group font-sans"
              aria-label="View detailed information about this translation"
            >
              <span>View Details</span>
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      {isModalOpen &&
        createPortal(
          <div
            className={`fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4 pb-safe px-safe bg-background backdrop-blur-sm transition-all duration-300 ${
              isModalAnimating ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/20 max-w-2xl w-full overflow-y-auto transform transition-all duration-300 ease-out ${
                isSingleResult ? "max-h-[75svh] sm:max-h-[75vh]" : "max-h-[80svh] sm:max-h-[80vh] md:max-h-[85vh]"
              } ${
                isModalAnimating
                  ? "scale-100 opacity-100 translate-y-0"
                  : "scale-95 opacity-0 translate-y-4"
              }`}
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-600/30 bg-slate-700/70 backdrop-blur-sm rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2
                    className="text-xl sm:text-2xl font-bold text-white leading-tight truncate pr-2"
                    style={{ fontFamily: "Varela Round, sans-serif" }}
                  >
                    {language}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-white transition-colors duration-200 hover:bg-slate-700/50 rounded-lg h-10 w-10 flex items-center justify-center"
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
                {/* Main Idiom with TTS */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3">
                    <p
                      className={`text-2xl sm:text-3xl font-bold text-cyan-300 underline decoration-dotted cursor-pointer font-sans ${
                        isPlaying || isRetrying
                          ? "opacity-70"
                          : "hover:opacity-80"
                      }`}
                      onClick={() => handleTextClick(false)}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      style={{ touchAction: "manipulation" }}
                      title={`Click to hear "${data.idiom}" in ${language}`}
                    >
                      {data.idiom}
                    </p>
                    <button
                      onClick={() => handleTextClick(false)}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                      disabled={isPlaying || isRetrying}
                      style={{ touchAction: "manipulation" }}
                      className="p-2 text-cyan-300 hover:text-cyan-200 hover:bg-slate-700/50 rounded-lg transition-all duration-200 disabled:opacity-50"
                      title="Play audio"
                    >
                      {isPlaying || isRetrying ? (
                        <svg
                          className="w-5 h-5 animate-pulse"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Literal Translation */}
                <div>
                  <h4
                    className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2"
                    style={{ fontFamily: "Varela Round, sans-serif" }}
                  >
                    Literal Translation
                  </h4>
                  <p className="text-slate-200 italic text-lg">
                    "{data.literal_translation}"
                  </p>
                </div>

                {/* Explanation */}
                <div>
                  <h4
                    className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2"
                    style={{ fontFamily: "Varela Round, sans-serif" }}
                  >
                    Explanation
                  </h4>
                  <p className="text-slate-200 text-base leading-relaxed">
                    {data.explanation}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-600/30 bg-slate-700/70 backdrop-blur-sm rounded-b-xl pb-4 sm:pb-4">
                <button
                  onClick={closeModal}
                  className="w-full py-3 px-4 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg text-white font-medium transition-all duration-200 hover:bg-slate-500 font-sans"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Error Toast */}
      {showErrorToast &&
        createPortal(
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
            <div className="bg-red-600/90 backdrop-blur-sm text-white p-4 rounded-lg shadow-lg border border-red-500/50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-red-200 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-100">
                    Audio Playback Failed
                  </p>
                  <p className="text-sm text-red-200 mt-1">{ttsError}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleRetry}
                      disabled={isRetrying}
                      className="px-3 py-1 bg-red-700/50 hover:bg-red-700/70 rounded text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isRetrying ? "Retrying..." : "Try Again"}
                    </button>
                    <button
                      onClick={() => setShowErrorToast(false)}
                      className="px-3 py-1 bg-red-800/50 hover:bg-red-800/70 rounded text-xs font-medium transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default ResultCard;
