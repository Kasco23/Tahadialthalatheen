import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import type { AuthContext } from './_auth';
import { getAuthContext, requireAuth, verifySessionHost } from './_auth';
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  validateMethod,
} from './_utils';

interface DailyRoomConfig {
  name: string;
  privacy?: 'public' | 'private';
  properties?: Record<string, unknown> & {
    start_video_off?: boolean;
    start_audio_off?: boolean;
    max_participants?: number;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    enable_recording?: boolean;
    exp?: number; // expiration timestamp
  };
}

interface CreateRoomRequest {
  sessionId: string;
  roomName: string;
  properties?: DailyRoomConfig['properties'];
}

interface DailyRoomResponse {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: DailyRoomConfig['properties'];
}

interface DailyTokenResponse {
  token: string;
}

interface DailyRoomListResponse {
  data: DailyRoomResponse[];
  total_count: number;
}

interface RoomData {
  roomId: string;
  roomName: string;
  url: string;
  sessionId: string;
  isActive: boolean;
}

// Helper function to call Daily.co API
async function callDailyAPI<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
): Promise<T> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error('Daily.co API key not configured');
  }

  const requestInit: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(
    `https://api.daily.co/v1${endpoint}`,
    requestInit,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Daily.co API error: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<T>;
}

const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Parse URL path to determine action
  const path = event.path?.split('/').pop();
  const action = event.queryStringParameters?.action || path;

  try {
    const authContext = await getAuthContext(event);

    switch (action) {
      case 'create':
        return await createRoom(event, authContext);

      case 'delete':
        return await deleteRoom(event, authContext);

      case 'check':
        return await checkRoom(event, authContext);

      case 'list':
        return await listRooms(event, authContext);

      case 'token':
        return await createToken(event, authContext);

      case 'presence':
        return await getRoomPresence(event, authContext);

      default:
        return createErrorResponse('Invalid action', 'INVALID_ACTION');
    }
  } catch (error) {
    console.error('Daily.co handler error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500,
    );
  }
};

async function createRoom(event: HandlerEvent, authContext: AuthContext) {
  if (!validateMethod(event.httpMethod, ['POST'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  requireAuth(authContext);

  const requestData = parseRequestBody<CreateRoomRequest>(event.body);
  if (!requestData) {
    return createErrorResponse('Invalid JSON in request body', 'INVALID_JSON');
  }

  if (!requestData.sessionId || !requestData.roomName) {
    return createErrorResponse(
      'Missing required fields: sessionId and roomName',
      'MISSING_FIELDS',
    );
  }

  // Verify user is the session host
  const isHost = await verifySessionHost(
    authContext.supabase,
    requestData.sessionId,
    authContext.userId,
  );
  if (!isHost) {
    return createErrorResponse(
      'Only the session host can create video rooms',
      'INSUFFICIENT_PERMISSIONS',
      403,
    );
  }

  // Check if room already exists for this session
  const { data: existingRoom } = await authContext.supabase
    .from('rooms')
    .select('*')
    .eq('session_id', requestData.sessionId)
    .eq('is_active', true)
    .single();

  if (existingRoom) {
    return createSuccessResponse({
      roomId: existingRoom.room_id,
      roomName: existingRoom.daily_room_name,
      url: existingRoom.url,
      sessionId: existingRoom.session_id,
      isActive: existingRoom.is_active,
    });
  }

  // Create room via Daily.co API
  const roomConfig: DailyRoomConfig = {
    name: requestData.roomName,
    privacy: 'private',
    properties: {
      start_video_off: false,
      start_audio_off: false,
      max_participants: 10,
      enable_screenshare: true,
      enable_chat: true,
      enable_recording: false,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      ...requestData.properties,
    },
  };

  const dailyRoom: DailyRoomResponse = await callDailyAPI<DailyRoomResponse>(
    '/rooms',
    'POST',
    roomConfig as unknown as Record<string, unknown>,
  );

  // Store room in database
  const { data: roomData, error: roomError } = await authContext.supabase
    .from('rooms')
    .insert({
      room_id: dailyRoom.id,
      daily_room_name: dailyRoom.name,
      url: dailyRoom.url,
      session_id: requestData.sessionId,
      is_active: true,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (roomError) {
    console.error('Error storing room in database:', roomError);
    // Try to clean up the Daily.co room
    try {
      await callDailyAPI(`/rooms/${dailyRoom.name}`, 'DELETE');
    } catch (cleanupError) {
      console.error('Failed to cleanup Daily.co room:', cleanupError);
    }
    return createErrorResponse(
      'Failed to store room data',
      'STORAGE_FAILED',
      500,
    );
  }

  // Update session with video room info
  await authContext.supabase
    .from('sessions')
    .update({
      video_room_created: true,
      video_room_url: dailyRoom.url,
      updated_at: new Date().toISOString(),
    })
    .eq('session_id', requestData.sessionId);

  const response: RoomData = {
    roomId: roomData.room_id,
    roomName: roomData.daily_room_name,
    url: roomData.url,
    sessionId: roomData.session_id,
    isActive: roomData.is_active,
  };

  return createSuccessResponse(response, 201);
}

async function deleteRoom(event: HandlerEvent, authContext: AuthContext) {
  if (!validateMethod(event.httpMethod, ['DELETE'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  requireAuth(authContext);

  const roomName = event.queryStringParameters?.roomName;
  const sessionId = event.queryStringParameters?.sessionId;

  if (!roomName && !sessionId) {
    return createErrorResponse(
      'Either roomName or sessionId is required',
      'MISSING_PARAMETERS',
    );
  }

  // Find room in database
  let query = authContext.supabase.from('rooms').select('*');

  if (roomName) {
    query = query.eq('daily_room_name', roomName);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: roomData, error: findError } = await query.single();

  if (findError || !roomData) {
    return createErrorResponse('Room not found', 'ROOM_NOT_FOUND', 404);
  }

  // Verify permissions
  if (sessionId) {
    const isHost = await verifySessionHost(
      authContext.supabase,
      sessionId,
      authContext.userId,
    );
    if (!isHost) {
      return createErrorResponse(
        'Only the session host can delete video rooms',
        'INSUFFICIENT_PERMISSIONS',
        403,
      );
    }
  }

  // Delete from Daily.co
  try {
    await callDailyAPI(`/rooms/${roomData.daily_room_name}`, 'DELETE');
  } catch (error) {
    console.error('Failed to delete room from Daily.co:', error);
  }

  // Update room in database
  await authContext.supabase
    .from('rooms')
    .update({
      is_active: false,
      ended_at: new Date().toISOString(),
    })
    .eq('room_id', roomData.room_id);

  // Update session
  if (roomData.session_id) {
    await authContext.supabase
      .from('sessions')
      .update({
        video_room_created: false,
        video_room_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', roomData.session_id);
  }

  return createSuccessResponse({ deleted: true, roomId: roomData.room_id });
}

async function checkRoom(event: HandlerEvent, authContext: AuthContext) {
  const roomName = event.queryStringParameters?.roomName;

  if (!roomName) {
    return createErrorResponse(
      'roomName parameter is required',
      'MISSING_PARAMETERS',
    );
  }

  try {
    const roomInfo = await callDailyAPI(`/rooms/${roomName}`);

    // Also check our database
    const { data: dbRoom } = await authContext.supabase
      .from('rooms')
      .select('*')
      .eq('daily_room_name', roomName)
      .single();

    return createSuccessResponse({
      daily: roomInfo,
      database: dbRoom,
      exists: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return createSuccessResponse({ exists: false });
    }
    throw error;
  }
}

async function listRooms(event: HandlerEvent, authContext: AuthContext) {
  const sessionId = event.queryStringParameters?.sessionId;

  let query = authContext.supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true);

  if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: rooms, error } = await query;

  if (error) {
    return createErrorResponse('Failed to fetch rooms', 'FETCH_FAILED', 500);
  }

  return createSuccessResponse(rooms || []);
}

async function createToken(event: HandlerEvent, authContext: AuthContext) {
  if (!validateMethod(event.httpMethod, ['POST'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const requestData = parseRequestBody<{
    roomName: string;
    properties?: {
      is_owner?: boolean;
      user_name?: string;
      exp?: number;
    };
  }>(event.body);

  if (!requestData?.roomName) {
    return createErrorResponse('roomName is required', 'MISSING_FIELDS');
  }

  const tokenConfig = {
    properties: {
      room_name: requestData.roomName,
      is_owner: false,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      ...requestData.properties,
    },
  };

  const tokenResponse = await callDailyAPI<DailyTokenResponse>(
    '/meeting-tokens',
    'POST',
    tokenConfig,
  );

  return createSuccessResponse({
    token: tokenResponse.token,
    roomName: requestData.roomName,
  });
}

async function getRoomPresence(event: HandlerEvent, authContext: AuthContext) {
  const roomName = event.queryStringParameters?.roomName;

  if (!roomName) {
    return createErrorResponse(
      'roomName parameter is required',
      'MISSING_PARAMETERS',
    );
  }

  try {
    const presence = await callDailyAPI(`/rooms/${roomName}/presence`);
    return createSuccessResponse(presence);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return createSuccessResponse({ total_count: 0, participants: [] });
    }
    throw error;
  }
}

export default handler;
