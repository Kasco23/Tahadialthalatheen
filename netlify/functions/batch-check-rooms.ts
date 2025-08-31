import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { withErrorHandling } from "./_utils.js";

/**
 * Batch check multiple Daily.co rooms to see which ones are active
 * Used by ActiveGames component to filter games with active video rooms
 */
const batchCheckRoomsHandler = async (
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!process.env.DAILY_API_KEY) {
    console.error('DAILY_API_KEY environment variable is missing');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Daily API key not configured',
        code: 'MISSING_API_KEY',
      }),
    };
  }

  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { roomNames } = requestBody;

    if (!roomNames || !Array.isArray(roomNames)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'roomNames array is required',
          code: 'MISSING_ROOM_NAMES',
        }),
      };
    }

    // Limit batch size to prevent overwhelming the API
    if (roomNames.length > 20) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Too many rooms requested (max 20)',
          code: 'TOO_MANY_ROOMS',
        }),
      };
    }

    // Check each room's presence concurrently
    const roomChecks = roomNames.map(async (roomName: string) => {
      try {
        // First check if room exists
        const roomResponse = await fetch(
          `https://api.daily.co/v1/rooms/${roomName}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (roomResponse.status === 404) {
          return {
            roomName,
            exists: false,
            active: false,
            error: null,
          };
        }

        if (!roomResponse.ok) {
          return {
            roomName,
            exists: false,
            active: false,
            error: `Room check failed: ${roomResponse.status}`,
          };
        }

        const roomData = await roomResponse.json();

        // Check if room has expired
        const now = Math.round(Date.now() / 1000);
        const roomExp = roomData.config?.exp;
        if (roomExp && roomExp < now) {
          return {
            roomName,
            exists: true,
            active: false,
            expired: true,
            error: null,
          };
        }

        // Get presence data
        const presenceResponse = await fetch(
          `https://api.daily.co/v1/rooms/${roomName}/presence`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!presenceResponse.ok) {
          return {
            roomName,
            exists: true,
            active: false,
            error: `Presence check failed: ${presenceResponse.status}`,
          };
        }

        const presenceData = await presenceResponse.json();
        const participantCount = (presenceData.participants || []).length;

        return {
          roomName,
          exists: true,
          active: participantCount > 0,
          participantCount,
          error: null,
        };
      } catch (error) {
        console.error(`Error checking room ${roomName}:`, error);
        return {
          roomName,
          exists: false,
          active: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Wait for all room checks to complete
    const results = await Promise.all(roomChecks);

    // Filter to only active rooms
    const activeRooms = results.filter((room) => room.active);
    const totalChecked = results.length;
    const totalActive = activeRooms.length;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        totalChecked,
        totalActive,
        results,
        activeRooms: activeRooms.map((room) => room.roomName),
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// Export with error handling
export const handler = withErrorHandling('batch-check-rooms', batchCheckRoomsHandler);
