# Libraries - Current State

**Last Updated**: October 21, 2025  
**Total Active Libraries**: 25+

---

## Core Database Operations

### mutations.ts
- **Status**: ✅ Active
- **Purpose**: All Supabase database operations and mutations
- **Size**: ~45KB
- **Key Functions** (46 total):
  - **Session Management**: `createSession`, `getActiveSessions`, `getSessionIdByCode`, `endSession`
  - **Participant Management**: `joinAsHost`, `joinAsPlayer`, `joinAsGameMaster`, `joinAsPlayerWithCode`
  - **Presence Management**: `updateLobbyPresence`, `leaveLobby`, `leaveLobbyByRole`, `updateVideoPresence`
  - **Ready System**: `markPlayerReady`, `checkAllPlayersReady`, `resetAllPlayersReady`
  - **Heartbeat System**: `updateParticipantHeartbeat`, `markParticipantDisconnected`
  - **Quiz Operations**: `setSegmentConfig`, `getSegmentConfig`, `updateScore`, `activatePowerup`
  - **Strikes Management**: `incrementStrike`, `resetStrikes`
  - **Daily.co Integration**: `createDailyRoom`, `getDailyRoom`, `createDailyToken`, `clearDailyToken`
  - **Rejoin Logic**: `rejoinAsParticipant`, `getAvailableSeats`, `checkExistingPreset`
  - **Password Management**: `setParticipantPassword`, `verifyParticipantPassword`
  - **Configuration**: `updateParticipantConfig`, `getSessionParticipants`
- **Dependencies**: Supabase, dailyTokenManager, Logger, types
- **Used In**: All pages and components requiring database operations

### mutations.validation.ts
- **Status**: ✅ Active
- **Purpose**: Input validation for mutation functions
- **Size**: ~3KB
- **Key Functions**:
  - `validateSessionCode`: Session code format validation
  - `validateParticipantName`: Name length and character validation
  - `validateSegmentConfig`: Segment configuration validation
- **Used In**: mutations.ts for input sanitization

---

## Real-time Hooks

### realtimeHooks.ts
- **Status**: ✅ Active
- **Purpose**: React hooks for Supabase real-time subscriptions
- **Size**: ~8KB
- **Key Hooks**:
  - `useStrikes(sessionId)`: Subscribe to WDYK strikes
  - `useSegmentConfig(sessionId)`: Subscribe to segment configurations
  - `useParticipants(sessionId)`: Subscribe to participant updates with Profile data
- **Dependencies**: Supabase, Logger, types
- **Used In**: Quiz.tsx, Lobby.tsx, GameSetup.tsx

### sessionHooks.ts
- **Status**: ✅ Active
- **Purpose**: Session data management hook
- **Size**: ~3KB
- **Key Hook**: `useSession(sessionId)` - Fetches and subscribes to session phase/state changes
- **Dependencies**: Supabase, Logger
- **Used In**: Lobby.tsx, Quiz.tsx, Results.tsx

---

## State Management

### sessionState.ts
- **Status**: ✅ Active
- **Purpose**: Session-level state management via Netlify Blobs
- **Size**: ~5KB
- **Key Functions**:
  - `getSessionState(sessionId)`: Retrieve session state
  - `updateSessionState(sessionId, updates)`: Partial update (merges)
  - `setSessionState(sessionId, state)`: Full replacement
  - `deleteSessionState(sessionId)`: Remove session state
  - `subscribeToSessionState(sessionId, callback, intervalMs)`: Polling subscription
- **State Schema**: `dailyRoomCreated`, `dailyRoomUrl`, `phase`, `segmentsConfigured`, `participantCount`, `lastUpdated`
- **Used In**: Homepage.tsx, GameSetup.tsx, Lobby.tsx for cross-component coordination

### userSession.ts
- **Status**: ✅ Active
- **Purpose**: Hybrid localStorage + Netlify Blobs user session management
- **Size**: ~7KB
- **Key Class**: `UserSession` with static methods
- **Methods**:
  - `init()`: Initialize from localStorage
  - `set(key, value)`: Store session data
  - `get(key)`: Retrieve session data
  - `clear()`: Clear all data
  - `syncToBlob()`: Sync to Netlify Blobs
  - `loadFromBlob()`: Load from Netlify Blobs
- **Convenience Getters**: `participantId`, `participantName`, `sessionCode`, `role`, `isHost`, `canModerate`
- **Dependencies**: blobStore, Logger
- **Used In**: Join pages, Lobby, GameSetup for participant state persistence

### useSessionData.ts
- **Status**: ✅ Active
- **Purpose**: Hook for fetching session + Daily room data
- **Size**: ~4KB
- **Returns**: `{ sessionId, dailyRoom, loading, error }`
- **Used In**: Lobby.tsx, GameSetup.tsx

---

## Presence & Real-time Communication

### presence.ts
- **Status**: ✅ Active
- **Purpose**: Real-time presence tracking via Supabase Realtime
- **Size**: ~9KB
- **Key Class**: `PresenceHelper`
- **Methods**:
  - `joinPresence(user)`: Join presence channel
  - `leavePresence()`: Leave presence channel
  - `getPresenceState()`: Get current presence state
  - `onPresenceUpdate(callback)`: Listen to presence changes
  - `updateUserState(updates)`: Update user presence state
  - `createHeartbeat()`: Auto-heartbeat mechanism
- **Used In**: Lobby.tsx, GameSetup.tsx for participant status tracking

---

## Social Features

### friends.ts
- **Status**: ✅ Active
- **Purpose**: Friend request and friendship management
- **Size**: ~12KB
- **Key Functions**:
  - `sendFriendRequest(addresseeId)`: Send friend request
  - `acceptFriendRequest(requestId)`: Accept request
  - `declineFriendRequest(requestId)`: Decline request
  - `removeFriend(friendshipId)`: Remove friend
  - `getFriends()`: Get accepted friends
  - `getFriendRequests()`: Get pending requests
  - `searchUsersByUsername(query)`: Search users
  - `subscribeFriendsUpdates(userId, callback)`: Real-time friend updates
- **Dependencies**: Supabase, Logger
- **Used In**: Profile.tsx (FriendsTab), InviteFriendsModal.tsx

### notifications.ts
- **Status**: ✅ Active
- **Purpose**: In-app notification system
- **Size**: ~9KB
- **Key Functions**:
  - `getNotifications(unreadOnly)`: Fetch notifications
  - `getUnreadNotificationCount()`: Get unread count
  - `markNotificationAsRead(id)`: Mark as read
  - `markAllNotificationsAsRead()`: Mark all read
  - `deleteNotification(id)`: Delete notification
  - `subscribeNotificationsUpdates(userId, callback)`: Real-time updates
- **Dependencies**: Supabase, Logger
- **Used In**: Inbox.tsx, NotificationBell.tsx

### matches.ts
- **Status**: ✅ Active
- **Purpose**: Match recording and statistics tracking
- **Size**: ~18KB
- **Key Functions**:
  - `recordMatch(sessionId, homePlayerId, awayPlayerId, scores, winnerId, segments)`: Record match result
  - `recordSegmentStats(profileId, segmentCode, stats)`: Record segment performance
  - `getPlayerStats(profileId)`: Get player statistics
  - `getRecentMatches(profileId, limit)`: Get recent matches
  - `getHeadToHeadStats(profileId, opponentId)`: Get H2H statistics
  - `getLeaderboardPlayers(limit)`: Get top players
  - `getLeaderboardMatches(limit)`: Get top matches
- **Dependencies**: Supabase, Logger
- **Used In**: Results.tsx, Profile.tsx (StatisticsTab), Leaderboard.tsx

---

## Utilities & Helpers

### blobStore.ts
- **Status**: ✅ Active
- **Purpose**: Client interface for Netlify Blobs via Edge Functions
- **Size**: ~5KB
- **Key Functions**:
  - `saveSession(key, data)`: Save to blob storage
  - `loadSession(key)`: Load from blob storage
  - `deleteSession(key)`: Remove from blob storage
- **Used In**: userSession.ts for cross-device persistence

### dailyTokenManager.ts
- **Status**: ✅ Active
- **Purpose**: Daily.co token caching and lifecycle management
- **Size**: ~6KB
- **Key Methods**:
  - `getToken(roomName, userName)`: Get cached or create new token
  - `getTokenInfo(roomName, userName)`: Get token metadata
  - `clearToken(roomName, userName)`: Clear specific token
  - `clearRoomTokens(roomName)`: Clear all tokens for room
- **Token Expiry**: Handles 24-hour token expiration
- **Used In**: mutations.ts, Lobby.tsx

### useDailyToken.ts
- **Status**: ✅ Active
- **Purpose**: React hook for Daily.co token auto-refresh
- **Size**: ~4KB
- **Features**:
  - Auto-refresh tokens before expiry (5 min threshold)
  - Token expiry monitoring
  - Refresh interval management (every 4 minutes)
- **Dependencies**: Jotai atoms, mutations.ts
- **Used In**: VideoRoom.tsx for persistent video calls

### logger.ts
- **Status**: ✅ Active
- **Purpose**: Centralized logging utility with log levels
- **Size**: ~3KB
- **Methods**: `debug()`, `log()`, `warn()`, `error()`
- **Used In**: All library files and components

### supabaseClient.ts
- **Status**: ✅ Active
- **Purpose**: Supabase client initialization
- **Size**: ~1KB
- **Exports**: `supabase` singleton instance
- **Configuration**: VITE_SUPABASE_DATABASE_URL, VITE_SUPABASE_ANON_KEY
- **Used In**: All files requiring database access

---

## Helper Libraries

### joinHelpers.ts
- **Status**: ✅ Active
- **Purpose**: Join page utility functions
- **Size**: ~6KB
- **Key Functions**:
  - `checkForExistingParticipants(sessionCode, profileId)`: Check existing participants
  - `storeParticipantData(data)`: Store participant info in localStorage
  - `getLobbyUrl(sessionCode, role)`: Generate lobby URL
  - `extractTeamNameFromLogoUrl(logoUrl)`: Extract team name
  - `checkForExistingPreset(profileId)`: Check saved presets
- **Used In**: JoinPage.tsx, JoinModal.tsx

### roleUtils.ts
- **Status**: ✅ Active
- **Purpose**: Role and seat mapping utilities
- **Size**: ~2KB
- **Constants**: `PARTICIPANT_ROLE`, `LOBBY_PRESENCE`, `SEAT_TO_ROLE`, `ROLE_DISPLAY_LABELS`
- **Used In**: Lobby.tsx, Join pages for role management

### flagHelper.ts
- **Status**: ✅ Active
- **Purpose**: Country flag code/name conversion
- **Size**: ~4KB
- **Key Functions**:
  - `getFlagName(code)`: Get country name from code
  - `getCodeFromName(name)`: Get code from country name
  - `getAllCountries()`: Get all country data
- **Used In**: FlagSelector.tsx, Profile.tsx

### flagIcons.ts
- **Status**: ✅ Active
- **Purpose**: Emoji flag icon mappings
- **Size**: ~10KB
- **Data**: Maps country codes to emoji flags (195+ countries)
- **Used In**: Flag.tsx, FlagSelector.tsx

### teamLogoHelper.ts
- **Status**: ✅ Active
- **Purpose**: Team logo URL generation and league mapping
- **Size**: ~4KB
- **Key Functions**:
  - `teamNameToKebabCase(teamName)`: Convert team name to URL format
  - `getLeagueForTeam(teamName)`: Get league for team
  - `getTeamLogoUrl(teamName, league)`: Generate logo URL
- **Supported Leagues**: Premier League, La Liga, Serie A, Bundesliga, Ligue 1
- **Used In**: TeamLogoPicker.tsx, LobbyLogo.tsx

### participantAuth.ts
- **Status**: ✅ Active
- **Purpose**: Participant password hashing (bcrypt-style)
- **Size**: ~3KB
- **Key Functions**:
  - `hashParticipantPassword(password)`: Hash password
  - `verifyParticipantPassword(password, hash)`: Verify password
  - `setParticipantPassword(participantId, password)`: Set participant password
- **Used In**: mutations.ts for secure participant authentication

### activeProfile.ts
- **Status**: ✅ Active
- **Purpose**: Active profile management (server-side via Netlify functions)
- **Size**: ~4KB
- **Key Functions**:
  - `setActiveProfile(userId)`: Set active profile via Netlify function
  - `getActiveProfile(userId)`: Get active profile via Netlify function
- **Used In**: Homepage.tsx, Profile.tsx

### sessionCode.test.ts
- **Status**: ✅ Active
- **Purpose**: Session code generation tests
- **Size**: ~2KB
- **Test Coverage**: Uniqueness, format validation, length validation
- **Used In**: Test suite

### mutations.test.ts
- **Status**: ✅ Active
- **Purpose**: Mutation function tests
- **Size**: ~3KB
- **Test Coverage**: Import validation, function signature tests
- **Used In**: Test suite

### createSession.test.ts
- **Status**: ✅ Active
- **Purpose**: Session creation tests
- **Size**: ~2KB
- **Test Coverage**: createSession function validation
- **Used In**: Test suite

---

## Type Definitions

### types/supabase.ts
- **Status**: ✅ Active
- **Purpose**: Auto-generated Supabase database types
- **Size**: ~25KB
- **Exports**: `Database`, `Tables`, `Views`, type helpers
- **Tables**: Sessions, Participants, Profiles, Friends, Notifications, Matches, PlayerSegmentStats, Scores, Strikes, SegmentConfig, DailyRooms
- **Views**: UserInbox, leaderboard_players, leaderboard_matches
- **Used In**: All files requiring type safety with database operations

### types.ts
- **Status**: ✅ Active
- **Purpose**: Application-specific type definitions
- **Size**: ~8KB
- **Key Types**:
  - `SessionPhase`, `GameState`, `ParticipantRole`, `LobbyPresence`
  - `SegmentCode`, `Powerup`
  - `CreateDailyRoomResponse`, `DailyTokenResponse`
  - `NotificationType`, `FriendStatus`
  - `HeadToHeadStats`, `PlayerStats`
  - Helper types: `Tables<T>`, `TablesInsert<T>`, `TablesUpdate<T>`, `Views<T>`
- **Used In**: All application files requiring type definitions
