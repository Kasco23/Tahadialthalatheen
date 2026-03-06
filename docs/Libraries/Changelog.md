# Libraries - Changelog

**Tracking Start**: October 21, 2025

## March 6, 2026

### mutations.ts - Updated (Verify Cleanup)

- **Change**: Added explicit caught-error cause preservation when rethrowing failures
- **Reason**: Resolve `preserve-caught-error` lint errors from `pnpm verify`
- **Details**:
  - Added shared `createErrorWithCause()` helper
  - Updated rethrows in session creation, Daily room creation, and Daily token creation paths
  - Refined Daily room HTTP error parsing flow to avoid nested throw/catch loss of context
  - Replaced `any` in `getSessionQuestions()` flattening logic with explicit typed payload handling
- **Impact**: Lint passes with improved error traceability and safer typing

### dailyTokenManager.ts - Updated (Verify Cleanup)

- **Change**: Preserved original caught error cause for token retry exhaustion
- **Reason**: Resolve `preserve-caught-error` lint error
- **Details**:
  - Added `createErrorWithCause()` helper
  - Retry-final error now retains original failure context via `error.cause`
- **Impact**: Better observability when token creation retries are exhausted

### AuthContext.tsx - Updated (Lint Rule Compliance)

- **Change**: Added targeted lint suppression for hook exports in context module
- **Reason**: Resolve `react-refresh/only-export-components` warnings while preserving existing API (`useAuth`, `useProfile`)
- **Impact**: Clean lint output without breaking import paths across pages/components

## January 24, 2025

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
