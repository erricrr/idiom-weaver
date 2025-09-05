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
  const [lastSubmittedValues, setLastSubmittedValues] = useState<{
    idiom: string;
    sourceLanguage: Language | null;
    targetLanguages: Language[];
  } | null>(null);
  const [duplicateNotification, setDuplicateNotification] = useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = useState<boolean>(false);

  const clearDuplicateNotification = useCallback(() => {
    setIsNotificationVisible(false);
    setTimeout(() => {
      setDuplicateNotification(null);
    }, 300);
  }, []);

  const showDuplicateNotification = useCallback((message: string) => {
    setDuplicateNotification(message);
    setIsNotificationVisible(true);
    setTimeout(() => {
      clearDuplicateNotification();
    }, 4000);
  }, [clearDuplicateNotification]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
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

      if (lastSubmittedValues) {
        const isDuplicate =
          lastSubmittedValues.idiom.trim().toLowerCase() === idiomInput.trim().toLowerCase() &&
          lastSubmittedValues.sourceLanguage === sourceLanguage &&
          lastSubmittedValues.targetLanguages.length === targetLanguages.length &&
          lastSubmittedValues.targetLanguages.every((lang) => targetLanguages.includes(lang));
        if (isDuplicate) {
          showDuplicateNotification('✨ These idioms have already been woven! Try a different phrase or language combination.');
          setError(null);
          return;
        }
      }

      if (duplicateNotification) {
        clearDuplicateNotification();
      }
      setError(null);
      setIsTransitioning(true);
      setTimeout(() => {
        setResults(null);
        setIsLoading(true);
        setIsTransitioning(false);
      }, 500);
      try {
        const response = await translateIdiom(idiomInput, sourceLanguage, targetLanguages);
        setResults(response);
        // Only update lastSubmittedValues after successful API response
        setLastSubmittedValues({
          idiom: idiomInput.trim(),
          sourceLanguage,
          targetLanguages: [...targetLanguages],
        });
      } catch (err) {
        console.error(err);
        setError("Sorry, we couldn't find an equivalent for that idiom. Please try another one.");
      } finally {
        setIsLoading(false);
      }
    },
    [idiomInput, sourceLanguage, targetLanguages, lastSubmittedValues, duplicateNotification, clearDuplicateNotification]
  );

  return (
    <div className="min-h-screen font-sans text-white p-4 sm:p-6 md:p-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto relative">
        <Header />
        {duplicateNotification && (
  <div
    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md px-4 py-3
      bg-gradient-to-r from-pink-500/90 to-rose-500/90
      backdrop-blur-md border border-pink-300/50 rounded-2xl shadow-2xl
      transition-all duration-300 ease-in-out transform
      ${isNotificationVisible
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-8 opacity-0 scale-95'
      }`}
  >
    <button
      onClick={clearDuplicateNotification}
      className="absolute top-2 right-2 text-pink-100 hover:text-white
                 transition-colors duration-200 focus:outline-none
                 focus:ring-2 focus:ring-white/40 rounded-full p-1"
      aria-label="Close notification"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    <p className="text-white text-sm font-semibold pr-6 text-center font-sans">
      {duplicateNotification}
    </p>
  </div>
)}

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
            {results && <ResultsDisplay results={results} isExiting={isTransitioning} />}
            {!isLoading && !error && !results && !duplicateNotification && <Welcome isExiting={isTransitioning} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
