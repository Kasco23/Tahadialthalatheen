# Pages - Changelog

**Category**: User-facing route components  
**Tracking Start**: October 17, 2025

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
