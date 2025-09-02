import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { getAuthContext } from './_auth';
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
} from './_utils';

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

const handler = async (event: HandlerEvent, context: HandlerContext) => {
  const requestId = context.awsRequestId || crypto.randomUUID();
  
  console.log(`[${requestId}] Supabase health check started`, {
    method: event.httpMethod,
    path: event.path,
    userAgent: event.headers?.['user-agent'] || 'unknown',
    origin: event.headers?.['origin'] || 'unknown',
  });
  
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Allow GET and POST requests
  if (!['GET', 'POST'].includes(event.httpMethod || '')) {
    console.warn(`[${requestId}] Method not allowed: ${event.httpMethod}`);
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  // Check environment configuration
  console.log(`[${requestId}] Checking environment configuration...`);
  const healthCheck: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url_configured: !!process.env.VITE_SUPABASE_URL,
      supabase_anon_key_configured: !!process.env.VITE_SUPABASE_ANON_KEY,
      supabase_service_role_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  console.log(`[${requestId}] Environment check:`, healthCheck.environment);

  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.error(`[${requestId}] Missing required environment variables`);
    healthCheck.status = 'misconfigured';
    healthCheck.error = 'Supabase environment variables not configured';
    return createSuccessResponse(healthCheck, 200);
  }

  try {
    console.log(`[${requestId}] Testing database connectivity...`);
    
    // Get authentication context for secure database access
    const authContext = await getAuthContext(event);
    console.log(`[${requestId}] Auth context obtained, user: ${authContext.userId || 'anonymous'}`);

    // Simple query to test connectivity using authenticated client
    const startTime = Date.now();
    const { error, count } = await authContext.supabase
      .from('sessions')
      .select('session_id', { count: 'exact' })
      .limit(1);
    
    const queryTime = Date.now() - startTime;
    console.log(`[${requestId}] Database query completed in ${queryTime}ms`);

    if (error) {
      console.error(`[${requestId}] Database query error:`, error);
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

    console.log(`[${requestId}] Health check successful:`, healthCheck);
    return createSuccessResponse(healthCheck, 200);
  } catch (error) {
    console.error(`[${requestId}] Supabase health check error:`, error);

    healthCheck.status = 'unhealthy';
    healthCheck.error =
      error instanceof Error ? error.message : 'Unknown error';

    return createSuccessResponse(healthCheck, 503);
  }
};

export default handler;
