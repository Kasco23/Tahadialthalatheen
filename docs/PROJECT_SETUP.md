# Project Setup Files - Tahadialthalatheen

**Last Updated**: October 21, 2025  
**Project Scope**: Private football quiz application for friends (non-commercial)

---

## Overview

Tahadialthalatheen is a React TypeScript quiz application built with Vite for live head-to-head football trivia between friends. The application uses:

- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + DaisyUI
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Video**: Daily.co integration for video calls
- **Hosting**: Netlify with serverless functions and edge functions
- **State**: Jotai for global state management
- **Package Manager**: pnpm 10.18.3+
- **Edge Runtime**: Deno (required for Netlify Edge Functions)

---

## Documentation Structure

This documentation is organized into the following categories:

### 1. Pages (`/docs/Pages/`)

All route components that users navigate to. Each page represents a distinct user flow or screen.

### 2. Components (`/docs/Components/`)

Reusable UI components used across multiple pages. Organized by feature area.

### 3. Libraries (`/docs/Libraries/`)

Core business logic, API clients, utilities, and helper functions.

### 4. Features (`/docs/Features/`)

High-level feature documentation covering complete user journeys and workflows.

### 5. Backend (`/docs/Backend/`)

Netlify serverless functions and edge functions.

### 6. Database (`/docs/Database/`)

Supabase schema, migrations, RLS policies, and database views.

### 7. State Management (`/docs/State/`)

Jotai atoms and global state structure.

---

## Quick Reference

### Key Technology Versions

- Node.js: >= 22 (v22.19.0 confirmed)
- pnpm: 10.18.3+
- React: 19.2.0
- TypeScript: 5.9.2
- Vite: 7.1.10
- Tailwind CSS: 4.1.14
- Supabase JS: 2.75.0
- Daily.co: 0.83.1

### Build Times (Reference)

- Development Server: ~450ms startup
- Production Build: ~10 seconds
- Linting: ~3 seconds
- Unit Tests: ~3 seconds
- Formatting: ~4 seconds

### Environment Variables Required

```bash
# Frontend (VITE_* prefix = exposed to browser)
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DAILY_DOMAIN=your_daily_domain

# Backend (Netlify Functions only)
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DAILY_API_KEY=your_daily_api_key
```

---

## File Organization

```
Tahadialthalatheen/
├── src/
│   ├── pages/              → Route components (lazy loaded)
│   ├── components/         → Reusable UI components
│   ├── lib/                → Business logic & utilities
│   ├── atoms/              → Jotai state atoms
│   ├── contexts/           → React contexts (Auth, Daily)
│   ├── hooks/              → Custom React hooks
│   ├── App.tsx             → Main app with routing
│   ├── main.tsx            → Entry point
│   └── index.css           → Global styles
├── netlify/
│   ├── functions/          → Serverless functions (Node.js)
│   └── edge-functions/     → Edge functions (Deno)
├── supabase/
│   └── migrations/         → Database migrations
├── docs/                   → Project documentation
├── public/                 → Static assets
└── tests/                  → Test files (E2E, unit)
```

---

## Core Workflow

### User Journey

1. **Homepage** → Create or join session
2. **Signup/Login** → Authenticate with unique username
3. **Join Flow** → Select role (Host/Player) + customize (flag/team)
4. **Lobby** → Wait for all players, view video feeds
5. **Game Setup** (Host only) → Configure quiz segments
6. **Quiz** → Live gameplay with real-time scoring
7. **Results** → View final scores and review answers

### Development Workflow

```bash
# Start development
pnpm dev

# Run tests
pnpm test

# Lint & format
pnpm lint && pnpm format

# Build for production
pnpm build

# Build with size validation
pnpm build:prod
```

---

## Category Overview

| Category   | Purpose            | File Count | Key Files                          |
| ---------- | ------------------ | ---------- | ---------------------------------- |
| Pages      | User-facing routes | 13         | Homepage, Lobby, Quiz, Results     |
| Components | Reusable UI        | 30+        | VideoRoom, ParticipantTile, Flag   |
| Libraries  | Business logic     | 25+        | mutations.ts, sessionHooks.ts      |
| Features   | User journeys      | N/A        | Session creation, Video calls      |
| Backend    | Serverless         | 8          | createDailyRoom, send-notification |
| Database   | Schema & data      | N/A        | Migrations, views, RLS policies    |
| State      | Global state       | N/A        | Session atoms, presence atoms      |

---

## Documentation Maintenance

Each category folder contains:

1. **Overview.md** - High-level category explanation
2. **CurrentState.md** - Active files and their status
3. **Deprecated.md** - Removed/obsolete files with reasons
4. **Changelog.md** - Historical changes and modifications

### Update Process

When making changes:

1. Modify code files as needed
2. Update relevant `CurrentState.md` with changes
3. Add entry to `Changelog.md` with date and details
4. Move deprecated items to `Deprecated.md` if removing files
5. Keep `Overview.md` updated for major structural changes

---

## Project Scope Note

⚠️ **Private Application**: This is a private project for personal use among friends, not a commercial product or public service. Features are designed for small groups (typically 2-10 players per session) and do not need to scale beyond that scope.

---

## Next Steps

- Explore each category folder in `/docs/` for detailed information
- Read `Overview.md` in each folder to understand the category
- Check `CurrentState.md` for up-to-date file listings
- Review `Changelog.md` for recent changes

---

**Document Version**: 1.0  
**Maintainer**: Copilot AI Assistant  
**Update Frequency**: On every significant change
