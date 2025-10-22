# Libraries - Changelog

**Tracking Start**: October 21, 2025

## October 22, 2025

### mutations.ts - Daily Token Refactoring

- **Change**: Replaced `dailyTokenManager` abstraction with direct Netlify function call in `createDailyToken()`
- **Reason**: Simplify video call token generation flow and remove unnecessary caching layer
- **Features**:
  - Direct call to `/.netlify/functions/create-daily-token`
  - Returns both `token` and `room_url` for convenience
  - Improved error handling with detailed logging
  - Local dev mode support with mock tokens
  - Removed dependencies on `getDailyTokenInfo()`, `clearDailyToken()`, and `clearRoomTokens()`
- **Impact**: Cleaner, more maintainable token generation with fewer moving parts
- **Code Location**: Lines 763-825 in `mutations.ts`
- **Dependencies**: Removed `dailyTokenManager` import
- **Migration Note**: `dailyTokenManager.ts` is now deprecated but kept for reference

### useDailyToken.ts - Simplified Token Refresh

- **Change**: Removed dependency on `getDailyTokenInfo()`, calculate expiry locally
- **Reason**: Align with simplified token management approach
- **Features**:
  - Token expiry calculated as 2 hours from creation (Daily.co standard)
  - Auto-refresh logic remains unchanged
  - Cleaner implementation without external dependencies
- **Impact**: More predictable token lifecycle management
- **Code Location**: Lines 38-53 in `useDailyToken.ts`
- **Dependencies**: Removed `getDailyTokenInfo` import

## October 21, 2025

### realtimeHooks.ts - Enhanced Profiles Query

- **Change**: Added `username` column to Profiles SELECT query in `useParticipants` hook
- **Reason**: Support robust token system in Lobby.tsx
- **Impact**: Participant subscriptions now include username for safe Daily.co token creation
- **Code Location**: Line 188 in `useParticipants` hook
- **Dependencies**: None added

### dailyTokenManager.ts - Enhanced Cache Clearing

- **Change**: Enhanced `clearRoomTokens()` to handle domain-prefixed room names
- **Reason**: Daily.co rooms format as "thirty/915BDV" but were cached without domain
- **Features**:
  - Now matches partial room names using `endsWith()` pattern
  - Handles both "915BDV" and "thirty/915BDV" formats
  - Clears all cached tokens for a room regardless of domain prefix
- **Impact**: Token cache clearing now works correctly with Daily.co room URLs
- **Code Location**: Lines 93-119 in `dailyTokenManager.ts`
- **Commit**: Previously committed in earlier session

### Documentation Structure Created

- ✅ Created comprehensive Libraries documentation
- ✅ Documented 25+ active library files
- ✅ Established changelog tracking system

_Detailed changelog entries will be added as changes occur._
