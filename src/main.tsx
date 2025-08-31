import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css';
import { checkEnvironmentConfiguration } from '@/utils/environmentCheck';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Initialize Sentry with complete isolation to prevent bundling issues
async function initSentry() {
  // Temporarily disable Sentry to fix bundling issues
  console.warn('Sentry temporarily disabled to fix production deployment');
  return null;
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
    // Check environment configuration first - but don't fail the app
    const envStatus = checkEnvironmentConfiguration();
    if (envStatus.warnings.length > 0) {
      console.warn('⚠️ Environment configuration warnings:');
      envStatus.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
    }
    
    // Initialize Sentry - completely fault-tolerant
    const sentryModule = await initSentry();
    
    // Load optional dependencies - completely fault-tolerant
    await loadOptionalDependencies();
    
    console.log('✅ App initialization complete');
    return sentryModule;
  } catch (error) {
    // Log error but don't re-throw to prevent app crash
    console.warn('⚠️ App initialization had issues but continuing:', error);
    return null;
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
  const container = document.getElementById('root');
  if (!container) {
    console.error('❌ Failed to find the root element');
    return;
  }

  try {
    // Initialize app dependencies
    const sentryModule = await initializeApp();

    // Safe error boundary setup
    let ErrorBoundaryComponent: React.ComponentType<any> = React.Fragment;
    let errorBoundaryProps: any = {};

    // Only use Sentry error boundary if initialization was successful and module exists
    if (sentryModule && typeof sentryModule === 'object' && 'ErrorBoundary' in sentryModule) {
      try {
        const sentryErrorBoundary = (sentryModule as any).ErrorBoundary;
        ErrorBoundaryComponent = sentryErrorBoundary as React.ComponentType<any>;
        errorBoundaryProps = {
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
        };
      } catch (sentryError) {
        console.warn('⚠️ Failed to set up Sentry error boundary:', sentryError);
      }
    }

    // Render the app with safe error boundaries
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
    
    // Show basic fallback UI if everything fails
    try {
      ReactDOM.createRoot(container).render(
        <AppFallback error={error instanceof Error ? error : undefined} />
      );
    } catch (fallbackError) {
      console.error('❌ Even fallback failed:', fallbackError);
      // Last resort: show basic HTML
      container.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8fafc; font-family: system-ui;">
          <div style="text-align: center; padding: 32px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #dc2626; margin-bottom: 16px;">تحدي الثلاثين</h2>
            <p style="color: #666; margin-bottom: 16px;">حدث خطأ في التطبيق</p>
            <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer;">
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Start the app
renderApp();
