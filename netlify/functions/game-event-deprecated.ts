import type { HandlerContext, HandlerEvent } from '@netlify/functions';

/**
 * DEPRECATED: This endpoint has been replaced by game-event-secure.ts
 *
 * This legacy endpoint is maintained for backward compatibility but should not be used
 * for new implementations. Please use game-event-secure.ts instead, which includes:
 * - Proper authentication and authorization
 * - Enhanced security with RLS policies
 * - Better error handling and monitoring
 *
 * @deprecated Use game-event-secure.ts instead
 */
const gameEventHandler = async (
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
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  return {
    statusCode: 410, // Gone
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: 'This endpoint has been deprecated',
      message: 'Please use /game-event-secure instead for enhanced security',
      migrationGuide: {
        newEndpoint: '/game-event-secure',
        authenticationRequired: true,
        securityEnhancements: [
          'Host verification for restricted operations',
          'Player verification for game participation',
          'Enhanced RLS policy enforcement',
          'Improved error handling and monitoring'
        ]
      },
      code: 'ENDPOINT_DEPRECATED',
    }),
  };
};

export { gameEventHandler as handler };
