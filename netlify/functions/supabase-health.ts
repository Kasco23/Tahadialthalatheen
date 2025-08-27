import type { HandlerContext, HandlerEvent } from '@netlify/functions';
const { withSentry, createApiResponse } = require('./_sentry.js');

/**
 * Simple Supabase health check endpoint
 */
const supabaseHealthHandler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  // Allow GET and POST requests
  if (!['GET', 'POST'].includes(event.httpMethod || '')) {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Check environment configuration
  const healthCheck = {
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url_configured: !!process.env.SUPABASE_URL,
      supabase_anon_key_configured: !!process.env.SUPABASE_ANON_KEY,
      supabase_service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ...healthCheck,
        status: 'misconfigured',
        error: 'Supabase environment variables not configured',
      }),
    };
  }

  try {
    // Test Supabase connectivity
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );

    // Simple query to test connectivity
    const { error, count } = await supabase
      .from('games')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          ...healthCheck,
          status: 'error',
          error: error.message,
          supabase_error_code: error.code,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ...healthCheck,
        status: 'healthy',
        database: {
          accessible: true,
          total_games: count || 0,
          test_query_successful: true,
        },
      }),
    };
  } catch (error) {
    console.error('Supabase health check error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        ...healthCheck,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Export with Sentry monitoring
export const handler = withSentry('supabase-health', supabaseHealthHandler);
