# Pages - Current State

**Last Updated**: October 21, 2025  
**Total Active Pages**: 13

---

## Authentication & User Management

### Signup.tsx

- **Status**: ✅ Active
- **Route**: `/signup`
- **Purpose**: New user registration with unique username validation
- **Dependencies**: AuthContext, Supabase auth
- **Key Features**:
  - Email + password authentication
  - Username uniqueness validation
  - Auto-navigation to profile after signup
- **Size**: ~8KB

### Login.tsx

- **Status**: ✅ Active
- **Route**: `/login`
- **Purpose**: Existing user authentication
- **Dependencies**: AuthContext, Supabase auth
- **Key Features**:
  - Email + password login
  - Remember me option
  - Redirect to homepage after login
- **Size**: ~6KB

### Profile.tsx

- **Status**: ✅ Active
- **Route**: `/profile`
- **Route Protection**: Requires authentication
- **Purpose**: User profile management with three tabs
- **Dependencies**: AuthContext, Supabase, AvatarEditor
- **Key Features**:
  - Three-tab interface (Profile, Statistics, Friends)
  - Edit username, avatar, bio
  - View match statistics (wins, losses, win rate)
  - Manage friends (send/accept requests, view friend list)
  - Navigation to flag/team selection
  - Password change functionality
- **Components Used**: StatisticsTab, FriendsTab, AvatarEditor
- **Size**: ~25KB

---

## Main Quiz Flow

### Homepage.tsx

- **Status**: ✅ Active
- **Route**: `/` (root)
- **Purpose**: Landing page and main entry point
- **Dependencies**: StadiumBackground, JoinModal, ActiveGames, NotificationBell
- **Key Features**:
  - Create new session (generates unique code)
  - Join existing session via modal
  - View active games sidebar
  - Profile menu with navigation
  - Username setup banner (if missing)
  - Notification bell with unread count
- **Size**: ~15KB

### JoinSimplified.tsx

- **Status**: ✅ Active
- **Route**: `/join`
- **Purpose**: Join session with role selection
- **Dependencies**: FlagSelector, TeamLogoPicker, sessionState
- **Key Features**:
  - Enter session code
  - Choose role (Host/Player)
  - Player customization (name, flag, team logo)
  - Validation and error handling
  - Navigate to appropriate page based on role
- **Size**: ~12KB

### GameSetup.tsx

- **Status**: ✅ Active (Enhanced - Phase 2.1)
- **Route**: `/gamesetup/:sessionCode`
- **Route Protection**: Host only
- **Purpose**: Configure quiz segments and create Daily.co room with comprehensive Blobs persistence
- **Dependencies**: Supabase, Daily.co, blobsManager.ts, sessionState
- **Key Features**:
  - Set question counts for 5 segments (WDYK, AUCT, BELL, UPDW, REMO)
  - Create Daily.co video room with token system
  - **✨ NEW**: Comprehensive session data persistence to Netlify Blobs
  - **✨ NEW**: Session state restoration from Blobs on mount (page refresh recovery)
  - **✨ NEW**: Multi-layer caching (Browser Cache API + memory + Blobs + localStorage)
  - Update legacy session state for backward compatibility
  - Host presence tracking with heartbeat mechanism
  - Real-time participant count from Lobby
  - Navigate to lobby when ready
- **Blobs Integration** (Phase 2.1):
  - `saveSessionBlob()` on room creation with full SessionBlobData schema:
    - Session metadata: session_id, session_code, host_profile_id
    - Daily.co data: daily_room_url, daily_room_name, daily_room_created_at
    - Game state: phase, game_state, segments_configured
    - Participant tracking: active_participant_ids, participant_count
    - Metadata: segments_config, created_by, creation_context
  - `getSessionBlob()` on mount for resilience and UI state restoration
  - 5-layer fallback: Cache (5min TTL) → Blobs → localStorage → Supabase → Error
  - Strong consistency mode for immediate cross-device visibility
- **Performance**:
  - Cache hit rate: 80%+ (target)
  - Reduced Supabase queries via cached Blobs data
  - Instant state restoration on page refresh
- **Size**: ~23KB (increased due to Blobs integration)

### Lobby.tsx

- **Status**: ✅ Active
- **Route**: `/lobby/:sessionCode/:seat?`
- **Purpose**: Pre-game waiting room with video
- **Dependencies**: VideoRoom, ParticipantTile, presence system, dailyTokenManager
- **Key Features**:
  - Real-time participant list with Profiles data (name, username, flag, team)
  - Video call integration (Daily.co) with robust token system
  - Separate username (safe, no spaces) for token creation
  - Full name display in UI (may contain spaces)
  - Host controls (start game)
  - Presence indicators (online/offline)
  - Session info display
  - Ready status indicators with toggle for players
  - Heartbeat mechanism for presence tracking
  - Refresh button preserves complete participant data
- **Token System**:
  - Uses `Profiles.username` for Daily.co token (e.g., "tareq")
  - Uses `Profiles.name` for UI display (e.g., "Tareq Salah")
  - Fallback chain: `username || name || "player"`
  - Automatic cache clearing on username change
- **Size**: ~20KB

### Quiz.tsx

- **Status**: ✅ Active
- **Route**: `/quiz/:sessionCode`
- **Purpose**: Live gameplay interface
- **Dependencies**: VideoRoom, Timer, real-time scoring
- **Key Features**:
  - Display questions and answers
  - Real-time answer submission
  - Video call persistence
  - Score tracking
  - Segment progression
  - Host controls (next question, end game)
- **Size**: ~18KB

### Results.tsx

- **Status**: ✅ Active
- **Route**: `/results/:sessionCode?`
- **Purpose**: Post-game score review
- **Dependencies**: Supabase match recording
- **Key Features**:
  - Final scoreboard
  - Individual player statistics
  - Match recording to database
  - Return to homepage option
  - Session cleanup
- **Size**: ~12KB

---

## Customization Pages

### FlagSelection.tsx

- **Status**: ✅ Active
- **Route**: `/select-flag`
- **Route Protection**: Requires authentication
- **Purpose**: Choose country flag for player avatar
- **Dependencies**: OptimizedFlagSelector, Supabase profiles
- **Key Features**:
  - Searchable flag selector with 200+ countries
  - Visual flag preview
  - Save to user profile
  - Navigate back to profile
- **Size**: ~8KB

### TeamSelection.tsx

- **Status**: ✅ Active
- **Route**: `/select-team`
- **Route Protection**: Requires authentication
- **Purpose**: Choose team logo for player avatar
- **Dependencies**: LogoSelector, Supabase profiles
- **Key Features**:
  - Grid of team logos
  - Visual logo preview
  - Save to user profile
  - Navigate back to profile
- **Size**: ~8KB

---

## Social & Rankings

### Inbox.tsx

- **Status**: ✅ Active
- **Route**: `/inbox`
- **Route Protection**: Requires authentication
- **Purpose**: Notification center for user interactions
- **Dependencies**: Supabase notifications, real-time subscriptions
- **Key Features**:
  - View all notifications with filters (all/unread)
  - Mark as read/unread
  - Delete notifications
  - Mark all as read
  - Real-time updates
  - Click to navigate and auto-mark read
  - Notification type icons (friend requests, matches)
- **Size**: ~10KB

### Leaderboard.tsx

- **Status**: ✅ Active
- **Route**: `/leaderboard`
- **Purpose**: Rankings and top performances
- **Dependencies**: Supabase views (top_players, epic_matches)
- **Key Features**:
  - Two tabs: "Top Players" and "Epic Matches"
  - Top Players: ranked by win rate + wins, medals for top 3
  - Epic Matches: ranked by total points, home/away designations
  - Player avatars, flags, statistics
  - Responsive design with empty states
- **Size**: ~13.5KB

---

## Technical Notes

### Lazy Loading

All pages are lazy-loaded in `App.tsx`:

```tsx
const Homepage = lazy(() => import("./pages/Homepage"));
const Lobby = lazy(() => import("./pages/Lobby"));
// etc...
```

### Bundle Splitting

Each page is its own chunk, optimizing initial load time.

### Authentication Flow

Protected routes redirect to `/login` if user is not authenticated.

### URL Parameters

- `:sessionCode` - Session identifier (all session flow pages)
- `:seat?` - Optional seat number for quick rejoin (Lobby)

---

## Performance Metrics

| Page     | Load Time | Components | Dependencies            |
| -------- | --------- | ---------- | ----------------------- |
| Homepage | ~450ms    | 8          | Medium                  |
| Lobby    | ~600ms    | 12         | High (video)            |
| Quiz     | ~550ms    | 10         | High (video + realtime) |
| Profile  | ~400ms    | 6          | Medium                  |
| Results  | ~350ms    | 4          | Low                     |

---

## See Also

- **Overview.md** - Category introduction
- **Changelog.md** - Recent changes
- **Deprecated.md** - Removed pages
