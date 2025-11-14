# Backend - Current State

**Last Updated**: November 14, 2025  
**Total Active Functions**: 9 Serverless + 3 Edge Functions = 12 total

---

## Netlify Serverless Functions (Node.js)

### createDailyRoom.ts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/createDailyRoom`
- **Method**: POST
- **Purpose**: Create Daily.co video rooms via Daily.co API
- **Request Body**: `{ session_code: string }`
- **Response**: `{ room_url: string, room_name: string, session_id: string }`
- **Key Features**:
  - Uses session_code as room name
  - 8-second timeout with abort controller
  - Idempotent (fetches existing room if 409 conflict)
  - Saves room to Supabase DailyRooms table
- **Environment Variables**: `DAILY_API_KEY`, `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Size**: ~6KB
- **Used By**: Homepage.tsx, GameSetup.tsx via mutations.ts

### create-daily-token.ts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/create-daily-token`
- **Method**: POST
- **Purpose**: Generate Daily.co meeting tokens for participants
- **Request Body**: `{ room_name: string, user_name: string, session_code?: string }`
- **Response**: `{ token: string }`
- **Key Features**:
  - Supports room_name or session_code
  - Tokens valid for Daily.co room access
  - Non-owner tokens by default
  - Video/audio enabled by default
- **Environment Variables**: `DAILY_API_KEY`
- **Size**: ~3KB
- **Used By**: Lobby.tsx, Quiz.tsx via mutations.ts/dailyTokenManager.ts

### send-notification.ts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/send-notification`
- **Method**: POST
- **Purpose**: Server-side notification creation (keeps service role key secure)
- **Request Body**: `{ recipient_id: string, type: string, title: string, message: string, sender_id?: string, link?: string, metadata?: object }`
- **Response**: `{ success: boolean, notification?: object }`
- **Key Features**:
  - Uses Supabase service role key
  - Bypasses RLS policies
  - Validates required fields
  - Returns created notification
- **Environment Variables**: `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Size**: ~4KB
- **Used By**: Friend request system, match invites

### check-ready-status.ts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/check-ready-status`
- **Method**: POST
- **Purpose**: Check if all players in a session are ready
- **Request Body**: `{ sessionId: string }`
- **Response**: `{ success: boolean, allReady: boolean, readyCount: number, totalPlayers: number, participants: array }`
- **Key Features**:
  - Queries Player1/Player2 roles only
  - Filters by lobby_presence='Joined'
  - Checks isReady status
  - Uses service role for security
- **Environment Variables**: `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Size**: ~3KB
- **Used By**: Lobby.tsx via mutations.ts checkAllPlayersReady()

### mark-player-ready.ts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/mark-player-ready`
- **Method**: POST
- **Purpose**: Update player ready status server-side
- **Request Body**: `{ participantId: string, isReady: boolean }`
- **Response**: `{ success: boolean }`
- **Key Features**:
  - Server-side ready state management
  - Bypasses RLS for reliable updates
  - Returns success status
- **Environment Variables**: `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Size**: ~2KB
- **Used By**: Lobby.tsx via mutations.ts markPlayerReady()

### transfermarkt-proxy.mts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/transfermarkt-proxy`
- **Method**: GET
- **Purpose**: Proxy requests to Transfermarkt API to avoid CORS issues
- **Query Parameters**: `endpoint` (the API path to proxy, e.g., `/players/search/Messi`)
- **Response**: Proxied JSON response from Transfermarkt API
- **Key Features**:
  - Proxies all requests to `https://transfermarkt-api-jftx.onrender.com`
  - Adds CORS headers for browser access
  - Error handling with detailed messages
  - Supports all HTTP methods
  - No authentication required
- **External API**: Transfermarkt API on Render.com
- **Size**: ~2KB
- **Used By**: TransfermarktAPI.tsx page

### get-active-profile.ts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/get-active-profile`
- **Method**: GET
- **Purpose**: Retrieve active profile for user
- **Query Parameters**: `userId`
- **Response**: `{ success: boolean, profile?: object }`
- **Key Features**:
  - Fetches from Netlify Blobs storage
  - Cross-device profile sync
  - Returns null if no active profile
- **Size**: ~2KB
- **Used By**: activeProfile.ts library

### store-active-profile.ts

- **Status**: ✅ Active
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/store-active-profile`
- **Method**: POST
- **Purpose**: Store active profile for user
- **Request Body**: `{ userId: string, profileData: object }`
- **Response**: `{ success: boolean }`
- **Key Features**:
  - Saves to Netlify Blobs storage
  - Enables cross-device profile sync
  - Overwrites previous active profile
- **Size**: ~2KB
- **Used By**: activeProfile.ts library

### cleanupStatus.ts

- **Status**: ✅ Active (Scheduled)
- **Runtime**: Netlify Functions (Node.js) - Runtime API v1 (scheduled functions)
- **Schedule**: Hourly (cron: `0 * * * *`)
- **Purpose**: Cleanup stale participant status
- **Logic**:
  - Finds participants with lastHeartbeat > 10 minutes ago
  - Sets isConnected=false, isReady=false, inCall=false
  - Returns count of cleaned participants
- **Key Features**:
  - Automatic maintenance
  - Prevents stale presence data
  - Runs hourly via Netlify scheduler
- **Environment Variables**: `SUPABASE_DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Size**: ~3KB
- **Configured In**: netlify.toml

---

## Netlify Edge Functions (Deno)

### get-session.ts

- **Status**: ✅ Active
- **Runtime**: Deno Edge Functions
- **Endpoint**: `/.netlify/edge-functions/get-session`
- **Method**: GET
- **Purpose**: Retrieve session data from Netlify Blobs
- **Query Parameters**: `key` (format: `sessionId:participantId`)
- **Response**: `{ success: boolean, data?: object }` or 404
- **Key Features**:
  - Edge-deployed (low latency)
  - Reads from Netlify Blobs store
  - Returns 404 if key not found
- **Size**: ~2KB
- **Used By**: blobStore.ts loadSession()

### set-session.ts

- **Status**: ✅ Active
- **Runtime**: Deno Edge Functions
- **Endpoint**: `/.netlify/edge-functions/set-session`
- **Methods**: POST (save), DELETE (remove)
- **Purpose**: Save/delete session data in Netlify Blobs
- **POST Body**: `{ key: string, data: object }`
- **DELETE Body**: `{ key: string }`
- **Response**: `{ success: boolean }`
- **Key Features**:
  - Edge-deployed (low latency)
  - Writes to Netlify Blobs store
  - Handles both save and delete operations
- **Size**: ~2KB
- **Used By**: blobStore.ts saveSession(), deleteSession()

### session-state.ts

- **Status**: ✅ Active
- **Runtime**: Deno Edge Functions
- **Endpoint**: `/.netlify/edge-functions/session-state`
- **Methods**: GET, POST, PUT, DELETE
- **Purpose**: Session-level state management (room creation, phase changes)
- **GET Query**: `?sessionId=xxx`
- **POST/PUT Body**: `{ sessionId: string, state: object }`
- **DELETE Body**: `{ sessionId: string }`
- **State Schema**: `{ dailyRoomCreated, dailyRoomUrl, phase, segmentsConfigured, participantCount, lastUpdated }`
- **Key Features**:
  - Session-wide coordination
  - Partial updates (POST) vs full replacement (PUT)
  - Edge-deployed for low latency
  - Used for GameSetup → Lobby synchronization
- **Size**: ~4KB
- **Used By**: sessionState.ts library

---

## Backend Architecture

### API Gateway Pattern

- **Frontend** → Netlify Functions → External APIs (Daily.co, Supabase)
- **Security**: API keys secured in Netlify environment variables
- **No CORS Issues**: Functions handle all external API calls

### Function Types

1. **API Proxies**: createDailyRoom, create-daily-token (wrap Daily.co API)
2. **Database Operations**: send-notification, check-ready-status, mark-player-ready (use service role key)
3. **State Management**: get-session, set-session, session-state (use Netlify Blobs)
4. **Scheduled Tasks**: cleanupStatus (automated maintenance)
5. **Profile Management**: get-active-profile, store-active-profile (cross-device sync)
6. **Question Generation**: generate-remontada-question, generate-bell-question, generate-wdyk-question, generate-auction-question, generate-updw-question (planned)

---

## Planned Serverless Functions (Question Generators)

### generate-remontada-question.mts

- **Status**: 🚧 **Planned** (Phase 4)
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/generate-remontada-question`
- **Method**: POST
- **Purpose**: Generate REMO (Remontada) segment questions using player transfer history
- **Request Body**: `{ player_name: string, career_span?: string }`
- **Response**: `{ question: QuestionObject, metadata: { api_source, api_params, total_answers_count, answers_truncated } }`
- **Key Features**:
  - Uses /transfers endpoint to extract career path
  - Cleans club names (removes parentheses, loan indicators)
  - Sorts clubs chronologically
  - Handles answer limit (display 100, warn if 100+)
  - Caches results with 30-day TTL
- **API Endpoints Used**: /players/search, /players/{id}/transfers
- **Dependencies**: api/transfermarkt.ts, api/transfermarktCache.ts
- **Part Of**: Transfermarkt API Integration Project (Phase 4)

### generate-bell-question.mts

- **Status**: 🚧 **Planned** (Phase 5)
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/generate-bell-question`
- **Method**: POST
- **Purpose**: Generate BELL (Bell Ringer) segment questions using statistical data
- **Request Body**: `{ stat_type: 'top_scorer' | 'most_assists' | 'most_appearances', competition_id?: string, season_id?: string, limit?: number }`
- **Response**: `{ question: QuestionObject, metadata: { api_source, api_params, total_answers_count, answers_truncated } }`
- **Key Features**:
  - Uses /stats endpoint for statistical comparisons
  - Supports competition and season filtering
  - Handles tied answers (same stat value)
  - Answer limit handling (100+ scenarios)
  - Caches with 1-day TTL (stats change seasonally)
- **API Endpoints Used**: /players/search, /players/{id}/stats
- **Dependencies**: api/transfermarkt.ts, api/transfermarktCache.ts
- **Part Of**: Transfermarkt API Integration Project (Phase 5)

### generate-wdyk-question.mts

- **Status**: 🚧 **Planned** (Phase 6)
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/generate-wdyk-question`
- **Method**: POST
- **Purpose**: Generate WDYK (Who Do You Know) segment questions with multi-league filtering
- **Request Body**: `{ leagues: string[], season?: string, club?: string }`
- **Response**: `{ question: QuestionObject, metadata: { api_source, api_params, total_answers_count, answers_truncated } }`
- **Key Features**:
  - Multi-league player search
  - Club roster filtering by season
  - Answer limit critical (often 100+ players)
  - Display 100 with expand option
  - Cache with 7-day TTL
- **API Endpoints Used**: /clubs/search, /clubs/{id}/players, /players/search
- **Dependencies**: api/transfermarkt.ts, api/transfermarktCache.ts
- **Part Of**: Transfermarkt API Integration Project (Phase 6)

### generate-auction-question.mts

- **Status**: 🚧 **Planned** (Phase 6)
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/generate-auction-question`
- **Method**: POST
- **Purpose**: Generate AUCT (Auction) segment questions with high-value, multi-answer scenarios
- **Request Body**: `{ leagues: string[], criteria: string, season?: string }`
- **Response**: `{ question: QuestionObject, metadata: { api_source, api_params, total_answers_count, answers_truncated } }`
- **Key Features**:
  - Similar to WDYK but designed for 100+ answer scenarios
  - "Name all players who..." format
  - Answer limit handling essential
  - Display 100, warn about total, expand UI
  - Cache with 7-day TTL
- **API Endpoints Used**: /players/search, /clubs/{id}/players
- **Dependencies**: api/transfermarkt.ts, api/transfermarktCache.ts
- **Part Of**: Transfermarkt API Integration Project (Phase 6)

### generate-updw-question.mts

- **Status**: 🚧 **Planned** (Phase 7)
- **Runtime**: Netlify Functions (Node.js) - Runtime API v2
- **Endpoint**: `/.netlify/functions/generate-updw-question`
- **Method**: POST
- **Purpose**: Generate UPDW (Up Down) segment hard trivia questions using templates
- **Request Body**: `{ template_type: string, player_name?: string, club_name?: string }`
- **Response**: `{ question: QuestionObject, metadata: { api_source, api_params, manual_verification_required } }`
- **Key Features**:
  - Template-based generation (jersey numbers, rare achievements)
  - Manual verification workflow for edge cases
  - Uses /jersey_numbers and /achievements endpoints
  - Smaller answer sets (usually <10)
  - Cache with 30-day TTL
- **API Endpoints Used**: /players/{id}/jersey_numbers, /players/{id}/achievements
- **Dependencies**: api/transfermarkt.ts, api/transfermarktCache.ts
- **Part Of**: Transfermarkt API Integration Project (Phase 7)

---

## Function Categories Summary

1. **Video Call Management**: createDailyRoom, create-daily-token (Daily.co integration)
2. **Notifications**: send-notification (friend requests, match invites)
3. **Quiz State Management**: get-questions, update-quiz-state, record-buzz (gameplay)
4. **Scheduled Tasks**: cleanupStatus (automated maintenance)
5. **Profile Management**: get-active-profile, store-active-profile (cross-device sync)
6. **Question Generation**: generate-remontada-question, generate-bell-question, generate-wdyk-question, generate-auction-question, generate-updw-question (planned)

### Runtime Versions

- **Netlify Functions**: Runtime API v2 (modern async handler pattern)
- **Edge Functions**: Deno runtime for low-latency operations
- **Scheduled Functions**: Runtime API v1 (requires schedule config export)

### Error Handling

- All functions return JSON responses with success/error fields
- Timeout handling with abort controllers (createDailyRoom)
- Detailed error logging to Netlify function logs
- Client-friendly error messages

### Deployment

- **Configured In**: netlify.toml
- **Auto-deployment**: On git push to main/cleanup branches
- **Build Command**: `pnpm build`
- **Functions Directory**: `netlify/functions/`
- **Edge Functions Directory**: `netlify/edge-functions/`
