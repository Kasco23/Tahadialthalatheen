# Backend - Changelog

**Last Updated**: November 14, 2025

---

## November 14, 2025

## January 24, 2025

### Question Generator Functions - Planning Complete

- **Type**: Planned (Phases 4-7)
- **Purpose**: Create 5 Netlify serverless functions for semi-automatic football quiz question generation
- **Planned Functions**:
  1. **generate-remontada-question.mts** (Phase 4): REMO segment using player transfer history
  2. **generate-bell-question.mts** (Phase 5): BELL segment using statistical data
  3. **generate-wdyk-question.mts** (Phase 6): WDYK segment with multi-league filtering
  4. **generate-auction-question.mts** (Phase 6): AUCT segment with 100+ answer handling
  5. **generate-updw-question.mts** (Phase 7): UPDW segment with template-based trivia
- **Common Features**:
  - All use cache-first pattern (check Netlify Blobs → fetch from API → store)
  - All track metadata (api_source, api_params, total_answers_count, answers_truncated)
  - All handle 100+ answer scenarios (display 100, warn, expand option)
  - Runtime API v2 with modern async handlers
  - Comprehensive error handling for API failures
- **API Endpoints Used**:
  - REMO: /players/search, /players/{id}/transfers
  - BELL: /players/search, /players/{id}/stats
  - WDYK/AUCT: /clubs/search, /clubs/{id}/players, /players/search
  - UPDW: /players/{id}/jersey_numbers, /players/{id}/achievements
- **TTL Strategy by Function**:
  - REMO: 30 days (transfer history is historical)
  - BELL: 1 day (stats change seasonally)
  - WDYK/AUCT: 7 days (rosters relatively stable)
  - UPDW: 30 days (achievements/jersey numbers rarely change)
- **Impact**:
  - Hosts can generate questions in seconds
  - Access to comprehensive football data (transfers, stats, achievements)
  - Reduced manual data entry errors
  - Support for all 5 quiz segments
  - Cache layer minimizes API calls
- **Implementation Order**: Phase 4 (REMO) → Phase 5 (BELL) → Phase 6 (WDYK/AUCT) → Phase 7 (UPDW)
- **Next Action**: Implement after API wrapper (Phase 1) and caching layer (Phase 2) are complete

---

## October 22, 2025

### create-daily-token.ts - Enhanced Response

- **Change**: Function now returns both `token` and `room_url` in response
- **Reason**: Provide complete room information to frontend in single call
- **Features**:
  - Constructs room URL using `DAILY_DOMAIN` environment variable
  - Falls back to `VITE_DAILY_DOMAIN` or `thirty.daily.co` default
  - Returns: `{ token: string, room_url: string }`
  - Added comprehensive JSDoc documentation
- **Impact**: Frontend can verify/update room URL alongside token creation
- **Code Location**: Lines 1-113 in `netlify/functions/create-daily-token.ts`
- **API Change**: Response now includes `room_url` field (backwards compatible)

### Development Environment - Updated

- **Change**: Added Deno runtime requirement documentation
- **Reason**: Edge Functions require Deno for local development
- **Impact**: Developers must install Deno to run `pnpm dev` successfully
- **Solution**:
  - Updated `devcontainer.json` to auto-install Deno on container creation
  - Added PATH configuration for Deno binary
  - Documented troubleshooting steps in Backend/Overview.md
- **Related Issue**: Fixed "Could not establish a connection to the Netlify Edge Functions local development server" error
