# Pages - Overview

**Category**: User-facing route components  
**Location**: `/src/pages/`  
**Total Files**: 13 active pages

---

## Purpose

Pages are the top-level route components that users navigate to in the application. Each page represents a distinct screen or user flow in the quiz application. Pages are lazy-loaded via React.lazy() for optimal bundle splitting.

---

## Page Types

### Authentication Pages

- **Signup.tsx** - Create new account with unique username
- **Login.tsx** - Authenticate existing user

### Main Flow Pages

- **Homepage.tsx** - Landing page, create/join session entry point
- **JoinSimplified.tsx** - Join session with role selection (Host/Player)
- **GameSetup.tsx** - Host-only configuration for quiz segments
- **Lobby.tsx** - Pre-game waiting room with video and participant list
- **Quiz.tsx** - Live gameplay interface for all participants
- **Results.tsx** - Post-game score breakdown and review

### Profile & Social Pages

- **Profile.tsx** - User profile with tabs (Profile, Statistics, Friends)
- **FlagSelection.tsx** - Choose country flag for player avatar
- **TeamSelection.tsx** - Choose team logo for player avatar
- **Inbox.tsx** - Notification center for friend requests and matches
- **Leaderboard.tsx** - Top players and epic matches rankings

---

## Routing Structure

All pages are registered in `src/App.tsx`:

```tsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Homepage />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/login" element={<Login />} />

  {/* Protected Routes */}
  <Route path="/profile" element={<Profile />} />
  <Route path="/inbox" element={<Inbox />} />
  <Route path="/leaderboard" element={<Leaderboard />} />
  <Route path="/select-flag" element={<FlagSelection />} />
  <Route path="/select-team" element={<TeamSelection />} />

  {/* Session Flow Routes */}
  <Route path="/join" element={<JoinSimplified />} />
  <Route path="/gamesetup/:sessionCode" element={<GameSetup />} />
  <Route path="/lobby/:sessionCode/:seat?" element={<Lobby />} />
  <Route path="/quiz/:sessionCode" element={<Quiz />} />
  <Route path="/results/:sessionCode?" element={<Results />} />
</Routes>
```

---

## Common Patterns

### Layout

Most pages use `StadiumBackground` component for consistent theming:

```tsx
<StadiumBackground>{/* Page content */}</StadiumBackground>
```

### Authentication

Pages check auth status via `useAuth()` context:

```tsx
const { user } = useAuth();
if (!user) navigate("/login");
```

### Navigation

Pages use `react-router-dom` for navigation:

```tsx
const navigate = useNavigate();
const { sessionCode } = useParams();
```

---

## State Management

Pages typically use:

- **React hooks** (useState, useEffect) for local state
- **Jotai atoms** for global state (session, presence)
- **Supabase realtime** for live data updates
- **Custom hooks** (useSessionData, usePresence)

---

## See Also

- **CurrentState.md** - Detailed status of each page
- **Changelog.md** - Historical changes to pages
- **Deprecated.md** - Removed/obsolete pages
- `/docs/Features/` - Feature workflows that span multiple pages
