# Pages - Changelog

**Category**: User-facing route components  
**Tracking Start**: October 17, 2025

---

## November 14, 2025

### QuestionBuilder.tsx - Created

- **Type**: New Page
- **Purpose**: Structured data explorer for finding football data to create quiz questions
- **Route**: `/question-builder`
- **Reason**: Help users research and discover data for question creation without dealing with raw JSON
- **Features**:
  - Three-category system: Competitions, Clubs, Players
  - Smart filtering with sensible defaults (Season: 2025)
  - Competition search with Top 5/Top 10 leagues filtering
  - Club search with country filtering
  - Player search with position and nationality filtering
  - Clean table displays with formatted data
  - Currency formatting for market values
  - Empty states and result counts
  - Top 5 leagues: Premier League, La Liga, Serie A, Bundesliga, Ligue 1 (based on UEFA ranking)
  - Top 10 leagues: Top 5 + Portugal, Netherlands, Belgium, Russia, Turkey
- **Backend**: Uses transfermarkt-proxy.mts for API calls
- **Dependencies**: React Router, Netlify Functions
- **Impact**: Users can easily search and filter football data to create informed quiz questions
- **Size**: ~15KB

### TransfermarktAPI.tsx - Created

- **Type**: New Page
- **Purpose**: Production-like API testing interface for Transfermarkt integration
- **Route**: `/transfermarkt-api`
- **Reason**: Enable comprehensive testing of all Transfermarkt API endpoints with real responses
- **Features**:
  - Three-tabbed interface for organized endpoint testing (Competitions, Clubs, Players)
  - Real-time API calls via Netlify Functions proxy (CORS-free)
  - Live response display with status codes and formatted JSON
  - Competition endpoints: search competitions, get competition clubs
  - Club endpoints: search clubs, get club profile, get club players
  - Player endpoints: search players, profile, market value, transfers, jersey numbers, stats, injuries, achievements
  - Empty input fields (no mock data or placeholders)
  - Loading states and error handling
  - Responsive two-column layout (inputs + response panel)
- **Backend**: Created `transfermarkt-proxy.mts` Netlify function to proxy requests
- **Dependencies**: React Router, Netlify Functions
- **Impact**: Developers can now test all Transfermarkt API endpoints without CORS issues
- **Size**: ~12KB

### transfermarkt-proxy.mts - Created

- **Type**: New Netlify Function
- **Purpose**: Proxy Transfermarkt API requests to avoid CORS issues
- **Endpoint**: `/.netlify/functions/transfermarkt-proxy?endpoint={path}`
- **Reason**: Browser direct calls to Transfermarkt API blocked by CORS policy
- **Features**:
  - Proxies all requests to `https://transfermarkt-api-jftx.onrender.com`
  - Adds proper CORS headers for browser access
  - Error handling with detailed error messages
  - Supports all HTTP methods
- **Impact**: Frontend can make API calls without CORS restrictions

---

## January 15, 2025

### GameSetup.tsx - Question Management Integration

- **Change**: Added QuestionManager modal integration
- **Reason**: Enable hosts to create and manage quiz questions before starting game
- **Features**:
  - New "📝 Manage Questions" button between segment config and Start Quiz
  - QuestionManager modal opens on click
  - Modal allows viewing, adding, filtering, and deleting questions
  - Positioned above Start Quiz button for logical workflow
- **Implementation**:
  - Line 25: Import QuestionManager component
  - Line 68: Add isQuestionManagerOpen state
  - Lines 640-648: New "Manage Questions" button in form
  - Lines 711-717: QuestionManager modal rendering at bottom
- **Impact**: Hosts can now manage question bank directly from setup page without external tools
- **Code Location**: Lines integrated throughout component
- **Size**: ~21KB (increased from 20.8KB)

---

## October 22, 2025

### Lobby.tsx - Token Generation Refactoring

- **Change**: Updated to use simplified `createDailyToken()` with enhanced response handling
- **Reason**: Align with refactored token generation (removed dailyTokenManager)
- **Features**:
  - Now handles both `token` and `room_url` from Netlify function response
  - Improved error handling with user-facing error messages
  - Removed `clearRoomTokens()` calls (no longer needed)
  - Better logging for token creation flow
- **Impact**: Cleaner code, better error visibility, more reliable token generation
- **Code Location**: Lines 370-410 in setupDailyRoom useEffect
- **Size**: ~20.78KB (slight decrease due to removed dependencies)

## October 22, 2025

### App.tsx - Enhanced with Phase 2.4 Device ID Tracking

- **Change**: Added device ID initialization on app startup
- **Implementation**:
  - Lines 2-7: Import useEffect, getDeviceId, Logger
  - Lines 25-31: New useEffect calls getDeviceId() and logs device ID
- **Purpose**: Enable cross-device session continuity by generating/retrieving stable device ID
- **Impact**: All participant blobs now include device_id for tracking across devices
- **Dependencies**: Uses crypto.randomUUID() via blobsManager.ts

### Lobby.tsx - Enhanced with Phases 2.2 & 2.3 Blobs Integration

- **Change**: Comprehensive participant Blobs and lobby snapshots
- **Features Added (Phase 2.2 - Participant Blobs)**:
  - Lines 42-49: Import saveParticipantBlob, getParticipantBlob, getDeviceId, saveLobbySnapshot, getLobbySnapshot
  - Lines 486-537: Save participant blobs for all players on initial load with device_id
  - Lines 597-633: Load participant preferences from Blobs on mount (getParticipantBlob)
  - Lines 634-780: Enhanced heartbeat with participant blob updates every 30 seconds
  - ParticipantBlobData includes: profile info, session relationship, presence status, device tracking, preferences
- **Features Added (Phase 2.3 - Lobby Snapshots)**:
  - Lines 212-215: Added recoveredFromSnapshot state for UI indicator
  - Lines 237-270: Snapshot recovery logic on mount with 2-minute age validation
  - Lines 782-828: Periodic snapshot saving every 30 seconds with full lobby state
  - Lines 1053-1062: UI indicator for snapshot recovery (blue badge, 5s auto-dismiss)
  - LobbySnapshotData captures: participants array, phase, daily_room_url, participant_count
- **Performance Impact**:
  - Participant data cached locally, reducing database queries
  - Lobby recovers from crashes using snapshots (< 2 minutes old)
  - Device ID enables cross-device participant tracking
- **Testing**: Build validated successfully (6.04s), TypeScript compilation clean
- **Dependencies**: Uses blobsManager.ts, Browser Cache API, crypto.randomUUID()

## January 20, 2025

### GameSetup.tsx - Enhanced with Phase 2.1 Blobs Integration

- **Change**: Comprehensive Session Blobs integration using blobsManager.ts library
- **Features Added**:
  - `saveSessionBlob()` call in `handleCreateDailyRoom()` with full SessionBlobData schema
  - Stores: host_profile_id, daily_room_url, daily_room_name, daily_room_created_at
  - Tracks: phase, game_state, segments_configured, active_participant_ids, participant_count
  - Metadata: segments_config, created_by, creation_context
  - `getSessionBlob()` on mount for resilience and state restoration
  - Automatic cache invalidation and multi-layer caching (Browser Cache API + memory)
- **Implementation Details**:
  - Lines 25-29: Import saveSessionBlob, getSessionBlob, SessionBlobData from blobsManager
  - Lines 175-213: New useEffect for session loading from Blobs on mount
  - Lines 285-338: Enhanced handleCreateDailyRoom with comprehensive Blobs persistence
  - Maintains backward compatibility with updateSessionState() for legacy support
- **Benefits**:
  - Page refresh recovery: UI state restored from Blobs instantly
  - Cross-device session continuity: Same session accessible from multiple devices
  - Reduced Supabase queries: Cached data served from Blobs/Browser Cache
  - 5-layer fallback: Cache → Blobs → localStorage → Supabase → Error
- **Testing**: Build validated successfully (6.29s), TypeScript compilation clean
- **Dependencies**: Uses @netlify/blobs (strong consistency), Browser Cache API (5min TTL)
- **Impact**: Foundation for Phase 2.2-3.2 implementation, improved user experience for hosts

## October 21, 2025

### Profile.tsx - Updated

- **Change**: Separated username (token) from name (display) for Daily.co integration
- **Reason**: Names with spaces (e.g., "Tareq Salah") cause Daily.co token issues
- **Features**:
  - Added `tokenUsername` state variable for safe token creation
  - Uses `Profiles.username` (no spaces) for Daily.co tokens
  - Uses `Profiles.name` (full name) for UI display
  - Implemented fallback chain: `username || name || "player"`
  - Enhanced cache clearing when username changes
  - Fixed refresh button to include complete Profiles data
- **Database Changes**:
  - Added `username` to all Profiles JOIN queries
  - Prevents "Unknown" name and missing flag/logo on refresh
- **TypeScript**: Added `username` field to `ParticipantRow` type
- **Logging**: Enhanced logging to show both token username and display name
- **Impact**: Robust token system handles all edge cases with names containing spaces
- **Size**: ~20KB (no change)

### Documentation Created

- ✅ Created comprehensive Pages documentation structure
- ✅ Documented all 13 active pages with detailed specs
- ✅ Established changelog tracking system

---

## October 17, 2025

### Major Updates

#### Profile.tsx - Enhanced with Tabs

- **Change**: Added three-tab interface (Profile, Statistics, Friends)
- **Reason**: Better organization of profile features
- **Components**: Integrated StatisticsTab and FriendsTab components
- **Impact**: Improved UX, better information hierarchy

#### Inbox.tsx - Created

- **Change**: New notification center page
- **Route**: `/inbox`
- **Features**: Real-time notifications, mark read/unread, filters
- **Dependencies**: Supabase subscriptions, notifications library
- **Impact**: Users can now manage in-app notifications

#### Leaderboard.tsx - Created

- **Change**: New rankings and statistics page
- **Route**: `/leaderboard`
- **Features**: Two tabs (Top Players, Epic Matches), medals, rankings
- **Dependencies**: Supabase views (top_players, epic_matches)
- **Impact**: Competitive element, user engagement

#### Homepage.tsx - Navigation Enhancements

- **Change**: Added NotificationBell component to header
- **Change**: Enhanced profile menu with Inbox and Leaderboard links
- **Features**: Real-time unread count, one-click navigation
- **Impact**: Better discoverability of new features

#### FlagSelection.tsx & TeamSelection.tsx - Restored

- **Change**: Moved back from deprecated/ to active pages/
- **Reason**: Profile.tsx needs these for "Change Flag" and "Change Team" buttons
- **Routes**: `/select-flag` and `/select-team` re-enabled
- **Impact**: User customization flow restored

### Deprecations

#### Join.tsx (Original)

- **Change**: Deprecated and moved to `/src/deprecated/`
- **Reason**: Replaced by JoinSimplified.tsx
- **Route**: Removed from App.tsx routing
- **Impact**: Cleaner codebase, better UX

---

## Pre-October 2025

### Initial Development

All core pages created during initial application development:

- Homepage.tsx
- Signup.tsx / Login.tsx
- JoinSimplified.tsx
- GameSetup.tsx
- Lobby.tsx
- Quiz.tsx
- Results.tsx
- Profile.tsx
- FlagSelection.tsx
- TeamSelection.tsx

---

## Upcoming Changes

### Planned

- None currently planned

### Under Consideration

- Potential Results.tsx enhancement with detailed question review
- Quiz.tsx improvements for better mobile experience
- Lobby.tsx enhancements for better video layout

---

## Change Log Format

Each entry should include:

- **Date**: When the change occurred
- **Page(s)**: Which file(s) were modified
- **Type**: Created | Updated | Deprecated | Removed
- **Change**: What was changed
- **Reason**: Why the change was made
- **Impact**: Effect on users/app
- **Dependencies**: New libraries or components added

---

## See Also

- **CurrentState.md** - Current page specifications
- **Deprecated.md** - Removed pages
- **Overview.md** - Category introduction
