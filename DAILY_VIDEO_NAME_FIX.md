# Daily Video Participant Name Fix

## Problem Statement
When participants joined the Daily video call in the Lobby, the name displayed was coming from localStorage instead of the Supabase `Profiles` table. This led to inconsistent or incorrect names being shown in the video interface.

## Solution Overview
The fix ensures that participant names displayed in the Daily video call are fetched from the Supabase database using the proper relationship chain:
```
Sessions → Participants (via session_id) → Profiles (via profile_id) → name
```

## Changes Made

### 1. Lobby.tsx - Participant Name from Profiles
**File**: `src/pages/Lobby.tsx`

**Changes**:
- Converted `participantName` from a constant to a state variable
- Added a new `useEffect` hook to dynamically update the participant name from the Profiles table
- The hook finds the current participant based on their role (Host, Home, or Away)
- When the participant record is found, it extracts the name from `Profiles.name`
- Updates both the local `participantName` state and the `dailyUserNameAtom` for persistence

**Code Location**: Lines 289-336

**Key Logic**:
```typescript
// Find current participant by role
const seatRole = SEAT_TO_ROLE[resolvedSeat];
const currentParticipant = players.find((p) => p.role === participantRole);
if (currentParticipant?.Profiles?.name) {
  const profileName = currentParticipant.Profiles.name;
  setParticipantName(profileName);
  setDailyUserName(profileName); // Persist for Quiz page
}
```

### 2. realtimeHooks.ts - Include Profile Data in useParticipants
**File**: `src/lib/realtimeHooks.ts`

**Changes**:
- Modified the `useParticipants` hook to include Profile data in the query
- Added a JOIN to the Profiles table to fetch name, flag, and team
- This ensures that the Quiz page also has access to Profile data for video participants

**Code Location**: Lines 166-193

**Key Logic**:
```typescript
const { data, error } = await supabase
  .from("Participants")
  .select(
    `
    *,
    Profiles!profile_id (
      name,
      flag,
      team
    )
  `,
  )
  .eq("session_id", sessionId);
```

## How It Works

### Flow in Lobby Page
1. User navigates to Lobby with a seat parameter (e.g., `/lobby/ABC123/host`)
2. The seat is resolved to a role (host, home, or away)
3. Participants are loaded from Supabase with Profile data via JOIN
4. The effect finds the participant matching the current user's role
5. The Profile name is extracted and set in both:
   - Local state (`participantName`)
   - Global atom (`dailyUserNameAtom`)
6. When joining the Daily call, this name is used

### Flow in Quiz Page
1. User transitions from Lobby to Quiz (maintaining the video call)
2. The `dailyUserNameAtom` persists the Profile name across routes
3. The `useParticipants` hook now includes Profile data
4. Video participants display the correct Profile name

### Data Flow Diagram
```
┌─────────────────────────────────────────────────────────┐
│                  Lobby Page Load                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Load Participants with Profile JOIN                    │
│  (Sessions → Participants → Profiles)                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Find Current Participant by Role                       │
│  (Based on URL seat parameter)                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Extract Profile Name                                    │
│  currentParticipant.Profiles.name                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ├────────────────────────┬────────────────┐
                  ▼                        ▼                ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│  Local State         │  │  dailyUserNameAtom   │  │  Daily Token     │
│  participantName     │  │  (persists to Quiz)  │  │  Creation        │
└──────────────────────┘  └──────────────────────┘  └──────────────────┘
                                                              │
                                                              ▼
                                                     ┌──────────────────┐
                                                     │  Join Daily Call │
                                                     │  with Profile    │
                                                     │  Name            │
                                                     └──────────────────┘
```

## Database Schema Reference

### Profiles Table
- `id` (PK): User's unique identifier
- `name`: User's display name (this is what we display)
- `flag`: Country flag code
- `team`: Team logo/name
- Other fields...

### Participants Table
- `participant_id` (PK): Unique participant identifier
- `session_id` (FK → Sessions): Links to session
- `profile_id` (FK → Profiles): Links to user profile
- `role`: Host, Home, Away, GameMaster
- `lobby_presence`: Joined, Disconnected, NotJoined
- `video_presence`: Boolean indicating if in video call
- Other fields...

### Sessions Table
- `session_id` (PK): Unique session identifier
- `session_code`: Human-readable session code
- Other fields...

## Video Component Integration

### ParticipantTile Component
**File**: `src/components/ParticipantTile.tsx`

The ParticipantTile component displays individual video participants. It:
1. Receives a `participantId` from Daily.co
2. Gets the `userName` from Daily's participant properties
3. Looks up the participant in the `playersByName` map
4. Falls back to the userName if no match is found
5. Displays: `playerData?.name || userName || "Unknown Participant"`

With our fix, the Daily userName now correctly matches the Profile name, ensuring proper display.

### VideoCall Component
**File**: `src/components/VideoCall.tsx`

The VideoCall component:
1. Creates a `playersByName` map from the players prop
2. Maps Daily participant IDs to ParticipantTile components
3. Passes the map to each tile for name lookup

The component now receives players with Profile data from both Lobby and Quiz pages.

## Testing the Fix

### Manual Testing Steps
1. **Setup**:
   - Ensure you have a valid Supabase profile with a name
   - Create a session as Host
   - Join as Home or Away player from another device/browser

2. **Test in Lobby**:
   - Navigate to the Lobby page
   - Click "Join Call" to join the Daily video
   - Verify that your name shown in the video tile matches your Profile name
   - Check browser console for log: "Setting participant name from Profiles table: [YourName]"

3. **Test in Quiz**:
   - From Lobby, start the quiz
   - Navigate to the Quiz page
   - Verify video call persists with correct names
   - Check that all participant names still show Profile names

4. **Test Edge Cases**:
   - Test with missing Profile name (should fall back gracefully)
   - Test with special characters in name
   - Test with very long names

### Expected Console Logs
```
Lobby: Setting participant name from Profiles table: John Doe
Lobby: Storing Daily room data in atoms
Lobby: Daily token created and stored
```

## Benefits of This Fix

1. **Consistency**: Names are always sourced from the single source of truth (Profiles table)
2. **Persistence**: Using Jotai atoms ensures names persist across route transitions
3. **Correctness**: Eliminates discrepancies between localStorage and database
4. **Maintainability**: Clear data flow from database to UI
5. **Profile Management**: Users can update their name in one place (Profile) and it reflects everywhere

## Potential Issues and Solutions

### Issue 1: Profile Name Not Found
**Symptom**: Video shows "Unknown Participant"
**Cause**: Participant record doesn't have a profile_id or Profile doesn't exist
**Solution**: Ensure participants are created with valid profile_id during session join

### Issue 2: Name Updates Don't Reflect
**Symptom**: Old name shows in video even after profile update
**Cause**: The name is set once when Lobby loads
**Solution**: The Participants query includes Profile JOIN, so refreshing the page will pick up updates. For real-time updates, could add a Profile subscription.

### Issue 3: Quiz Page Shows Wrong Name
**Symptom**: Quiz shows localStorage name instead of Profile name
**Cause**: dailyUserNameAtom not set before transitioning to Quiz
**Solution**: Ensure user waits for participants to load in Lobby before joining video and moving to Quiz

## Future Improvements

1. **Real-time Profile Updates**: Subscribe to Profile changes to update names in real-time
2. **Offline Handling**: Better fallback logic when database is unavailable
3. **Name Validation**: Ensure Profile names meet Daily.co requirements (length, characters)
4. **Caching**: Cache Profile data to reduce database queries
5. **Avatar Support**: Extend to also show profile avatars in video tiles

## Related Files
- `src/pages/Lobby.tsx` - Main lobby with video integration
- `src/pages/Quiz.tsx` - Quiz page with persistent video
- `src/components/VideoCall.tsx` - Daily video call wrapper
- `src/components/VideoRoom.tsx` - Video room manager
- `src/components/ParticipantTile.tsx` - Individual video participant display
- `src/lib/realtimeHooks.ts` - Supabase realtime hooks
- `src/atoms/index.ts` - Jotai state atoms

## Verification Checklist
- [x] Lobby loads participants with Profile data
- [x] Current participant name is extracted from Profile
- [x] dailyUserNameAtom is set with Profile name
- [x] Daily token uses Profile name
- [x] Video tiles display Profile name
- [x] Quiz page receives participants with Profile data
- [x] Video persists across Lobby → Quiz transition
- [x] Build passes with no errors
- [x] Linter passes with no new warnings
- [x] Existing tests still pass (1 pre-existing failure unrelated to changes)
