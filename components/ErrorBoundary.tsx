import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error details with more information
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('📍 Error info:', errorInfo);
    console.error('📋 Error stack:', error.stack);
    console.error('🔍 Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI that prevents blank screen
      return (
        <div className="min-h-screen font-sans text-white p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="mb-8">
                <svg
                  className="w-16 h-16 text-red-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-slate-300 mb-6">
                  The app encountered an unexpected error. Don't worry, we can fix this!
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-md text-white bg-gradient-to-r from-cyan-600 to-purple-500 hover:from-cyan-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  🔄 Refresh Page
                </button>

                <div className="text-xs text-slate-500 mt-4">
                  If this problem persists, try:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Clear your browser cache</li>
                    <li>Try a different browser</li>
                    <li>Check your internet connection</li>
                  </ul>
                </div>
              </div>

              {this.state.error && (
                <details className="mt-8 text-left bg-red-900/20 p-4 rounded-lg">
                  <summary className="cursor-pointer text-red-300 font-medium">
                    🔍 Error Details (Click to expand)
                  </summary>
                  <pre className="mt-2 text-xs text-red-200 overflow-auto max-h-60">
                    <strong>Error:</strong> {this.state.error.toString()}
                    {this.state.error.stack && (
                      <>
                        <br/><br/>
                        <strong>Stack Trace:</strong>
                        <br/>
                        {this.state.error.stack}
                      </>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <br/><br/>
                        <strong>Component Stack:</strong>
                        <br/>
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
