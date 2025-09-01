import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext } from './_auth.js';
import { 
  handleCors, 
  createSuccessResponse, 
  createErrorResponse 
} from './_utils.js';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'misconfigured';
  timestamp: string;
  environment: {
    supabase_url_configured: boolean;
    supabase_anon_key_configured: boolean;
    supabase_service_role_configured: boolean;
  };
  database?: {
    accessible: boolean;
    total_sessions: number;
    test_query_successful: boolean;
  };
  error?: string;
  supabase_error_code?: string;
}

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext,
) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Allow GET and POST requests
  if (!['GET', 'POST'].includes(event.httpMethod || '')) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  // Check environment configuration
  const healthCheck: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url_configured: !!process.env.SUPABASE_URL,
      supabase_anon_key_configured: !!process.env.SUPABASE_ANON_KEY,
      supabase_service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    healthCheck.status = 'misconfigured';
    healthCheck.error = 'Supabase environment variables not configured';
    return createSuccessResponse(healthCheck, 200);
  }

  try {
    // Get authentication context for secure database access
    const authContext = await getAuthContext(event);

    // Simple query to test connectivity using authenticated client
    const { error, count } = await authContext.supabase
      .from('sessions')
      .select('session_id', { count: 'exact' })
      .limit(1);

    if (error) {
      healthCheck.status = 'unhealthy';
      healthCheck.error = error.message;
      healthCheck.supabase_error_code = error.code;
      return createSuccessResponse(healthCheck, 200);
    }

    healthCheck.database = {
      accessible: true,
      total_sessions: count || 0,
      test_query_successful: true,
    };

    return createSuccessResponse(healthCheck, 200);

  } catch (error) {
    console.error('Supabase health check error:', error);

    healthCheck.status = 'unhealthy';
    healthCheck.error = error instanceof Error ? error.message : 'Unknown error';

    return createSuccessResponse(healthCheck, 503);
  }
};
