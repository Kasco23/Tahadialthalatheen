# Tahadialthalatheen — Football Quiz Application

**ALWAYS follow these instructions first. Only search or explore further if the information here is incomplete or found to be in error.**

Tahadialthalatheen is a React TypeScript application built with Vite that creates live head-to-head football quizzes. It uses Supabase for data, Daily.co for video calls, and is deployed on Netlify with serverless functions.

## Core Development Workflow

### Prerequisites Setup

- **Required**: Node.js >= 22 (confirmed working: v22.19.0)
- **Package Manager**: pnpm (auto-enabled via corepack)
- **Environment**: Use `.env.example` as template for local environment variables

### Initial Setup (First Time)

```bash
# Verify Node.js version
node --version  # Must be 22+

# Enable pnpm if needed (usually auto-enabled)
corepack enable

# Install dependencies - FAST execution
pnpm install --frozen-lockfile  # Takes ~2 seconds
```

### Build & Test Commands

**CRITICAL TIMING NOTE: All build and test operations are FAST - no extended timeouts needed**

#### Development Server

```bash
pnpm dev  # Starts in ~450ms on http://localhost:5173/
```

#### Build Commands

```bash
pnpm build          # Standard build - Takes ~10 seconds
pnpm build:prod     # Build + size validation - Takes ~10 seconds
```

#### Testing

```bash
pnpm test           # Unit tests - Takes ~3 seconds
pnpm test:e2e       # E2E tests - Requires env setup + Playwright install
pnpm test:install   # Install Playwright browsers (may fail in restricted environments)
```

#### Code Quality

```bash
pnpm lint          # ESLint check - Takes ~3 seconds
pnpm format        # Prettier formatting - Takes ~4 seconds
```

### Netlify Development

```bash
pnpm dev:netlify   # Requires Netlify auth - use 'pnpm dev' for local development
```

## Validation Requirements

**ALWAYS test your changes with these scenarios after making modifications:**

### Essential User Flows

1. **Session Creation**: Navigate to homepage, create session, verify session code generation
2. **Join Flow**: Use join page to connect as host or player, test name/flag selection
3. **Lobby State**: Check participant list, presence indicators, host controls
4. **Quiz Navigation**: Verify segment progression and scoring (if backend available)

### Build Validation

```bash
# ALWAYS run before committing
pnpm lint && pnpm format && pnpm build
```

### Manual Testing Checklist

- [ ] Homepage loads and displays create/join options
- [ ] Session creation generates valid session codes
- [ ] Join page allows role selection (Host/Player)
- [ ] Lobby shows participant status correctly
- [ ] Navigation between routes works smoothly
- [ ] No console errors during basic flows

## Key Architecture & Navigation

### Core Pages (`src/pages/`)

- **Homepage.tsx** — Create or join session entry point
- **Join.tsx** — Role selection (Host/Player) + name/flag/logo picker
- **GameSetup.tsx** — Host configuration for quiz segments
- **Lobby.tsx** — Pre-game waiting room with participant management
- **Quiz.tsx** — Live gameplay interface with segment handling
- **Results.tsx** — Post-game score review and breakdown

### Critical Libraries (`src/lib/`)

- **mutations.ts** — All Supabase database operations (sessions, participants, scoring)
- **supabaseClient.ts** — Database connection configuration
- **sessionHooks.ts** — React hooks for session state management
- **presence.ts & enhancedPresence.ts** — Real-time participant status
- **types/** — TypeScript definitions for database and application state

### Components (`src/components/`)

- **ParticipantTile.tsx** — Player status display with video integration
- **VideoCall.tsx** — Daily.co video calling interface
- **FlagSelector.tsx & TeamLogoPicker.tsx** — Player customization
- **EnhancedLobby.tsx** — Advanced lobby with real-time features

### Server Functions (`netlify/functions/`)

- **createDailyRoom.ts** — Video room creation via Daily.co API
- **create-daily-token.ts** — Authentication tokens for video calls

### Integration Points

- **Supabase**: Handles database operations for sessions, participants, and scoring. Key file: `src/lib/mutations.ts`.
- **Daily.co**: Provides video call functionality. Key file: `src/components/VideoCall.tsx`.
- **Netlify**: Hosts serverless functions for backend operations. Key directory: `netlify/functions/`.

## Environment Configuration

### Required Variables (Development)

```bash
# Frontend (exposed to browser)
VITE_SUPABASE_DATABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DAILY_DOMAIN=your_daily_domain

# Backend (Netlify Functions only)
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DAILY_API_KEY=your_daily_api_key
```

### Without Backend Services

- Frontend-only development works for UI/UX changes
- Database operations will fail gracefully with mock responses
- Focus testing on component rendering and navigation

## Common Development Tasks

### Adding New Quiz Features

1. Update types in `src/lib/types/` for new data structures
2. Add database mutations in `src/lib/mutations.ts`
3. Create/modify page components in `src/pages/`
4. Test with `pnpm dev` and manual validation flows

### Styling Changes

- Uses **Tailwind CSS** with **DaisyUI** components
- **No build step required** for CSS changes - hot reload in dev mode
- Main styles in `src/index.css`

### Database Schema Updates

- Supabase migrations in `supabase/` directory
- Update TypeScript types in `src/lib/types/supabase.ts`
- Modify mutations in `src/lib/mutations.ts` accordingly

## Troubleshooting

### Build Issues

- **Node version**: Verify Node.js 22+ with `node --version`
- **Dependencies**: Clean install with `rm -rf node_modules && pnpm install`
- **TypeScript**: Check `pnpm build` for type errors

### Runtime Issues

- **Database errors**: Check VITE*SUPABASE* environment variables
- **Video issues**: Verify DAILY_API_KEY and domain configuration
- **Navigation issues**: Clear browser cache and check React Router setup

### Performance Monitoring

```bash
pnpm analyze        # Bundle size analysis
pnpm dep:graph      # Dependency visualization
```

## CI/CD Integration

### GitHub Actions Workflow

- **Linting**: `pnpm lint` must pass
- **Tests**: `pnpm test` must pass
- **Build**: `pnpm build` must complete successfully
- **Deployment**: Automatic to Netlify on main branch

### Pre-commit Requirements

```bash
# Run this before every commit
pnpm lint && pnpm format && pnpm build && pnpm test
```

## Development Tips

### Fast Iteration

- **Hot reload**: `pnpm dev` provides instant updates for most changes
- **Component testing**: Create isolated test files in same directory as components
- **Type checking**: IDE integration with TypeScript provides real-time validation

### Code Organization

- **Route-level code splitting**: Each page is lazy-loaded (see `App.tsx`)
- **Manual chunking**: React, Supabase, and Daily.co libraries separated into vendor chunks
- **Size monitoring**: Build fails if main chunks exceed 250kB gzipped

### Testing Strategy

- **Unit tests**: Focus on pure functions and isolated components
- **Integration tests**: Test component interactions with mocked services
- **E2E tests**: Require full environment setup including Supabase and Daily.co

Remember: This application has FAST build times and simple development workflows. Most operations complete in seconds, making rapid iteration and testing very efficient.
