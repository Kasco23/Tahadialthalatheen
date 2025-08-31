import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css';
import { checkEnvironmentConfiguration } from '@/utils/environmentCheck';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Initialize Sentry with error handling
async function initSentry() {
  try {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
      console.warn('VITE_SENTRY_DSN not found - monitoring disabled');
      return;
    }

    const Sentry = await import('@sentry/react');

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
  } catch (error) {
    console.warn('⚠️ Failed to initialize Sentry:', error);
  }
}

// Load optional dependencies with error handling
async function loadOptionalDependencies() {
  try {
    // Load flag icons CSS
    await import('flag-icons/css/flag-icons.min.css');
    console.log('✅ Flag icons loaded');
  } catch (error) {
    console.warn('⚠️ Failed to load flag icons:', error);
  }

  try {
    // Enable network debugging in development
    if (import.meta.env.DEV) {
      const { enableNetworkDebugging } = await import('@/utils/debugNetworkRequests');
      enableNetworkDebugging();
      console.log('✅ Network debugging enabled');
    }
  } catch (error) {
    console.warn('⚠️ Failed to enable network debugging:', error);
  }
}

// Initialize everything with error handling
async function initializeApp() {
  try {
    // Check environment configuration first
    const envStatus = checkEnvironmentConfiguration();
    if (!envStatus.isValid) {
      console.warn('⚠️ Environment configuration issues detected:');
      envStatus.errors.forEach(error => console.warn(`❌ ${error}`));
      
      // Don't fail completely for missing env vars in development
      if (import.meta.env.PROD) {
        throw new Error(`Environment configuration error: ${envStatus.errors.join(', ')}`);
      }
    }
    
    // Initialize Sentry
    await initSentry();
    
    // Load optional dependencies
    await loadOptionalDependencies();
    
    console.log('✅ App initialization complete');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    throw error; // Re-throw to trigger fallback UI
  }
}

// Basic fallback UI for critical failures
function AppFallback({ error }: { error?: Error }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fee',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '32px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '16px', fontSize: '24px' }}>
          تحدي الثلاثين
        </h2>
        <p style={{ color: '#666', marginBottom: '16px' }}>
          {error ? 'حدث خطأ في التطبيق' : 'جارٍ تحميل التطبيق...'}
        </p>
        {error && (
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>
            {error.message}
          </p>
        )}
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  );
}

// Render app with comprehensive error handling
async function renderApp() {
  try {
    const container = document.getElementById('root');
    if (!container) {
      throw new Error('Failed to find the root element');
    }

    // Initialize app dependencies
    await initializeApp();

    // Try to load Sentry for enhanced error boundary
    let SentryErrorBoundary: React.ComponentType<any> | null = null;
    try {
      const Sentry = await import('@sentry/react');
      SentryErrorBoundary = Sentry.ErrorBoundary;
    } catch (error) {
      console.warn('⚠️ Sentry not available for error boundary');
    }

    const ErrorBoundaryComponent = SentryErrorBoundary || React.Fragment;
    const errorBoundaryProps = SentryErrorBoundary ? {
      fallback: ({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200 max-w-md mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              شيء ما حدث خطأ!
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {error instanceof Error ? error.message : 'حدث خطأ غير متوقع'}
            </p>
            <div className="space-y-2">
              <button
                onClick={resetError}
                className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                المحاولة مرة أخرى
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                إعادة تحميل الصفحة
              </button>
            </div>
          </div>
        </div>
      )
    } : {};

    ReactDOM.createRoot(container).render(
      <React.StrictMode>
        <ErrorBoundaryComponent {...errorBoundaryProps}>
          <ErrorBoundary>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ErrorBoundary>
        </ErrorBoundaryComponent>
      </React.StrictMode>
    );

    console.log('✅ App rendered successfully');
  } catch (error) {
    console.error('❌ Failed to render app:', error);
    
    // Show basic fallback UI
    const container = document.getElementById('root');
    if (container) {
      ReactDOM.createRoot(container).render(
        <AppFallback error={error instanceof Error ? error : undefined} />
      );
    }
  }
}

// Start the app
renderApp();
