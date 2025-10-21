# Features - Changelog

**Last Updated**: October 21, 2025

## October 21, 2025

### Lobby & Ready System - Robust Token Implementation

- **Change**: Enhanced video calling feature with robust token system
- **Reason**: Daily.co API requires usernames without spaces, but users have full names with spaces
- **Implementation**:
  - Separated `tokenUsername` (from Profiles.username) for Daily.co API calls
  - Separated `participantName` (from Profiles.name) for UI display
  - Implemented fallback chain: `username || name || "player"`
  - Enhanced token cache clearing to handle username changes
- **Impact**: 
  - Video calls now work correctly with full names like "Tareq Salah"
  - Tokens created with safe usernames like "tareq"
  - UI displays full names for better user experience
  - Refresh button preserves all participant data (no more "Unknown" names)
- **Components Affected**: Lobby.tsx, VideoRoom.tsx
- **Libraries Updated**: realtimeHooks.ts, dailyTokenManager.ts

### Video Calling (Daily.co) - Cache Enhancement

- **Change**: Enhanced `dailyTokenManager` cache clearing mechanism
- **Reason**: Daily.co room URLs include domain prefix ("thirty/915BDV") but cache keys didn't match
- **Implementation**: Added `endsWith()` pattern matching for partial room names
- **Impact**: Token cache now clears correctly regardless of domain prefix

---

_Documentation for this category will be populated as relevant changes occur._

This is a placeholder file. Content will be added when:

- New features/files are created
- Existing files are modified
- Deprecations occur
