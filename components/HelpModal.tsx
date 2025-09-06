import React from 'react';
import { Language } from '../types';

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      onTouchEnd={handleBackdropTouch}
    >
      <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white" style={{fontFamily: 'Varela Round, sans-serif'}}>About Idiom Weaver</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl font-bold leading-none font-sans"
            >
              ×
            </button>
          </div>

          <div className="space-y-6 text-slate-300 font-sans">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>What is Idiom Weaver?</h3>
              <p className="leading-relaxed">
                Idiom Weaver is a powerful tool that helps you discover how different cultures express the same ideas.
                Ever wondered how to say "it's raining cats and dogs" in Spanish, French, or Japanese? This app finds
                the cultural equivalents that native speakers actually use.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>How to Use It</h3>
              <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                <li>Enter an idiom, saying, or common phrase in the input field</li>
                <li>Select the language your phrase is in</li>
                <li>Choose one or more target languages you want to translate to</li>
                <li>Click "Weave" to discover cultural equivalents</li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>Supported Languages</h3>
              <p className="leading-relaxed mb-3">
                Idiom Weaver currently supports the following languages:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Object.values(Language).sort().map((lang) => (
                  <div key={lang} className="px-3 py-2 bg-slate-700/50 rounded text-slate-300 text-sm font-sans text-center">
                    {lang}
                  </div>
                ))}
              </div>
              <p className="leading-relaxed mt-3 text-sm text-slate-400">
                You can translate from any of these languages to any other supported language.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>Why It's Useful</h3>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li><strong>Language Learning:</strong> Understand cultural context and natural expressions</li>
                <li><strong>Translation:</strong> Find authentic equivalents, not literal translations</li>
                <li><strong>Cultural Understanding:</strong> See how different societies express similar concepts</li>
                <li><strong>Communication:</strong> Connect with native speakers using their natural language</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>Powered By</h3>
              <p className="leading-relaxed mb-3">
                Idiom Weaver is powered by Gemini (gemini-2.5-flash), which provides intelligent and accurate
                cross-cultural idiom translations and cultural context.
              </p>
              <p className="leading-relaxed">
                Text-to-speech functionality is provided by Google Translate's TTS API, enabling you to hear
                how the idioms sound in their native languages.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-3" style={{fontFamily: 'Varela Round, sans-serif'}}>Contact & Feedback</h3>
              <p className="leading-relaxed mb-3">
                Have suggestions, found an error, or want to share your experience? I'd love to hear from you!
              </p>
              <p className="leading-relaxed">
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:voicevoz321@gmail.com"
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                >
                  voicevoz321@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
