
import React, { useState, useCallback } from 'react';
import { Language, ApiResult } from './types';
import { translateIdiom } from './services/geminiService';
import Header from './components/Header';
import IdiomInputForm from './components/IdiomInputForm';
import ResultsDisplay from './components/ResultsDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import Welcome from './components/Welcome';

const App: React.FC = () => {
  const [idiomInput, setIdiomInput] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<Language | null>(null);
  const [targetLanguages, setTargetLanguages] = useState<Language[]>([]);
  const [results, setResults] = useState<ApiResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Track last submitted values to detect duplicates
  const [lastSubmittedValues, setLastSubmittedValues] = useState<{
    idiom: string;
    sourceLanguage: Language | null;
    targetLanguages: Language[];
  } | null>(null);
  const [duplicateNotification, setDuplicateNotification] = useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);

  // Clear duplicate notification when user changes input
  const clearDuplicateNotification = useCallback(() => {
    if (duplicateNotification) {
      setIsNotificationVisible(false);
      // Wait for animation to complete before clearing the message
      setTimeout(() => {
        setDuplicateNotification(null);
      }, 300);
    }
  }, [duplicateNotification]);

  // Show duplicate notification with animation
  const showDuplicateNotification = useCallback((message: string) => {
    setDuplicateNotification(message);
    setIsNotificationVisible(true);

    // Auto-hide after 4 seconds
    setTimeout(() => {
      clearDuplicateNotification();
    }, 4000);
  }, [clearDuplicateNotification]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idiomInput.trim()) {
      setError('Please enter an idiom to translate.');
      return;
    }
    if (!sourceLanguage) {
      setError('Please select a source language.');
      return;
    }
    if (targetLanguages.length === 0) {
      setError('Please select at least one target language.');
      return;
    }

    // Check for duplicate submission
    if (lastSubmittedValues) {
      const isDuplicate =
        lastSubmittedValues.idiom.trim().toLowerCase() === idiomInput.trim().toLowerCase() &&
        lastSubmittedValues.sourceLanguage === sourceLanguage &&
        lastSubmittedValues.targetLanguages.length === targetLanguages.length &&
        lastSubmittedValues.targetLanguages.every(lang => targetLanguages.includes(lang));

      if (isDuplicate) {
        showDuplicateNotification('✨ These idioms have already been woven! Try a different phrase or language combination.');
        setError(null);
        // Keep the existing results on screen - don't clear them!
        return;
      }
    }

    // Clear any previous notifications
    if (duplicateNotification) {
      clearDuplicateNotification();
    }
    setError(null);

    // Store current values as last submitted
    setLastSubmittedValues({
      idiom: idiomInput.trim(),
      sourceLanguage,
      targetLanguages: [...targetLanguages]
    });

    setIsTransitioning(true);
    setResults(null);

    // Start the transition, then set loading after a brief delay
    setTimeout(() => {
      setIsLoading(true);
      setIsTransitioning(false);
    }, 250);

    try {
      const response = await translateIdiom(idiomInput, sourceLanguage, targetLanguages);
      setResults(response);
    } catch (err) {
      console.error(err);
      setError('Sorry, we couldn\'t find an equivalent for that idiom. Please try another one.');
    } finally {
      setIsLoading(false);
    }
  }, [idiomInput, sourceLanguage, targetLanguages, lastSubmittedValues]);

  return (
    <div className="min-h-screen font-sans text-white p-4 sm:p-6 md:p-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto relative">
        <Header />
        <main className="mt-8">
          <IdiomInputForm
            idiomInput={idiomInput}
            setIdiomInput={setIdiomInput}
            sourceLanguage={sourceLanguage}
            setSourceLanguage={setSourceLanguage}
            targetLanguages={targetLanguages}
            setTargetLanguages={setTargetLanguages}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            clearDuplicateNotification={clearDuplicateNotification}
          />
          <div className="mt-10 relative">
            {isLoading && <LoadingSpinner isEntering={!isTransitioning} />}
            {error && <ErrorAlert message={error} />}
            {duplicateNotification && (
              <div className={`fixed top-4 right-4 z-50 max-w-sm p-3 bg-gradient-to-r from-amber-500/90 to-orange-500/90 backdrop-blur-sm border border-amber-400/50 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
                isNotificationVisible
                  ? 'transform translate-x-0 opacity-100 scale-100'
                  : 'transform translate-x-full opacity-0 scale-95'
              }`}>
                <button
                  onClick={clearDuplicateNotification}
                  className="absolute top-1 right-1 text-amber-100 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 rounded-full p-1"
                  aria-label="Close notification"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="text-amber-50 text-sm font-medium pr-5">{duplicateNotification}</p>
              </div>
            )}
            {results && <ResultsDisplay results={results} isExiting={isTransitioning} />}
            {!isLoading && !error && !results && !duplicateNotification && <Welcome isExiting={isTransitioning} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
