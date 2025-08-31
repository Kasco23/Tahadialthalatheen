/**
 * Simple API response utilities - replaces Sentry functionality
 */

import type { HandlerEvent, HandlerContext } from '@netlify/functions';

export function createApiResponse(
  statusCode: number,
  data: unknown,
  headers: Record<string, string> = {}
) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      ...headers,
    },
    body: JSON.stringify(data),
  };
}

/**
 * Simple wrapper for functions - replaces withSentry
 */
export function withErrorHandling(
  functionName: string,
  handler: (event: HandlerEvent, context: HandlerContext) => Promise<unknown>
) {
  return async (event: HandlerEvent, context: HandlerContext) => {
    try {
      console.log(`🚀 Starting function: ${functionName}`);
      const result = await handler(event, context);
      console.log(`✅ Function ${functionName} completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Error in function ${functionName}:`, error);
      
      return createApiResponse(500, {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        function: functionName,
        timestamp: new Date().toISOString(),
      });
    }
  };
}