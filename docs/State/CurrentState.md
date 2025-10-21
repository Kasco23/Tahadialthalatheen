# State - Current State

**Last Updated**: October 21, 2025  
**State Management**: Jotai Atoms  
**Location**: `/src/atoms/index.ts`

---

## Global State Atoms

### Session State

#### sessionAtom

- **Type**: `atom<string | null>`
- **Purpose**: Stores current session ID
- **Initial Value**: `null`
- **Set By**: Homepage (create), GameSetup, Lobby (on session resolution)
- **Used By**: All pages requiring session context

#### sessionCodeAtom

- **Type**: `atom<string | null>`
- **Purpose**: Stores current session code (6-character code)
- **Initial Value**: `null`
- **Set By**: Homepage (create), GameSetup, Lobby (on session resolution)
- **Used By**: All pages for session identification and display

---

### Participants State

#### participantsAtom

- **Type**: `atom<Record<string, Tables<"Participants">>>`
- **Purpose**: Keyed map of all participants by participant_id
- **Initial Value**: `{}`
- **Structure**: `{ [participant_id]: ParticipantRow }`
- **Updated By**: Real-time subscriptions in Lobby, GameSetup
- **Used By**: Components displaying participant lists

#### hostParticipantAtom

- **Type**: Derived atom
- **Purpose**: Returns the Host participant from participantsAtom
- **Computed From**: `Object.values(participants).find((p) => p.role === "Host")`
- **Returns**: `Tables<"Participants"> | null`
- **Used By**: Components needing host information

#### playerParticipantsAtom

- **Type**: Derived atom
- **Purpose**: Returns all player participants (Player1, Player2)
- **Computed From**: `Object.values(participants).filter((p) => p.role.startsWith("Player"))`
- **Returns**: `Tables<"Participants">[]`
- **Used By**: Lobby, Quiz for player-specific logic

#### participantCountAtom

- **Type**: Derived atom
- **Purpose**: Returns total count of participants
- **Computed From**: `Object.keys(participants).length`
- **Returns**: `number`
- **Used By**: Session capacity checks, UI display

---

### Daily.co Video Call State

#### dailyRoomUrlAtom

- **Type**: `atom<string | null>`
- **Purpose**: Stores Daily.co room URL for video calls
- **Initial Value**: `null`
- **Set By**: GameSetup (on room creation), Lobby (on room fetch)
- **Persistence**: Stored in Jotai atom (cleared on page refresh)
- **Used By**: VideoRoom.tsx for joining calls

#### dailyTokenAtom

- **Type**: `atom<string | null>`
- **Purpose**: Stores Daily.co meeting token for authentication
- **Initial Value**: `null`
- **Set By**: Lobby (on token creation), dailyTokenManager (on refresh)
- **Persistence**: Stored in Jotai atom (cleared on page refresh)
- **Token Lifespan**: 24 hours (auto-refresh enabled)
- **Used By**: VideoRoom.tsx for authenticated room access

#### dailyUserNameAtom

- **Type**: `atom<string | null>`
- **Purpose**: Stores participant name for Daily.co display
- **Initial Value**: `null`
- **Set By**: Lobby (from participant Profile data)
- **Used By**: VideoRoom.tsx for participant identification in video call

#### dailyTokenExpiryAtom

- **Type**: `atom<number | null>`
- **Purpose**: Stores token expiration timestamp (milliseconds)
- **Initial Value**: `null`
- **Set By**: dailyTokenManager on token creation
- **Used By**: useDailyToken hook for auto-refresh logic
- **Refresh Trigger**: 5 minutes before expiry

#### dailyTokenRefreshingAtom

- **Type**: `atom<boolean>`
- **Purpose**: Indicates if token refresh is in progress
- **Initial Value**: `false`
- **Set By**: useDailyToken hook during refresh operations
- **Used By**: UI components to show loading states during refresh
