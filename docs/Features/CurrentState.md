# Features - Current State

**Last Updated**: January 24, 2025  
**Feature Count**: 13 major features

---

## Core Quiz Features

### 1. Session Management

- **Pages**: Homepage, GameSetup
- **Features**: Create session, auto-generate session code, host password protection
- **Database**: Sessions table
- **State**: sessionAtom, sessionCodeAtom

### 2. Join & Role Selection

- **Pages**: JoinPage, JoinModal
- **Features**: Join as Host/Player, flag/team selection, rejoin logic
- **Database**: Participants table
- **State**: userSession (localStorage + Netlify Blobs)

### 3. Lobby & Ready System

- **Page**: Lobby
- **Features**:
  - Participant tiles with complete Profiles data (name, username, flag, team)
  - Ready toggle for players
  - Heartbeat tracking for presence detection
  - Video call preview with robust token system
  - Refresh button preserves all participant data
- **Token System** (Oct 21, 2025):
  - Separates username (safe, no spaces) for Daily.co tokens
  - Separates name (full, may have spaces) for UI display
  - Fallback chain: `username || name || "player"`
  - Automatic cache clearing on username change
- **Real-time**: Supabase subscriptions for participant updates with Profiles JOIN
- **Backend**: check-ready-status.ts, mark-player-ready.ts functions

### 4. Video Calling (Daily.co)

- **Components**: VideoRoom, VideoCall, ParticipantTile
- **Features**:
  - Persistent video across routes (Lobby → Quiz)
  - Token auto-refresh with 5-minute expiry threshold
  - Robust token system handling names with spaces
  - Uses username (no spaces) for API tokens
  - Displays full name (with spaces) in UI
- **State**: dailyRoomUrlAtom, dailyTokenAtom, dailyUserNameAtom
- **Token Management**: dailyTokenManager with domain-aware cache clearing
- **Backend**: createDailyRoom.ts, create-daily-token.ts
- **Recent Enhancement** (Oct 21, 2025): Separated token username from display name

### 5. Quiz Gameplay

- **Page**: Quiz
- **Features**: Segment navigation, score tracking, powerups, strike system (WDYK)
- **Real-time**: Live score updates, strike tracking
- **Database**: Scores, Strikes, SegmentConfig tables

### 6. Results & Match Recording

- **Page**: Results
- **Features**: Final scores, winner determination, automatic match recording
- **Database**: Matches, PlayerSegmentStats tables
- **Statistics**: Win rate, H2H stats, segment performance tracking

---

## Social Features (v2.0)

### 7. User Profiles

- **Page**: Profile
- **Features**: Username setup, avatar editing, flag/team selection, statistics view
- **Tabs**: Profile, Statistics, Friends
- **Database**: Profiles table with unique username

### 8. Friend System

- **Component**: FriendsTab (in Profile)
- **Features**: Send/accept/decline requests, friend list, search by username
- **Real-time**: Live friend request notifications
- **Database**: Friends table
- **Backend**: send-notification.ts for friend request alerts

### 9. Notifications

- **Pages**: Inbox, NotificationBell (component)
- **Features**: In-app notifications, unread count badge, mark as read, real-time updates
- **Database**: Notifications table, UserInbox view
- **Real-time**: ✅ Enabled

### 10. Leaderboards

- **Page**: Leaderboard
- **Features**: Top players (by win rate), top matches (by total points)
- **Database**: leaderboard_players, leaderboard_matches views
- **Ranking**: Auto-calculated via SQL views

### 11. Match History & Statistics

- **Page**: Profile (Statistics tab)
- **Features**: Recent matches, win/loss/tie record, segment performance breakdown
- **Library**: matches.ts for stats queries
- **Database**: Matches, PlayerSegmentStats tables

### 12. Session Invitations

- **Component**: InviteFriendsModal
- **Features**: Invite friends to join session, send via notifications
- **Integration**: Friend list + notification system
- **Backend**: send-notification.ts for invite delivery

---

## Infrastructure Features

### State Persistence (Netlify Blobs)

- **Edge Functions**: get-session.ts, set-session.ts, session-state.ts
- **Purpose**: Cross-device session persistence, session-level coordination
- **Use Cases**: GameSetup → Lobby room creation sync, rejoin logic

### Scheduled Maintenance

- **Function**: cleanupStatus.ts
- **Schedule**: Hourly (cron)
- **Purpose**: Cleanup stale participant heartbeats

### Authentication

- **Provider**: Supabase Auth
- **Pages**: Signup, Login
- **Context**: AuthContext for global auth state

---

## Advanced Features

### 13. Semi-Automatic Question Generation (Transfermarkt API)

- **Status**: 🚧 **Planning Complete** (Phase 1 Ready)
- **Documentation**: `/docs/TRANSFERMARKT_INTEGRATION_ROADMAP.md`
- **API**: Transfermarkt Open API (transfermarkt-api.fly.dev)
- **Purpose**: Semi-automatic football quiz question generation for all 5 segments
- **Segments Covered**:
  - **REMO** (Remontada): Player career path questions using transfer history
  - **BELL** (Bell Ringer): Statistical comparison questions (top scorers, assists, etc.)
  - **WDYK** (Who Do You Know): Multi-league player identification
  - **AUCT** (Auction): High-value questions with 100+ possible answers
  - **UPDW** (Up Down): Hard trivia with template-based generation
- **Architecture**:
  - **API Wrapper**: `src/lib/api/transfermarkt.ts` (TransfermarktClient class)
  - **Caching**: `src/lib/api/transfermarktCache.ts` (Netlify Blobs with TTL strategy)
  - **Functions**: 5 Netlify functions (`generate-{segment}-question.mts`)
  - **Database**: 3 new tables (generated_questions, question_bank, player_question_history)
  - **Frontend**: `/tools/question-generator` page with 7 sub-components
- **Key Features**:
  - Cache-first pattern with >80% hit rate goal
  - Answer limit handling (display 100, expand for 100+)
  - Metadata tracking (api_source, api_params, total_answers_count)
  - Profile integration ("My Questions" page)
  - GameSetup integration with modal/drawer
- **TTL Strategy**: 1 hour (searches) → 1 day (stats) → 7 days (profiles) → 30 days (transfers)
- **Implementation Plan**: 14 phases across 12 implementation sessions + 2 documentation sessions
- **Current Phase**: Phase 1.1 - Create TransfermarktClient API wrapper
- **Estimated Completion**: ~20-30 hours total

---

## Feature Interactions

**Session Flow**: Homepage → GameSetup → Lobby → Quiz → Results  
**Social Flow**: Signup → Profile → Friends → Notifications → Match Invites  
**Video Flow**: GameSetup (create room) → Lobby (join call) → Quiz (persist call)  
**Stats Flow**: Results (record match) → Profile (view stats) → Leaderboard (rankings)  
**Question Generation Flow**: GameSetup → Generate Questions (modal) → Select Segment → Configure Parameters → Preview → Save to Session/Bank

**Real-time Features**: Participant presence, friend requests, notifications, match results, scores
