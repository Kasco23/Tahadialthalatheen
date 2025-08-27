import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css';
import { enableNetworkDebugging } from '@/utils/debugNetworkRequests';
import * as Sentry from '@sentry/react';
import 'flag-icons/css/flag-icons.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Initialize Sentry with DSN from environment variables
function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn('VITE_SENTRY_DSN not found - monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    sendDefaultPii: true,
    environment: import.meta.env.MODE,
    debug: import.meta.env.DEV,

    // Performance Monitoring
    tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/thirtyquiz\.tyshub\.xyz/,
      /^https:\/\/.*\.netlify\.app/,
      /^https:\/\/.*\.supabase\.co/,
      /^https:\/\/.*\.daily\.co/,
    ],

    // Profiling
    profilesSampleRate: import.meta.env.DEV ? 1.0 : 0.05,

    // Release tracking
    release: import.meta.env.VITE_APP_VERSION || 'development',

    // User feedback
    beforeSend(event) {
      // In development, log events for debugging
      if (import.meta.env.DEV) {
        console.log('Sentry event (dev mode):', event);
      }
      return event;
    },

    // Additional integrations
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Session Replay
    replaysSessionSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  console.log('✅ Sentry initialized with DSN from environment');
}

// Initialize Sentry immediately
initSentry();

// Enable network debugging in development
enableNetworkDebugging();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong!
            </h2>
            <p className="text-gray-600 mb-4">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred'}
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    >
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
