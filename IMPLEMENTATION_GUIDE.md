# Tahadialthalatheen - Implementation Guide
**Last Updated:** October 17, 2025

## Table of Contents
1. [Project Overview](#project-overview)
2. [Recent Fixes](#recent-fixes)
3. [Architecture](#architecture)
4. [Development Workflow](#development-workflow)
5. [Known Issues & Solutions](#known-issues--solutions)

---

## Project Overview

Tahadialthalatheen is a React TypeScript football quiz application built with:
- **Frontend:** React 18 + TypeScript + Vite
- **Database:** Supabase (PostgreSQL + Realtime + Storage)
- **Video:** Daily.co for live video calls
- **Deployment:** Netlify (Static + Serverless Functions)
- **Styling:** Tailwind CSS + DaisyUI

### Quick Start
```bash
# Install dependencies (takes ~2 seconds)
pnpm install --frozen-lockfile

# Development server (starts in ~450ms)
pnpm dev

# Build (takes ~4 seconds)
pnpm build

# Run tests
pnpm test
```

---

## Recent Fixes (October 17, 2025)

### Issue #1: Daily Room Creation 404 Error
**Problem:** Netlify functions using singular table names (`Session`, `Participant`) instead of plural.

**Fixed Files:**
- `netlify/functions/createDailyRoom.ts` - Line 67: `Session` → `Sessions`
- `netlify/functions/cleanupStatus.ts` - Lines 53, 84: `Participant` → `Participants`
- `netlify/functions/mark-player-ready.ts` - Line 75: `Participant` → `Participants`
- `netlify/functions/check-ready-status.ts` - Line 75: `Participant` → `Participants`

### Issue #2: Profile Navigation Broken
**Problem:** Routes `/select-flag` and `/select-team` were removed, causing 404 errors.

**Solution:**
- Restored `FlagSelection.tsx` and `TeamSelection.tsx` to `src/pages/`
- Added routes back to `src/App.tsx`
- Profile buttons now work correctly

### Issue #3: Quick Join Requires Manual Entry
**Problem:** Quick Join navigated to join page instead of auto-joining lobby.

**Solution:**
- Updated `src/components/ActiveGames.tsx` to:
  1. Fetch user profile from Supabase
  2. Call `joinAsPlayerWithCode` with profile data
  3. Navigate directly to `/lobby/{sessionCode}/{seat}`
- Modified `src/lib/mutations.ts` to accept optional `profile_id` parameter

### Issue #4: Lobby Missing Profile Data
**Problem:** Flag badges and team logos not displaying next to player names.

**Solution:**
- Updated Lobby query to JOIN with Profiles table:
  ```typescript
  .select(`
    *,
    Profiles!profile_id (
      flag,
      team
    )
  `)
  ```
- Display logic prioritizes profile data with fallback to participant data

---

## Architecture

### Database Schema (Key Tables)

#### Sessions
- `session_id` (PK, uuid)
- `session_code` (text, unique 6-char code)
- `phase` (text: Setup | Lobby | In-Progress | Completed)
- `game_state` (jsonb)
- `created_at`, `ended_at`

#### Participants
- `participant_id` (PK, uuid)
- `session_id` (FK → Sessions)
- `profile_id` (FK → Profiles, nullable)
- `name`, `role` (Host | Player1 | Player2)
- `flag`, `team_logo_url` (legacy fields)
- `lobby_presence` (NotJoined | Joined | Disconnected)
- `video_presence` (boolean)
- `isReady` (boolean)

#### Profiles
- `id` (PK, uuid, FK to auth.users)
- `name`, `email`
- `flag` (country flag code)
- `team` (favorite team, may be logo URL)
- `avatar_url`

#### Key Foreign Keys
- `Participants.session_id` → `Sessions.session_id`
- `Participants.profile_id` → `Profiles.id`
- `Scores.participant_id` → `Participants.participant_id`

### Page Flow

```
Homepage → Create/Join Session
  ├─ Create → GameSetup → Lobby → Quiz → Results
  └─ Join → Lobby → Quiz → Results

Profile → Flag/Team Selection → Profile
ActiveGames → Quick Join → Lobby
```

### Core Components

**Pages:** (`src/pages/`)
- `Homepage.tsx` - Entry point
- `JoinSimplified.tsx` - Join session with role selection
- `GameSetup.tsx` - Host configures quiz segments
- `Lobby.tsx` - Pre-game waiting room with video
- `Quiz.tsx` - Live gameplay
- `Results.tsx` - Score review
- `Profile.tsx` - User settings
- `FlagSelection.tsx`, `TeamSelection.tsx` - User preferences

**Components:** (`src/components/`)
- `VideoRoom.tsx` - Daily.co video integration
- `ActiveGames.tsx` - Live sessions list with Quick Join
- `ParticipantTile.tsx` - Player status display
- `Flag.tsx`, `LobbyLogo.tsx` - Visual elements

**Libraries:** (`src/lib/`)
- `mutations.ts` - All database operations
- `sessionHooks.ts` - Session state management
- `presence.ts` - Real-time participant status
- `supabaseClient.ts` - Database connection
- `types/` - TypeScript definitions

---

## Development Workflow

### Environment Variables
```bash
# Frontend (exposed to browser)
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DAILY_DOMAIN=your_daily_domain

# Backend (Netlify Functions)
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DAILY_API_KEY=your_daily_api_key
```

### Testing Changes
```bash
# Always run before committing
pnpm lint && pnpm format && pnpm build && pnpm test
```

### Manual Validation Flows
1. **Session Creation:** Homepage → Create → Verify code generation
2. **Join Flow:** Join page → Select role → Name/flag/team → Enter lobby
3. **Quick Join:** Homepage → Active Games → Quick Join → Auto-join lobby
4. **Lobby State:** Check participant list, presence, host controls
5. **Profile Updates:** Profile → Change flag/team → Verify in next game

---

## Known Issues & Solutions

### Issue: Build Errors After Edits
**Symptoms:** TypeScript errors, missing imports

**Solution:**
1. Run `pnpm build` to see exact error
2. Check import paths are correct
3. Verify types match expected interfaces
4. Clear build cache: `rm -rf dist/ tsconfig.tsbuildinfo`

### Issue: Supabase Connection Errors
**Symptoms:** "Failed to fetch sessions", "Invalid API key"

**Solution:**
1. Check `.env` has correct `VITE_SUPABASE_DATABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Verify Supabase project is not paused
3. Check RLS policies allow anonymous reads for Sessions/Participants

### Issue: Daily.co Video Not Working
**Symptoms:** "Room not found", blank video tiles

**Solution:**
1. Verify `DAILY_API_KEY` in Netlify environment
2. Check `createDailyRoom` function logs in Netlify dashboard
3. Ensure Daily.co domain is active
4. Token expiry: tokens last 24h, recreate session if expired

### Issue: Team Logos Not Loading
**Symptoms:** Missing team logos in lobby

**Current Status:** Profiles.team field needs conversion to full Storage URL

**Implementation Needed:**
- Create helper: `teamNameToLogoUrl("Real Madrid")` → `/logos/La-Liga/real-madrid.svg`
- Storage bucket: `logos` with league folder structure
- Existing edge function `list-logos` can provide mapping

---

## Best Practices

### Database Operations
✅ **DO:**
- Use plural table names: `Sessions`, `Participants`, `Profiles`
- Include `profile_id` when creating participants for authenticated users
- Use JOINs to fetch related data in one query
- Handle null/undefined with fallbacks: `?? "default"`

❌ **DON'T:**
- Use singular table names in queries
- Duplicate profile data in participants table
- Make multiple queries when JOIN works
- Assume foreign key relationships exist without checking schema

### Component Design
✅ **DO:**
- Lazy load pages for code splitting
- Use React.memo for expensive components
- Handle loading/error states
- Provide fallback UI for missing data

❌ **DON'T:**
- Import all pages eagerly
- Re-render entire component trees unnecessarily
- Leave unhandled promise rejections
- Assume data exists without null checks

### State Management
✅ **DO:**
- Use Jotai atoms for global state (session, Daily room)
- Use React hooks for component-local state
- Subscribe to Supabase realtime for live updates
- Clean up subscriptions in useEffect return

❌ **DON'T:**
- Prop drill through many levels
- Store derived state (compute from source)
- Forget to unsubscribe from realtime channels
- Mutate state directly (always create new objects)

---

## File Organization

```
src/
├── atoms/           - Jotai global state atoms
├── components/      - Reusable UI components
├── contexts/        - React contexts (Auth, Daily)
├── hooks/           - Custom React hooks
├── lib/
│   ├── mutations.ts     - Database operations
│   ├── sessionHooks.ts  - Session state hooks
│   ├── presence.ts      - Realtime presence
│   └── types/           - TypeScript definitions
├── pages/           - Route components (lazy loaded)
└── main.tsx         - App entry point

netlify/
├── functions/       - Serverless functions (Node.js)
└── edge-functions/  - Edge functions (Deno)

supabase/
└── migrations/      - Database schema migrations
```

---

## Deployment

### Netlify Configuration (`netlify.toml`)
- Build command: `pnpm build`
- Publish directory: `dist`
- Node version: 22
- Functions directory: `netlify/functions`
- Edge functions directory: `netlify/edge-functions`

### Environment Variables
Set in Netlify dashboard:
- `SUPABASE_SERVICE_ROLE_KEY`
- `DAILY_API_KEY`

All `VITE_*` variables are automatically included from `.env` during build.

---

## Troubleshooting

### Clear All Caches
```bash
rm -rf node_modules/ dist/ .netlify/ tsconfig.tsbuildinfo
pnpm install
pnpm build
```

### Debug Netlify Functions
```bash
netlify dev  # Run local dev server with functions
netlify functions:log createDailyRoom  # View function logs
```

### Check Supabase Logs
1. Open Supabase dashboard
2. Navigate to Logs → API / Database
3. Filter by timestamp of issue
4. Look for 404, 401, or 500 errors

---

## Next Steps (TODO)

1. **Team Logo Storage Helper**
   - Implement `teamNameToLogoUrl()` function
   - Handle kebab-case conversion
   - Map team names to leagues

2. **UI Enhancements**
   - Integrate ReactBits components for badges, avatars, cards
   - Improve lobby participant cards visual design
   - Add animations for state transitions

3. **Profile Migration**
   - Populate `profile_id` for existing participants
   - Update JoinSimplified.tsx to set profile_id

4. **Testing**
   - Add E2E tests for critical user flows
   - Unit tests for mutations and hooks
   - Integration tests for realtime features

---

**For detailed change history, see:** `CHANGELOG.md`  
**For recent fixes, see:** `FIXES_SUMMARY_OCT_17_2025_CONTINUED.md`
