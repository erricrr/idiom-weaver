
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
  const [sourceLanguage, setSourceLanguage] = useState<Language>(Language.English);
  const [targetLanguages, setTargetLanguages] = useState<Language[]>([Language.Spanish, Language.Vietnamese, Language.French]);
  const [results, setResults] = useState<ApiResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!idiomInput.trim()) {
      setError('Please enter an idiom to translate.');
      return;
    }
    if (targetLanguages.length === 0) {
      setError('Please select at least one target language.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

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
    <div className="bg-gradient-to-br from-gray-900 to-slate-800 min-h-screen font-sans text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
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
          <div className="mt-10">
            {isLoading && <LoadingSpinner />}
            {error && <ErrorAlert message={error} />}
            {results && <ResultsDisplay results={results} />}
            {!isLoading && !error && !results && <Welcome />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
