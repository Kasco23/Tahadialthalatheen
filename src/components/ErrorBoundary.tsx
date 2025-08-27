import * as Sentry from '@sentry/react';
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<object>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<object>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 React Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    // Send to Sentry with enhanced context
    Sentry.withScope((scope) => {
      scope.setTag('component', 'ErrorBoundary');
      scope.setTag('errorBoundary', true);
      scope.setLevel('error');

      scope.setContext('errorBoundary', {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
        timestamp: new Date().toISOString(),
      });

      scope.setContext('application', {
        version: import.meta.env.VITE_APP_VERSION,
        environment: import.meta.env.MODE,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });

      Object.keys(errorInfo).forEach((key) => {
        scope.setExtra(key, errorInfo[key as keyof React.ErrorInfo]);
      });

      Sentry.captureException(error);
    });

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're sorry for the inconvenience. Our team has been notified and
              is working on a fix.
            </p>
            {import.meta.env.DEV && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error?.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  const eventId = Sentry.captureException(
                    this.state.error || new Error('Unknown error'),
                  );
                  Sentry.showReportDialog({
                    eventId,
                    title: 'Report Issue',
                    subtitle: 'Help us fix this problem',
                    labelName: 'Your name (optional)',
                    labelEmail: 'Your email (optional)',
                    labelComments: 'What were you doing when this happened?',
                    labelSubmit: 'Send Report',
                    successMessage: 'Thank you for your feedback!',
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
