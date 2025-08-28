import * as Sentry from '@sentry/node';
import type { AuthContext } from './_auth.js';

/**
 * Enhanced Sentry monitoring for authentication-enabled functions
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
  Sentry.addBreadcrumb({
    category: 'auth',
    message: `Authentication event: ${event}`,
    level: 'info',
    data: {
      event,
      functionName: context.functionName,
      isAuthenticated: context.isAuthenticated,
      hasUserId: !!context.userId,
      hasGameId: !!context.gameId,
      error: context.error,
    },
  });

  // Track as custom metric for monitoring
  Sentry.withScope((scope) => {
    scope.setTag('auth_event', event);
    scope.setTag('function_name', context.functionName);
    scope.setContext('auth_context', {
      event,
      isAuthenticated: context.isAuthenticated,
      hasUserId: !!context.userId,
      hasGameId: !!context.gameId,
    });

    if (event === 'auth_failed' && context.error) {
      Sentry.captureMessage(
        `Authentication failed: ${context.error}`,
        'warning',
      );
    } else {
      Sentry.captureMessage(`Auth event: ${event}`, 'info');
    }
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
  Sentry.addBreadcrumb({
    category: 'database',
    message: `Database ${operation} on ${table}`,
    level: context.success ? 'info' : 'warning',
    data: {
      operation,
      table,
      functionName: context.functionName,
      isAuthenticated: context.authContext.isAuthenticated,
      hasUserId: !!context.authContext.userId,
      success: context.success,
      error: context.error,
    },
  });

  if (!context.success && context.error) {
    Sentry.withScope((scope) => {
      scope.setTag('database_operation', operation);
      scope.setTag('database_table', table);
      scope.setTag('function_name', context.functionName);
      scope.setContext('database_context', {
        operation,
        table,
        isAuthenticated: context.authContext.isAuthenticated,
        recordId: context.recordId,
      });

      Sentry.captureException(
        new Error(`Database ${operation} failed: ${context.error}`),
      );
    });
  }
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
  const level =
    event.startsWith('unauthorized') || event === 'rls_policy_block'
      ? 'warning'
      : 'info';

  Sentry.addBreadcrumb({
    category: 'security',
    message: `Security event: ${event}`,
    level,
    data: {
      event,
      functionName: context.functionName,
      gameId: context.gameId,
      hasUserId: !!context.userId,
      attemptedAction: context.attemptedAction,
      reason: context.reason,
    },
  });

  Sentry.withScope((scope) => {
    scope.setTag('security_event', event);
    scope.setTag('function_name', context.functionName);
    scope.setTag('game_id', context.gameId);
    scope.setContext('security_context', {
      event,
      gameId: context.gameId,
      attemptedAction: context.attemptedAction,
      reason: context.reason,
    });

    if (level === 'warning') {
      Sentry.captureMessage(
        `Security violation: ${event} in ${context.functionName}`,
        'warning',
      );
    } else {
      Sentry.captureMessage(`Security event: ${event}`, 'info');
    }
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
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'authentication');
    scope.setTag('function_name', context.functionName);

    if (context.authContext) {
      scope.setContext('auth_context', {
        isAuthenticated: context.authContext.isAuthenticated,
        hasUserId: !!context.authContext.userId,
      });
    }

    if (context.gameId) {
      scope.setTag('game_id', context.gameId);
    }

    if (context.operation) {
      scope.setTag('operation', context.operation);
    }

    if (typeof error === 'string') {
      Sentry.captureMessage(error, 'error');
    } else {
      Sentry.captureException(error);
    }
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

  return Sentry.withScope(async (scope) => {
    scope.setTag('operation', operation);
    scope.setTag('function_name', functionName);

    try {
      const result = await asyncFn();
      const duration = Date.now() - startTime;

      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Auth operation completed: ${operation}`,
        level: 'info',
        data: {
          operation,
          functionName,
          duration: `${duration}ms`,
          success: true,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Auth operation failed: ${operation}`,
        level: 'error',
        data: {
          operation,
          functionName,
          duration: `${duration}ms`,
          success: false,
        },
      });

      captureAuthError(error as Error, { functionName, operation });
      throw error;
    }
  });
}
