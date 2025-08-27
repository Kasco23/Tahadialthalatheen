const Sentry = require('@sentry/node');

// Initialize Sentry for Netlify functions
let sentryInitialized = false;

function initSentryFunction() {
  if (sentryInitialized) return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.warn('SENTRY_DSN not found for function monitoring');
    return;
  }

  Sentry.init({
    dsn,
    environment:
      process.env.NODE_ENV || process.env.NETLIFY_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

    // Function-specific settings
    serverName: 'netlify-functions',

    // Release tracking
    release:
      process.env.COMMIT_REF || process.env.VITE_APP_VERSION || 'unknown',

    // Enhanced error info
    beforeSend(event) {
      // Add function context
      if (!event.tags) event.tags = {};
      event.tags.platform = 'netlify-functions';
      return event;
    },
  });

  sentryInitialized = true;
  console.log('✅ Sentry initialized for Netlify functions');
}

// Wrapper for Netlify functions to add Sentry monitoring
function withSentry(functionName, handler) {
  return async (event, context) => {
    initSentryFunction();

    return Sentry.withScope(async (scope) => {
      scope.setTag('function', functionName);
      scope.setContext('netlify', {
        functionName,
        timestamp: new Date().toISOString(),
        httpMethod: event.httpMethod,
        path: event.path,
      });

      try {
        const result = await handler(event, context);
        return result;
      } catch (error) {
        Sentry.captureException(error);
        return createApiResponse(500, {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  };
}

// Alternative export for compatibility
function withSentry2(functionName, handler) {
  return withSentry(functionName, handler);
}

// Helper for API responses with error tracking
function createApiResponse(statusCode, body, headers = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    ...headers,
  };

  return {
    statusCode,
    headers: defaultHeaders,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

module.exports = {
  initSentryFunction,
  withSentry,
  withSentry2,
  createApiResponse,
  Sentry,
};
