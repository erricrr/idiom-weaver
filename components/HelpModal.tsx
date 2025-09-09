import React from "react";
import { Language } from "../types";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking on the backdrop itself, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBackdropTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only close if touching the backdrop itself, not on the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4 pb-safe px-safe bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onTouchEnd={handleBackdropTouch}
    >
      <div className="bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-600/20 max-w-2xl w-full overflow-y-auto max-h-[85svh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-600/30 bg-slate-700/70 backdrop-blur-sm rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl sm:text-2xl font-bold text-white leading-tight truncate pr-2"
              style={{ fontFamily: "Varela Round, sans-serif" }}
            >
              About Idiom Weaver
            </h2>
            <button
              onClick={onClose}
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
        <div className="p-4 sm:p-6 pt-3 sm:pt-4 space-y-6 text-slate-300 font-sans">
            <div>
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "Varela Round, sans-serif" }}
              >
                What is Idiom Weaver?
              </h3>
              <p className="leading-relaxed">
                Idiom Weaver is a powerful tool that helps you discover how
                different cultures express the same ideas. Ever wondered how to
                say "it's raining cats and dogs" in Spanish, French, or
                Japanese? This app finds the cultural equivalents that native
                speakers actually use.
              </p>
            </div>

            <div>
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "Varela Round, sans-serif" }}
              >
                How to Use It
              </h3>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Enter an idiom, saying, or phrase in the input box.</li>
                <li>
                  The source language is detected automatically (you can adjust
                  it if needed).
                </li>
                <li>Select one or more target languages.</li>
                <li>
                  Click <strong>Weave</strong> to see how the same idea is
                  expressed across cultures.
                </li>
              </ol>
            </div>

            <div>
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "Varela Round, sans-serif" }}
              >
                Supported Languages
              </h3>
              <p className="leading-relaxed mb-3">
                Idiom Weaver currently supports the following languages:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.values(Language)
                  .sort()
                  .map((lang) => (
                    <div
                      key={lang}
                      className="px-3 py-2 bg-slate-700/50 rounded text-slate-300 text-sm font-sans text-center"
                    >
                      {lang}
                    </div>
                  ))}
              </div>
              <p className="leading-relaxed mt-3 text-sm text-slate-400">
                You can translate from any of these languages to any other
                supported language.
              </p>
            </div>

            <div>
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "Varela Round, sans-serif" }}
              >
                Why It's Useful
              </h3>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>
                  <strong>Language Learning:</strong> Understand cultural
                  context and natural expressions
                </li>
                <li>
                  <strong>Translation:</strong> Find authentic equivalents, not
                  literal translations
                </li>
                <li>
                  <strong>Cultural Understanding:</strong> See how different
                  societies express similar concepts
                </li>
                <li>
                  <strong>Communication:</strong> Connect with native speakers
                  using their natural language
                </li>
              </ul>
            </div>

            <div>
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "Varela Round, sans-serif" }}
              >
                Powered By
              </h3>
              <p className="leading-relaxed mb-3">
              Idiom Weaver is powered by Gemini (gemini-2.5-flash),
              providing intelligent, accurate cross-cultural idiom
              translations with rich cultural and historical context&mdash;at least,
              that&rsquo;s what it&rsquo;s prompted to do!
              </p>
              <p className="leading-relaxed">
                Text-to-speech functionality is provided by Google Translate's
                TTS API, enabling you to hear how the idioms sound in their
                native languages.
              </p>
            </div>

            <div>
              <h3
                className="text-xl font-semibold text-white mb-3"
                style={{ fontFamily: "Varela Round, sans-serif" }}
              >
                Contact & Feedback
              </h3>
              <p className="leading-relaxed mb-3">
                Have suggestions, found an error, or want to share your
                experience? I'd love to hear from you!
              </p>
              <p className="leading-relaxed">
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:voicevoz321@gmail.com"
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                >
                  voicevoz321@gmail.com
                </a>
              </p>
            </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-10 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-600/30 bg-slate-700/70 backdrop-blur-sm rounded-b-xl pb-safe">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg text-white font-medium transition-all duration-200 hover:bg-slate-500 font-sans"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
