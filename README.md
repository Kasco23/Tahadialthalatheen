# Tahadialthalatheen — Football Quiz

A lightweight live head-to-head football quiz for two players. A host (controller) creates a session and two players join on their phones to play five different rounds and compare scores.

**New in v2.0:** User profiles with usernames, friends system, in-app notifications, match recording, statistics tracking, and global leaderboards! See [FEATURES.md](./FEATURES.md) for complete documentation.

## Quick overview

- Players: Home and Away (formerly Player A and Player B)
- Host: creates session, configures rounds, starts the quiz
- Session: identified by Session ID + Host password
- Phases: Setup → Lobby → In‑Progress → Tie‑Breaker → Results → Review
- **New:** User profiles, friends, notifications, leaderboards

## Segments (rounds)

- WDYK (What Do You Know) — open-ended; strikes; 1–2 points per question
- AUCT (Auction) — bidding for number of answers; variable points and penalties
- BELL — buzzer first-to-answer; 1 point per correct answer
- UPDW (Upside-Down) — harder buzzer round; powerup can lock question and change points (points can be lost)
- REMO (Remontada) — career-path guessing; 1 or 2 points depending on timing

Each player can use each segment's powerup button once (where applicable).

## Pages

- **Homepage** — create or join session, view leaderboard
- **Signup/Login** — create account with unique username
- **Profile** — view/edit profile, manage friends, view statistics
- **Inbox** — in-app notifications for friend requests and matches
- **Leaderboard** — top players and epic matches
- **Join** — choose Host or Player; players pick name, flag, logo
- **Lobby** — waiting room with participant list and session info
- **Setup (Configuration)** — host sets question counts and creates video room
- **Quiz** — live play interface for host and players
- **Results & Review** — score breakdown and summary

## Tech stack

TypeScript, React (Vite), Tailwind, Supabase, Daily.co (video), Socket.io. Tests with Jest and Playwright. Uses pnpm.

## Quick start

**Requirements**:

- Node.js >= 20.19.6 (LTS "Iron")
- Deno >= 2.5 (for Edge Functions)
- pnpm

**Install and run**:

```bash
# Install dependencies
pnpm install

# Install Deno (required for Edge Functions)
curl -fsSL https://deno.land/install.sh | sh

# Start dev server
pnpm dev
```

**Troubleshooting**: If you see "Could not establish a connection to the Netlify Edge Functions local development server", install Deno using the command above. See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for more details.

Common scripts:

- pnpm dev — start dev server
- pnpm build — build production
- pnpm test — run unit tests
- pnpm test:e2e — run Playwright E2E tests
- pnpm lint — lint code
- pnpm format — format code

## Environment variables (example)

```bash
# Frontend (required)
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DAILY_API_KEY=your_daily_api_key
VITE_DAILY_DOMAIN=your_daily_domain

# Backend / Netlify Functions (required for production)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## New Features (v2.0)

For complete documentation of new features, see [FEATURES.md](./FEATURES.md):

- **User Profiles** - Unique usernames, avatars, flags, teams
- **Friends System** - Send/accept friend requests, manage friendships
- **Notifications** - Real-time in-app notifications at `/inbox`
- **Match Recording** - Automatic game result tracking
- **Statistics** - Player stats, segment performance, head-to-head
- **Leaderboards** - Top players by win rate, epic matches by points
- **Home/Away Terminology** - Updated player roles throughout app

### Database Migrations

Run migrations to set up new features:

```bash
# Apply all migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --local > src/lib/types/supabase.ts
```

## Data schema (updated)

### Core Tables

- **Profiles** — user accounts with unique username
- **Sessions** — game sessions
- **Participants** — players in sessions
- **SegmentConfig** — segment question counts
- **Scores** — segment scores
- **Strikes** — WDYK strikes
- **DailyRooms** — video call rooms

### New Tables (v2.0)

- **Friends** — friendship relationships (requester, addressee, status)
- **Notifications** — in-app notification system
- **Matches** — completed game records with home/away players
- **PlayerSegmentStats** — detailed segment-level performance stats

### Views

- **UserInbox** — notifications with sender profile info
- **leaderboard_players** — top players by win rate
- **leaderboard_matches** — top matches by total points

# Trigger CI
