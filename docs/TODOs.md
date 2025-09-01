# TODOs

This is a living TODO file intended for both humans and automated agents. Keep entries short and actionable.

Sections

## Pages

- ~~Landing: finish theme polish, ensure `ActiveGames` responsive sizing, remove quick-preview (done)~~
  - Rationale: Quick preview removed and ActiveGames sizing adjusted in `Landing.tsx` — 2025-08-21

- Game Lobby: accessibility pass, keyboard navigation

## Flows

- Real-time sync: improve reconnection resilience for Supabase channels

- ~~Video rooms: automatic cleanup of stale Daily rooms (Netlify function review)~~
  - Rationale: Implemented comprehensive Daily.co room management with cleanup_expired_rooms() function and rooms table in Supabase migration — 2025-01-23

## Database & Backend

- ~~Review existing Supabase schema and improve security policies~~
  - Rationale: Completed comprehensive Supabase security overhaul with authentication-based RLS policies replacing insecure "Anyone can..." policies — 2025-01-23

- ~~Create and implement new table "Rooms" for Daily.co room information~~
  - Rationale: Implemented rooms table with proper foreign keys, constraints, and integration with games table — 2025-01-23

- ~~Implement game event logging improvements~~
  - Rationale: Enhanced game_events table with player attribution, sequence numbering, and metadata fields — 2025-01-23

- ~~Upgrade frontend and backend to use new Supabase schema (games → sessions)~~
  - Rationale: Completed full schema migration including TypeScript types, database layer, state management, routes, and all references updated from games/gameId to sessions/sessionId — 2025-09-01

## Monitoring & Observability

- ~~Set up comprehensive Sentry monitoring for frontend and backend~~
  - Rationale: Implemented complete Sentry monitoring with error tracking, performance monitoring, session replay, user feedback, and release tracking for both frontend and all Netlify functions — 2024-12-28

- ~~Optimize player session tracking~~
  - Rationale: Added last_seen, connection_status, session_id to players table with utility functions for real-time tracking — 2025-01-23

- ~~Add game state management enhancements~~
  - Rationale: Added settings jsonb and last_activity timestamp to games table for better state management — 2025-01-23

## Features

- Theme system: persist custom colors and apply them globally (write CSS vars from `customColorsAtom`)

## Monitoring

- Evaluate alternative error monitoring after removing the previous Netlify plugin — 2025-08-21

- Color picker: add background/surface pickers and live preview
  - Note: partial implementation added for primary/secondary/accent pickers; background/surface and persistence remain TODO — 2025-08-21

- Onboarding: add a quick guided tour for new hosts

## Documentation Consolidation

- ✅ Consolidated minimal documentation files into DEVELOPER_GUIDE.md, REFERENCE.md, and enhanced SETUP.md

- ✅ Removed redundant documentation files: DocsGuide.md, Guide.md, reactconfig.md, VSCode.md, CHROME_SETUP.md, DAILY_CO_INTEGRATION.md, QUIZ_STRUCTURE.md, Theme.md, ThemeConfigurator.md, Environment-variables-Netlify.md

## Tests

- Add Vitest unit tests for `themeAtoms` (recommended: test persistence and CSS var propagation)

- E2E smoke test for creating a game and joining

## Docs

- DocsGuide.md: keep updated with new docs (this file created 2025-08-21)

- Add usage examples for `pnpm` commands in `SETUP.md`

## Infra / Deployment

- Pin Netlify build image and document env var differences between preview and production

Notes

- When an automated agent (Copilot) completes a task that changes behavior, it must update this file in the same commit to reflect status changes.

- Strike-out convention: when an item is finished or superseded, wrap the line in ~~strikethrough~~ and add a one-line rationale and ISO timestamp.

Change log

- 2025-08-21: Initial TODOs.md created — Copilot
- 2025-01-23: Completed all Supabase database improvements and marked related TODOs as finished — Copilot
