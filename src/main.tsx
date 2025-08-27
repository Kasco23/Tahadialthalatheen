import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css';
import { enableNetworkDebugging } from '@/utils/debugNetworkRequests';
import * as Sentry from '@sentry/react';
import 'flag-icons/css/flag-icons.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

Sentry.init({
  dsn: 'https://15eb5a2c2b6cb8525318038b8fa29e3f@o4509883241594880.ingest.de.sentry.io/4509915253506128',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: import.meta.env.MODE,
  // Add more debugging in development
  debug: import.meta.env.DEV,
  // Set sample rate for development (100% in dev, lower in prod)
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,
});

console.log(
  'Sentry initialized with DSN:',
  'https://15eb5a2c2b6cb8525318038b8fa29e3f@o4509883241594880.ingest.de.sentry.io/4509915253506128',
);

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
