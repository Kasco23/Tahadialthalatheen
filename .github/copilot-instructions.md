# GitHub Copilot Instructions for This Repository (Tahadialthalatheen)

**⚠️ CRITICAL: Always follow these instructions first and completely. Only fallback to additional search or context gathering if the information here is incomplete or found to be in error.**

These instructions tell AI coding assistants (and future contributors) how to write high‑quality, consistent code for this project. They are explicit so the assistant can act with minimal back‑and‑forth.

## 🚀 Essential Build & Development Commands (VALIDATED)

**Requirements**: Node.js >= 22, pnpm 10.15.1+

### Quick Setup & Validation
```bash
# 1. Install dependencies (already done in fresh clone)
pnpm install --frozen-lockfile

# 2. Core validation workflow (ALWAYS run these after code changes):
pnpm run lint           # ~3 seconds - passes with warnings only
pnpm run test           # ~3 seconds - all 25 tests pass  
pnpm run build:prod     # ~11 seconds - NEVER CANCEL, includes size validation
pnpm run format         # ~4 seconds - formats all files
```

### Development Server
```bash
pnpm run dev            # Starts in <500ms on http://localhost:5173/
```
**⚠️ Expected Behavior**: App loads but shows blank page due to missing Supabase environment variables. This is NORMAL and expected in development without proper .env setup.

### **CRITICAL TIMEOUT WARNINGS**
- **Build commands (`pnpm run build:prod`)**: Set timeout to **20+ minutes**. NEVER CANCEL.
- **Test commands (`pnpm run test`)**: Set timeout to **10+ minutes**. NEVER CANCEL.
- Current measured times are much faster, but builds can vary significantly by environment.

### Commands That DON'T Work (Known Limitations)
```bash
# These fail in sandboxed environments - document alternatives:
pnpm run dev:netlify        # Fails: Netlify auth required
pnpm run test:e2e           # Fails: Playwright browser install issues
pnpm run test:install       # Fails: Browser download blocked
pnpm run analyze            # Fails: vite-bundle-analyzer not found
pnpm run docs:index         # Fails: script file missing
pnpm run flow:generate      # Fails: script file missing
pnpm run flow:update        # Fails: script file missing
```

### Validation Scenario After Changes
**MANDATORY**: After making any changes, run this complete validation:
```bash
pnpm run lint && pnpm run test && pnpm run build:prod && pnpm run format
```
This ensures your changes pass CI and maintain code quality.

![Development server screenshot](https://github.com/user-attachments/assets/2c359368-e6ac-490d-87e9-3eb587ba17d9)
*Expected: App loads but shows blank page due to missing environment variables*

---

## 1. Project Purpose (Current Scope)

A lightweight, extensible real‑time quiz / session platform with:

- Host-created sessions (ephemeral for now)
- Players joining via session code
- Lobby + Setup (host control panel) + Quiz flow
- Role & presence tracking
- Optional video room (Daily.co)
- Enhanced realtime layer (Supabase broadcasts + presence + DB change feeds)
- Simplicity first → later iterations may add history, rounds/segments, analytics, persistence layers

Do NOT over-engineer: prefer lean abstractions that are easy to migrate or replace.

---

## 2. Technology Stack & Key Libraries

Frontend:

- React 19 + Vite 7 (ESM, fast dev, code splitting)
- TypeScript 5.9 (strict typing expected)
- React Router v7
- Jotai (local/global lightweight state pieces)
- TanStack Query (server/cache-oriented remote data; avoid duplicating with Jotai)
- Tailwind CSS v4 + DaisyUI + utility add-ons (primary styling approach)
- MUI + Emotion + styled-components present: USE SPARINGLY. Prefer Tailwind first. Only introduce MUI when component complexity (a11y, layout) benefits significantly.

Realtime & Data:

- Supabase JS v2 (auth, database, realtime: broadcasts, presence, postgres changes)
- Enhanced presence utilities under `src/lib/enhanced*`
- Zod for runtime validation (expected for input boundaries & serverless function payload verification)

Video:

- Daily.co via Netlify function `/api/create-daily-room` and client SDK (`@daily-co/daily-js`, `@daily-co/daily-react`)

Deployment & Infra:

- Netlify build + functions (`netlify/functions/*`)
- Environment variables (runtime vs build: Vite requires `VITE_` prefix for exposure)
- Node.js >= 22
- Production build: `pnpm build` → `dist`

Utilities / Tooling:

- Axios (HTTP where appropriate — prefer consistent wrapper if added)
- Day.js (datetime formatting)
- DOMPurify (sanitize any dynamic HTML—NO untrusted injection without it)
- Framer Motion (animations)
- Immer (immutable transforms when helpful)
- React Window (virtualized lists)
- Flag assets, icons (Lucide, Heroicons, react-icons)
- Supabase migrations + PL/pgSQL (presence policies, realtime SQL)

Testing & QA:

- **Jest + Testing Library** (unit / component): 25 tests pass in ~3 seconds - set 10+ minute timeouts
- **Playwright (E2E)**: ⚠️ Browser install fails in sandboxed environments - use alternative validation
- **Vitest present** (avoid mixing test runners inside the same suite—prefer Jest for now unless migrating intentionally)
- **MSW** for API mocking
- **Lighthouse plugin** (performance / accessibility CI opportunity)  
- **Madge** (dependency graph): `pnpm run dep:graph` works in ~2.5 seconds
- **Bundle size enforcement script** (`scripts/size-check.mjs`): integrated in `build:prod`

Build Optimization:

- Manual vendor chunking (vendor-react: 112.90kB gzipped, vendor-supabase: 34.31kB, vendor-daily: 66.82kB)
- Route-level code splitting
- Brotli + compression plugin  
- CSS minification (cssnano)
- **Size enforcement**: Fails build if main chunks exceed 250kB gzipped (`build:prod`)
- **Current largest chunk**: 110.3kB (passing validation)
- **Build time**: ~11 seconds (measured), set 20+ minute timeouts

---

## 3. Domain Concepts & Core Model (Keep Synced With Reality)

Session (ephemeral)

- session_id / code
- host (name + password ephemeral; no account system yet)
- phase: e.g. "lobby" | "setup" | "quiz" | "results" (flexible; keep enum centralized)
- players: name, role, optional presence status
- roles: host, player (anticipate future: moderator, scorer, viewer)
- video presence: joining/leaving video room
- realtime presence: active vs inactive + timestamps
- chat (broadcast-based) & game actions (broadcasts)

Naming guidance (WRITE NEW CODE WITH THESE):

- Prefer `sessionId`, `playerId`, `hostName`, `role`, `phase`
- Broadcast channels: `session:{sessionId}:<topic>` (if patternized, put helper in one place)
- When adding new phases or game segments, define them in a single source file (e.g. `src/constants/phases.ts`)

---

## 4. File / Directory Guidelines

(If a file or folder does not exist yet, create it when needed.)

Suggested structure (reinforce if partially present):

```
src/
  components/
    (UI + composite containers)
  pages/
    (Route-level components → lazy loaded)
  hooks/
    (UI-specific hooks; for cross-cutting realtime logic prefer /lib)
  lib/
    supabaseClient.ts
    enhancedRealtimeHooks.ts
    enhancedPresence.ts
    api/
      (API abstraction modules calling Netlify functions or Supabase)
  state/
    atoms.ts (Jotai)
    queryKeys.ts
  constants/
    phases.ts
    roles.ts
    events.ts (broadcast/event name constants)
  types/
    domain.ts (shared domain types)
  utils/
    validation/
      (Zod schemas)
    formatting/
  styles/
    (global css / tailwind config if imported)
netlify/
  functions/
    create-daily-room.ts (and future)
supabase/
  migrations/
docs/
scripts/
```

DO NOT scatter constants across random components. Keep them centralized. Avoid duplicate supabase clients—only one initialization.

---

## 5. Realtime Design Rules

Use enhanced realtime layer as per `docs/ENHANCED_REALTIME.md`.

Decision Matrix:

- Broadcast (transient, instant UI): chat messages, ephemeral actions (ready toggles, quick signaling)
- Database change feeds (durable state): persisted players, scores, quiz progression steps
- Presence (Supabase native presence): online state, last active, ephemeral join/leave
- Combine: persist durable state asynchronously after broadcasting for immediate UX (if required)

Event Naming Conventions:

- `player_ready`
- `lobby_status_change`
- `chat_message`
- `video_join` / `video_leave`
- `phase_change`
  Use `kebab_case` OR `snake_case` consistently. Prefer `snake_case` here (already used: `player_ready`). Put them all in `constants/events.ts`.

Presence:

- All presence payloads MUST include: `user_id`, `name`, `role`, `timestamp` (ISO), `is_active`
- Add optional: `flag`, `lobby_status`, `video_active`
- Provide helper methods in `EnhancedPresenceHelper` instead of rewriting logic in components.

Security / Policy:

- Development policies are permissive (`USING (true)`)
- For production-ready tasks, generate tightened policies referencing authenticated roles or participant membership. Code should _assume_ eventual restrictions—NEVER rely on open policies.

---

## 6. Video Integration (Daily.co)

Serverless function: `/api/create-daily-room`

- Method: POST
- Input: `{ session_code: string }`
- Output: `{ room_url: string }`
  Guidelines:
- Validate input with zod before calling Daily API
- Handle errors gracefully and return structured JSON `{ error: string }`
- Client should cache `room_url` in a react-query cache keyed by `['daily-room', sessionId]`
- DO NOT expose secret DAILY API key to client (only VITE_DAILY_API_KEY if intentionally needed; prefer server-only when possible)

---

## 7. API / Data Access Patterns

Supabase:

- Single `supabaseClient.ts` that injects URL and anon key from env (`import.meta.env.VITE_SUPABASE_*`)
- All queries wrapped in small abstraction functions inside `lib/api/` modules for reuse & consistent error handling
- Use zod to validate responses from critical endpoints (e.g. players list)
- For mutations: optimistic UI updates only when easily reversible

Netlify Functions:

- Put each function in `netlify/functions/<name>.ts`
- Use named exports: `export const handler: Handler = async (event) => { ... }`
- Keep pure logic testable by extracting into a helper file under `src/lib/api/server/` if complexity grows

---

## 8. State Management Rules

React Query (tanstack):

- Use for server data (players list, persisted quiz objects)
- Query keys: array form, centralize in `state/queryKeys.ts`
- Invalidate relevant queries after side effects

Jotai:

- Use for ephemeral UI or cross-component transient flags (modal open, local selections)
- Avoid storing server-canonical data here (prevents inconsistency)

Presence / Realtime:

- Derived UI collections from enhanced hook(s) should be memoized; avoid recomputations inside render loops

---

## 9. Performance & Bundling

Follow existing optimization pattern:

- Dynamic imports for route components: `const SetupPage = lazy(() => import('../pages/SetupPage'))`
- Keep initial route payload small (< 250kB gzipped)
- Isolate large libs (e.g. Daily, Supabase, MUI) into separate chunks via manual config (already in place)
- DO NOT import rarely-used heavy modules at top-level
- Use `React.Suspense` + fallback skeletons where appropriate
- Use `react-window` for any potentially long player / chat lists
- Avoid unnecessary re-renders: wrap derived lists in `useMemo`

When adding new dependencies:

- Justify in PR description
- Run `pnpm analyze` to confirm impact
- If large (>40kB), ensure lazy loading or code-splitting

---

## 10. Styling & UI

Primary: Tailwind utility-first.
Secondary: DaisyUI for accessible primitives.
Tertiary: MUI (only when a11y complexity or layout patterns justify; prefer incremental migration away from multiple styling paradigms).
Avoid mixing `styled-components` and Emotion unless migrating; prefer one pattern per component.

Class Composition:

- Keep semantic naming via `data-*` attributes for tests
- Abstract repeated utility sets into small component wrappers OR Tailwind @apply in a single layered stylesheet if necessary

---

## 11. Validation & Sanitization

- ALL user-facing text from uncontrolled sources sanitized with DOMPurify before `dangerouslySetInnerHTML`
- Use zod schemas for:
  - Form submissions
  - Function payloads
  - Broadcast event payloads (create a central `schemas/` folder)
    Provide helpers like:

```ts
export const ChatMessageSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  userName: z.string().min(1),
  message: z.string().max(500),
  createdAt: z.string().datetime(),
});
```

---

## 12. Security Practices

- Never embed service role keys or non-public secrets in client bundle
- Enforce stricter RLS policies before enabling persistence of sensitive state
- Use CSP & security headers (already referenced in docs) → do not introduce inline scripts
- sanitize broadcast & chat inputs (length, content)
- Avoid leaking internal IDs in public error messages

---

## 13. Testing Strategy

Unit (Jest):

- Co-locate test files: `ComponentName.test.tsx`
- Use Testing Library; assert behavior, not implementation

E2E (Playwright):

- Place spec files under `e2e/`
- Use stable `data-testid` or `data-role` attributes; DO NOT rely on text that may change

Mocking:

- Supabase calls: isolate logic & test pure functions; integration tests can hit a test instance or be mocked via MSW
- Broadcast logic: abstract event names & test via simulated handlers

Performance:

- Optionally add Lighthouse CI budgets (plugin available)

---

## 14. Scripts (Do Not Remove Without Replacement)

Key scripts (automate when possible):

- `flow:generate` → generates user flows (keep outputs deterministic)
- `flow:update` → rebuild flows from JSON definitions
- `dep:graph` → maintain dependency map; run before large refactors
- `docs:index:write` → keep docs discoverable (run on doc changes)
- `build:prod` → enforce size thresholds (must pass in CI)

If adding new scripts:

- Use concise names
- Document in `docs/PRODUCTION.md` if build/runtime relevant

---

## 15. Naming & Consistency Improvements

### ⚠️ SCRIPT VALIDATION STATUS (CRITICAL)
**Before using any script, verify it exists and works:**

**✅ WORKING SCRIPTS** (measured timing):
- `pnpm run lint` → 3 seconds (passes with warnings only)
- `pnpm run test` → 3 seconds (25 tests pass)
- `pnpm run build:prod` → 11 seconds (includes size validation - NEVER CANCEL, set 20+ min timeout)
- `pnpm run format` → 4 seconds (formats all files)
- `pnpm run dev` → <500ms startup (serves on localhost:5173)
- `pnpm run dep:graph` → 2.5 seconds (generates JSON, skips image due to missing Graphviz)

**❌ NON-WORKING SCRIPTS** (alternatives in parentheses):
- `pnpm run flow:generate` → script file missing
- `pnpm run flow:update` → script file missing
- `pnpm run docs:index:write` → script file missing
- `pnpm run analyze` → vite-bundle-analyzer not found
- `pnpm run dev:netlify` → requires authentication
- `pnpm run test:e2e` → Playwright browser install fails

**MANDATORY VALIDATION WORKFLOW:**
```bash
pnpm run lint && pnpm run test && pnpm run build:prod && pnpm run format
```

---

## 26. Naming & Consistency Improvements

"Setup" page alternative candidate names:

- "ControlPanel"
- "HostConsole"
- "SessionSetup" (neutral, transitional)
  Until renamed: keep exports generic enough to refactor (e.g. `SetupLayout`, not `HardcodedSetupThing`).

Phases central suggested enum:

```ts
export enum SessionPhase {
  Lobby = "lobby",
  Setup = "setup",
  Quiz = "quiz",
  Results = "results",
}
```

ALWAYS import from one file.

---

## 26. Example Copilot Prompts (Use These Patterns)

Create a new broadcast event helper:

> Add a helper in src/lib/realtimeEvents.ts that exports a typed sendLobbyStatus(sessionId, status) using the existing enhanced realtime broadcast pattern.

Add a Netlify function:

> Create netlify/functions/list-active-sessions.ts that returns active sessions from Supabase with zod validation and proper CORS headers.

Add a presence-aware component:

> Build a PlayerGrid component showing active players with their realtime presence (green dot if active) using useParticipants from enhancedRealtimeHooks.

Add a zod schema + usage:

> Create a zod schema for QuizQuestion in src/types/quiz.ts and a validateQuizQuestions utility in src/utils/validation/quiz.ts.

Write a test:

> Write a Jest test for EnhancedPresenceHelper ensuring joinPresence and leavePresence trigger the provided callbacks.

Optimize a heavy component:

> Refactor the QuizPage to lazy load editor-only subcomponents and ensure main chunk size is minimized.

---

## 26. PR Expectations

Each PR should:

1. Explain purpose & scope (avoid grab-bag changes)
2. Note performance/security implications
3. Mention new dependencies with size rationale
4. Include tests for new logic (where applicable)
5. Pass `pnpm build:prod` locally

Branch naming:

- `feat/<concise-kebab>`
- `fix/<issue-ref>`
- `refactor/<target>`
- `test/<area>`
  Commit style (recommended):
- `feat: add broadcast event for phase changes`
- `fix: sanitize chat input`
- `refactor: unify session phase constants`
- `perf: lazy load Daily meeting widget`
- `test: add player readiness hook tests`

---

## 26. When Adding New Realtime Logic

Checklist:

- Event name added to `constants/events.ts`
- Payload validated (zod)
- UI gracefully handles late arrival or duplication
- Avoid memory leaks: clean up subscriptions in `useEffect` return
- Do not duplicate channel creation—reuse enhanced hooks

---

## 26. When Adding New Pages

Checklist:

- Place component in `src/pages`
- Lazy import in router
- Provide `<PageName>Page` as default export
- Add suspense boundary
- Keep initial above-the-fold render under ~50ms (avoid heavy synchronous loops)
- Defer large data fetch with React Query + skeleton

---

## 26. Anti-Patterns to Avoid

- Direct Supabase calls in random components (centralize)
- Mixing styled-components + Tailwind in same component unless truly necessary
- Recreating presence logic ad hoc
- Hardcoding event strings inline
- Silent catch blocks (always log or surface)
- Embedding raw un-sanitized HTML
- Putting persistent domain data in Jotai atoms

---

## 26. Open Areas (Safe to Improve)

- Consolidate styling approach (gradually reduce style system overlap)
- Migrate completely to one test runner (Jest or Vitest)
- Add proper RLS production policies (see docs)
- Introduce session archival/persistence (future)
- Add structured logging layer
- Introduce error boundary strategy per route

---

## 26. Quick Reference: Environment Variables

Build-time (exposed):

- `VITE_SUPABASE_DATABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_DAILY_API_KEY` (only if strictly needed client-side)

Server-only (DO NOT expose):

- `DAILY_API_KEY` (used in Netlify functions)

Add new env vars:

- Prefix with `VITE_` only if required in client
- Document in `docs/PRODUCTION.md`

---

## 26. Quality Bar

Before merging:

- TypeScript: No `any` unless justified with comment
- Lint: No warnings on changed lines
- Tests: Added/updated when logic changes
- Performance: No regressive large bundle diffs
- Security: No exposure of secrets or insecure HTML insertion

---

## 26. Assistant Behavioral Rules (Critical)

When generating code:

- Use existing patterns and file naming conventions above
- Reference constants instead of retyping literals
- Prefer composition over new abstractions unless reuse >2 places
- Explain rationale briefly in PR description comments if pattern deviates

When unsure about naming / domain:

- Propose 2–3 concise options
- Default to descriptive, lowercased, snake_case for internal event names

---

## 26. Future Migration (Planned)

(Do not prematurely implement but design with openness)

- Add session history storage layer
- Add scoreboard & round segmentation
- Harden production RLS and audit logging
- Replace duplicate styling systems

---

If anything here becomes outdated, update this file AND reflect in `docs/` for longer explanations. Keep this file actionable, concise, and _canonical_.

Happy building.
