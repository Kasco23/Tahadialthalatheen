# Libraries - Changelog

**Tracking Start**: October 21, 2025

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
