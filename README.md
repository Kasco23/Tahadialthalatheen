# Tahadialthalatheen — Football Quiz

A lightweight live head-to-head football quiz for two players. A host (controller) creates a session and two players join on their phones to play five different rounds and compare scores.

## Quick overview

- Players: Player A and Player B
- Host: creates session, configures rounds, starts the quiz
- Session: identified by Session ID + Host password
- Phases: Setup → Lobby → In‑Progress → Tie‑Breaker → Results → Review

## Segments (rounds)

- WDYK (What Do You Know) — open-ended; strikes; 1–2 points per question
- AUCT (Auction) — bidding for number of answers; variable points and penalties
- BELL — buzzer first-to-answer; 1 point per correct answer
- UPDW (Upside-Down) — harder buzzer round; powerup can lock question and change points (points can be lost)
- REMO (Remontada) — career-path guessing; 1 or 2 points depending on timing

Each player can use each segment's powerup button once (where applicable).

## Pages

- Homepage — create or join session
- Join — choose Host or Player; players pick name, flag, logo
- Lobby — waiting room with participant list and session info
- Setup (Configuration) — host sets question counts and creates video room
- Quiz — live play interface for host and players
- Results & Review — score breakdown and summary

## Tech stack

TypeScript, React (Vite), Tailwind, Supabase, Daily.co (video), Socket.io. Tests with Jest and Playwright. Uses pnpm.

## Quick start

Requirements: Node.js >= 22, pnpm

Install and run:
```bash
pnpm install
pnpm dev
```

Common scripts:
- pnpm dev — start dev server
- pnpm build — build production
- pnpm test — run unit tests
- pnpm test:e2e — run Playwright E2E tests
- pnpm lint — lint code
- pnpm format — format code

## Environment variables (example)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DAILY_API_KEY=
```

## Data suggestions (simple)

- sessions: id, host_name, host_password, phase
- participants: session_id, name, role, flag, logo, connected
- rounds: session_id, segment_code, question_count, powerup_used



