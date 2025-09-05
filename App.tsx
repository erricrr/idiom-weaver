
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

    setIsTransitioning(true);
    setError(null);
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
  }, [idiomInput, sourceLanguage, targetLanguages]);

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
          />
          <div className="mt-10 relative">
            {isLoading && <LoadingSpinner isEntering={!isTransitioning} />}
            {error && <ErrorAlert message={error} />}
            {results && <ResultsDisplay results={results} />}
            {!isLoading && !error && !results && <Welcome isExiting={isTransitioning} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
