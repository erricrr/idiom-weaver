import React, { useState, useCallback, useRef, useEffect } from "react";
import { Language, ApiResult } from "./types";
import {
  translateIdiomDirect,
  translateIdiomPartialDirect,
  checkGeminiSetup,
} from "./services/geminiDirectService";
import Header from "./components/Header";
import IdiomInputForm from "./components/IdiomInputForm";
import ResultsDisplay from "./components/ResultsDisplay";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorAlert from "./components/ErrorAlert";
import Welcome from "./components/Welcome";

const App: React.FC = () => {
  console.log("🏗️ App component initializing...");

  const [idiomInput, setIdiomInput] = useState<string>("");
  const [sourceLanguage, setSourceLanguage] = useState<Language | null>(null);
  const [targetLanguages, setTargetLanguages] = useState<Language[]>([]);
  const [results, setResults] = useState<ApiResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isPartialReweaveInProgress, setIsPartialReweaveInProgress] = useState<boolean>(false);
  const [lastSubmittedValues, setLastSubmittedValues] = useState<{
    idiom: string;
    sourceLanguage: Language | null;
    targetLanguages: Language[];
  } | null>(null);
  const [duplicateNotification, setDuplicateNotification] = useState<
    string | null
  >(null);
  const [isNotificationVisible, setIsNotificationVisible] =
    useState<boolean>(false);
  const loadingAreaRef = useRef<HTMLDivElement>(null);

  // Global audio initialization for mobile browsers
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let isInitialized = false;

    const initializeAudio = () => {
      if (isInitialized) return;

      try {
        if (!audioContext) {
          audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        if (audioContext.state === "suspended") {
          audioContext.resume();
        }

        isInitialized = true;
        console.log("Audio context initialized for TTS");
      } catch (error) {
        console.warn("Audio context initialization failed:", error);
      }
    };

    // Initialize audio on first user interaction (with delay for mobile stability)
    const handleFirstInteraction = () => {
      // Small delay to avoid interfering with form interactions on mobile
      setTimeout(() => {
        initializeAudio();
      }, 100);
      // Remove event listeners after first interaction
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    // Add event listeners for various user interactions
    document.addEventListener("click", handleFirstInteraction, { once: true });
    document.addEventListener("touchstart", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("keydown", handleFirstInteraction, {
      once: true,
    });

    // Cleanup function
    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  // Ensure results are brought into view when they appear
  useEffect(() => {
    if (results && loadingAreaRef.current) {
      loadingAreaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [results]);

  const clearDuplicateNotification = useCallback(() => {
    setIsNotificationVisible(false);
    setTimeout(() => {
      setDuplicateNotification(null);
    }, 300);
  }, []);

  const showDuplicateNotification = useCallback(
    (message: string) => {
      setDuplicateNotification(message);
      setIsNotificationVisible(true);
      setTimeout(() => {
        clearDuplicateNotification();
      }, 4000);
    },
    [clearDuplicateNotification],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!idiomInput.trim()) {
        setError("Please enter an idiom to translate.");
        return;
      }
      if (!sourceLanguage) {
        setError("Please select a source language.");
        return;
      }
      if (targetLanguages.length === 0) {
        setError("Please select at least one target language.");
        return;
      }

      if (lastSubmittedValues) {
        const isExactDuplicate =
          lastSubmittedValues.idiom.trim().toLowerCase() ===
            idiomInput.trim().toLowerCase() &&
          lastSubmittedValues.sourceLanguage === sourceLanguage &&
          lastSubmittedValues.targetLanguages.length ===
            targetLanguages.length &&
          lastSubmittedValues.targetLanguages.every((lang) =>
            targetLanguages.includes(lang),
          );

        if (isExactDuplicate) {
          showDuplicateNotification(
            "✨ These idioms have already been woven! Try a different phrase or language combination.",
          );
          setError(null);
          return;
        }

        // Check if this is a partial re-weave (same idiom + source, but with additional target languages)
        const isPartialReweave =
          lastSubmittedValues.idiom.trim().toLowerCase() ===
            idiomInput.trim().toLowerCase() &&
          lastSubmittedValues.sourceLanguage === sourceLanguage &&
          targetLanguages.length > lastSubmittedValues.targetLanguages.length &&
          lastSubmittedValues.targetLanguages.every((lang) =>
            targetLanguages.includes(lang),
          );

        if (isPartialReweave) {
          // Find the new target languages that need to be translated
          const newTargetLanguages = targetLanguages.filter(
            (lang) => !lastSubmittedValues.targetLanguages.includes(lang),
          );

          setError(null);
          setIsPartialReweaveInProgress(true);
          setIsLoading(true);

          // Note: No transition animation for partial re-weaves to keep existing results visible

          try {
            // Use partial translation to only translate new languages
            const result = await translateIdiomPartialDirect(
              idiomInput,
              sourceLanguage,
              newTargetLanguages,
              results || {},
            );
            setResults(result);
            // Update lastSubmittedValues to include all target languages
            setLastSubmittedValues({
              idiom: idiomInput.trim(),
              sourceLanguage,
              targetLanguages: [...targetLanguages],
            });
          } catch (err) {
            console.error(err);
            setError("Sorry, we hit a snag. Please try again.");
          } finally {
            setIsLoading(false);
            setIsPartialReweaveInProgress(false);
          }
          return;
        }
      }

      if (duplicateNotification) {
        clearDuplicateNotification();
      }
      setError(null);
      setIsLoading(true); // Show loader immediately - same as partial reweave

      // Clear results after brief moment to let loader appear
      setTimeout(() => {
        setResults(null);
      }, 50);
      try {
        const result = await translateIdiomDirect(
          idiomInput,
          sourceLanguage,
          targetLanguages,
        );
        setResults(result);
        // Only update lastSubmittedValues after successful API response
        setLastSubmittedValues({
          idiom: idiomInput.trim(),
          sourceLanguage,
          targetLanguages: [...targetLanguages],
        });
      } catch (err) {
        console.error(err);
        setError("Sorry, we hit a snag. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [
      idiomInput,
      sourceLanguage,
      targetLanguages,
      lastSubmittedValues,
      duplicateNotification,
      clearDuplicateNotification,
    ],
  );

  console.log("🎨 App component rendering...");

  return (
    <div className="font-sans text-white p-4 sm:p-6 md:p-8 overflow-x-hidden px-safe">
      <div className="max-w-4xl mx-auto relative">
        <Header />
        {duplicateNotification && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md px-4 py-3
      bg-gradient-to-r from-pink-500/90 to-rose-500/90
      backdrop-blur-md border border-pink-300/50 rounded-2xl shadow-2xl
      transition-all duration-300 ease-in-out transform
      ${
        isNotificationVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-8 opacity-0 scale-95"
      }`}
          >
            <button
              onClick={clearDuplicateNotification}
              className="absolute top-2 right-2 text-pink-100 hover:text-white
                 transition-colors duration-200 focus:outline-none
                 focus:ring-2 focus:ring-white/40 rounded-full p-1"
              aria-label="Close notification"
            >
              <svg
                className="w-4 h-4"
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
          <div ref={loadingAreaRef} className="mt-6 relative min-h-[2.5rem]">
            <LoadingSpinner
              isEntering={isLoading}
              isPartialReweave={isPartialReweaveInProgress}
              isVisible={isLoading}
            />
            {error && <ErrorAlert message={error} />}
            {results && (
              <ResultsDisplay results={results} isExiting={false} />
            )}
            {!error && !results && !duplicateNotification && (
              <Welcome isExiting={isLoading || isTransitioning} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
