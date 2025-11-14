# Backend - Changelog

**Last Updated**: November 13, 2025

---

## November 13, 2025

### generate-wdyk-final-losers.mts - Created

- **Type**: Created
- **Purpose**: Generate a WDYK question aggregating all players from the losing squads of the UEFA Champions League, Europa League, and Europa Conference League finals for a season.
- **Reason**: Implements requested "losing European Cup Final last season" quiz question using live squad data without paid APIs or external datasets.
- **Implementation**:
  - Hard‑coded 2023/24 losing finalists mapping (Borussia Dortmund, Bayer 04 Leverkusen, Fiorentina) for MVP.
  - Fetch + cache via `searchClubCached` and `getClubPlayersCached` helpers; aggregates unique player names.
  - Truncates answers at 150, tracks `totalPlayers` and `truncated` flag.
  - Persists question to `Questions` and metadata to `generated_questions_metadata` (api_source='transfermarkt', queryType='european_finals_losers').
  - Structured JSON response with finals mapping and per‑club player counts.
- **Error Handling**: 405 (method), 422 (unsupported season), 500 (internal errors); logs failures per club fetch.
- **Impact**: Enables immediate finals-based gameplay; establishes extensible pattern for multi-club aggregation.
- **Next Steps**: Add additional seasons; enrich metadata with starter/bench/sub appearance details once endpoint available.

---

## January 24, 2025

### Question Generator Functions - Planning Complete

- **Type**: Planned (Phases 4-7)
- **Purpose**: Create 5 Netlify serverless functions for semi-automatic football quiz question generation
- **Reason**: Enable hosts to generate questions on-demand using Transfermarkt API data instead of manual creation
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
- **Dependencies**: api/transfermarkt.ts (API wrapper), api/transfermarktCache.ts (caching layer)
- **Impact**:
  - Hosts can generate questions in seconds
  - Access to comprehensive football data (transfers, stats, achievements)
  - Reduced manual data entry errors
  - Support for all 5 quiz segments
  - Cache layer minimizes API calls
- **Part Of**: Transfermarkt API Integration Project (14-phase implementation)
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
