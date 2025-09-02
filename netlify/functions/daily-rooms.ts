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

// Enhanced interfaces with strict typing and validation
interface DailyRoomConfig {
  name: string;
  privacy?: 'public' | 'private';
  properties?: {
    start_video_off?: boolean;
    start_audio_off?: boolean;
    max_participants?: number;
    enable_screenshare?: boolean;
    enable_chat?: boolean;
    enable_recording?: boolean;
    enable_knocking?: boolean;
    enable_prejoin_ui?: boolean;
    exp?: number; // expiration timestamp
    lang?: string;
    geo?: 'au' | 'ca' | 'eu' | 'in' | 'jp' | 'sg' | 'us';
    webhook_events?: string[];
  };
}

interface CreateRoomRequest {
  sessionId: string;
  roomName: string;
  properties?: DailyRoomConfig['properties'];
}

interface TokenRequest {
  roomName: string;
  properties?: {
    is_owner?: boolean;
    user_name?: string;
    user_id?: string;
    enable_screenshare?: boolean;
    enable_recording?: boolean;
    exp?: number;
  };
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

interface DailyPresenceResponse {
  total_count: number;
  participants?: Array<{
    id: string;
    user_name?: string;
    user_id?: string;
    joined_at?: string;
  }>;
}

interface RoomData {
  roomId: string;
  roomName: string;
  url: string;
  sessionId: string;
  isActive: boolean;
  createdAt: string;
  totalParticipants?: number;
}

// Enhanced error types
enum DailyErrorCode {
  API_KEY_MISSING = 'DAILY_API_KEY_MISSING',
  API_REQUEST_FAILED = 'DAILY_API_REQUEST_FAILED',
  RATE_LIMIT_EXCEEDED = 'DAILY_RATE_LIMIT_EXCEEDED',
  ROOM_NOT_FOUND = 'DAILY_ROOM_NOT_FOUND',
  ROOM_ALREADY_EXISTS = 'DAILY_ROOM_ALREADY_EXISTS',
  INVALID_ROOM_NAME = 'DAILY_INVALID_ROOM_NAME',
  TOKEN_GENERATION_FAILED = 'DAILY_TOKEN_GENERATION_FAILED',
}

// Rate limiting cache (in production, use Redis)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Validation helpers
function validateRoomName(roomName: string): boolean {
  // Daily.co room names must be alphanumeric with hyphens and underscores
  return /^[a-zA-Z0-9_-]+$/.test(roomName) && roomName.length <= 50;
}

function sanitizeRoomName(roomName: string): string {
  return roomName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

// Enhanced Daily.co API wrapper with retry logic
async function callDailyAPI<T = unknown>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  retryCount = 0,
): Promise<T> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    console.error('DAILY_API_KEY environment variable not set');
    throw new Error(DailyErrorCode.API_KEY_MISSING);
  }

  const maxRetries = 3;
  const baseDelay = 1000;
  const timeoutMs = 10000; // 10 second timeout

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestInit: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Tahadialthalatheen/1.0',
    },
    signal: controller.signal,
  };

  if (body && method !== 'GET') {
    requestInit.body = JSON.stringify(body);
  }

  const startTime = Date.now();
  console.log(`[Daily API] ${method} ${endpoint}`, { 
    attempt: retryCount + 1, 
    body: body ? JSON.stringify(body) : undefined 
  });

  try {
    const response = await fetch(`https://api.daily.co/v1${endpoint}`, requestInit);
    clearTimeout(timeoutId); // Clear timeout on successful response
    
    const responseTime = Date.now() - startTime;
    
    console.log(`[Daily API] Response: ${response.status} (${responseTime}ms)`);

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.warn(`[Daily API] Rate limited, retry after ${retryAfter}s`);
      
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return callDailyAPI<T>(endpoint, method, body, retryCount + 1);
      }
      throw new Error(DailyErrorCode.RATE_LIMIT_EXCEEDED);
    }

    // Handle server errors with exponential backoff
    if (response.status >= 500 && retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.warn(`[Daily API] Server error ${response.status}, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callDailyAPI<T>(endpoint, method, body, retryCount + 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Daily API] Error ${response.status}: ${errorText}`);
      
      if (response.status === 404) {
        throw new Error(DailyErrorCode.ROOM_NOT_FOUND);
      }
      
      throw new Error(`${DailyErrorCode.API_REQUEST_FAILED}: ${response.status} ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }
    
    return response.text() as Promise<T>;

  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    
    if (error instanceof Error && Object.values(DailyErrorCode).includes(error.message as DailyErrorCode)) {
      throw error;
    }
    
    // Handle timeout/abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[Daily API] Request timeout after ${timeoutMs}ms`);
      if (retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`[Daily API] Retrying after timeout in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return callDailyAPI<T>(endpoint, method, body, retryCount + 1);
      }
      throw new Error(`${DailyErrorCode.API_REQUEST_FAILED}: Request timeout`);
    }
    
    console.error(`[Daily API] Request failed:`, error);
    if (retryCount < maxRetries) {
      const delay = baseDelay * Math.pow(2, retryCount);
      console.log(`[Daily API] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callDailyAPI<T>(endpoint, method, body, retryCount + 1);
    }
    
    throw new Error(`${DailyErrorCode.API_REQUEST_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Rate limiting middleware
function checkRateLimit(userId: string, action: string): boolean {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = action === 'create' ? 10 : 50; // More restrictive for room creation

  const current = rateLimitCache.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

// Main handler with comprehensive error handling
const handler = async (event: HandlerEvent, context: HandlerContext) => {
  const requestId = context.awsRequestId || crypto.randomUUID();
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return handleCors();
  }

  // Parse action from query params (primary) or URL path (for REST-style calls)
  let action: string | null = null;
  
  // Try to get action from query parameters first
  if (event.queryStringParameters?.action) {
    action = event.queryStringParameters.action;
  }
  // Fallback: try to parse from URL path
  else if (event.path?.includes('/')) {
    const pathParts = event.path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && !['daily-rooms', 'function', ''].includes(lastPart)) {
      action = lastPart;
    }
  }
  
  // Default action for basic health check if no action specified
  if (!action && event.httpMethod === 'GET') {
    action = 'health';
  }
  
  console.log(`[${requestId}] Daily.co handler started`, {
    method: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
    parsedAction: action,
    userAgent: event.headers?.['user-agent'] || 'unknown',
  });
  
  if (!action) {
    return createErrorResponse(
      'Action parameter is required. Valid actions: create, delete, check, list, token, presence, health',
      'MISSING_ACTION',
      400
    );
  }

  try {
    const authContext = await getAuthContext(event);
    
    // Rate limiting for authenticated users
    if (authContext.userId) {
      if (!checkRateLimit(authContext.userId, action)) {
        return createErrorResponse(
          'Rate limit exceeded. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }
    }

    switch (action) {
      case 'create':
        return await createRoom(event, authContext, requestId);

      case 'delete':
        return await deleteRoom(event, authContext, requestId);

      case 'check':
        return await checkRoom(event, authContext, requestId);

      case 'list':
        return await listRooms(event, authContext, requestId);

      case 'token':
        return await createToken(event, authContext, requestId);

      case 'presence':
        return await getRoomPresence(event, authContext, requestId);

      case 'health':
        return await healthCheck(requestId);

      default:
        return createErrorResponse(
          `Invalid action: ${action}. Valid actions: create, delete, check, list, token, presence, health`,
          'INVALID_ACTION',
          400
        );
    }
  } catch (error) {
    console.error(`[${requestId}] Handler error:`, error);
    
    if (error instanceof Error) {
      if (Object.values(DailyErrorCode).includes(error.message as DailyErrorCode)) {
        return createErrorResponse(error.message, error.message, 500);
      }
      return createErrorResponse(error.message, 'INTERNAL_ERROR', 500);
    }
    
    return createErrorResponse('An unexpected error occurred', 'INTERNAL_ERROR', 500);
  }
};

async function createRoom(event: HandlerEvent, authContext: AuthContext, requestId: string) {
  console.log(`[${requestId}] Creating room`);
  
  if (!validateMethod(event.httpMethod, ['POST'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  requireAuth(authContext);

  const requestData = parseRequestBody<CreateRoomRequest>(event.body);
  if (!requestData) {
    return createErrorResponse('Invalid JSON in request body', 'INVALID_JSON');
  }

  // Enhanced validation
  if (!requestData.sessionId || !requestData.roomName) {
    return createErrorResponse(
      'Missing required fields: sessionId and roomName',
      'MISSING_FIELDS'
    );
  }

  if (!validateRoomName(requestData.roomName)) {
    const sanitized = sanitizeRoomName(requestData.roomName);
    console.warn(`[${requestId}] Invalid room name "${requestData.roomName}", suggesting "${sanitized}"`);
    return createErrorResponse(
      `Invalid room name. Room names must be alphanumeric with hyphens/underscores only. Suggestion: "${sanitized}"`,
      DailyErrorCode.INVALID_ROOM_NAME
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
    console.log(`[${requestId}] Room already exists for session`);
    return createSuccessResponse({
      roomId: existingRoom.room_id,
      roomName: existingRoom.daily_room_name,
      url: existingRoom.url,
      sessionId: existingRoom.session_id,
      isActive: existingRoom.is_active,
      createdAt: existingRoom.started_at,
    });
  }

  // Enhanced room configuration with security defaults
  const roomConfig: DailyRoomConfig = {
    name: requestData.roomName,
    privacy: 'private', // Always private for security
    properties: {
      start_video_off: false,
      start_audio_off: false,
      max_participants: Math.min(requestData.properties?.max_participants || 10, 50), // Cap at 50
      enable_screenshare: requestData.properties?.enable_screenshare ?? true,
      enable_chat: requestData.properties?.enable_chat ?? true,
      enable_recording: requestData.properties?.enable_recording ?? false,
      enable_knocking: true, // Security feature
      enable_prejoin_ui: true, // Better UX
      lang: 'en',
      geo: 'us', // Default to US, could be configurable
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      webhook_events: ['participant-joined', 'participant-left', 'recording-started'],
      ...requestData.properties,
    },
  };

  try {
    // Create room via Daily.co API
    console.log(`[${requestId}] Creating Daily.co room: ${requestData.roomName}`);
    const dailyRoom = await callDailyAPI<DailyRoomResponse>(
      '/rooms',
      'POST',
      roomConfig as unknown as Record<string, unknown>,
    );

    // Store room in database with transaction
    const { data: roomData, error: roomError } = await authContext.supabase
      .from('rooms')
      .insert({
        room_id: dailyRoom.id,
        daily_room_name: dailyRoom.name,
        url: dailyRoom.url,
        session_id: requestData.sessionId,
        is_active: true,
        started_at: new Date().toISOString(),
        created_by: authContext.userId,
        config: dailyRoom.config,
      })
      .select()
      .single();

    if (roomError) {
      console.error(`[${requestId}] Database error:`, roomError);
      
      // Cleanup: Try to delete the Daily.co room
      try {
        await callDailyAPI(`/rooms/${dailyRoom.name}`, 'DELETE');
        console.log(`[${requestId}] Cleaned up Daily.co room after database error`);
      } catch (cleanupError) {
        console.error(`[${requestId}] Failed to cleanup Daily.co room:`, cleanupError);
      }
      
      return createErrorResponse(
        'Failed to store room data in database',
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
      createdAt: roomData.started_at,
    };

    console.log(`[${requestId}] Room created successfully`);
    return createSuccessResponse(response, 201);

  } catch (error) {
    console.error(`[${requestId}] Room creation failed:`, error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return createErrorResponse(
        `Room name '${requestData.roomName}' already exists. Please choose a different name.`,
        DailyErrorCode.ROOM_ALREADY_EXISTS,
        409
      );
    }
    
    throw error;
  }
}

async function deleteRoom(event: HandlerEvent, authContext: AuthContext, requestId: string) {
  console.log(`[${requestId}] Deleting room`);
  
  if (!validateMethod(event.httpMethod, ['DELETE'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  requireAuth(authContext);

  const roomName = event.queryStringParameters?.roomName;
  const sessionId = event.queryStringParameters?.sessionId;

  if (!roomName && !sessionId) {
    return createErrorResponse(
      'Either roomName or sessionId parameter is required',
      'MISSING_PARAMETERS',
    );
  }

  // Find room in database
  let query = authContext.supabase
    .from('rooms')
    .select('*, sessions(host_id)')
    .eq('is_active', true);

  if (roomName) {
    query = query.eq('daily_room_name', roomName);
  } else if (sessionId) {
    query = query.eq('session_id', sessionId);
  }

  const { data: roomData, error: findError } = await query.single();

  if (findError || !roomData) {
    console.warn(`[${requestId}] Room not found:`, { roomName, sessionId });
    return createErrorResponse('Room not found', DailyErrorCode.ROOM_NOT_FOUND, 404);
  }

  // Enhanced permission check
  const isHost = roomData.sessions?.host_id === authContext.userId;
  const isRoomCreator = roomData.created_by === authContext.userId;
  
  if (!isHost && !isRoomCreator) {
    return createErrorResponse(
      'Only the session host or room creator can delete rooms',
      'INSUFFICIENT_PERMISSIONS',
      403,
    );
  }

  try {
    // Delete from Daily.co
    await callDailyAPI(`/rooms/${roomData.daily_room_name}`, 'DELETE');
    console.log(`[${requestId}] Daily.co room deleted: ${roomData.daily_room_name}`);

    // Update database
    const { error: updateError } = await authContext.supabase
      .from('rooms')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('room_id', roomData.room_id);

    if (updateError) {
      console.error(`[${requestId}] Database update error:`, updateError);
      return createErrorResponse(
        'Room deleted but failed to update database',
        'PARTIAL_FAILURE',
        500,
      );
    }

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

    console.log(`[${requestId}] Room deletion completed successfully`);
    return createSuccessResponse({
      message: 'Room deleted successfully',
      roomName: roomData.daily_room_name,
      sessionId: roomData.session_id,
    });

  } catch (error) {
    console.error(`[${requestId}] Room deletion failed:`, error);
    
    if (error instanceof Error && error.message.includes(DailyErrorCode.ROOM_NOT_FOUND)) {
      // Room doesn't exist in Daily.co, just update database
      await authContext.supabase
        .from('rooms')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('room_id', roomData.room_id);
        
      return createSuccessResponse({
        message: 'Room was already deleted from Daily.co, database updated',
        roomName: roomData.daily_room_name,
      });
    }
    
    throw error;
  }
}

async function checkRoom(event: HandlerEvent, authContext: AuthContext, requestId: string) {
  const roomName = event.queryStringParameters?.roomName;

  if (!roomName) {
    return createErrorResponse(
      'roomName parameter is required',
      'MISSING_PARAMETERS',
    );
  }

  try {
    console.log(`[${requestId}] Checking room: ${roomName}`);
    const room = await callDailyAPI<DailyRoomResponse>(`/rooms/${roomName}`);
    
    return createSuccessResponse({
      exists: true,
      room: {
        id: room.id,
        name: room.name,
        url: room.url,
        privacy: room.privacy,
        config: room.config,
        created_at: room.created_at,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes(DailyErrorCode.ROOM_NOT_FOUND)) {
      return createSuccessResponse({ exists: false });
    }
    throw error;
  }
}

async function listRooms(event: HandlerEvent, authContext: AuthContext, requestId: string) {
  console.log(`[${requestId}] Listing rooms`);
  
  try {
    const rooms = await callDailyAPI<DailyRoomListResponse>('/rooms');
    
    // Get room activity from database
    const { data: dbRooms } = await authContext.supabase
      .from('rooms')
      .select('daily_room_name, session_id, is_active')
      .eq('is_active', true);

    const activeRoomNames = new Set(
      dbRooms?.map(room => room.daily_room_name) || []
    );

    const enhancedRooms = rooms.data.map(room => ({
      ...room,
      isTracked: activeRoomNames.has(room.name),
      sessionId: dbRooms?.find(db => db.daily_room_name === room.name)?.session_id,
    }));

    return createSuccessResponse({
      rooms: enhancedRooms,
      total_count: rooms.total_count,
      activeRooms: Array.from(activeRoomNames),
    });
  } catch (error) {
    console.error(`[${requestId}] List rooms failed:`, error);
    throw error;
  }
}

async function createToken(event: HandlerEvent, authContext: AuthContext, requestId: string) {
  console.log(`[${requestId}] Creating token`);
  
  if (!validateMethod(event.httpMethod, ['POST'])) {
    return createErrorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  const requestData = parseRequestBody<TokenRequest>(event.body);

  if (!requestData?.roomName) {
    return createErrorResponse('roomName is required', 'MISSING_FIELDS');
  }

  if (!validateRoomName(requestData.roomName)) {
    return createErrorResponse(
      'Invalid room name format',
      DailyErrorCode.INVALID_ROOM_NAME
    );
  }

  // Enhanced token configuration
  const tokenConfig = {
    properties: {
      room_name: requestData.roomName,
      is_owner: requestData.properties?.is_owner ?? false,
      user_name: requestData.properties?.user_name || 'Anonymous',
      user_id: requestData.properties?.user_id || authContext.userId,
      enable_screenshare: requestData.properties?.enable_screenshare ?? true,
      enable_recording: requestData.properties?.enable_recording ?? false,
      exp: requestData.properties?.exp || Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour default
      ...requestData.properties,
    },
  };

  try {
    console.log(`[${requestId}] Creating token for room: ${requestData.roomName}`);
    const tokenResponse = await callDailyAPI<DailyTokenResponse>(
      '/meeting-tokens',
      'POST',
      tokenConfig,
    );

    return createSuccessResponse({
      token: tokenResponse.token,
      roomName: requestData.roomName,
      expiresAt: new Date(tokenConfig.properties.exp * 1000).toISOString(),
      properties: tokenConfig.properties,
    });
  } catch (error) {
    console.error(`[${requestId}] Token creation failed:`, error);
    if (error instanceof Error) {
      return createErrorResponse(
        `Failed to create token: ${error.message}`,
        DailyErrorCode.TOKEN_GENERATION_FAILED,
        500
      );
    }
    throw error;
  }
}

async function getRoomPresence(event: HandlerEvent, authContext: AuthContext, requestId: string) {
  const roomName = event.queryStringParameters?.roomName;

  if (!roomName) {
    return createErrorResponse(
      'roomName parameter is required',
      'MISSING_PARAMETERS',
    );
  }

  try {
    console.log(`[${requestId}] Getting presence for room: ${roomName}`);
    const presence = await callDailyAPI<DailyPresenceResponse>(`/rooms/${roomName}/presence`);
    
    return createSuccessResponse({
      roomName,
      totalParticipants: presence.total_count,
      participants: presence.participants || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes(DailyErrorCode.ROOM_NOT_FOUND)) {
      return createSuccessResponse({
        roomName,
        totalParticipants: 0,
        participants: [],
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
}

async function healthCheck(requestId: string) {
  console.log(`[${requestId}] Health check`);
  
  try {
    // Test Daily.co API connectivity
    const startTime = Date.now();
    await callDailyAPI('/rooms?limit=1');
    const responseTime = Date.now() - startTime;
    
    return createSuccessResponse({
      status: 'healthy',
      service: 'daily-rooms',
      timestamp: new Date().toISOString(),
      dailyApi: {
        status: 'connected',
        responseTime,
      },
      version: '2.0.0',
    });
  } catch (error) {
    console.error(`[${requestId}] Health check failed:`, error);
    return createErrorResponse(
      'Daily.co API connectivity issues',
      'HEALTH_CHECK_FAILED',
      503
    );
  }
}

export { handler as default };
