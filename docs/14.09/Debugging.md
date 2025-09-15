# 2025-09-14 Debug / QA Session

Scope: External production site pages plus join/lobby flow for session `585MJS` and inspection of Supabase schema (GameMaster role). Focus ONLY on documenting issues, warnings, observations, and improvement opportunities. No fixes applied yet.

## Summary of Critical Issues

- CSP blocks flag icons stylesheet causing missing flag styling everywhere.
- Role separation unclear: GameMaster appears in contexts intended for Host or total slot logic does not exclude GameMaster.
- 406 response during participant existence check (GET Participant?name=eq.TestPlayer...), likely due to RLS or header mismatch (Accept profile) or query shape; still proceeds to create participant.
- Duplicate / redundant Supabase fetches (Participants, DailyRoom) on GameSetup and Lobby pages (same endpoints called multiple times on initial load).
- Flags not displayed in Lobby (blocked CSS + possibly class logic). Participant rows show no flag even when selected (Spain chosen -> not visible in lobby Participant list view; only team logo shown).
- Excessive network requests for all flag SVG assets when opening flag selector (loads entire list rather than lazy / virtualized approach).
- GameMaster vs Host functional distinction not enforced in UI filtering (LobbyStatus counts only Host+Players but underlying participants array includes GameMaster elsewhere; risk of off-by-one in slot logic or showing wrong participants in other components).

## Environment / Pages Tested

1. Homepage: https://thirtyquiz.tyshub.xyz/
2. Game Setup: https://thirtyquiz.tyshub.xyz/gamesetup/585MJS
3. Join Page: https://thirtyquiz.tyshub.xyz/join?sessionCode=585MJS
4. Lobby: https://thirtyquiz.tyshub.xyz/lobby/585MJS (after successful join as Player with flag Spain + team Real Madrid)

## Supabase Schema Notes (Public)

Tables inspected: Session, Participant, SegmentConfig, Score, DailyRoom, Strikes.
Participant.role enum check includes: Host, Player1, Player2, GameMaster.
Comment indicates: Host = mobile coordinator; GameMaster = PC/desktop organizer.
Current UI logic (e.g., `LobbyStatus.tsx`) uses `totalSlots = 3` (Host + 2 Players) but does not filter out GameMaster before computing empty slots (it uses raw participants length). If GameMaster is present, empty slot calculation for players becomes inaccurate.

### Role Separation Observations

- `mutations.ts` auto-creates both GameMaster and Host on session creation (GameMaster name default "GameMaster"). This leads to immediate presence of an extra participant type.
- Video call moderation privileges: `canModerate = ["Host", "GameMaster"].includes(currentUserRole)` — combined logic OK, but UI sections (e.g. Lobby participants section) should probably show GameMaster differently or perhaps hide from player slot counts.
- Need clarified responsibility matrix: (a) Session configuration (GameSetup) should likely restrict to GameMaster only; (b) Lobby Host tile should represent mobile host; (c) Ownership / permissions must be unified so GameMaster changes propagate to Host session mgmt while not duplicating scoreboard logic.

## Page-by-Page Findings

### 1. Homepage

Console Logs:

- ERROR (CSP): Refused to load stylesheet `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.3.2/css/flag-icons.min.css` (blocked by `style-src`).
- LOG: Raw data from Supabase (active sessions array).
- LOG: Transformed active sessions.

Network (key entries):

- Supabase GET Session list with embedded Participant + DailyRoom succeeded (200).
- Attempted external CSS (flag icons) fetched but blocked by CSP (still shows as network request). No other failures.

Interactions:

- Clicking "Create Session" opens password / host modal; no immediate console errors besides CSP.

Issues / Improvements:

- CSP must allow required flag icons stylesheet OR migrate flags into local assets (preferred for performance + control) and remove external CSS dependency.
- Logging: Raw arrays logged to console in production; should be gated behind env flag (noise + potential data leakage).
- Accessibility: Verbose console message about autocomplete attributes missing for password (improvement: add `autocomplete="new-password"` or `current-password`).

### 2. GameSetup Page `/gamesetup/585MJS`

Console:

- Same CSP stylesheet refusal for flag icons.

Network:

- Multiple sequential GETs: Participant list fetched twice; DailyRoom queried twice (room_url+ready and again same columns). Indicates redundant fetch or duplicated effect/hook triggers.
- Storage logos retrieved (Real Madrid etc.) — working.

Observations:

- Loading indicator persisted briefly then data rendered (snapshot not captured post-load in console tool but network suggests success).
- GameMaster participant returned in list (in Participant fetch) though UI for slots may not expect it.

Improvements:

- Debounce or consolidate initial fetches (combine Participant + DailyRoom into single effect or rely on channel after first fetch).
- Consider caching SegmentConfig locally; reduce duplicate queries.
- Evaluate whether GameMaster should appear in pre-game status components or be abstracted.

### 3. Join Page `/join?sessionCode=585MJS`

Console:

- CSP error for flag icons.

Network:

- `POST functions/v1/list-logos` succeeded (logo list retrieval).
- Flag selector expansion triggered mass download of all flag SVG assets (hundreds of requests) — performance and bandwidth concern.

Interactions:

- Selecting country Spain updated button label successfully (flag visual may still miss because blocked stylesheet classes `.fi` not styled).
- Player name input accepted text.
- Proceed to team selection successful; league list renders; team logos load.

Issues:

- No immediate validation feedback if session code invalid (not tested with invalid code here, worth verifying separately).
- Over-fetch: load-on-open strategy for all flags; virtualize or incremental search-based fetch recommended.
- Potential RLS or query error surfaces later (406) when verifying participant uniqueness (see Lobby section).

### 4. Lobby Page `/lobby/585MJS` (post-join)

Console (new after join):

- ERROR 406 on GET Participant existence check: `Participant?select=participant_id,role&session_id=...&name=eq.TestPlayer&limit=1` returns 406 Not Acceptable. (Likely missing `Accept: application/json` header or conflicting `Prefer` header — Supabase PostgREST returns 406 if Accept cannot be satisfied.) Code still proceeds to create participant (POST 201).
- LOG: Daily room URL from atom: null.
- CSP errors for flag stylesheet repeated + explicit handled error logs "Failed to load flag icons CSS: Event" twice => code attempts to handle load failure but spams console.
- LOG: Session + Participants subscription status SUBSCRIBED (OK).

Network Highlights:

- Participant check (406) then successful Participant insert (201).
- Several GET Participant + Session + DailyRoom requests — some duplication.
- Reattempts to load flag-icons CSS multiple times after navigation.

UI Observations:

- Participants list shows Host (tareq) and Player (TestPlayer) with team logos, but no country flag visual (expected due to CSP + maybe missing rendered element in this component variant). Participant role label for player is "Player A" (UI mapping from Player1/Player2?). Need to confirm consistent naming vs DB roles.
- No GameMaster tile visible here (implies filtering in Lobby component differs from LobbyStatus). Need uniform approach.
- Video call section shows room status but no attempt to create/join room automatically — expected? (Daily room URL null yet status shows icons Ready/Live; ensure logic matches actual DailyRoom table state.)

Issues:

- 406 may hide silent data integrity issues if uniqueness check logic relies on fetch success; risk of duplicate participant insertion under race conditions.
- Missing flag display reduces customization feature value.
- Redundant CSS load attempts should be guarded (only try once and fallback).

## Cross-Cutting Technical Issues

1. Content Security Policy: Current `style-src` excludes CDN used for flags. Either:
   - Add the CDN to CSP (risk: external dependency), or
   - Vendor the `flag-icons` CSS + SVG assets locally and reference via relative paths.
2. Redundant Fetch Patterns: Multiple identical GETs on initial render for Participants and DailyRoom. Consolidate or memoize.
3. Role Modeling: Need explicit mapping & filtering rules:
   - GameMaster: configuration + elevated permissions, not counted in player slots, optionally hidden from basic participant UI.
   - Host: video presence leader/mobile device, visible in lobby and counted in slots.
   - Players: Player1/Player2 displayed with alphabetical or positional labeling consistently (avoid "Player A" if DB stores Player1/Player2 unless you standardize naming transform).
4. Flag System Performance: Loading hundreds of SVGs on first dropdown open is heavy. Options:
   - Lazy scroll/virtualization (react-window) + dynamic import of subset.
   - Static sprite sheet or only load subset by region search.
5. Error Handling & Logging: Production console logs of raw data should be removed / gated. Repeated CSS load failures should not spam logs; show single warning with guidance.
6. Participant Uniqueness Check (406): Investigate headers in fetch wrapper. Ensure `Accept: application/json` and correct `Prefer` values. If RLS policy restricts selection on name without additional filters, adjust query or policy.
7. Team & Flag Persistence: Player joined with team + flag, but lobby shows only team logo. Confirm that flag is saved (DB insert should include flag code) and lobby component actually renders `participant.flag` (in some components it does, e.g. `LobbyStatus.tsx`; verify lobby variant uses same logic or remove CSP blocker so styling appears).

## Potential Root Causes & Hypotheses

- CSP defined in `netlify.toml` (or response headers) missing `https://cdn.jsdelivr.net` leading to failed stylesheet and fallback code attempts generating errors.
- 406 on participant check due to missing or conflicting Accept header caused by custom fetch layer or Supabase client override when using `select=...&limit=1` without specifying `Accept: application/json` under certain browsers / edge deployments.
- Duplicate fetches triggered by multiple hooks subscribing simultaneously (e.g., one effect for load + another effect upon subscription ready). Centralizing lobby/game state in a context could reduce duplicates.
- GameMaster presence created automatically may not align with new UX expectation — if GameMaster should only appear when a desktop config flow starts, delay creation until first GameSetup entry.

## Recommendations (Deferred Until Fix Phase)

1. Vendor flag assets: Copy CSS + needed SVG subset locally; update imports; adjust CSP accordingly.
2. Refactor role filtering: Provide utility `getDisplayParticipants(participants)` that excludes GameMaster where appropriate; adapt slot count logic to use filtered list.
3. Consolidate initial data fetch in GameSetup and Lobby to single `Promise.all` call and rely on realtime channels afterwards.
4. Patch participant uniqueness check by inspecting response headers & adding explicit `.single()` usage or `.limit(1).maybeSingle()` to reduce 406 risk.
5. Introduce logging abstraction with levels; disable verbose logs in production via VITE flag.
6. Implement virtualization for flag list.
7. Add integration test covering: join flow with flag + team selection -> lobby displays both.
8. Add schema constraint or application guard to prevent multiple GameMaster entries (currently logic updates existing but verify concurrency safety).

## Raw Captured Console Errors (Exact Strings)

```
Refused to load the stylesheet 'https://cdn.jsdelivr.net/.../flag-icons.min.css' because it violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.daily.co".
Failed to load flag icons CSS: Event
Failed to load resource: the server responded with a status of 406 () (Participant existence check)
```

## Raw Captured Network Failures

- GET Participant existence check (406) before creation.
- All other Supabase REST interactions 200/201.
- Repeated attempts to fetch blocked stylesheet (CSP) — network shows request, render blocked.

## Metrics / Counts

- Flag dropdown triggered ~250+ SVG GET requests (one per country) on first open.
- Duplicate Participant list fetch on GameSetup (observed at least 2 immediate calls).
- Duplicate DailyRoom fetch (room_url/ready) twice on GameSetup and again on Lobby initial load.

## Next Steps

1. Confirm CSP source (Netlify headers or function). Prepare local asset migration plan.
2. Identify all UI components rendering participants; document intended visibility of GameMaster.
3. Trace participant existence check implementation in `mutations.ts` around join logic for Player to adjust to `.maybeSingle()`.
4. Benchmark flag selector performance after optimization ideas.

---

End of report.
