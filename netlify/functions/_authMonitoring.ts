import type { AuthContext } from './_auth.js';

/**
 * Enhanced logging for authentication-enabled functions
 */

/**
 * Track authentication events for monitoring and analytics
 */
export function trackAuthEvent(
  event:
    | 'auth_context_created'
    | 'auth_required'
    | 'auth_failed'
    | 'host_verification'
    | 'player_verification',
  context: {
    functionName: string;
    userId?: string;
    gameId?: string;
    isAuthenticated?: boolean;
    error?: string;
  },
) {
  console.log(`[AUTH] ${event}`, {
    functionName: context.functionName,
    isAuthenticated: context.isAuthenticated,
    hasUserId: !!context.userId,
    hasGameId: !!context.gameId,
    error: context.error,
  });
}

/**
 * Track database operations with authentication context
 */
export function trackDatabaseOperation(
  operation: 'read' | 'write' | 'delete',
  table: 'games' | 'players' | 'game_events',
  context: {
    functionName: string;
    authContext: AuthContext;
    recordId?: string;
    success: boolean;
    error?: string;
  },
) {
  const logLevel = context.success ? 'log' : 'warn';
  console[logLevel](`[DB] ${operation} on ${table}`, {
    functionName: context.functionName,
    isAuthenticated: context.authContext.isAuthenticated,
    hasUserId: !!context.authContext.userId,
    success: context.success,
    error: context.error,
    recordId: context.recordId,
  });
}

/**
 * Track game security events (host verification, unauthorized access attempts)
 */
export function trackSecurityEvent(
  event:
    | 'unauthorized_host_access'
    | 'unauthorized_player_access'
    | 'rls_policy_block'
    | 'permission_granted',
  context: {
    functionName: string;
    userId?: string;
    gameId: string;
    attemptedAction: string;
    reason?: string;
  },
) {
  const logLevel =
    event.startsWith('unauthorized') || event === 'rls_policy_block'
      ? 'warn'
      : 'log';
      
  console[logLevel](`[SECURITY] ${event}`, {
    functionName: context.functionName,
    gameId: context.gameId,
    hasUserId: !!context.userId,
    attemptedAction: context.attemptedAction,
    reason: context.reason,
  });
}

/**
 * Enhanced error tracking for authentication functions
 */
export function captureAuthError(
  error: Error | string,
  context: {
    functionName: string;
    authContext?: AuthContext;
    gameId?: string;
    operation?: string;
  },
) {
  console.error(`[AUTH_ERROR] ${context.functionName}`, {
    error: typeof error === 'string' ? error : error.message,
    isAuthenticated: context.authContext?.isAuthenticated,
    hasUserId: !!context.authContext?.userId,
    gameId: context.gameId,
    operation: context.operation,
  });
}

/**
 * Performance monitoring for authentication operations
 */
export async function measureAuthPerformance<T>(
  operation: string,
  functionName: string,
  asyncFn: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await asyncFn();
    const duration = Date.now() - startTime;

    console.log(`[PERF] Auth operation completed: ${operation}`, {
      functionName,
      duration: `${duration}ms`,
      success: true,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    console.warn(`[PERF] Auth operation failed: ${operation}`, {
      functionName,
      duration: `${duration}ms`,
      success: false,
    });

    captureAuthError(error as Error, { functionName, operation });
    throw error;
  }
}
