# Features - Changelog

**Last Updated**: January 24, 2025

## January 24, 2025

### Semi-Automatic Question Generation (Transfermarkt API) - Planning Complete

- **Type**: Created (Planning Phase)
- **Purpose**: Enable semi-automatic football quiz question generation for all 5 segments using Transfermarkt Open API
- **Reason**: Manual question creation is time-consuming and limits quiz variety. API integration allows hosts to generate diverse, data-driven questions on-demand.
- **Features**:
  - **API Wrapper**: TransfermarktClient class with 10+ methods (searchPlayer, getPlayerProfile, getPlayerTransfers, getPlayerStats, etc.)
  - **Caching Layer**: Netlify Blobs with TTL strategy (1 hour to 30 days) for >80% cache hit rate
  - **Generator Functions**: 5 Netlify serverless functions (one per segment: REMO, BELL, WDYK, AUCT, UPDW)
  - **Database Schema**: 3 new tables (generated_questions, question_bank, player_question_history)
  - **Frontend UI**: /tools/question-generator page with 7 sub-components and answer limit handling (100+ scenarios)
  - **GameSetup Integration**: Modal/drawer for question generation directly in game setup flow
  - **Profile Features**: "My Questions" page tracking created/answered questions with performance stats
- **Implementation Plan**: 14 phases documented in `/docs/TRANSFERMARKT_INTEGRATION_ROADMAP.md`
  - Phase 1-2: Foundation (API wrapper + caching) - 10 tasks
  - Phase 3: Database setup (3 new tables) - 6 tasks
  - Phase 4-7: Segment generators (REMO, BELL, WDYK/AUCT, UPDW) - 20 tasks
  - Phase 8: Frontend UI (/tools/question-generator) - 10 tasks
  - Phase 9: GameSetup integration - 5 tasks
  - Phase 10: Profile features - 5 tasks
  - Phase 11-14: Testing, refinement, documentation - 14 tasks
- **Dependencies**:
  - **External**: Transfermarkt API (transfermarkt-api.fly.dev) - no authentication required
  - **Internal**: Netlify Blobs, Supabase (Questions table updates), GameSetup.tsx, Profile pages
- **Answer Limit Handling**: Display 100 answers by default with warning and expand option for 100+ scenarios
- **Metadata Tracking**: All generated questions track api_source, api_params, total_answers_count, answers_truncated
- **Impact**:
  - Hosts can generate questions in seconds instead of minutes
  - Reduces manual data entry errors
  - Enables access to comprehensive football statistics (transfers, achievements, jersey numbers, stats)
  - Supports all 5 quiz segments with appropriate templates
  - Cache layer minimizes API calls and improves performance
- **Estimated Timeline**: 14 sessions (~20-30 hours total work)
- **Current Status**: Planning complete, Phase 1 (API wrapper) ready to start
- **Next Action**: Create `src/lib/api/transfermarkt.ts` with TransfermarktClient class

---

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
